import type { Question, QuestionOption } from "@/data/types";
import { markQuestionAnswer } from "@/lib/answer-engine";
import { resolveConfiguredPlacement } from "@/lib/content-import/configuration";
import { canonicalSerialize } from "@/lib/content-import/canonical";
import { stripMathWrapper } from "@/lib/content-import/parser";
import type {
  BankImportConfiguration,
  CollisionDiff,
  CollisionFieldDiff,
  ContentBankIR,
  ImportAnswerCandidate,
  ImportBlocker,
  ImportClassification,
  ImportConversion,
  ImportQuestionIR,
  ImportRegistry,
  MarkerCompatibilityCheck,
  RequiredCapability,
} from "@/lib/content-import/types";
import type {
  CompositeAlgebraicEquivalenceMarkingContract,
  MarkingFixtures,
  NumericMarkingContract,
  PolynomialMarkingContract,
  QuestionMarkingContract,
} from "@/lib/marking/types";

export function classifyBank(
  bank: ContentBankIR,
  configuration: BankImportConfiguration,
  registry: ImportRegistry,
): { classifications: ImportClassification[]; collisionDiffs: CollisionDiff[] } {
  const collisionDiffs: CollisionDiff[] = [];
  const classifications = bank.questions.map((question) => {
    const placement = resolveConfiguredPlacement(configuration, question.id, question.declaredStage);
    const diagnostics = [...question.diagnostics];
    if (bank.advisorySkillPathId && bank.advisorySkillPathId !== configuration.bankId) {
      diagnostics.push({
        code: "advisory_skill_path_mismatch",
        severity: "warning",
        message: `Draft advisory skillPathId "${bank.advisorySkillPathId}" differs from configured bank identity "${configuration.bankId}".`,
        questionId: question.id,
        lineRange: question.sourceLineRange,
      });
    }
    const assessed = selectAssessedCandidate(question);
    const blockers = [...assessed.blockers];
    if (question.diagnostics.some((item) => item.severity === "error")) {
      blockers.push({
        code: "invalid_source_question",
        message: "Question contains error-level source diagnostics and cannot be imported.",
      });
    }
    if (!placement.targetStageId) {
      blockers.push({
        code: "unmapped_source_stage",
        message: `Source stage "${question.declaredStage}" has no explicit canonical stage mapping.`,
      });
    }
    const conversions: ImportConversion[] = ["label_rename", "stage_label_to_stage_id"];
    if (assessed.conversion) conversions.push(assessed.conversion);
    let markerCompatibility: MarkerCompatibilityCheck | undefined;
    let canonicalQuestion: Question | undefined;
    if (assessed.candidate) {
      const marker = analyseMarkability(question, assessed.candidate);
      markerCompatibility = marker.compatibility;
      blockers.push(...marker.blockers);
      if (marker.lexicallyNormalised) conversions.push("marker_proven_lexical_normalisation");
      if (marker.contract && !blockers.length && placement.targetStageId) {
        canonicalQuestion = toCanonicalQuestion(question, assessed.candidate, marker.contract, marker.correctAnswer, placement.targetSkillPathSlug, placement.targetStageId, registry);
      }
    }
    const existing = registry.questions.get(question.id);
    let status: ImportClassification["status"] = blockers.length ? "blocked" : conversions.length ? "convertible" : "ready";
    if (existing) {
      const diff = canonicalQuestion ? compareQuestion(existing, canonicalQuestion) : compareSourceQuestion(existing, question);
      collisionDiffs.push(diff);
      if (diff.identical && canonicalQuestion) status = "unchanged";
      else if (configuration.runMode === "new_content_only") {
        blockers.push({ code: "existing_id_collision", message: `Question ID "${question.id}" already exists and new_content_only forbids edits.` });
        status = "blocked";
      } else if (!blockers.length && !diff.availableVersionDecisions.length) {
        blockers.push({
          code: "collision_has_no_executable_version_decision",
          message: `Question ID "${question.id}" differs in a way the current importer cannot apply safely.`,
        });
        status = "blocked";
      } else if (!blockers.length) {
        diagnostics.push({
          code: "collision_requires_explicit_version_decision",
          severity: "warning",
          message: `Question ID "${question.id}" differs from canonical content and requires an explicit approval-receipt decision.`,
          questionId: question.id,
          lineRange: question.sourceLineRange,
        });
      }
    }
    return {
      questionId: question.id,
      sourceLineRange: question.sourceLineRange,
      status,
      targetSkillPathSlug: placement.targetSkillPathSlug,
      targetStageId: placement.targetStageId,
      conversions: unique(conversions),
      blockers,
      diagnostics,
      ...(markerCompatibility ? { markerCompatibility } : {}),
      ...(canonicalQuestion ? { canonicalQuestion } : {}),
    };
  });
  return { classifications, collisionDiffs };
}

