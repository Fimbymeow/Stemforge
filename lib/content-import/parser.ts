import {
  CONTENT_IMPORT_COMPILER_VERSION,
  MAX_IMPORT_ACCEPTED_ANSWERS,
  MAX_IMPORT_ANSWER_FIELDS,
  MAX_IMPORT_QUESTIONS,
  MAX_IMPORT_SOURCE_BYTES,
  MAX_IMPORT_TEXT_LENGTH,
  type ContentBankIR,
  type ImportAnswerCandidate,
  type ImportDiagnostic,
  type ImportQuestionIR,
  type SourceLineRange,
} from "@/lib/content-import/types";
import { hashCanonicalTextSource } from "@/lib/content-import/canonical";

const QUESTION_HEADING = /^#{2,3}\s+((?:F|A|PPQ)\d{3})\s+[—-]\s+([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/i;
const SUMMARY_HEADING = /^#{1,3}\s+.*(?:all questions together for skim|QA check|Import readiness checklist)/i;
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROTOTYPE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const QUESTION_LABELS = [
  "Stage", "Subskill", "Type", "Marks", "Calculator/non-calculator", "Command word",
  "Curriculum metadata", "Question", "Correct answer", "Accepted answers", "Answer fields", "Hint", "Worked solution",
  "Common mistake", "QA note",
];

