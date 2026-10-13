import assert from "node:assert/strict";
import test from "node:test";
import { markQuestionAnswer } from "../lib/answer-engine";
import type { MultipartMarkingContract } from "../lib/marking/types";

const fixtures = { correct: [], incorrect: [], malformed: [], unmarkable: [] };
const marking: MultipartMarkingContract = {
  strategy: "multipart", strategyVersion: 1,
  fields: [
    { id: "gradient", label: "Gradient", inputType: "numeric", marking: { strategy: "numeric", strategyVersion: 1, target: "2", comparison: { type: "exact" }, fixtures } },
    { id: "equation", label: "Tangent equation", inputType: "line_equation", marking: { strategy: "linear_equation_equivalence", strategyVersion: 1, target: "y=2x+3", variables: ["x", "y"], fixtures } },
  ],
};

function mark(gradient: string, equation: string) { return markQuestionAnswer({ marking }, JSON.stringify({ gradient, equation })); }

test("multipart aggregation is correct only when every assessed part is correct", () => {
  const both = mark("2", "2x-y+3=0");
  assert.equal(both.outcomeKind, "graded"); assert.equal(both.isCorrect, true);
  assert.deepEqual(both.partResults?.map((part) => part.isCorrect), [true, true]);
  for (const [gradient, equation, outcomes] of [
    ["2", "y=2x+4", [true, false]], ["3", "y=2x+3", [false, true]], ["3", "y=2x+4", [false, false]],
  ] as const) {
    const result = mark(gradient, equation);
    assert.equal(result.outcomeKind, "graded"); assert.equal(result.isCorrect, false);
    assert.deepEqual(result.partResults?.map((part) => part.isCorrect), outcomes);
  }
});

test("a malformed or unsupported part keeps the whole question ungraded and exposes field-level status", () => {
  const malformed = mark("++", "y=2x+3");
  assert.equal(malformed.outcomeKind, "malformed"); assert.equal(malformed.isCorrect, null);
  assert.equal(malformed.partResults?.[0].outcomeKind, "malformed");
  const unsupported = mark("2", "y=x^2");
  assert.equal(unsupported.outcomeKind, "unmarkable"); assert.equal(unsupported.isCorrect, null);
  assert.equal(unsupported.partResults?.[1].outcomeKind, "unmarkable");
});

test("multipart input is bounded, closed to unknown fields, and normalises declared field wrappers", () => {
  assert.equal(markQuestionAnswer({ marking }, "not-json").outcomeKind, "malformed");
  assert.equal(markQuestionAnswer({ marking }, JSON.stringify({ gradient: "2", equation: "y=2x+3", extra: "x" })).outcomeKind, "malformed");
  assert.equal(markQuestionAnswer({ marking }, JSON.stringify({ gradient: "m=2", equation: "y=2x+3" })).isCorrect, true);
  assert.equal(markQuestionAnswer({ marking }, "x".repeat(32_769)).outcomeKind, "malformed");
  assert.equal(markQuestionAnswer({ marking: { ...marking, fields: [...marking.fields, marking.fields[0]] } }, JSON.stringify({ gradient: "2", equation: "y=2x+3" })).outcomeKind, "malformed");
});