export function auditBankAssessment(bank: ContentBankIR): ImportClassification[] {
  return bank.questions.map((question) => {
    const assessed = selectAssessedCandidate(question);
    const blockers = [...assessed.blockers];
    if (question.diagnostics.some((item) => item.severity === "error")) {
      blockers.push({
        code: "invalid_source_question",
        message: "Question contains error-level source diagnostics and cannot be imported.",
      });
    }
    const conversions: ImportConversion[] = assessed.conversion ? [assessed.conversion] : [];
    let markerCompatibility: MarkerCompatibilityCheck | undefined;
    if (assessed.candidate) {
      const marker = analyseMarkability(question, assessed.candidate);
      blockers.push(...marker.blockers);
      markerCompatibility = marker.compatibility;
      if (marker.lexicallyNormalised) conversions.push("marker_proven_lexical_normalisation");
    }
    return {
      questionId: question.id,
      sourceLineRange: question.sourceLineRange,
      status: blockers.length ? "blocked" : conversions.length ? "convertible" : "ready",
      conversions: unique(conversions),
      blockers,
      diagnostics: [...question.diagnostics],
      ...(markerCompatibility ? { markerCompatibility } : {}),
    };
  });
}

function selectAssessedCandidate(question: ImportQuestionIR): {
  candidate?: ImportAnswerCandidate;
  conversion?: ImportConversion;
  blockers: ImportBlocker[];
} {
  if (question.answerCandidates.length === 1) return { candidate: question.answerCandidates[0], blockers: [] };
  if (question.explicitFieldAssessment) {
    const assessed = question.answerCandidates.filter((candidate) => candidate.assessed);
    const scaffolding = question.answerCandidates.filter((candidate) => candidate.assessed === false);
    if (assessed.length === 1 && scaffolding.length === question.answerCandidates.length - 1) {
      return { candidate: assessed[0], conversion: "explicit_scaffolding_field_drop", blockers: [] };
    }
  }
  const requiredCapability = detectMultiFieldCapability(question);
  return {
    blockers: [{
      code: "undeclared_multi_field_assessment",
      message: "Multiple answer fields cannot be collapsed without explicit assessed/scaffolding metadata.",
      requiredCapability,
    }],
  };
}

