import assert from "node:assert/strict";
import test from "node:test";
import { markQuestionAnswer } from "@/lib/answer-engine";
import { parseGraphConfigYaml, parseGraphExpression } from "@/lib/content-import/graph-authoring";
import { evaluateMathExpression } from "@/lib/maths/expression-core";
import { validateGraphDefinition } from "@/lib/maths/graph-validation";
import { createGraphImportPilotPreview } from "@/e2e/fixtures/graph-import-question";

function pilotPreview() {
  const preview = createGraphImportPilotPreview();
  return { preview, classification: preview.payload.classifications[0] };
}

test("the graph pilot parses and compiles an author expression to canonical graph AST", () => {
  const { preview, classification } = pilotPreview();
  assert.equal(preview.payload.sourceQuestionIds.length, 1);
  assert.equal(preview.payload.importable, true);
  assert.deepEqual(preview.payload.diagnostics.filter((item) => item.severity === "error"), []);
  assert.equal(classification.status, "convertible");
  assert.deepEqual(classification.blockers, []);
  const question = classification.canonicalQuestion;
  assert.ok(question?.graphConfig);
  assert.equal(question.skillPathId, "area-under-curve");
  assert.deepEqual(question.curriculum, { primarySkillId: "area-under-curve", requiredSkillIds: ["definite-integrals"] });
  assert.deepEqual(validateGraphDefinition(question.graphConfig), []);
  const atTwo = evaluateMathExpression(question.graphConfig.functions[0].expression, 2);
  const atFour = evaluateMathExpression(question.graphConfig.functions[0].expression, 4);
  assert.deepEqual(atTwo, { status: "value", value: 3 });
  assert.deepEqual(atFour, { status: "value", value: 11 });
  assert.deepEqual(question.graphConfig.axes?.xTicks, [2, 4]);
  assert.equal(question.graphConfig.regions?.[0].type, "curve-to-constant");
  assert.equal(JSON.stringify(question.graphConfig).includes('"expression":"x^2 - 2*x + 3"'), false);
  assert.equal(markQuestionAnswer(question, "38/3").isCorrect, true);
  assert.equal(markQuestionAnswer(question, "12.6666666667").isCorrect, false);
});

test("graph authoring fails closed on unknown keys, malformed expressions and unsafe regions", () => {
  const unknown = parseGraphConfigYaml(`version: 1\ntitle: Demo\ndescription: Demo graph\nviewport:\n  xMin: 0\n  xMax: 2\n  yMin: 0\n  yMax: 2\nfunctions:\n  - id: f\n    expression: x\n    styleRole: primary\n    surprise: true`);
  assert.ok(unknown.diagnostics.some((item) => item.code === "unknown_graph_yaml_key"));
  assert.throws(() => parseGraphExpression("process.exit()"), /unsupported/i);
  assert.deepEqual(evaluateMathExpression(parseGraphExpression("-x^2"), 3), { status: "value", value: -9 });

  const crossing = parseGraphConfigYaml(`version: 1\ntitle: Crossing\ndescription: Invalid shaded crossing\nviewport:\n  xMin: -1\n  xMax: 1\n  yMin: -1\n  yMax: 1\nfunctions:\n  - id: f\n    expression: x\n    styleRole: primary\nregions:\n  - id: area\n    type: curve-to-constant\n    curveId: f\n    fromX: -1\n    toX: 1\n    baseline: 0\n    description: Crossing area`);
  assert.ok(crossing.diagnostics.some((item) => item.code === "unsafe_graph_region_domain"));
});
