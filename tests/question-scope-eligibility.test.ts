import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent, type CanonicalContentSource } from "../data/canonical-content";
import { higherMathsLiveQuestionCurriculum } from "../data/curriculum/higher-mathematics/live-question-curriculum";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { chainRulePackage } from "../data/curriculum/higher-mathematics/chain-rule-package";
import type { Question } from "../data/types";
import {
  validateCurriculumQaMetadataCompleteness,
  validateQuestionCurriculumMetadataReferences,
  validateRequiredSkillsWithinPrerequisiteClosure,
} from "../lib/curriculum/question-curriculum-metadata";
import {
  checkQuestionEligibilityForScope,
  deriveAllowedRequirementSkillIds,
  getEligibleQuestionPoolForScope,
  getQuestionEvidenceOwnerSkillId,
} from "../lib/curriculum/question-scope-eligibility";
import { createContentResolver } from "../lib/content-resolver";

const basic = "basic-differentiation";
const chain = "chain-rule";
const trig = "trigonometric-differentiation";

function question(id = "hm-calc-diff-chain-ppq-017"): Question {
  return structuredClone(canonicalContent.questions.find((candidate) => candidate.id === id)!);
}

function resolver(source: CanonicalContentSource = canonicalContent) {
  return createContentResolver(source);
}

function sourceWithAvailablePath(skillPathId: string): CanonicalContentSource {
  const source = structuredClone(canonicalContent);
  const path = source.subjects.flatMap((subject) => subject.courseAreas)
    .flatMap((area) => area.specAreas)
    .flatMap((area) => area.skillPaths ?? [])
    .find((candidate) => candidate.slug === skillPathId)!;
  path.isAvailable = true;
  path.status = "available";
  path.contentStatus = "active";
  return source;
}

test("all 42 live Higher Maths questions carry explicit manually reviewed metadata", () => {
  assert.equal(canonicalContent.questions.length, 42);
  assert.equal(Object.keys(higherMathsLiveQuestionCurriculum).length, 42);
  assert(canonicalContent.questions.every((candidate) => candidate.curriculum));
  assert.equal(canonicalContent.questions.filter((candidate) => candidate.curriculum?.requiredSkillIds.length === 0).length, 11);
  assert.equal(canonicalContent.questions.filter((candidate) => (candidate.curriculum?.requiredSkillIds.length ?? 0) > 0).length, 31);
  assert.deepEqual(question().curriculum, { primarySkillId: chain, requiredSkillIds: [basic] });
});

test("strict scope accepts reviewed empty metadata and rejects missing metadata", () => {
  const reviewed = question("hm-calc-diff-basic-f-001");
  assert.deepEqual(checkQuestionEligibilityForScope({ question: reviewed, selectedAssessmentSkillIds: [basic], allowedRequirementSkillIds: [basic], resolver: resolver() }), { eligible: true });
  delete reviewed.curriculum;
  assert.deepEqual(checkQuestionEligibilityForScope({ question: reviewed, selectedAssessmentSkillIds: [basic], allowedRequirementSkillIds: [basic], resolver: resolver() }), { eligible: false, reason: "missing_curriculum_metadata" });
});

test("strict scope rejects an unselected primary or required skill and accepts an explicitly selected requirement", () => {
  const candidate = question();
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [basic], allowedRequirementSkillIds: [basic], resolver: resolver() }), { eligible: false, reason: "primary_skill_outside_scope", skillId: chain });
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: [chain], resolver: resolver() }), { eligible: false, reason: "required_skill_outside_scope", skillId: basic });
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain, basic], allowedRequirementSkillIds: [chain, basic], resolver: resolver() }), { eligible: true });
});

test("prerequisite-aware policy deliberately admits formal prerequisites while strict policy does not", () => {
  const candidate = question();
  const strict = deriveAllowedRequirementSkillIds({ policy: "strict", selectedAssessmentSkillIds: [chain], availableCourseSkillIds: [chain, basic], prerequisiteRelationships: higherMathematicsCalculusPrerequisites });
  const aware = deriveAllowedRequirementSkillIds({ policy: "prerequisite_aware", selectedAssessmentSkillIds: [chain], availableCourseSkillIds: [chain, basic], prerequisiteRelationships: higherMathematicsCalculusPrerequisites });
  assert.deepEqual([...strict], [chain]);
  assert(aware.has(basic));
  assert.equal(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: strict, resolver: resolver() }).eligible, false);
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: aware, resolver: resolver() }), { eligible: true });
});