function analyseMarkability(question: ImportQuestionIR, candidate: ImportAnswerCandidate) {
  const blockers: ImportBlocker[] = [];
  const capability = detectCapability(question, candidate);
  if (capability) {
    blockers.push({ code: `requires_${capability}`, message: `Answer requires unsupported capability "${capability}".`, requiredCapability: capability, candidateId: candidate.id });
    return { blockers, compatibility: { aliasOutcomes: [] } as MarkerCompatibilityCheck, correctAnswer: candidate.correctAnswer, lexicallyNormalised: false };
  }
  const interaction = (question.interactionType || candidate.type).toLowerCase();
  const rawCorrect = candidate.correctAnswer;
  const correctAnswer = normalizeMarkerLexeme(rawCorrect);
  let contract: QuestionMarkingContract | undefined;
  if (interaction === "multiple_choice") {
    const options = parseOptions(question.questionText);
    const authority = resolveMultipleChoiceAuthority(rawCorrect, options);
    const duplicateValues = hasDuplicates(options.map((option) => option.value));
    const duplicateLabels = hasDuplicates(options.map((option) => normalizeOptionText(option.label)));
    if (!options.length) {
      blockers.push({ code: "missing_multiple_choice_options", message: "Multiple-choice question does not declare parseable options.", candidateId: candidate.id });
    } else if (duplicateValues || duplicateLabels) {
      blockers.push({ code: "ambiguous_multiple_choice_options", message: "Multiple-choice option IDs and labels must be unique.", candidateId: candidate.id });
    } else if (!authority) {
      blockers.push({ code: "invalid_multiple_choice_target", message: "Multiple-choice correct answer does not resolve uniquely to an existing option.", candidateId: candidate.id });
    } else {
      contract = { strategy: "multiple_choice", strategyVersion: 1, correctOptionId: authority, fixtures: fixtures([authority]) };
    }
  } else {
    const numeric = numericContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    const polynomial = polynomialContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    const composite = compositeAlgebraicContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    if (numeric && markQuestionAnswer({ marking: numeric }, correctAnswer).outcomeKind === "graded") contract = numeric;
    else if (polynomial && markQuestionAnswer({ marking: polynomial }, correctAnswer).outcomeKind === "graded") contract = polynomial;
    else if (composite && markQuestionAnswer({ marking: composite }, correctAnswer).outcomeKind === "graded") contract = composite;
    else {
      const requiredCapability = inferUnsupportedAlgebraCapability(correctAnswer);
      blockers.push({
        code: "unsupported_marker_target",
        message: "The live marking implementations cannot interpret the declared correct answer.",
        ...(requiredCapability ? { requiredCapability } : {}),
        candidateId: candidate.id,
      });
    }
  }
  const aliases = unique(candidate.acceptedAnswers.length ? candidate.acceptedAnswers : [candidate.correctAnswer]);
  const aliasOutcomes = contract ? aliases.map((answer) => {
    const submitted = contract.strategy === "multiple_choice"
      ? resolveMultipleChoiceAuthority(answer, parseOptions(question.questionText)) ?? answer
      : normalizeMarkerLexeme(answer);
    const result = markQuestionAnswer({ marking: contract }, submitted);
    return { answer, outcomeKind: result.outcomeKind, isCorrect: result.isCorrect };
  }) : [];
  if (contract) {
    aliasOutcomes.forEach((outcome) => {
      if (outcome.outcomeKind !== "graded" || outcome.isCorrect !== true) {
        blockers.push({
          code: "unsupported_intended_alias",
          message: "A source-declared accepted answer is not accepted by the live strategy; aliases are never pruned.",
          candidateId: candidate.id,
        });
      }
    });
  }
  const canonicalCorrectAnswer = contract?.strategy === "multiple_choice" ? contract.correctOptionId : correctAnswer;
  const targetOutcome = contract ? markQuestionAnswer({ marking: contract }, canonicalCorrectAnswer).outcomeKind : undefined;
  return {
    blockers,
    contract,
    compatibility: {
      ...(contract ? { strategy: contract.strategy, strategyVersion: contract.strategyVersion } : {}),
      ...(targetOutcome ? { targetOutcome } : {}),
      aliasOutcomes,
    },
    correctAnswer: canonicalCorrectAnswer,
    lexicallyNormalised: correctAnswer !== rawCorrect,
  };
}

function toCanonicalQuestion(
  source: ImportQuestionIR,
  candidate: ImportAnswerCandidate,
  marking: QuestionMarkingContract,
  correctAnswer: string,
  pathSlug: string,
  stageId: string,
  registry: ImportRegistry,
): Question {
  const path = registry.paths.get(pathSlug);
  if (!path) throw new Error(`unknown_import_path:${pathSlug}`);
  const answerType = marking.strategy === "multiple_choice" ? "multiple_choice" : marking.strategy === "numeric" ? "numerical" : "algebraic";
  const options = marking.strategy === "multiple_choice" ? parseOptions(source.questionText) : undefined;
  return {
    id: source.id,
    questionVersion: 1,
    contentRevision: 1,
    contentStatus: "active",
    subject: path.subject,
    courseArea: path.courseArea,
    specArea: path.specArea,
    skillPath: path.name,
    skillPathId: path.slug,
    stageId,
    stage: source.declaredStage as Question["stage"],
    skill: source.subskill ?? source.commandWord ?? "Imported question",
    title: source.subskill ?? source.id,
    questionText: source.questionText,
    marks: source.marks,
    answerType,
    marking,
    correctAnswer,
    acceptedAnswers: marking.strategy === "multiple_choice"
      ? [marking.correctOptionId]
      : unique(candidate.acceptedAnswers.map(normalizeMarkerLexeme)),
    ...(options?.length ? { options } : {}),
    workedSolution: source.workedSolution,
    finalAnswer: correctAnswer,
    hint: source.hint,
    commonMistake: source.commonMistake,
    calculatorAllowed: !/non-calculator/i.test(source.calculatorStatus ?? ""),
    source: "Original STEM Forge QS-style content",
    status: "ready",
    displayOrder: sourceOrder(source.id),
  };
}

export function compareQuestion(existing: Question, proposed: Question): CollisionDiff {
  const fields: CollisionFieldDiff[] = [];
  const keys = [...new Set([...Object.keys(existing), ...Object.keys(proposed)])].sort() as Array<keyof Question>;
  for (const key of keys) {
    if (canonicalSerialize(existing[key]) === canonicalSerialize(proposed[key])) continue;
    fields.push({
      field: key,
      existingValue: diffValue(existing[key]),
      proposedValue: diffValue(proposed[key]),
      likelyImpact: impactForField(key),
    });
  }
  return { questionId: proposed.id, identical: fields.length === 0, fields, availableVersionDecisions: deriveVersionDecisions(existing, proposed, fields) };
}

