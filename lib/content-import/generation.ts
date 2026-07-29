import type { Question } from "@/data/types";
import { sha256 } from "@/lib/content-import/canonical";
import { skillOwnedOutputPath } from "@/lib/content-import/preview";
import type {
  ApprovalReceipt,
  GeneratedOutput,
  ImportClassification,
  ImportRegistry,
  VersionDecision,
} from "@/lib/content-import/types";

export function generateApprovedSkillModules(
  approval: ApprovalReceipt,
  registry: ImportRegistry,
): GeneratedOutput[] {
  const byPath = materializeApprovedQuestions(approval, registry);
  return [...byPath.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([pathSlug, questions]) => {
    const bytes = Buffer.from(renderSkillModule(pathSlug, questions), "utf8");
    return { path: skillOwnedOutputPath(pathSlug), bytes, hash: sha256(bytes) };
  });
}

export function materializeApprovedQuestions(
  approval: ApprovalReceipt,
  registry: ImportRegistry,
) {
  const classifications = new Map(approval.previewDecisionPayload.classifications.map((item) => [item.questionId, item]));
  const byPath = new Map<string, Question[]>();
  for (const id of approval.approvedQuestionIds) {
    const classification = classifications.get(id);
    if (!classification?.canonicalQuestion || !classification.targetSkillPathSlug) throw new Error(`approved_question_not_generatable:${id}`);
    const question = applyVersionDecision(classification, registry.questions.get(id), approval.versionDecisions[id]);
    const path = question.skillPathId;
    if (!path) throw new Error(`generated_question_missing_path:${id}`);
    if (!byPath.has(path)) {
      byPath.set(path, [...registry.questions.values()].filter((candidate) => candidate.skillPathId === path));
    }
    const questions = byPath.get(path)!;
    const existingIndex = questions.findIndex((candidate) => candidate.id === id);
    if (existingIndex >= 0) questions[existingIndex] = question;
    else questions.push(question);
  }
  return byPath;
}

export function renderSkillModule(pathSlug: string, questions: Question[]) {
  const sorted = [...questions].sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id));
  const names = exportNames(pathSlug);
  const stageIds = {
    foundations: sorted.filter((question) => question.stage === "Foundations").map((question) => question.id),
    applications: sorted.filter((question) => question.stage === "Applications").map((question) => question.id),
    pastPaperStyle: sorted.filter((question) => question.stage === "Past Paper-style Questions").map((question) => question.id),
  };
  const primaryExport = pathSlug === "basic-differentiation" ? "higherMathsDifferentiationQuestions" : names.questions;
  return [
    'import type { Question } from "@/data/types";',
    "",
    `export const ${names.stageIds} = ${JSON.stringify(stageIds, null, 2)} as const;`,
    "",
    `export const ${primaryExport}: Question[] = ${JSON.stringify(sorted, null, 2)};`,
    ...(primaryExport === names.questions ? [] : ["", `export const ${names.questions} = ${primaryExport};`]),
    "",
  ].join("\n");
}

function applyVersionDecision(
  classification: ImportClassification,
  existing: Question | undefined,
  decision: VersionDecision | undefined,
): Question {
  const question = structuredClone(classification.canonicalQuestion!);
  if (!existing) {
    if (decision) throw new Error(`new_question_has_version_decision:${question.id}`);
    return question;
  }
  if (!decision) throw new Error(`collision_missing_version_decision:${question.id}`);
  if (decision.kind === "content_revision_bump") {
    question.questionVersion = existing.questionVersion;
    question.contentRevision = existing.contentRevision + 1;
  } else if (decision.kind === "question_version_bump") {
    question.questionVersion = existing.questionVersion + 1;
    question.contentRevision = 1;
  }
  return question;
}

function exportNames(pathSlug: string) {
  const pascal = pathSlug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
  const camel = pascal[0].toLowerCase() + pascal.slice(1);
  return {
    questions: `higherMaths${pascal}Questions`,
    stageIds: `${camel}StageQuestionIds`,
  };
}
