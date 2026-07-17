import assert from "node:assert/strict";
import test from "node:test";
import { add, constant, deriveExpression, evaluateMathExpression, multiply, power, serializeMathExpression, xExpression } from "../lib/maths/expression-core";

test("derivatives cover constants, x, sums, constant multiples and powers", () => {
  assert.equal(serializeDerivative(constant(7)), "constant(0/1)");
  assert.equal(serializeDerivative(xExpression), "constant(1/1)");
  assert.equal(serializeDerivative(add(multiply(constant(3), power(xExpression, 4)), multiply(constant(-2), power(xExpression, 2)), constant(7))), "add(multiply(constant(12/1),power(variable(x),3/1)),multiply(constant(-4/1),variable(x)))");
});

test("supported trig and exponential derivatives are cross-checked numerically", () => {
  const expression = { type: "sin" as const, argument: multiply(constant(2), xExpression) };
  const derivative = deriveExpression(expression);
  assert.equal(derivative.status, "supported");
  if (derivative.status !== "supported") return;
  const symbolic = evaluateMathExpression(derivative.simplifiedExpression, 0.4);
  const finite = valueOf(expression, 0.40001);
  const base = valueOf(expression, 0.39999);
  assert.ok(symbolic.status === "value");
  assert.ok(Math.abs(symbolic.value - ((finite - base) / 0.00002)) < 0.001);
});

test("unsupported derivatives fail explicitly", () => {
  const result = deriveExpression(multiply(xExpression, xExpression));
  assert.deepEqual(result, { status: "unsupported", reasonCode: "unsupported_derivative" });
});

function serializeDerivative(expression: Parameters<typeof deriveExpression>[0]) {
  const derivative = deriveExpression(expression);
  assert.equal(derivative.status, "supported");
  return derivative.status === "supported" ? serializeMathExpression(derivative.simplifiedExpression) : "";
}

function valueOf(expression: Parameters<typeof evaluateMathExpression>[0], x: number) {
  const result = evaluateMathExpression(expression, x);
  assert.equal(result.status, "value");
  return result.status === "value" ? result.value : 0;
}
