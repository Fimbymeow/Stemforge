import assert from "node:assert/strict";
import test from "node:test";
import { exact } from "../lib/maths/expression-core";
import { serializeStructuredGraphAnswer, validateStructuredGraphAnswer } from "../lib/questions/graph-answer-validation";
import type { NatureTableConfig } from "../lib/maths/expression-types";

test("point placement uses mathematical coordinate tolerances rather than pixels", () => {
  const marked = validateStructuredGraphAnswer(
    { type: "point-placement", expectedPoints: [{ id: "root", x: 2, y: 0, tolerance: 0.25 }] },
    { type: "point-placement", points: [{ id: "root", x: 2.1, y: -0.1 }] },
  );
  assert.equal(marked.isCorrect, true);
});

test("candidate matching, interval signs and transformations are deterministic", () => {
  assert.equal(validateStructuredGraphAnswer({ type: "candidate-match", expectedId: "candidate-b" }, { type: "candidate-match", selectedId: "candidate-a" }).isCorrect, false);
  assert.equal(validateStructuredGraphAnswer({ type: "interval-signs", expectedSigns: { left: "positive" } }, { type: "interval-signs", intervals: { left: "positive" } }).isCorrect, true);
  assert.equal(validateStructuredGraphAnswer({ type: "transformation-sequence", expectedTransformations: [{ type: "translateX", value: exact(2) }] }, { type: "transformation-sequence", transformations: [{ type: "translateX", value: exact(2) }] }).isCorrect, true);
});

test("nature table validation reports correct and incorrect cells", () => {
  const table: NatureTableConfig = {
    id: "nature",
    criticalValues: [exact(1)],
    rows: [{ id: "nature", label: "Nature", kind: "nature" }],
    expectedAnswers: {
      "nature:critical-0": { type: "nature", value: "minimum" },
      "sign:interval-0": { type: "sign", value: "negative" },
    },
  };
  const marked = validateStructuredGraphAnswer({ type: "nature-table", tableId: "nature" }, {
    type: "nature-table",
    cells: {
      "nature:critical-0": { type: "nature", value: "minimum" },
      "sign:interval-0": { type: "sign", value: "positive" },
    },
  }, table);
  assert.equal(marked.isCorrect, false);
  assert.deepEqual(marked.correctCells, ["nature:critical-0"]);
  assert.deepEqual(marked.incorrectCells, ["sign:interval-0"]);
});

test("structured answer serialization is stable", () => {
  const left = serializeStructuredGraphAnswer({ type: "interval-signs", intervals: { b: "negative", a: "positive" } });
  const right = serializeStructuredGraphAnswer({ type: "interval-signs", intervals: { a: "positive", b: "negative" } });
  assert.equal(left, right);
});
