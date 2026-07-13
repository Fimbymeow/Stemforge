import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import type { Question } from "../data/types";
import {
  canSubmitAnswer,
  compareAcceptedAnswers,
  getLegacyPhysicsDemoAnswerState,
  markQuestionAnswer,
  normaliseAnswer,
} from "../lib/answer-engine";

const powerQuestion = higherMathsDifferentiationQuestions.find((question) => question.id === "hm-calc-diff-basic-f-001");
const numericalQuestion = higherMathsDifferentiationQuestions.find((question) => question.id === "hm-calc-diff-basic-f-003");
const physicsQuestion = legacyPhysicsQuestions.find((question) => question.id === "motion-f-001");

assert.ok(powerQuestion);
assert.ok(numericalQuestion);
assert.ok(physicsQuestion);

test("normalisation preserves the existing character substitutions", () => {
  assert.equal(normaliseAnswer(" 5 * X^{4} "), "5x^4");
  assert.equal(normaliseAnswer("5×x⁴"), "5x⁴");
  assert.equal(normaliseAnswer("\u2212\u03c0 x² · 3"), "-pix^23");
});

test("canonical and explicitly accepted Maths answers remain accepted", () => {
  for (const acceptedAnswer of powerQuestion.acceptedAnswers) {
    assert.equal(markQuestionAnswer(powerQuestion, acceptedAnswer).isCorrect, true);
  }
});

test("current whitespace, case, multiplication and brace variants remain accepted", () => {
  for (const value of ["  5x^4  ", "5 X ^ 4", "5*x^{4}", "5×x^4", "5·x^4"]) {
    assert.equal(markQuestionAnswer(powerQuestion, value).isCorrect, true, value);
  }
});

test("mathematically equivalent reordered algebra remains rejected", () => {
  assert.equal(markQuestionAnswer(powerQuestion, "x^4*5").isCorrect, false);
  assert.equal(markQuestionAnswer(powerQuestion, "5x*x*x*x").isCorrect, false);
});

test("decimal formatting, leading zeros and leading plus signs are not equivalent", () => {
  assert.equal(markQuestionAnswer(numericalQuestion, "14").isCorrect, true);
  assert.equal(markQuestionAnswer(numericalQuestion, "14.0").isCorrect, false);
  assert.equal(markQuestionAnswer(numericalQuestion, "014").isCorrect, false);
  assert.equal(markQuestionAnswer(numericalQuestion, "+14").isCorrect, false);
});

test("fractions are exact strings and are not equivalent to decimals", () => {
  assert.equal(compareAcceptedAnswers(" 1 / 2 ", ["1/2"]).isCorrect, true);
  assert.equal(compareAcceptedAnswers("0.5", ["1/2"]).isCorrect, false);
  assert.equal(compareAcceptedAnswers("2/4", ["1/2"]).isCorrect, false);
});

test("negative and Unicode-minus forms share the existing normalisation", () => {
  assert.equal(compareAcceptedAnswers("-2", ["-2"]).isCorrect, true);
  assert.equal(compareAcceptedAnswers("\u22122", ["-2"]).isCorrect, true);
});

test("brackets, commas and units are retained except for whitespace", () => {
  assert.equal(compareAcceptedAnswers("( 2, 3 )", ["(2,3)"]).isCorrect, true);
  assert.equal(compareAcceptedAnswers("2 metres", ["2"]).isCorrect, false);
  assert.equal(compareAcceptedAnswers("[2,3]", ["(2,3)"]).isCorrect, false);
});

test("empty and whitespace-only answers cannot be submitted", () => {
  assert.equal(canSubmitAnswer(""), false);
  assert.equal(canSubmitAnswer("   "), false);
  assert.equal(canSubmitAnswer("0"), true);
  assert.equal(compareAcceptedAnswers("", [""]).isCorrect, true);
});

test("accepted-answer order only determines which matching alias is reported", () => {
  const result = compareAcceptedAnswers("5*x^4", ["5x^4", "5*x^4"]);
  assert.equal(result.isCorrect, true);
  assert.equal(result.matchedAcceptedAnswer, "5x^4");
});

test("guided written and multi-step answers remain unmarked regardless of completeness", () => {
  const multiStep = { ...powerQuestion, answerType: "multi_step" as const } satisfies Question;
  assert.equal(markQuestionAnswer(multiStep, "x=1\ny=2").isCorrect, null);
  assert.equal(markQuestionAnswer(multiStep, "x=1").isCorrect, null);
  assert.equal(markQuestionAnswer({ ...multiStep, answerType: "written" }, "complete explanation").isCorrect, null);
});

test("legacy Physics remains an unmarkable prefilled demonstration", () => {
  const canonical = getLegacyPhysicsDemoAnswerState(physicsQuestion);
  const incorrectInputCannotBeEvaluated = getLegacyPhysicsDemoAnswerState(physicsQuestion);
  assert.deepEqual(canonical, incorrectInputCannotBeEvaluated);
  assert.equal(canonical.isMarkable, false);
  assert.equal(canonical.isCorrect, null);
  assert.equal(canonical.displayedAnswer, "2.0");
});
