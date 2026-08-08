import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import { markQuestionAnswer } from "../lib/answer-engine";
import { deriveMathInputCapabilities } from "../lib/questions/math-input-capabilities";
import {
  canonicalMathToLatex,
  normalizeRichMathSource,
  RICH_MATH_MAX_DEPTH,
  RICH_MATH_SOURCE_MAX_LENGTH,
} from "../lib/questions/rich-math-normalization";

const basic = requiredQuestion("hm-calc-diff-basic-f-001");
const compositeV1 = requiredQuestion("hm-calc-diff-chain-f-003");
const compositeV2 = requiredQuestion("hm-calc-diff-chain-f-008");

test("normalizes the bounded current polynomial and composite grammar", () => {
  const cases = [
    [basic, "5x^{4}", "5x^4"],
    [basic, "12x^{3}-4x", "12x^3-4x"],
    [compositeV1, "15\\left(3x+2\\right)^{4}", "15(3x+2)^4"],
    [compositeV1, "4\\left(2x+3\\right)\\left(x^{2}+3x+1\\right)^{3}", "4(2x+3)(x^2+3x+1)^3"],
    [compositeV2, "\\left(2x+7\\right)^{-\\frac{1}{2}}", "(2x+7)^(-1/2)"],
    [compositeV2, "\\frac{-6x}{\\left(x^{2}+1\\right)^{4}}", "-6x/(x^2+1)^4"],
    [compositeV2, "\\frac{7}{2\\sqrt{7x-3}}", "7/(2sqrt(7x-3))"],
    [compositeV2, "\\frac{5}{2}\\left(5x+4\\right)^{-\\frac{1}{2}}", "5/2(5x+4)^(-1/2)"],
  ] as const;
  for (const [question, source, canonical] of cases) {
    assert.deepEqual(normalizeRichMathSource(source, deriveMathInputCapabilities(question)), {
      status: "ready", canonical, version: 1,
    }, source);
  }
});

test("incomplete structured slots are distinguished from invalid and unsupported input", () => {
  const capabilities = deriveMathInputCapabilities(compositeV2);
  for (const source of ["x^{\\placeholder{}}", "\\frac{1}{}", "\\frac{}{}", "\\sqrt{}", "x^"]) {
    assert.equal(normalizeRichMathSource(source, capabilities).status, "incomplete", source);
  }
  assert.equal(normalizeRichMathSource("x+*1", capabilities).status, "invalid");
});

test("unsupported commands and constructs fail closed", () => {
  const capabilities = deriveMathInputCapabilities(compositeV2);
  for (const source of [
    "\\pi", "\\sin{x}", "\\cos{x}", "\\tan{x}", "\\log{x}", "\\text{answer}", "\\unknown{x}",
    "x=1", "\\frac{x+1}{x-2}", "\\sqrt{x+1}", "\\frac{1}{x}", "(x+1)^{3/2}",
  ]) assert.equal(normalizeRichMathSource(source, capabilities).status, "unsupported", source);
});

test("strategy versions expose only their real parser boundaries", () => {
  assert.equal(normalizeRichMathSource("(x+1)^2", deriveMathInputCapabilities(basic)).status, "unsupported");
  assert.equal(normalizeRichMathSource("(x+1)^{-2}", deriveMathInputCapabilities(compositeV1)).status, "unsupported");
  assert.equal(normalizeRichMathSource("\\frac{1}{\\sqrt{x+1}}", deriveMathInputCapabilities(compositeV1)).status, "unsupported");
  assert.equal(normalizeRichMathSource("\\frac{1}{\\sqrt{x+1}}", deriveMathInputCapabilities(compositeV2)).status, "ready");
});

test("source length, nesting depth and expression complexity are bounded", () => {
  const capabilities = deriveMathInputCapabilities(compositeV2);
  assert.equal(normalizeRichMathSource("x".repeat(RICH_MATH_SOURCE_MAX_LENGTH + 1), capabilities).status, "invalid");
  const deeplyNested = "(".repeat(RICH_MATH_MAX_DEPTH + 2) + "x" + ")".repeat(RICH_MATH_MAX_DEPTH + 2);
  assert.equal(normalizeRichMathSource(deeplyNested, capabilities).status, "invalid");
  assert.equal(normalizeRichMathSource(Array.from({ length: 140 }, () => "x").join("+"), capabilities).status, "invalid");
});

test("every live algebraic correct fixture restores to rich source, normalizes and still marks correct", () => {
  const questions = [...higherMathsDifferentiationQuestions, ...higherMathsChainRuleQuestions]
    .filter((question) => question.answerType === "algebraic");
  assert.ok(questions.length > 0);
  for (const question of questions) {
    const capabilities = deriveMathInputCapabilities(question);
    const marking = question.marking;
    assert.ok("fixtures" in marking && marking.fixtures);
    const inputs = new Set([question.correctAnswer, ...question.acceptedAnswers, ...marking.fixtures.correct.map((fixture) => fixture.input)]);
    for (const input of inputs) {
      const source = canonicalMathToLatex(input, capabilities);
      assert.ok(source, `${question.id}: could not restore ${input}`);
      const normalized = normalizeRichMathSource(source, capabilities);
      assert.equal(normalized.status, "ready", `${question.id}: ${input} -> ${source}`);
      if (normalized.status === "ready") {
        assert.equal(markQuestionAnswer(question, normalized.canonical).isCorrect, true, `${question.id}: ${input} -> ${normalized.canonical}`);
      }
    }
  }
});

function requiredQuestion(id: string) {
  const question = [...higherMathsDifferentiationQuestions, ...higherMathsChainRuleQuestions].find((item) => item.id === id);
  assert.ok(question, id);
  return question;
}
