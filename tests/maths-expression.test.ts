import assert from "node:assert/strict";
import test from "node:test";
import { add, constant, evaluateMathExpression, exact, expressionToDisplay, power, serializeMathExpression, validateMathExpression, xExpression } from "../lib/maths/expression-core";

test("valid supported expressions serialize deterministically and evaluate safely", () => {
  const expression = add(power(xExpression, 2), constant(-4));
  assert.equal(validateMathExpression(expression).status, "valid");
  assert.equal(serializeMathExpression(expression), "add(constant(-4/1),power(variable(x),2/1))");
  assert.equal(expressionToDisplay(expression), "-4 + x^2");
  assert.deepEqual(evaluateMathExpression(expression, 3), { status: "value", value: 5 });
});

test("invalid expression nodes, variables and excessive depth fail closed", () => {
  assert.equal(validateMathExpression({ type: "variable", name: "y" }).status, "invalid");
  assert.equal(validateMathExpression({ type: "execute", code: "alert(1)" }).status, "invalid");
  let deep = xExpression;
  for (let index = 0; index < 20; index += 1) deep = { type: "sin", argument: deep };
  assert.deepEqual(validateMathExpression(deep), { status: "invalid", reasonCode: "too_deep" });
});

test("domain errors are reported instead of throwing", () => {
  assert.equal(evaluateMathExpression({ type: "log", argument: xExpression }, -1).status, "domain_error");
  assert.equal(evaluateMathExpression({ type: "tan", argument: xExpression }, Math.PI / 2).status, "domain_error");
  assert.equal(exact(2, 4).denominator, 2);
});
