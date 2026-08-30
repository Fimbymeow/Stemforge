import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import type { Question } from "@/data/types";
import type { PrerequisiteRelationship } from "@/lib/curriculum/prerequisite-graph";
import { validateQuestionCurriculumMetadata } from "@/lib/curriculum/question-curriculum-metadata";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import { checkPracticeEligibility, discoverEligiblePracticeQuestions } from "@/lib/practice/practice-eligibility";
import type { EligiblePracticeQuestion, PracticeEligibilityReason } from "@/lib/practice/practice-types";

export type QuestionScopePolicy = "strict" | "prerequisite_aware" | "full_course";

export type QuestionScopeEligibilityReason =
  | PracticeEligibilityReason
  | "missing_curriculum_metadata"
  | "invalid_curriculum_metadata"
  | "primary_skill_outside_scope"
  | "required_skill_outside_scope";

export type QuestionScopeEligibility =
  | { eligible: true }
  | { eligible: false; reason: QuestionScopeEligibilityReason; skillId?: string };

type ScopeResolver = ReturnType<typeof createContentResolver>;

export function deriveAllowedRequirementSkillIds(input: {
  policy: QuestionScopePolicy;
  selectedAssessmentSkillIds: Iterable<string>;
  availableCourseSkillIds: Iterable<string>;
  prerequisiteRelationships?: readonly PrerequisiteRelationship[];
  approvedConditionalRequirementSkillIds?: Iterable<string>;
}): Set<string> {
  const selected = new Set(input.selectedAssessmentSkillIds);
  if (input.policy === "strict") return selected;
  if (input.policy === "full_course") return new Set(input.availableCourseSkillIds);

  const allowed = new Set(selected);
  const relationships = input.prerequisiteRelationships ?? [];
  const queue = [...selected];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const relationship of relationships) {
      if (relationship.skillPathId !== current || allowed.has(relationship.requiresSkillPathId)) continue;
      allowed.add(relationship.requiresSkillPathId);
      queue.push(relationship.requiresSkillPathId);
    }
  }
  for (const skillId of input.approvedConditionalRequirementSkillIds ?? []) allowed.add(skillId);
  return allowed;
}

export function checkQuestionEligibilityForScope(input: {
  question: Question;
  selectedAssessmentSkillIds: Iterable<string>;
  allowedRequirementSkillIds: Iterable<string>;
  resolver?: ScopeResolver;
}): QuestionScopeEligibility {
  const resolver = input.resolver ?? contentResolver;
  const global = checkPracticeEligibility(input.question, resolver);
  if (!global.eligible) return global;

  const curriculum = input.question.curriculum;
  if (!curriculum) return { eligible: false, reason: "missing_curriculum_metadata" };
  const shape = validateQuestionCurriculumMetadata(curriculum);
  const duplicateRequirement = new Set(curriculum.requiredSkillIds).size !== curriculum.requiredSkillIds.length;
  if (!shape.valid || duplicateRequirement || curriculum.primarySkillId !== input.question.skillPathId) {
    return { eligible: false, reason: "invalid_curriculum_metadata" };
  }

  const selected = new Set(input.selectedAssessmentSkillIds);
  if (!selected.has(curriculum.primarySkillId)) {
    return { eligible: false, reason: "primary_skill_outside_scope", skillId: curriculum.primarySkillId };
  }
  const allowedRequirements = new Set(input.allowedRequirementSkillIds);
  for (const requiredSkillId of curriculum.requiredSkillIds) {
    if (!allowedRequirements.has(requiredSkillId)) {
      return { eligible: false, reason: "required_skill_outside_scope", skillId: requiredSkillId };
    }
  }
  return { eligible: true };
}

export function getEligibleQuestionPoolForScope(input: {
  selectedAssessmentSkillIds: Iterable<string>;
  allowedRequirementSkillIds: Iterable<string>;
  source?: CanonicalContentSource;
}): {
  eligible: EligiblePracticeQuestion[];
  count: number;
  excludedByReason: Record<string, number>;
} {
  const source = input.source ?? canonicalContent;
  const resolver = source === canonicalContent ? contentResolver : createContentResolver(source);
  const globallyEligible = discoverEligiblePracticeQuestions(source);
  const selectedAssessmentSkillIds = new Set(input.selectedAssessmentSkillIds);
  const allowedRequirementSkillIds = new Set(input.allowedRequirementSkillIds);
  const eligible: EligiblePracticeQuestion[] = [];
  const excludedByReason = { ...globallyEligible.excludedByReason };

  for (const candidate of globallyEligible.eligible) {
    const result = checkQuestionEligibilityForScope({
      question: candidate.question,
      selectedAssessmentSkillIds,
      allowedRequirementSkillIds,
      resolver,
    });
    if (result.eligible) eligible.push(candidate);
    else excludedByReason[result.reason] = (excludedByReason[result.reason] ?? 0) + 1;
  }
  return { eligible, count: eligible.length, excludedByReason };
}

/** Attempts, mastery and Review evidence remain owned solely by this canonical skill. */
export function getQuestionEvidenceOwnerSkillId(question: Question): string | undefined {
  return question.curriculum?.primarySkillId ?? question.skillPathId;
}