test("a package-approved conditional dependency is admitted only when deliberately allowed and globally available", () => {
  const source = sourceWithAvailablePath(trig);
  const candidate = question("hm-calc-diff-chain-f-003");
  candidate.curriculum = { primarySkillId: chain, requiredSkillIds: [trig] };
  const approved = chainRulePackage.questionLevelRequirements.map((requirement) => requirement.requiredSkillId);
  const validation = validateRequiredSkillsWithinPrerequisiteClosure(candidate.curriculum, higherMathematicsCalculusPrerequisites, approved);
  assert.equal(validation.valid, true);
  const withoutConditional = deriveAllowedRequirementSkillIds({ policy: "prerequisite_aware", selectedAssessmentSkillIds: [chain], availableCourseSkillIds: [chain, basic, trig], prerequisiteRelationships: higherMathematicsCalculusPrerequisites });
  const withConditional = deriveAllowedRequirementSkillIds({ policy: "prerequisite_aware", selectedAssessmentSkillIds: [chain], availableCourseSkillIds: [chain, basic, trig], prerequisiteRelationships: higherMathematicsCalculusPrerequisites, approvedConditionalRequirementSkillIds: approved });
  assert.equal(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: withoutConditional, resolver: resolver(source) }).eligible, false);
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: withConditional, resolver: resolver(source) }), { eligible: true });
});

test("global eligibility still rejects unavailable required skills before scope filtering", () => {
  const candidate = question("hm-calc-diff-chain-f-003");
  candidate.curriculum = { primarySkillId: chain, requiredSkillIds: [trig] };
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: [chain, trig], resolver: resolver() }), { eligible: false, reason: "unavailable_required_skill" });
});

test("full-course scope accepts dependencies only from the supplied available course set", () => {
  const candidate = question();
  const allowed = deriveAllowedRequirementSkillIds({ policy: "full_course", selectedAssessmentSkillIds: [chain], availableCourseSkillIds: [chain, basic] });
  assert.deepEqual(checkQuestionEligibilityForScope({ question: candidate, selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: allowed, resolver: resolver() }), { eligible: true });
});

test("duplicate requirements and future-skill contamination remain invalid", () => {
  const duplicate = { primarySkillId: chain, requiredSkillIds: [basic, basic] };
  const references = validateQuestionCurriculumMetadataReferences(duplicate, chain, new Set([chain, basic]));
  assert(references.errors.some((issue) => issue.code === "duplicate-question-required-skill"));
  const contamination = validateRequiredSkillsWithinPrerequisiteClosure({ primarySkillId: chain, requiredSkillIds: ["optimisation"] }, higherMathematicsCalculusPrerequisites);
  assert(contamination.errors.some((issue) => issue.code === "required-skill-outside-prerequisite-closure"));
});

test("curriculumQaComplete cannot cover an active question with missing explicit metadata", () => {
  const questions = [question("hm-calc-diff-chain-f-001")];
  delete questions[0].curriculum;
  const report = validateCurriculumQaMetadataCompleteness(chainRulePackage, questions);
  assert(report.errors.some((issue) => issue.code === "curriculum-qa-metadata-incomplete"));
  assert.equal(validateCurriculumQaMetadataCompleteness({ ...chainRulePackage, qaEvidence: { ...chainRulePackage.qaEvidence, curriculumQaComplete: false } }, questions).valid, true);

  questions[0].curriculum = { primarySkillId: basic, requiredSkillIds: [] };
  assert(validateCurriculumQaMetadataCompleteness(chainRulePackage, questions).errors.some((issue) => issue.code === "curriculum-qa-metadata-invalid"));
});

test("candidate count and serving share the exact same scoped pool", () => {
  const pool = getEligibleQuestionPoolForScope({ selectedAssessmentSkillIds: [chain], allowedRequirementSkillIds: [chain, basic] });
  assert.equal(pool.count, 34);
  assert.equal(pool.count, pool.eligible.length);
  assert.deepEqual(new Set(pool.eligible.map((candidate) => candidate.question.id)), new Set(canonicalContent.questions.filter((candidate) => candidate.skillPathId === chain).map((candidate) => candidate.id)));
});

test("required skills never become evidence owners", () => {
  const candidate = question();
  assert.equal(getQuestionEvidenceOwnerSkillId(candidate), chain);
  assert.notEqual(getQuestionEvidenceOwnerSkillId(candidate), candidate.curriculum?.requiredSkillIds[0]);
});
