import assert from "node:assert/strict";
import test from "node:test";
import { add, constant, exact, multiply, power, xExpression } from "../lib/maths/expression-core";
import { analyseFunctionNature, createNatureTableExpectedAnswers } from "../lib/maths/function-analysis";

test("one stationary point is classified as a minimum from derivative signs", () => {
  const analysis = analyseFunctionNature(add(power(xExpression, 2), multiply(constant(-6), xExpression), constant(4)));
  assert.equal(analysis.status, "supported");
  if (analysis.status !== "supported") return;
  assert.equal(analysis.criticalPoints.length, 1);
  assert.equal(analysis.criticalPoints[0].nature, "minimum");
  assert.equal(analysis.intervalSigns["interval-0"], "negative");
  assert.equal(analysis.intervalSigns["interval-1"], "positive");
});

test("two stationary points produce maximum then minimum for cubic example with configured critical values", () => {
  const expression = add(power(xExpression, 3), multiply(constant(-3), xExpression));
  const analysis = analyseFunctionNature(expression, [exact(-1), exact(1)]);
  assert.equal(analysis.status, "supported");
  if (analysis.status !== "supported") return;
  assert.deepEqual(analysis.criticalPoints.map((point) => point.nature), ["maximum", "minimum"]);
  const answers = createNatureTableExpectedAnswers(analysis);
  assert.deepEqual(answers["nature:critical-0"], { type: "nature", value: "maximum" });
  assert.deepEqual(answers["nature:critical-1"], { type: "nature", value: "minimum" });
});

test("unsupported automatic solving asks content to supply critical values", () => {
  const analysis = analyseFunctionNature({ type: "sin", argument: xExpression });
  assert.deepEqual(analysis, { status: "unsupported", reasonCode: "critical_values_required" });
});