export function parseMarkdownBank(input: { sourcePath: string; bytes: Uint8Array }): ContentBankIR {
  const diagnostics: ImportDiagnostic[] = [];
  if (input.bytes.byteLength > MAX_IMPORT_SOURCE_BYTES) {
    diagnostics.push({ code: "source_too_large", severity: "error", message: `Source exceeds ${MAX_IMPORT_SOURCE_BYTES} bytes.` });
    return emptyBank(input, diagnostics);
  }
  const source = Buffer.from(input.bytes).toString("utf8");
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const title = lines.find((line) => /^#\s+/.test(line)) ?? "";
  const versionMatch = /Question Bank v(\d+)/i.exec(title);
  const advisoryLine = lines.find((line) => /^\s*-\s*skillPathId:\s*/i.test(line));
  const advisorySkillPathId = advisoryLine?.replace(/^\s*-\s*skillPathId:\s*/i, "").trim();
  const questionHeadings: Array<{ index: number; id: string; sourceOrder: string }> = [];
  const parseLimit = lines.findIndex((line) => SUMMARY_HEADING.test(line));
  const endIndex = parseLimit >= 0 ? parseLimit : lines.length;
  for (let index = 0; index < endIndex; index += 1) {
    const match = QUESTION_HEADING.exec(lines[index]);
    if (match) questionHeadings.push({ index, sourceOrder: match[1].toUpperCase(), id: match[2] });
    else if (/^#{2,3}\s+(?:F|A|PPQ)\d+/i.test(lines[index])) {
      diagnostics.push({
        code: "malformed_question_heading",
        severity: "error",
        message: "Question heading must contain a safe exact question ID after an em dash or hyphen.",
        lineRange: { start: index + 1, end: index + 1 },
      });
    }
  }
  for (let index = 1; index < questionHeadings.length; index += 1) {
    if (sourceOrderValue(questionHeadings[index].sourceOrder) <= sourceOrderValue(questionHeadings[index - 1].sourceOrder)) {
      diagnostics.push({
        code: "invalid_question_order",
        severity: "error",
        message: "Question headings must follow strict Foundations, Applications and Past Paper-style source order without duplicate sequence values.",
        lineRange: { start: questionHeadings[index].index + 1, end: questionHeadings[index].index + 1 },
      });
    }
  }
  if (questionHeadings.length > MAX_IMPORT_QUESTIONS) {
    diagnostics.push({ code: "too_many_questions", severity: "error", message: `Source exceeds ${MAX_IMPORT_QUESTIONS} questions.` });
  }
  const seenIds = new Set<string>();
  const questions = questionHeadings.slice(0, MAX_IMPORT_QUESTIONS).map((heading, position) => {
    const blockEnd = questionHeadings[position + 1]?.index ?? endIndex;
    const question = parseQuestion(lines.slice(heading.index + 1, blockEnd), heading.id, {
      start: heading.index + 1,
      end: blockEnd,
    });
    if (seenIds.has(question.id)) {
      const duplicate = {
        code: "duplicate_question_id",
        severity: "error" as const,
        message: `Duplicate question ID "${question.id}".`,
        questionId: question.id,
        lineRange: question.sourceLineRange,
      };
      question.diagnostics.push(duplicate);
      diagnostics.push(duplicate);
    }
    seenIds.add(question.id);
    diagnostics.push(...question.diagnostics);
    return question;
  });
  if (!versionMatch) diagnostics.push({ code: "missing_bank_version", severity: "error", message: "Bank heading does not declare a numeric version." });
  if (!advisorySkillPathId) diagnostics.push({ code: "missing_advisory_skill_path", severity: "warning", message: "Draft does not declare advisory skillPathId metadata." });
  const sourceBankId = advisorySkillPathId ?? inferBankId(questionHeadings[0]?.id) ?? "unknown-bank";
  return {
    compilerVersion: CONTENT_IMPORT_COMPILER_VERSION,
    sourcePath: input.sourcePath,
    rawSourceHash: hashCanonicalTextSource(input.bytes),
    sourceBankId,
    sourceBankVersion: versionMatch?.[1] ?? "unknown",
    ...(advisorySkillPathId ? { advisorySkillPathId } : {}),
    questions,
    diagnostics,
  };
}

function parseQuestion(block: string[], id: string, sourceLineRange: SourceLineRange): ImportQuestionIR {
  const diagnostics: ImportDiagnostic[] = [];
  const field = (label: string) => extractSection(block, label);
  const declaredStage = field("Stage");
  const marksText = field("Marks");
  const marks = Number(marksText);
  const questionText = field("Question");
  const hint = field("Hint");
  const workedSolution = field("Worked solution");
  const commonMistake = field("Common mistake");
  const curriculumYaml = extractFencedYaml(block, "Curriculum metadata");
  const curriculumResult = curriculumYaml
    ? parseCurriculumYaml(curriculumYaml.text, curriculumYaml.lineOffset + sourceLineRange.start)
    : undefined;
  if (curriculumResult) diagnostics.push(...curriculumResult.diagnostics.map((item) => ({ ...item, questionId: id })));
  const yaml = extractAnswerYaml(block);
  let answerCandidates: ImportAnswerCandidate[] = [];
  let answerDeclarationShape: ImportQuestionIR["answerDeclarationShape"] = "bare_correct_answer";
  let explicitFieldAssessment = false;
  if (yaml) {
    answerDeclarationShape = "yaml_answer_fields";
    const parsed = parseAnswerFieldsYaml(yaml.text, yaml.lineOffset + sourceLineRange.start);
    answerCandidates = parsed.candidates;
    explicitFieldAssessment = parsed.explicitFieldAssessment;
    diagnostics.push(...parsed.diagnostics.map((item) => ({ ...item, questionId: id })));
  } else {
    const correctAnswer = field("Correct answer");
    const acceptedAnswers = parseMarkdownList(field("Accepted answers"));
    const declaredAnswers = correctAnswer ? unique([correctAnswer, ...acceptedAnswers]) : [];
    if (declaredAnswers.length > MAX_IMPORT_ACCEPTED_ANSWERS) {
      diagnostics.push({
        code: "too_many_accepted_answers",
        severity: "error",
        message: `Answer declaration exceeds ${MAX_IMPORT_ACCEPTED_ANSWERS} accepted answers.`,
        questionId: id,
        lineRange: sourceLineRange,
      });
    }
    answerCandidates = correctAnswer ? [{
      id: "answer",
      label: "Answer",
      type: field("Type") || inferBareType(correctAnswer),
      correctAnswer,
      acceptedAnswers: declaredAnswers,
    }] : [];
  }
  for (const label of QUESTION_LABELS) {
    const expression = new RegExp(`^${escapeRegex(label)}:\\s*`, "i");
    if (block.filter((line) => expression.test(line)).length > 1) {
      diagnostics.push({
        code: "duplicate_question_section",
        severity: "error",
        message: `Question "${id}" declares "${label}" more than once.`,
        questionId: id,
        lineRange: sourceLineRange,
      });
    }
  }
  const required: Array<[string, unknown]> = [
    ["declared_stage", declaredStage],
    ["marks", Number.isInteger(marks) && marks > 0],
    ["question_text", questionText],
    ["answer_declaration", answerCandidates.length > 0],
    ["hint", hint],
    ["worked_solution", workedSolution],
    ["common_mistake", commonMistake],
  ];
  for (const [name, present] of required) {
    if (!present) diagnostics.push({
      code: `missing_${name}`,
      severity: "error",
      message: `Question "${id}" is missing required ${name.replaceAll("_", " ")} content.`,
      questionId: id,
      lineRange: sourceLineRange,
    });
  }
  if (!SAFE_ID.test(id)) diagnostics.push({ code: "unsafe_question_id", severity: "error", message: `Question ID "${id}" is not safe kebab-case.`, questionId: id, lineRange: sourceLineRange });
  for (const [name, value] of [["question", questionText], ["hint", hint], ["worked solution", workedSolution], ["common mistake", commonMistake]] as const) {
    if (value.length > MAX_IMPORT_TEXT_LENGTH) diagnostics.push({ code: "question_field_too_large", severity: "error", message: `${name} exceeds the import text bound.`, questionId: id, lineRange: sourceLineRange });
  }
  return {
    id,
    sourceLineRange,
    declaredStage,
    ...(field("Subskill") ? { subskill: field("Subskill") } : {}),
    marks: Number.isInteger(marks) && marks > 0 ? marks : 0,
    ...(field("Calculator/non-calculator") ? { calculatorStatus: field("Calculator/non-calculator") } : {}),
    ...(field("Command word") ? { commandWord: field("Command word") } : {}),
    ...(field("Type") ? { interactionType: field("Type") } : {}),
    questionText,
    hint,
    workedSolution,
    commonMistake,
    ...(field("QA note") ? { qaNote: field("QA note") } : {}),
    answerCandidates,
    answerDeclarationShape,
    explicitFieldAssessment,
    ...(curriculumResult?.curriculum ? { curriculum: curriculumResult.curriculum } : {}),
    diagnostics,
  };
}

function extractSection(lines: string[], label: string) {
  const expression = new RegExp(`^${escapeRegex(label)}:\\s*(.*)$`, "i");
  const index = lines.findIndex((line) => expression.test(line.trim()));
  if (index < 0) return "";
  const first = expression.exec(lines[index].trim())?.[1] ?? "";
  const collected = first ? [first] : [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const trimmed = lines[cursor].trim();
    if (QUESTION_LABELS.some((candidate) => new RegExp(`^${escapeRegex(candidate)}:`, "i").test(trimmed))) break;
    if (trimmed === "---") break;
    collected.push(lines[cursor]);
  }
  return trimBlankEdges(collected).join("\n").trim();
}

function extractAnswerYaml(lines: string[]) {
  return extractFencedYaml(lines, "Answer fields");
}

function extractFencedYaml(lines: string[], label: string) {
  const expression = new RegExp(`^${escapeRegex(label)}:\\s*$`, "i");
  const labelIndex = lines.findIndex((line) => expression.test(line.trim()));
  if (labelIndex < 0) return null;
  const open = lines.findIndex((line, index) => index > labelIndex && /^```ya?ml\s*$/i.test(line.trim()));
  if (open < 0) return { text: "", lineOffset: labelIndex + 1 };
  const close = lines.findIndex((line, index) => index > open && /^```\s*$/.test(line.trim()));
  if (close < 0) return { text: lines.slice(open + 1).join("\n"), lineOffset: open + 1 };
  return { text: lines.slice(open + 1, close).join("\n"), lineOffset: open + 1 };
}

export function parseCurriculumYaml(text: string, absoluteStartLine = 1) {
  const diagnostics: ImportDiagnostic[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let primarySkillId = "";
  const requiredSkillIds: string[] = [];
  let inRequiredSkillIds = false;
  let sawCurriculum = false;
  let sawPrimary = false;
  let sawRequired = false;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    if (/^curriculum:\s*$/.test(raw)) {
      if (sawCurriculum) diagnostics.push({ code: "duplicate_curriculum_key", severity: "error", message: "Curriculum YAML repeats the curriculum object.", lineRange: { start: absoluteStartLine + index, end: absoluteStartLine + index } });
      sawCurriculum = true;
      inRequiredSkillIds = false;
      continue;
    }
    const primary = /^\s{2}primarySkillId:\s*(.+)$/.exec(raw);
    if (primary) {
      if (sawPrimary) diagnostics.push({ code: "duplicate_curriculum_key", severity: "error", message: "Curriculum YAML repeats primarySkillId.", lineRange: { start: absoluteStartLine + index, end: absoluteStartLine + index } });
      sawPrimary = true;
      primarySkillId = parseYamlScalar(primary[1]);
      inRequiredSkillIds = false;
      continue;
    }
    if (/^\s{2}requiredSkillIds:\s*$/.test(raw)) {
      if (sawRequired) diagnostics.push({ code: "duplicate_curriculum_key", severity: "error", message: "Curriculum YAML repeats requiredSkillIds.", lineRange: { start: absoluteStartLine + index, end: absoluteStartLine + index } });
      sawRequired = true;
      inRequiredSkillIds = true;
      continue;
    }
    const required = /^\s{4}-\s+(.+)$/.exec(raw);
    if (required && inRequiredSkillIds) {
      requiredSkillIds.push(parseYamlScalar(required[1]));
      continue;
    }
    diagnostics.push({ code: "malformed_curriculum_yaml", severity: "error", message: "Curriculum YAML must use the canonical curriculum.primarySkillId and curriculum.requiredSkillIds fields.", lineRange: { start: absoluteStartLine + index, end: absoluteStartLine + index } });
  }

  if (!sawCurriculum || !sawPrimary || !sawRequired) {
    diagnostics.push({ code: "incomplete_curriculum_metadata", severity: "error", message: "Curriculum YAML requires curriculum.primarySkillId and curriculum.requiredSkillIds.", lineRange: { start: absoluteStartLine, end: absoluteStartLine + lines.length - 1 } });
  }
  const curriculumSkillIds: Array<[string, string]> = [
    ["primarySkillId", primarySkillId],
    ...requiredSkillIds.map((skillId): [string, string] => ["requiredSkillIds", skillId]),
  ];
  for (const [field, skillId] of curriculumSkillIds) {
    if (!SAFE_ID.test(skillId)) diagnostics.push({ code: "invalid_curriculum_skill_id", severity: "error", message: `${field} contains an invalid canonical skill ID.`, lineRange: { start: absoluteStartLine, end: absoluteStartLine + lines.length - 1 } });
  }
  if (new Set(requiredSkillIds).size !== requiredSkillIds.length) diagnostics.push({ code: "duplicate_curriculum_required_skill", severity: "error", message: "Curriculum YAML repeats a required skill ID.", lineRange: { start: absoluteStartLine, end: absoluteStartLine + lines.length - 1 } });

  return {
    curriculum: diagnostics.some((item) => item.severity === "error") ? undefined : { primarySkillId, requiredSkillIds },
    diagnostics,
  };
}

export function parseAnswerFieldsYaml(text: string, absoluteStartLine = 1) {
  const diagnostics: ImportDiagnostic[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (!lines.some((line) => /^\s*answerFields:\s*$/.test(line))) {
    diagnostics.push({ code: "malformed_yaml", severity: "error", message: "YAML answer declaration must contain answerFields.", lineRange: { start: absoluteStartLine, end: absoluteStartLine + lines.length - 1 } });
    return { candidates: [], explicitFieldAssessment: false, diagnostics };
  }
  const candidates: ImportAnswerCandidate[] = [];
  let current: Record<string, unknown> | null = null;
  let currentKeys = new Set<string>();
  let listKey: "acceptedAnswers" | null = null;
  const finish = () => {
    if (!current) return;
    const candidate: ImportAnswerCandidate = {
      id: stringValue(current.id),
      label: stringValue(current.label),
      type: stringValue(current.type),
      correctAnswer: stringValue(current.correctAnswer),
      acceptedAnswers: unique([
        stringValue(current.correctAnswer),
        ...((current.acceptedAnswers as string[] | undefined) ?? []),
      ]),
      ...(typeof current.assessed === "boolean" ? { assessed: current.assessed } : {}),
    };
    candidates.push(candidate);
    current = null;
    currentKeys = new Set<string>();
    listKey = null;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    if (/^\s*answerFields:\s*$/.test(raw)) continue;
    const start = /^\s*-\s+([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(raw);
    if (start) {
      finish();
      current = Object.create(null) as Record<string, unknown>;
      currentKeys = new Set<string>();
      assignYamlKey(current, currentKeys, start[1], start[2], diagnostics, absoluteStartLine + index);
      continue;
    }
    const list = /^\s{6,}-\s+(.*)$/.exec(raw);
    if (list && current && listKey) {
      const values = current[listKey] as string[];
      values.push(parseYamlScalar(list[1]));
      continue;
    }
    const property = /^\s{4,}([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(raw);
    if (property && current) {
      listKey = property[1] === "acceptedAnswers" ? "acceptedAnswers" : null;
      if (listKey && property[2].trim() === "") {
        if (currentKeys.has(listKey)) duplicateYamlKey(listKey, diagnostics, absoluteStartLine + index);
        currentKeys.add(listKey);
        current[listKey] = [];
      } else assignYamlKey(current, currentKeys, property[1], property[2], diagnostics, absoluteStartLine + index);
      continue;
    }
    diagnostics.push({ code: "malformed_yaml", severity: "error", message: "Unsupported or malformed YAML answerFields syntax.", lineRange: { start: absoluteStartLine + index, end: absoluteStartLine + index } });
  }
  finish();
  if (candidates.length > MAX_IMPORT_ANSWER_FIELDS) diagnostics.push({ code: "too_many_answer_fields", severity: "error", message: `answerFields exceeds ${MAX_IMPORT_ANSWER_FIELDS} fields.` });
  for (const candidate of candidates.slice(0, MAX_IMPORT_ANSWER_FIELDS)) {
    if (!candidate.id || !candidate.label || !candidate.type || !candidate.correctAnswer) {
      diagnostics.push({ code: "incomplete_answer_field", severity: "error", message: "Each answer field requires id, label, type and correctAnswer." });
    }
    if (candidate.acceptedAnswers.length > MAX_IMPORT_ACCEPTED_ANSWERS) diagnostics.push({ code: "too_many_accepted_answers", severity: "error", message: `Answer field exceeds ${MAX_IMPORT_ACCEPTED_ANSWERS} accepted answers.` });
  }
  return {
    candidates,
    explicitFieldAssessment: candidates.length > 0 && candidates.every((candidate) => typeof candidate.assessed === "boolean"),
    diagnostics,
  };
}

function assignYamlKey(target: Record<string, unknown>, keys: Set<string>, key: string, raw: string, diagnostics: ImportDiagnostic[], line: number) {
  if (PROTOTYPE_KEYS.has(key)) {
    diagnostics.push({ code: "prototype_polluting_yaml_key", severity: "error", message: `Forbidden YAML key "${key}".`, lineRange: { start: line, end: line } });
    return;
  }
  if (!["id", "label", "type", "correctAnswer", "acceptedAnswers", "assessed"].includes(key)) {
    diagnostics.push({ code: "unknown_yaml_key", severity: "error", message: `Unknown answerFields key "${key}".`, lineRange: { start: line, end: line } });
    return;
  }
  if (keys.has(key)) {
    duplicateYamlKey(key, diagnostics, line);
    return;
  }
  keys.add(key);
  if (key === "assessed") {
    if (!/^(true|false)$/i.test(raw.trim())) diagnostics.push({ code: "malformed_yaml_boolean", severity: "error", message: "assessed must be true or false.", lineRange: { start: line, end: line } });
    else target[key] = raw.trim().toLowerCase() === "true";
  } else if (key === "acceptedAnswers") {
    diagnostics.push({ code: "malformed_yaml", severity: "error", message: "acceptedAnswers must be a block list.", lineRange: { start: line, end: line } });
  } else target[key] = parseYamlScalar(raw);
}

function duplicateYamlKey(key: string, diagnostics: ImportDiagnostic[], line: number) {
  diagnostics.push({ code: "duplicate_yaml_key", severity: "error", message: `Duplicate YAML key "${key}".`, lineRange: { start: line, end: line } });
}

function parseYamlScalar(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1);
  return trimmed;
}

function parseMarkdownList(value: string) {
  return value.split("\n").map((line) => line.trim()).filter((line) => /^-\s+/.test(line)).map((line) => line.replace(/^-\s+/, "").trim());
}

function inferBareType(answer: string) {
  return /^[-+]?(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(stripMathWrapper(answer)) ? "numeric" : "algebraic";
}

export function stripMathWrapper(value: string) {
  let output = value.trim();
  if ((output.startsWith("\\(") && output.endsWith("\\)")) || (output.startsWith("$") && output.endsWith("$"))) output = output.slice(output.startsWith("\\(") ? 2 : 1, output.endsWith("\\)") ? -2 : -1);
  return output.trim();
}

function trimBlankEdges(lines: string[]) {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;
  return lines.slice(start, end);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function inferBankId(questionId?: string) {
  return questionId?.replace(/-(?:f|a|ppq)-\d+$/, "");
}

function sourceOrderValue(value: string) {
  const match = /^(F|A|PPQ)(\d{3})$/.exec(value);
  const section = match?.[1] === "F" ? 0 : match?.[1] === "A" ? 1 : 2;
  return section * 1000 + Number(match?.[2] ?? 0);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emptyBank(input: { sourcePath: string; bytes: Uint8Array }, diagnostics: ImportDiagnostic[]): ContentBankIR {
  return {
    compilerVersion: CONTENT_IMPORT_COMPILER_VERSION,
    sourcePath: input.sourcePath,
    rawSourceHash: hashCanonicalTextSource(input.bytes),
    sourceBankId: "unknown-bank",
    sourceBankVersion: "unknown",
    questions: [],
    diagnostics,
  };
}
