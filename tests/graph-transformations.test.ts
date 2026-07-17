import assert from "node:assert/strict";
import test from "node:test";
import { add, constant, evaluateMathExpression, exact, power, serializeMathExpression, xExpression } from "../lib/maths/expression-core";
import { applyGraphTransformations, transformGraphPoint } from "../lib/maths/graph-transformations";

test("translations, reflections and scales follow Higher Maths conventions", () => {
  const expression = power(xExpression, 2);
  const rightTwo = applyGraphTransformations(expression, [{ type: "translateX", value: exact(2) }]);
  assert.equal(evaluate(rightTwo, 2), 0);
  const vertical = applyGraphTransformations(expression, [{ type: "translateY", value: exact(3) }]);
  assert.equal(evaluate(vertical, 0), 3);
  const horizontalScale = applyGraphTransformations(expression, [{ type: "scaleX", factor: exact(2) }]);
  assert.equal(evaluate(horizontalScale, 2), 1);
  const reflected = applyGraphTransformations(add(xExpression, constant(1)), [{ type: "reflectY" }]);
  assert.equal(evaluate(reflected, 2), -1);
});

test("key-point mapping is deterministic and exact enough for validation", () => {
  const point = transformGraphPoint({ x: exact(1), y: exact(-2), label: "min" }, [
    { type: "translateX", value: exact(3) },
    { type: "reflectX" },
  ]);
  assert.equal(point.x.numerator / (point.x.denominator ?? 1), 4);
  assert.equal(point.y.numerator / (point.y.denominator ?? 1), 2);
});

test("transformed expressions serialize stably", () => {
  const transformed = applyGraphTransformations(xExpression, [{ type: "scaleY", factor: exact(-2) }]);
  assert.equal(serializeMathExpression(transformed), "multiply(constant(-2/1),variable(x))");
});

function evaluate(expression: Parameters<typeof evaluateMathExpression>[0], x: number) {
  const result = evaluateMathExpression(expression, x);
  assert.equal(result.status, "value");
  return result.status === "value" ? result.value : 0;
}
