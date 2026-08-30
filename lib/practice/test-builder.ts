import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { higherMathematicsCalculusPrerequisites } from "@/data/curriculum/higher-mathematics/calculus-prerequisites";
import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import type { LearningStageName } from "@/data/types";
import { createContentResolver } from "@/lib/content-resolver";
import type { CanonicalSkillSpecificationMapping } from "@/lib/curriculum/official-skill-mapping";
import type { PrerequisiteRelationship } from "@/lib/curriculum/prerequisite-graph";
import { resolveSkillsForRequirements } from "@/lib/curriculum/requirement-resolution";
import { deriveAllowedRequirementSkillIds, getEligibleQuestionPoolForScope } from "@/lib/curriculum/question-scope-eligibility";
import { PRACTICE_SESSION_SCHEMA_VERSION, type EligiblePracticeQuestion, type PracticeSession } from "@/lib/practice/practice-types";

export const BUILD_A_TEST_SIZE_OPTIONS = [
  { id: "short", label: "Short", questionCount: 5 },
  { id: "standard", label: "Standard", questionCount: 10 },
  { id: "long", label: "Long", questionCount: 20 },
] as const;

export type BuildATestSize = typeof BUILD_A_TEST_SIZE_OPTIONS[number]["id"];
export type BuildATestStatus = "empty_selection" | "no_content" | "insufficient_content" | "ready";

export type BuildATestPlan = {
  status: BuildATestStatus;
  selectedRequirementIds: string[];
  selectedAssessmentSkillIds: string[];
  allowedRequirementSkillIds: string[];
  unavailableRequirementIds: string[];
  availableCount: number;
  requestedCount: number;
  selectedQuestions: EligiblePracticeQuestion[];
  excludedByReason: Record<string, number>;
};

type BuildATestInput = {
  selectedRequirementIds: readonly string[];
  requestedCount: number;
  seed: string;
  source?: CanonicalContentSource;
  mappings?: readonly CanonicalSkillSpecificationMapping[];
  prerequisites?: readonly PrerequisiteRelationship[];
};

export function createBuildATestPlan(input: BuildATestInput): BuildATestPlan {
  const source = input.source ?? canonicalContent;
  const mappings = input.mappings ?? higherMathematicsOfficialSkillMappings;
  const prerequisites = input.prerequisites ?? higherMathematicsCalculusPrerequisites;
  const selectedRequirementIds = [...new Set(input.selectedRequirementIds.filter(Boolean))];
  const selectedAssessmentSkillIds = resolveSkillsForRequirements(selectedRequirementIds, mappings);
  const availableCourseSkillIds = createContentResolver(source).getAllPathContexts()
    .filter((context) => context.subject.subjectSlug === "higher-maths" && context.skillPath.isAvailable && context.skillPath.contentStatus === "active")
    .map((context) => context.skillPath.slug);
  const allowedRequirementSkillIds = [...deriveAllowedRequirementSkillIds({
    policy: "prerequisite_aware",
    selectedAssessmentSkillIds,
    availableCourseSkillIds,
    prerequisiteRelationships: prerequisites,
  })];
  const pool = getEligibleQuestionPoolForScope({ selectedAssessmentSkillIds, allowedRequirementSkillIds, source });
  const unavailableRequirementIds = selectedRequirementIds.filter((specPointId) => {
    const assessed = resolveSkillsForRequirements([specPointId], mappings);
    const allowed = deriveAllowedRequirementSkillIds({
      policy: "prerequisite_aware",
      selectedAssessmentSkillIds: assessed,
      availableCourseSkillIds,
      prerequisiteRelationships: prerequisites,
    });
    return getEligibleQuestionPoolForScope({ selectedAssessmentSkillIds: assessed, allowedRequirementSkillIds: allowed, source }).count === 0;
  });
  const requestedCount = Number.isInteger(input.requestedCount) && input.requestedCount > 0 ? input.requestedCount : 0;
  const status: BuildATestStatus = selectedRequirementIds.length === 0 ? "empty_selection"
    : pool.count === 0 ? "no_content"
      : requestedCount > pool.count ? "insufficient_content"
        : "ready";
  return {
    status,
    selectedRequirementIds,
    selectedAssessmentSkillIds,
    allowedRequirementSkillIds,
    unavailableRequirementIds,
    availableCount: pool.count,
    requestedCount,
    selectedQuestions: status === "ready" ? assembleTestQuestions(pool.eligible, selectedAssessmentSkillIds, requestedCount, input.seed) : [],
    excludedByReason: pool.excludedByReason,
  };
}

