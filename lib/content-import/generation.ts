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
    const practiceQuestionIds = resolveApprovedPracticeOrder(approval, registry, pathSlug, questions);
    const bytes = Buffer.from(renderSkillModule(pathSlug, questions, practiceQuestionIds), "utf8");
    return { path: skillOwnedOutputPath(pathSlug), bytes, hash: sha256(bytes) };
  });
}

/**
 * Resolves the exact Practice projection bound into the approved preview.
 * Practice V2 order is never reconstructed from IDs or displayOrder.
 */
export function resolveApprovedPracticeOrder(
  approval: ApprovalReceipt,
  registry: ImportRegistry,
  pathSlug: string,
  questions: readonly Question[],
) {
  const approvedOrder = approval.previewDecisionPayload.practiceOrders?.find(
    (order) => order.targetSkillPathSlug === pathSlug,
  );
  const knownIds = new Set(questions.map((question) => question.id));

  if (approvedOrder?.source === "authored_practice") {
    const projected = approvedOrder.questionIds.filter((id) => knownIds.has(id));
    if (new Set(projected).size !== projected.length) {
      throw new Error(`duplicate_approved_practice_order:${pathSlug}`);
    }
    if (projected.length !== knownIds.size) {
      throw new Error(`approved_practice_order_mismatch:${pathSlug}`);
    }
    return projected;
  }

  const practiceOrder = approvedOrder?.questionIds
    ?? registry.paths.get(pathSlug)?.practiceQuestionIds
    ?? [];
  const orderedPracticeIds = practiceOrder.filter((id) => knownIds.has(id));
  const missingPracticeIds = questions
    .filter((question) => !orderedPracticeIds.includes(question.id))
    .sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))
    .map((question) => question.id);
  return [...orderedPracticeIds, ...missingPracticeIds];
}

export function assertGeneratedOutputPathsRegistered(
  outputs: readonly Pick<GeneratedOutput, "path">[],
  registrations: readonly { outputPath: string }[],
) {
  const registeredPaths = new Set(registrations.map((registration) => registration.outputPath));
  if (registeredPaths.size !== registrations.length) throw new Error("duplicate_generated_output_registration");
  for (const output of outputs) {
    if (!registeredPaths.has(output.path)) {
      throw new Error(`registry_wiring_required_before_apply:${output.path}`);
    }
  }
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

export function renderSkillModule(pathSlug: string, questions: Question[], practiceQuestionIds: string[] = []) {
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
    `export const ${names.practiceIds} = ${JSON.stringify(practiceQuestionIds, null, 2)} as const;`,
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
  if (decision.kind === "practice_regrouping_no_version_bump") {
    question.questionVersion = existing.questionVersion;
    question.contentRevision = existing.contentRevision;
  } else if (decision.kind === "content_revision_bump") {
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
    practiceIds: `${camel}PracticeQuestionIds`,
  };
}