function compareSourceQuestion(existing: Question, source: ImportQuestionIR): CollisionDiff {
  const first = source.answerCandidates[0];
  const proposed = {
    stage: source.declaredStage,
    questionText: source.questionText,
    marks: source.marks,
    correctAnswer: first?.correctAnswer,
    acceptedAnswers: first?.acceptedAnswers,
    workedSolution: source.workedSolution,
    hint: source.hint,
    commonMistake: source.commonMistake,
    calculatorAllowed: !/non-calculator/i.test(source.calculatorStatus ?? ""),
    sourceLineRange: source.sourceLineRange,
    answerDeclarationShape: source.answerDeclarationShape,
  };
  const fields: CollisionFieldDiff[] = [];
  for (const [field, proposedValue] of Object.entries(proposed)) {
    const existingValue = (existing as unknown as Record<string, unknown>)[field];
    if (existingValue === undefined && proposedValue === undefined) continue;
    if (existingValue !== undefined && proposedValue !== undefined &&
        canonicalSerialize(existingValue) === canonicalSerialize(proposedValue)) continue;
    fields.push({
      field,
      existingValue: diffValue(existingValue),
      proposedValue: diffValue(proposedValue),
      likelyImpact: field === "stage" ? "placement" : field === "acceptedAnswers" ? "accepted_answers" :
        ["correctAnswer", "answerDeclarationShape"].includes(field) ? "marking_strategy" :
        ["questionText", "marks", "calculatorAllowed"].includes(field) ? "assessment_meaning" :
          ["workedSolution", "hint", "commonMistake"].includes(field) ? "content_revision" : "metadata",
    });
  }
  return { questionId: source.id, identical: fields.length === 0, fields, availableVersionDecisions: [] };
}

function numericContract(target: string, accepted: string[]): NumericMarkingContract | undefined {
  if (!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+|\d+\/[-+]?\d+)$/.test(target)) return undefined;
  return { strategy: "numeric", strategyVersion: 1, target, comparison: { type: "exact" }, fixtures: fixtures(unique([target, ...accepted])) };
}

function polynomialContract(target: string, accepted: string[]): PolynomialMarkingContract | undefined {
  if (!/[a-z]/i.test(target)) return undefined;
  return { strategy: "polynomial_form", strategyVersion: 1, target, variable: inferVariable(target), fixtures: fixtures(unique([target, ...accepted])) };
}

function compositeAlgebraicContract(target: string, accepted: string[]): CompositeAlgebraicEquivalenceMarkingContract | undefined {
  if (!/[a-z]/i.test(target) || /=/.test(target)) return undefined;
  const variable = inferVariable(target);
  const v1: CompositeAlgebraicEquivalenceMarkingContract = { strategy: "composite_algebraic_equivalence", strategyVersion: 1, target, variable, fixtures: fixtures(unique([target, ...accepted])) };
  if (markQuestionAnswer({ marking: v1 }, target).outcomeKind === "graded") return v1;
  const v2: CompositeAlgebraicEquivalenceMarkingContract = { strategy: "composite_algebraic_equivalence", strategyVersion: 2, target, variable, fixtures: fixtures(unique([target, ...accepted])) };
  if (markQuestionAnswer({ marking: v2 }, target).outcomeKind === "graded") return v2;
  return undefined;
}

function fixtures(correct: string[]): MarkingFixtures {
  return { correct: correct.map((input) => ({ input })), incorrect: [{ input: correct.includes("0") ? "1" : "0" }], malformed: [{ input: "++" }], unmarkable: [{ input: "sin(x)" }] };
}

export function normalizeMarkerLexeme(value: string) {
  let output = stripMathWrapper(value)
    .replace(/^([A-Z])\.\s+/, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\^\{([^{}]+)\}/g, "^$1")
    .replace(/\\,/g, "")
    .trim();
  if (output.startsWith("$") && output.endsWith("$")) output = output.slice(1, -1).trim();
  return output;
}