export function createBuildATestSession(input: BuildATestInput & { now?: Date }): { plan: BuildATestPlan; session: PracticeSession | null } {
  const plan = createBuildATestPlan(input);
  if (plan.status !== "ready" || plan.selectedQuestions.length !== plan.requestedCount) return { plan, session: null };
  const now = input.now ?? new Date();
  const stamp = now.toISOString();
  const references = plan.selectedQuestions.map((candidate) => candidate.reference);
  const includedPathIds = [...new Set(references.map((reference) => reference.pathId))];
  const session: PracticeSession = {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    sessionId: `practice_test_${stableHash(`${stamp}:${input.seed}:${references.map((reference) => reference.questionId).join("|")}`).toString(36)}`,
    origin: "build_a_test",
    subjectId: "higher-maths",
    mode: includedPathIds.length > 1 ? "mixed" : "targeted",
    courseId: "higher-maths",
    selectedPathIds: [...plan.selectedAssessmentSkillIds],
    questionReferences: references,
    currentQuestionIndex: 0,
    startedAt: stamp,
    updatedAt: stamp,
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed: input.seed,
      requestedCount: plan.requestedCount,
      availableCount: plan.availableCount,
      selectedCount: references.length,
      fullySatisfied: true,
      shortageReason: null,
      excludedByReason: plan.excludedByReason,
      includedPathIds,
      createdAt: stamp,
    },
    skippedQuestionIds: [],
  };
  return { plan, session };
}

export function assembleTestQuestions(
  candidates: readonly EligiblePracticeQuestion[],
  selectedAssessmentSkillIds: readonly string[],
  requestedCount: number,
  seed: string,
): EligiblePracticeQuestion[] {
  if (requestedCount <= 0 || candidates.length < requestedCount) return [];
  const bySkill = new Map<string, Map<LearningStageName, EligiblePracticeQuestion[]>>();
  for (const candidate of candidates) {
    const skillId = candidate.question.curriculum?.primarySkillId ?? candidate.reference.pathId;
    const stages = bySkill.get(skillId) ?? new Map<LearningStageName, EligiblePracticeQuestion[]>();
    const stage = candidate.question.stage;
    stages.set(stage, [...(stages.get(stage) ?? []), candidate]);
    bySkill.set(skillId, stages);
  }
  for (const stages of bySkill.values()) {
    for (const pool of stages.values()) pool.sort((left, right) => stableHash(`${seed}:${left.question.id}`) - stableHash(`${seed}:${right.question.id}`));
  }

  const skillOrder = selectedAssessmentSkillIds.filter((skillId) => bySkill.has(skillId));
  const stageCycle: LearningStageName[] = ["Past Paper-style Questions", "Applications", "Past Paper-style Questions", "Applications", "Foundations"];
  const stageCursor = new Map(skillOrder.map((skillId) => [skillId, 0]));
  const selected: EligiblePracticeQuestion[] = [];
  while (selected.length < requestedCount && skillOrder.some((skillId) => hasQuestions(bySkill.get(skillId)))) {
    for (const skillId of skillOrder) {
      if (selected.length >= requestedCount) break;
      const stages = bySkill.get(skillId);
      if (!stages || !hasQuestions(stages)) continue;
      const cursor = stageCursor.get(skillId) ?? 0;
      let next: EligiblePracticeQuestion | undefined;
      for (let offset = 0; offset < stageCycle.length; offset += 1) {
        const stage = stageCycle[(cursor + offset) % stageCycle.length];
        next = stages.get(stage)?.shift();
        if (next) {
          stageCursor.set(skillId, (cursor + offset + 1) % stageCycle.length);
          break;
        }
      }
      if (next) selected.push(next);
    }
  }
  return selected;
}

function hasQuestions(stages: Map<LearningStageName, EligiblePracticeQuestion[]> | undefined) {
  return Boolean(stages && [...stages.values()].some((questions) => questions.length > 0));
}

function stableHash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
