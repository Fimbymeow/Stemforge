import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { higherMaths } from "../data/higher-maths";
import { markQuestionAnswer } from "../lib/answer-engine";
import { getQuestionProgress, calculateSkillPathProgress, selectNextQuestionId } from "../lib/progress/calculations";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

const skillPath = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
assert.ok(skillPath);
const question = higherMathsDifferentiationQuestions[0];

function markedAttempt(answer: string, sequence = 1, hintViewedBeforeSubmission = false) {
  return attempt({
    questionId: question.id,
    stageId: question.stageId ?? question.stage,
    answer,
    sequence,
    hintViewedBeforeSubmission,
    isCorrect: markQuestionAnswer(question, answer).isCorrect,
  });
}

test("answer acceptance remains connected to completion", () => {
  const record = markedAttempt("5x^4");
  assert.equal(record.isCorrect, true);
  assert.equal(getQuestionProgress(question.id, evidence([record])).completed, true);
  assert.equal(selectNextQuestionId(skillPath, evidence([record])), "hm-calc-diff-basic-f-002");
});

test("answer rejection remains connected but incorrect alone does not complete", () => {
  const record = markedAttempt("4x^5");
  assert.equal(record.isCorrect, false);
  assert.equal(getQuestionProgress(question.id, evidence([record])).completed, false);
  assert.equal(selectNextQuestionId(skillPath, evidence([record])), question.id);
});

test("hint usage changes outcome without changing answer acceptance", () => {
  const record = markedAttempt("5x^4", 2, true);
  const state = getQuestionProgress(question.id, evidence([record], [supportEvent({ questionId: question.id, type: "hint_viewed", sequence: 1, afterGenuineAttempt: false })]));
  assert.equal(record.isCorrect, true);
  assert.equal(state.bestOutcome, "correct_with_hint");
});

test("worked solution after an incorrect attempt completes and unlocks progression", () => {
  const record = markedAttempt("wrong");
  const data = evidence([record], [supportEvent({ questionId: question.id, type: "solution_viewed", sequence: 2 })]);
  assert.equal(getQuestionProgress(question.id, data).completed, true);
  assert.equal(selectNextQuestionId(skillPath, data), "hm-calc-diff-basic-f-002");
});

test("progress bars count completed rather than merely submitted", () => {
  const progress = calculateSkillPathProgress(skillPath, evidence([markedAttempt("wrong")]));
  assert.equal(progress.attemptedCount, 1);
  assert.equal(progress.completedQuestionIds.length, 0);
  assert.equal(progress.completionPercentage, 0);
});
