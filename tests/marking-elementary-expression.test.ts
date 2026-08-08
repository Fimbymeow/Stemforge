import assert from "node:assert/strict";
import test from "node:test";
import { markQuestionAnswer } from "../lib/answer-engine";
import { markElementaryExpression } from "../lib/marking/elementary-expression";
import type { ElementaryExpressionEquivalenceMarkingContract } from "../lib/marking/types";

function contract(
  target: string,
  overrides: Partial<Pick<ElementaryExpressionEquivalenceMarkingContract, "allowedFunctions" | "allowedConstants" | "allowedLogBases">> = {},
): ElementaryExpressionEquivalenceMarkingContract {
  return {
    strategy: "elementary_expression_equivalence",
    strategyVersion: 1,
    target,
    variable: "x",
    allowedFunctions: overrides.allowedFunctions ?? ["sin", "cos", "tan", "ln", "log"],
    allowedConstants: overrides.allowedConstants ?? ["pi", "e"],
    allowedLogBases: overrides.allowedLogBases ?? [2, 10],
    fixtures: {
      correct: [{ input: target }],
      incorrect: [{ input: target === "3sin(x)" ? "3cos(x)" : "0", reason: "value_wrong" }],
      malformed: [{ input: "sin(", reason: "malformed_elementary_expression" }],
      unmarkable: [{ input: "sec(x)", reason: "unsupported_mathematical_form" }],
    },
  };
}

test("elementary expressions compare conservatively without inventing identities", () => {
  assert.equal(markElementaryExpression(contract("3sin(x)"), "3sin(x)").isCorrect, true);
  assert.equal(markElementaryExpression(contract("3sin(x)"), "3cos(x)").isCorrect, false);
  assert.equal(markElementaryExpression(contract("cos(2x)"), "cos(3x)").isCorrect, false);
  assert.equal(markElementaryExpression(contract("pi/4"), "pi/3").isCorrect, false);
  assert.equal(markElementaryExpression(contract("ln(x)"), "log_10(x)").isCorrect, false);
  assert.equal(markElementaryExpression(contract("e^x"), "e^(2x)").isCorrect, false);
  assert.equal(markElementaryExpression(contract("1"), "sin(x)^2+cos(x)^2").isCorrect, false);
});

test("unsupported and malformed elementary expressions are never graded", () => {
  assert.equal(markElementaryExpression(contract("sin(x)"), "sec(x)").outcomeKind, "unmarkable");
  assert.equal(markElementaryExpression(contract("sin(x)"), "arcsin(x)").outcomeKind, "unmarkable");
  assert.equal(markElementaryExpression(contract("sin(x)"), "sin(").outcomeKind, "malformed");
  assert.equal(markElementaryExpression(contract("sin(x)", { allowedFunctions: ["sin"] }), "cos(x)").outcomeKind, "unmarkable");
});

test("answer engine routes the new strategy and preserves canonical output", () => {
  const result = markQuestionAnswer({ marking: contract("tan(x+pi/4)") }, "tan(x+pi/4)");
  assert.equal(result.outcomeKind, "graded");
  assert.equal(result.isCorrect, true);
  assert.equal(result.normalizedStudentAnswer, "tan(x+pi/4)");
});

test("synthetic Trigonometric Differentiation boundary is markable without trig composites", () => {
  const sineDerivative = contract("3cos(x)", { allowedFunctions: ["sin", "cos"], allowedConstants: [] });
  const cosineDerivative = contract("4sin(x)", { allowedFunctions: ["sin", "cos"], allowedConstants: [] });
  assert.equal(markElementaryExpression(sineDerivative, "3cos(x)").isCorrect, true);
  assert.equal(markElementaryExpression(cosineDerivative, "4sin(x)").isCorrect, true);
  assert.equal(markElementaryExpression(sineDerivative, "3cos(2x)").isCorrect, false);
  assert.equal(markElementaryExpression(sineDerivative, "tan(x)").outcomeKind, "unmarkable");
});
