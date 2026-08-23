import assert from "node:assert/strict";
import test from "node:test";
import { add, constant, evaluateMathExpression, exact, multiply, power, xExpression } from "../lib/maths/expression-core";
import { buildGraphModel } from "../lib/maths/graph-model";
import { graphPointToSvg } from "../lib/maths/graph-sampling";
import { validateGraphDefinition } from "../lib/maths/graph-validation";
import { integrationAcceptanceGraph, twoCurveGraphFixture } from "../lib/maths/graph-fixtures";

const viewport = { xMin: -4, xMax: 4, yMin: -4, yMax: 8 };

test("linear and quadratic primitives produce deterministic adaptive geometry", () => {
  for (const expression of [xExpression, power(xExpression, 2)]) {
    const definition = { id: "curve", expression, styleRole: "primary" as const };
    const first = buildGraphModel({ viewport, functions: [definition] }, 640, 360);
    const second = buildGraphModel({ viewport, functions: [definition] }, 640, 360);
    assert.equal(first.status, "ready"); assert.deepEqual(first, second);
    assert.ok(first.model.curves[0].segments.flat().length >= 97);
  }
});

test("the integration acceptance fixture has the exact required values and a safe shaded region", () => {
  const curve = integrationAcceptanceGraph.functions[0];
  assert.deepEqual([1, 2, 4].map((x) => evaluateMathExpression(curve.expression, x)), [
    { status: "value", value: 2 }, { status: "value", value: 3 }, { status: "value", value: 11 },
  ]);
  for (let index = 0; index <= 100; index += 1) {
    const result = evaluateMathExpression(curve.expression, integrationAcceptanceGraph.viewport.xMin + (integrationAcceptanceGraph.viewport.xMax - integrationAcceptanceGraph.viewport.xMin) * index / 100);
    assert.equal(result.status, "value"); if (result.status === "value") assert.ok(result.value > 0);
  }
  const model = buildGraphModel(integrationAcceptanceGraph, 640, 360);
  assert.equal(model.status, "ready");
  assert.equal(model.model.regions.length, 1);
  assert.match(model.model.regions[0].path, /^M/);
});

test("reciprocal and fractional-power domain errors never create an unsafe connecting segment", () => {
  const reciprocal = { id: "reciprocal", expression: power(xExpression, -1), styleRole: "primary" as const };
  const reciprocalModel = buildGraphModel({ viewport: { xMin: -2, xMax: 2, yMin: -5, yMax: 5 }, functions: [reciprocal] }, 640, 360);
  assert.equal(reciprocalModel.status, "ready");
  assert.ok(reciprocalModel.model.curves[0].segments.length >= 2);
  assert.ok(reciprocalModel.model.curves[0].segments.every((segment) => segment.every((point) => point.x < 0) || segment.every((point) => point.x > 0)));

  const root = { id: "root", expression: power(xExpression, exact(1, 2)), styleRole: "primary" as const };
  const rootModel = buildGraphModel({ viewport: { xMin: -2, xMax: 2, yMin: -1, yMax: 2 }, functions: [root] }, 640, 360);
  assert.equal(rootModel.status, "ready");
  assert.ok(rootModel.model.curves[0].segments.flat().every((point) => point.x >= 0));
});

test("ordered between-curve regions render and crossing curves fail closed", () => {
  assert.equal(buildGraphModel(twoCurveGraphFixture, 640, 360).status, "ready");
  const crossing = validateGraphDefinition({
    viewport,
    functions: [
      { id: "a", expression: xExpression, styleRole: "primary" },
      { id: "b", expression: add(constant(2), multiply(constant(-1), xExpression)), styleRole: "secondary" },
    ],
    regions: [{ id: "crossing", type: "between-curves", curveAId: "a", curveBId: "b", fromX: 0, toX: 2, description: "Ambiguous crossing region." }],
  });
  assert.ok(crossing.some((issue) => issue.code === "unsafe-graph-region-domain"));
});

test("malformed declarations and unknown expression nodes fail closed", () => {
  const issues = validateGraphDefinition({
    viewport: { xMin: 1, xMax: 1, yMin: 0, yMax: 2 },
    functions: [{ id: "curve", expression: { type: "execute" } as never, styleRole: "primary" }],
  });
  assert.ok(issues.some((issue) => issue.code === "invalid-graph-viewport"));
  assert.ok(issues.some((issue) => issue.code === "invalid-graph-expression"));
  const placementIssues = validateGraphDefinition({
    viewport,
    functions: [{ id: "curve", expression: xExpression, styleRole: "primary", labelPlacement: "diagonal" as never }],
  });
  assert.ok(placementIssues.some((issue) => issue.code === "invalid-graph-label-placement"));
});

test("mathematical coordinates use explicit independent x and y scales", () => {
  assert.deepEqual(graphPointToSvg({ x: 0, y: 2 }, { xMin: -2, xMax: 2, yMin: -2, yMax: 6 }, 640, 320), { x: 320, y: 160 });
});
