import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent, type CanonicalContentSource } from "../data/canonical-content";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { checkQuestionEligibilityForScope, deriveAllowedRequirementSkillIds, getQuestionEvidenceOwnerSkillId } from "../lib/curriculum/question-scope-eligibility";
import { createContentResolver } from "../lib/content-resolver";
import { createBuildATestPlan, createBuildATestSession } from "../lib/practice/test-builder";
import { isPracticeSession } from "../lib/practice/practice-validation";

const basicRequirement = "hm-calc-diff-power-rule";
const chainRequirement = "hm-calc-diff-chain-rule";
const tangentRequirement = "hm-calc-tangent";

test("official requirements resolve deterministically and duplicate canonical resolutions are deduplicated", () => {
  const plan = createBuildATestPlan({ selectedRequirementIds: [chainRequirement, chainRequirement], requestedCount: 5, seed: "dedupe" });
  assert.deepEqual(plan.selectedRequirementIds, [chainRequirement]);
  assert.deepEqual(plan.selectedAssessmentSkillIds, ["chain-rule"]);
});

test("Chain Rule uses prerequisite-aware scope without assessing Basic Differentiation", () => {
  const plan = createBuildATestPlan({ selectedRequirementIds: [chainRequirement], requestedCount: 5, seed: "chain" });
  assert.equal(plan.status, "ready");
  assert.equal(plan.availableCount, 34);
  assert.deepEqual(plan.selectedAssessmentSkillIds, ["chain-rule"]);
  assert(plan.allowedRequirementSkillIds.includes("basic-differentiation"));
  assert(!plan.allowedRequirementSkillIds.includes("trigonometric-differentiation"));
  assert(plan.selectedQuestions.every((candidate) => getQuestionEvidenceOwnerSkillId(candidate.question) === "chain-rule"));

  const strict = deriveAllowedRequirementSkillIds({ policy: "strict", selectedAssessmentSkillIds: ["chain-rule"], availableCourseSkillIds: ["chain-rule", "basic-differentiation"], prerequisiteRelationships: higherMathematicsCalculusPrerequisites });
  const dependencyQuestion = canonicalContent.questions.find((question) => question.id === "hm-calc-diff-chain-ppq-017")!;
  assert.deepEqual(checkQuestionEligibilityForScope({ question: dependencyQuestion, selectedAssessmentSkillIds: ["chain-rule"], allowedRequirementSkillIds: strict }), { eligible: false, reason: "required_skill_outside_scope", skillId: "basic-differentiation" });
});

test("package-conditional or unrelated skills are not automatically admitted", () => {
  const source = sourceWithAvailablePath("trigonometric-differentiation");
  const changed = source.questions.find((question) => question.id === "hm-calc-diff-chain-f-003")!;
  changed.curriculum = { primarySkillId: "chain-rule", requiredSkillIds: ["trigonometric-differentiation"] };
  const plan = createBuildATestPlan({ selectedRequirementIds: [chainRequirement], requestedCount: 5, seed: "conditional", source });
  assert.equal(plan.availableCount, 33);
  assert(!plan.selectedQuestions.some((candidate) => candidate.question.id === changed.id));
  assert(!plan.allowedRequirementSkillIds.includes("trigonometric-differentiation"));
});

test("availability count and assembly share one pool, never exceed capacity or duplicate IDs", () => {
  const ready = createBuildATestPlan({ selectedRequirementIds: [chainRequirement], requestedCount: 20, seed: "capacity" });
  assert.equal(ready.availableCount, 34);
  assert.equal(ready.selectedQuestions.length, 20);
  assert.equal(new Set(ready.selectedQuestions.map((candidate) => candidate.question.id)).size, 20);
  const insufficient = createBuildATestPlan({ selectedRequirementIds: [chainRequirement], requestedCount: 35, seed: "capacity" });
  assert.equal(insufficient.status, "insufficient_content");
  assert.equal(insufficient.availableCount, 34);
  assert.deepEqual(insufficient.selectedQuestions, []);
});

test("multi-skill assembly balances assessed skills and prefers assessment-like stage diversity", () => {
  const plan = createBuildATestPlan({ selectedRequirementIds: [basicRequirement, chainRequirement], requestedCount: 10, seed: "balance" });
  const skillIds = plan.selectedQuestions.map((candidate) => candidate.question.curriculum!.primarySkillId);
  const stages = new Set(plan.selectedQuestions.map((candidate) => candidate.question.stage));
  assert(skillIds.includes("basic-differentiation"));
  assert(skillIds.includes("chain-rule"));
  assert(Math.abs(skillIds.filter((id) => id === "basic-differentiation").length - skillIds.filter((id) => id === "chain-rule").length) <= 1);
  assert(stages.has("Applications"));
  assert(stages.has("Past Paper-style Questions"));
});

test("assembly is deterministic for an injected seed", () => {
  const input = { selectedRequirementIds: [basicRequirement, chainRequirement], requestedCount: 10, seed: "repeatable" };
  const first = createBuildATestPlan(input).selectedQuestions.map((candidate) => candidate.question.id);
  const second = createBuildATestPlan(input).selectedQuestions.map((candidate) => candidate.question.id);
  assert.deepEqual(first, second);
});

test("empty, no-content and partial-content scopes remain honest", () => {
  assert.equal(createBuildATestPlan({ selectedRequirementIds: [], requestedCount: 5, seed: "empty" }).status, "empty_selection");
  const empty = createBuildATestPlan({ selectedRequirementIds: [tangentRequirement], requestedCount: 5, seed: "none" });
  assert.equal(empty.status, "no_content");
  assert.deepEqual(empty.unavailableRequirementIds, [tangentRequirement]);
  const partial = createBuildATestPlan({ selectedRequirementIds: [chainRequirement, tangentRequirement], requestedCount: 5, seed: "partial" });
  assert.equal(partial.status, "ready");
  assert.deepEqual(partial.unavailableRequirementIds, [tangentRequirement]);
  assert(partial.selectedQuestions.every((candidate) => candidate.question.curriculum?.primarySkillId === "chain-rule"));
});

test("Build a Test creates a normal valid Practice session with a distinct origin", () => {
  const result = createBuildATestSession({ selectedRequirementIds: [chainRequirement], requestedCount: 5, seed: "session", now: new Date("2026-08-30T10:00:00.000Z") });
  assert(result.session);
  assert.equal(isPracticeSession(result.session), true);
  assert.equal(result.session.origin, "build_a_test");
  assert.deepEqual(result.session.selectedPathIds, ["chain-rule"]);
  assert.equal(result.session.selectionMetadata.availableCount, result.plan.availableCount);
  assert.equal(result.session.questionReferences.length, 5);
});

function sourceWithAvailablePath(skillPathId: string): CanonicalContentSource {
  const source = structuredClone(canonicalContent);
  const path = createContentResolver(source).getPathContext(skillPathId)!.skillPath;
  path.isAvailable = true;
  path.status = "available";
  path.contentStatus = "active";
  return source;
}
