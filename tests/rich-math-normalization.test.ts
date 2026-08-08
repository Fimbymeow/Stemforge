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
import type { ElementaryExpressionEquivalenceMarkingContract } from "../lib/marking/types";

const basic = requiredQuestion("hm-calc-diff-basic-f-001");
const compositeV1 = requiredQuestion("hm-calc-diff-chain-f-003");
const compositeV2 = requiredQuestion("hm-calc-diff-chain-f-008");
const elementaryContract: ElementaryExpressionEquivalenceMarkingContract = {
  strategy: "elementary_expression_equivalence",
  strategyVersion: 1,
  target: "sin(x)",
  variable: "x",
  allowedFunctions: ["sin", "cos", "tan", "ln", "log"],
  allowedConstants: ["pi", "e"],
  allowedLogBases: [2, 10],
  fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] },
};

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

test("normalizes and restores the bounded elementary-expression vocabulary", () => {
  const capabilities = deriveMathInputCapabilities({ marking: elementaryContract });
  const cases = [
    ["\\sin x", "sin(x)"], ["3\\sin x", "3sin(x)"], ["\\sin(2x)", "sin(2x)"],
    ["\\cos(x)", "cos(x)"], ["-4\\cos(3x)", "-4cos(3x)"], ["\\tan(x)", "tan(x)"],
    ["\\tan\\left(x+\\frac{\\pi}{4}\\right)", "tan(x+pi/4)"], ["\\pi", "pi"],
    ["\\frac{\\pi}{4}", "pi/4"], ["\\frac{3\\pi}{2}", "3pi/2"], ["e", "e"], ["e^x", "e^x"], ["e^{2x}", "e^(2x)"],
    ["\\ln(x)", "ln(x)"], ["3\\ln(2x+1)", "3ln(2x+1)"], ["\\log_{2}(x)", "log_2(x)"],
    ["\\sqrt{3}", "sqrt(3)"], ["\\frac{\\sqrt{3}}{2}", "sqrt(3)/2"],
    ["\\sin\\left(\\cos(x)\\right)", "sin(cos(x))"], ["\\sin(x)^2", "sin(x)^2"],
  ] as const;
  for (const [source, canonical] of cases) {
    assert.deepEqual(normalizeRichMathSource(source, capabilities), { status: "ready", canonical, version: 1 }, source);
    const restored = canonicalMathToLatex(canonical, capabilities);
    assert.ok(restored, canonical);
    assert.equal(normalizeRichMathSource(restored, capabilities).status, "ready", canonical);
  }
});

test("elementary capabilities fail closed and honour question-level subsets", () => {
  const capabilities = deriveMathInputCapabilities({ marking: elementaryContract });
  for (const source of ["\\sec(x)", "\\arcsin(x)", "\\text{answer}", "\\unknown{x}", "y", "x=1", "\\int x"] ) {
    assert.equal(normalizeRichMathSource(source, capabilities).status, "unsupported", source);
  }
  for (const source of ["\\log_{3}(x)", "\\log_{1}(x)", "\\log_{x}(x)"]) {
    assert.equal(normalizeRichMathSource(source, capabilities).status, "unsupported", source);
  }
  assert.equal(normalizeRichMathSource("\\sin(", capabilities).status, "incomplete");
  assert.equal(normalizeRichMathSource("\\log_{}(x)", capabilities).status, "incomplete");
  assert.equal(normalizeRichMathSource("\\sin(\\cos(\\tan(x)))", capabilities).status, "unsupported");

  const sineOnly = deriveMathInputCapabilities({ marking: { ...elementaryContract, allowedFunctions: ["sin"], allowedConstants: [] } });
  assert.deepEqual(sineOnly.allowedFunctions, ["sin"]);
  assert.deepEqual(sineOnly.allowedConstants, []);
  assert.equal(normalizeRichMathSource("\\sin(x)", sineOnly).status, "ready");
  assert.equal(normalizeRichMathSource("\\cos(x)", sineOnly).status, "unsupported");
  assert.equal(normalizeRichMathSource("\\pi", sineOnly).status, "unsupported");
});

test("existing strategies expose no elementary function or constant controls", () => {
  for (const question of [basic, compositeV1, compositeV2]) {
    const capabilities = deriveMathInputCapabilities(question);
    assert.deepEqual(capabilities.allowedFunctions, []);
    assert.deepEqual(capabilities.allowedConstants, []);
    assert.equal(capabilities.directSquareRoots, false);
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
