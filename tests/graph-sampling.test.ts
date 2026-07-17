import assert from "node:assert/strict";
import test from "node:test";
import { constant, power, xExpression } from "../lib/maths/expression-core";
import { sampleExpressionForGraph } from "../lib/maths/graph-sampling";

test("polynomial sampling is deterministic and bounded", () => {
  const segments = sampleExpressionForGraph(power(xExpression, 2), { xMin: -2, xMax: 2, yMin: -1, yMax: 5 }, { samples: 40 });
  assert.equal(segments.length, 1);
  assert.equal(segments[0].length, 41);
});

test("domain errors and asymptotes split sampled graph segments", () => {
  const reciprocal = { type: "power" as const, base: xExpression, exponent: { numerator: -1 } };
  const segments = sampleExpressionForGraph(reciprocal, { xMin: -2, xMax: 2, yMin: -5, yMax: 5 }, { samples: 80 });
  assert.ok(segments.length >= 2);
  assert.ok(segments.every((segment) => segment.every((point) => Number.isFinite(point.y))));
});

test("sampling refuses to connect log domain errors", () => {
  const segments = sampleExpressionForGraph({ type: "log", argument: xExpression }, { xMin: -2, xMax: 2, yMin: -5, yMax: 5 }, { samples: 80 });
  assert.equal(segments.length, 1);
  assert.ok(segments[0][0].x > 0);
  assert.equal(sampleExpressionForGraph(constant(2), { xMin: 0, xMax: 1, yMin: 0, yMax: 3 }, { samples: 10 })[0].length, 17);
});
