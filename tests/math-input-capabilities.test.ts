import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import type { ElementaryExpressionEquivalenceMarkingContract } from "../lib/marking/types";
import { deriveMathInputCapabilities, getMathInputCapabilities } from "../lib/questions/math-input-capabilities";
import { deriveElementaryMathKeyboardControls } from "../lib/questions/math-keyboard-controls";

const elementary: ElementaryExpressionEquivalenceMarkingContract = {
  strategy: "elementary_expression_equivalence", strategyVersion: 1, target: "3sin(x)+pi", variable: "x",
  allowedFunctions: ["sin", "cos"], allowedConstants: ["pi"],
  fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] },
};

test("all live Basic Differentiation and Chain Rule questions retain their exact function-free contracts", () => {
  const questions = [...higherMathsDifferentiationQuestions, ...higherMathsChainRuleQuestions];
  assert.equal(higherMathsDifferentiationQuestions.length, 8);
  assert.equal(higherMathsChainRuleQuestions.length, 34);
  for (const question of questions) {
    const capabilities = deriveMathInputCapabilities(question);
    assert.deepEqual(capabilities.allowedFunctions, [], question.id);
    assert.deepEqual(capabilities.allowedConstants, [], question.id);
    assert.deepEqual(deriveElementaryMathKeyboardControls(capabilities), [], question.id);
  }
});

test("elementary question subsets drive only the corresponding keyboard controls", () => {
  const capabilities = getMathInputCapabilities(elementary);
  assert.deepEqual(capabilities.allowedFunctions, ["sin", "cos"]);
  assert.deepEqual(capabilities.allowedConstants, ["pi"]);
  assert.deepEqual(deriveElementaryMathKeyboardControls(capabilities).map((control) => control.accessibleLabel), [
    "Insert sine", "Insert cosine", "Insert pi",
  ]);
});

test("log controls are explicit and bounded by the declared contract", () => {
  const capabilities = getMathInputCapabilities({ ...elementary, target: "log_2(x)", allowedFunctions: ["log"], allowedConstants: [], allowedLogBases: [2] });
  const controls = deriveElementaryMathKeyboardControls(capabilities);
  assert.deepEqual(controls, [{ id: "log", label: "log", accessibleLabel: "Insert logarithm", latex: "\\log_{#0}\\left(#?\\right)" }]);
  assert.deepEqual(capabilities.allowedLogBases, [2]);
});
