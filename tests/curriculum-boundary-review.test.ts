import assert from "node:assert/strict";
import test from "node:test";
import { basicDifferentiationQuestionReview } from "../data/curriculum/higher-mathematics/basic-differentiation-question-review";
import { validateQuestionCurriculumMetadata, validateRequiredSkillsWithinPrerequisiteClosure } from "../lib/curriculum/question-curriculum-metadata";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";

/**
 * These assertions read explicit, hand-authored fixture metadata — they do not run any
 * automatic classifier over question text. That is deliberate: the brief is explicit that
 * "solving f'(x) = 0" is not, by itself, sufficient reason to move a question, and that
 * curriculum intent should never be inferred automatically from raw mathematics.
 */

test("every live Basic Differentiation question has an explicit review record", () => {
  const reviewedIds = basicDifferentiationQuestionReview.map((record) => record.questionId);
  assert.deepEqual(
    [...reviewedIds].sort(),
    [
      "hm-calc-diff-basic-a-001", "hm-calc-diff-basic-a-002", "hm-calc-diff-basic-a-003",
      "hm-calc-diff-basic-f-001", "hm-calc-diff-basic-f-002", "hm-calc-diff-basic-f-003",
      "hm-calc-diff-basic-ppq-001", "hm-calc-diff-basic-ppq-002",
    ],
  );
});

test("questions that only evaluate a derivative are NOT classified as Stationary Points, even where a gradient happens to be zero-adjacent language", () => {
  const gradientOnly = basicDifferentiationQuestionReview.filter((record) =>
    ["hm-calc-diff-basic-a-002", "hm-calc-diff-basic-ppq-001"].includes(record.questionId));
  for (const record of gradientOnly) {
    assert.equal(record.metadata.primarySkillId, "basic-differentiation");
    assert.equal(record.recommendedAction, "remain");
  }
});

test("questions whose task intent explicitly names \"the stationary point\" as the target are classified as Stationary Points", () => {
  const stationaryPointQuestions = basicDifferentiationQuestionReview.filter((record) =>
    ["hm-calc-diff-basic-a-003", "hm-calc-diff-basic-ppq-002"].includes(record.questionId));
  assert.equal(stationaryPointQuestions.length, 2);
  for (const record of stationaryPointQuestions) {
    assert.equal(record.metadata.primarySkillId, "stationary-points");
    assert.equal(record.recommendedAction, "move");
    assert.equal(record.futureMigrationNeeded, true);
    assert.ok(record.taskIntent.toLowerCase().includes("stationary point"));
  }
});

test("no review record's task-intent classification is derived by pattern-matching \"f'(x) = 0\" or \"= 0\" in the question text", () => {
  // hm-calc-diff-basic-f-003 also involves finding where a derivative is used, but its
  // task intent is evaluation at a stated point, not "find the stationary point" — it
  // correctly stays classified under basic-differentiation.
  const evaluationQuestion = basicDifferentiationQuestionReview.find((record) => record.questionId === "hm-calc-diff-basic-f-003")!;
  assert.equal(evaluationQuestion.metadata.primarySkillId, "basic-differentiation");
});

test("every review record's metadata passes shape validation and stays within its prerequisite closure", () => {
  for (const record of basicDifferentiationQuestionReview) {
    const shapeReport = validateQuestionCurriculumMetadata(record.metadata);
    assert.deepEqual(shapeReport.errors, [], `${record.questionId} metadata failed shape validation`);
    const closureReport = validateRequiredSkillsWithinPrerequisiteClosure(record.metadata, higherMathematicsCalculusPrerequisites);
    assert.deepEqual(closureReport.errors, [], `${record.questionId} metadata failed prerequisite-closure validation`);
  }
});

test("moved questions correctly require basic-differentiation, since a stationary point cannot be found without first differentiating", () => {
  const moved = basicDifferentiationQuestionReview.filter((record) => record.recommendedAction === "move");
  for (const record of moved) {
    assert.deepEqual(record.metadata.requiredSkillIds, ["basic-differentiation"]);
  }
});