function detectCapability(question: ImportQuestionIR, candidate: ImportAnswerCandidate): RequiredCapability | undefined {
  const type = candidate.type.toLowerCase();
  const combined = candidate.correctAnswer;
  if (/graph|sketch/i.test(type) || /draw|sketch.*graph/i.test(question.questionText)) return "graph_response";
  if (/diagram/i.test(question.questionText) && /diagram|shown|above|below/i.test(question.questionText)) return "prompt_diagram";
  if (/coordinate/.test(type) || /^\s*[\\($]\s*\(?\s*-?[\dx]/i.test(combined) && /,\s*-?[\dx]/i.test(combined)) return "structured_coordinate_pair";
  if (/interval|exact_list/.test(type) || /(?:≤|≥|<|>)|\\le|\\ge/.test(combined)) return "interval_set";
  if (/\+\s*[Cc]\b/.test(combined)) return "arbitrary_integration_constant";
  if (/text|nature|classification/.test(type)) return "closed_vocabulary_text_answer";
  if (/=/.test(combined) && (question.interactionType ?? "").toLowerCase() !== "multiple_choice") return "equation_form_answer";
  return undefined;
}

function detectMultiFieldCapability(question: ImportQuestionIR): RequiredCapability {
  const labels = question.answerCandidates.map((candidate) => `${candidate.id} ${candidate.label} ${candidate.type}`).join(" ").toLowerCase();
  if (/coordinate/.test(labels) && /nature|maximum|minimum|inflexion/.test(labels)) return "repeated_coordinate_nature_group";
  return "structured_multi_field_answer";
}

function inferUnsupportedAlgebraCapability(value: string): RequiredCapability | undefined {
  if (/=/.test(value)) return "equation_form_answer";
  if (/\+\s*[Cc]\b/.test(value)) return "arbitrary_integration_constant";
  if (/[()]/.test(value) || /\^-|\^\d+\/\d+|sqrt|\/[a-z]/i.test(value)) return "composite_algebraic_equivalence";
  return undefined;
}

function parseOptions(text: string): QuestionOption[] {
  return text.split("\n").map((line) => /^\s*([A-Z])\.\s+(.+?)\s*$/.exec(line)).filter((match): match is RegExpExecArray => Boolean(match)).map((match) => ({ label: match[2], value: match[1] }));
}

function resolveMultipleChoiceAuthority(value: string, options: QuestionOption[]) {
  const trimmed = value.trim();
  const direct = options.find((option) => option.value === trimmed);
  if (direct) return direct.value;
  const labelled = /^([A-Z])\.\s*([\s\S]+)$/.exec(trimmed);
  if (labelled) {
    const option = options.find((candidate) => candidate.value === labelled[1]);
    if (!option || normalizeOptionText(option.label) !== normalizeOptionText(labelled[2])) return undefined;
    return option.value;
  }
  const normalised = normalizeOptionText(trimmed);
  const matchingLabels = options.filter((option) => normalizeOptionText(option.label) === normalised);
  return matchingLabels.length === 1 ? matchingLabels[0].value : undefined;
}

function normalizeOptionText(value: string) {
  return normalizeMarkerLexeme(value).replace(/\s+/g, "");
}

function inferVariable(value: string) {
  return /[a-z]/i.exec(value.replace(/sqrt/gi, ""))?.[0].toLowerCase() ?? "x";
}

function sourceOrder(id: string) {
  const match = /-(f|a|ppq)-(\d+)$/.exec(id);
  const offset = match?.[1] === "f" ? 0 : match?.[1] === "a" ? 1000 : 2000;
  return offset + Number(match?.[2] ?? 0);
}

function impactForField(field: keyof Question): CollisionFieldDiff["likelyImpact"] {
  if (field === "id") return "identity";
  if (["questionVersion", "contentRevision"].includes(field)) return "version_fields";
  if (["skillPathId", "skillPath", "stageId", "stage", "courseArea", "specArea", "subject", "displayOrder"].includes(field)) return "placement";
  if (field === "acceptedAnswers") return "accepted_answers";
  if (["marking", "correctAnswer", "finalAnswer", "answerType", "options"].includes(field)) return "marking_strategy";
  if (["questionText", "marks", "calculatorAllowed", "skill"].includes(field)) return "assessment_meaning";
  if (["workedSolution", "hint", "commonMistake"].includes(field)) return "content_revision";
  if (field === "title") return "presentation";
  return "metadata";
}

function deriveVersionDecisions(
  existing: Question,
  proposed: Question,
  fields: CollisionFieldDiff[],
): CollisionDiff["availableVersionDecisions"] {
  if (!fields.length) return [];
  if (existing.skillPathId !== proposed.skillPathId) return [];
  const material = fields.filter((field) => field.likelyImpact !== "version_fields");
  if (!material.length) return [];
  const questionVersionRequired = material.some((field) =>
    ["accepted_answers", "marking_strategy", "assessment_meaning", "placement", "identity"].includes(field.likelyImpact));
  return questionVersionRequired
    ? ["question_version_bump"]
    : ["content_revision_bump", "question_version_bump"];
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function diffValue(value: unknown) {
  return value === undefined ? null : value;
}
