import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPOSITE_BRACKET_EXPONENT_LIMIT,
  COMPOSITE_EXPANSION_TERM_LIMIT,
  COMPOSITE_INPUT_MAX_LENGTH,
  COMPOSITE_TERM_LIMIT,
  markCompositeAlgebraicEquivalence,
  parseCompositeAlgebraicExpression,
} from "../lib/marking/composite-algebraic";
import type { CompositeAlgebraicEquivalenceMarkingContract } from "../lib/marking/types";

function composite(target: string, variable = "x"): CompositeAlgebraicEquivalenceMarkingContract {
  return { strategy: "composite_algebraic_equivalence", strategyVersion: 1, target, variable, fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] } };
}

test("implicit multiplication, explicit multiplication, whitespace, unicode minus and unary sign all normalise identically", () => {
  const contract = composite("15(3x+2)^4");
  for (const input of ["15(3x+2)^4", "15*(3x+2)^4", "15 * (3x + 2)^4", "15(3x + 2)^4"]) {
    assert.equal(markCompositeAlgebraicEquivalence(contract, input).isCorrect, true, input);
  }
  assert.equal(markCompositeAlgebraicEquivalence(composite("-8(7-2x)^3"), "−8(7−2x)^3").isCorrect, true);
});

test("rational coefficients (integer, decimal, fraction) and polynomial factors parse exactly", () => {
  assert.equal(markCompositeAlgebraicEquivalence(composite("6(2x+1)^2"), "3 * 2(2x+1)^2").isCorrect, true);
  assert.equal(markCompositeAlgebraicEquivalence(composite("(1/2)(x+1)^2"), "0.5(x+1)^2").isCorrect, true);
  assert.equal(markCompositeAlgebraicEquivalence(composite("10x(x^2+4)^4"), "(10x)(x^2+4)^4").isCorrect, true);
});

test("malformed parentheses, trailing operators and empty terms are malformed", () => {
  const contract = composite("15(3x+2)^4");
  for (const input of ["15(3x+2)^4+", "*15(3x+2)^4", "15((3x+2)^4", "15(3x+2)^4)", "15(3x+2)^4-", "+-15(3x+2)^4", "15(3x+2)^"]) {
    assert.equal(markCompositeAlgebraicEquivalence(contract, input).outcomeKind, "malformed", input);
  }
});

test("equivalent factored, expanded and reordered forms compare exactly equal", () => {
  const cases: Array<[string, string]> = [
    ["15(3x+2)^4", "15 * (3x + 2)^4"],
    ["15(3x+2)^4", "1215x^4+3240x^3+3240x^2+1440x+240"],
    ["10x(x^2+4)^4", "(10x)(x^2+4)^4"],
    ["5(2x+4)(x^2+4x)^4", "10(x+2)(x^2+4x)^4"],
    ["12(3x+1)^3+10x", "10x+12(3x+1)^3"],
    ["4(2x+3)(x^2+3x+1)^3", "(8x+12)(x^2+3x+1)^3"],
  ];
  for (const [target, alternate] of cases) {
    assert.equal(markCompositeAlgebraicEquivalence(composite(target), alternate).isCorrect, true, `${target} vs ${alternate}`);
  }
});

test("near-miss expressions parse successfully but grade incorrect, never unmarkable", () => {
  const cases: Array<[string, string]> = [
    ["15(3x+2)^4", "15(3x+2)^5"],
    ["10x(x^2+4)^4", "10(x^2+4)^4"],
    ["12(3x+1)^3+10x", "-12(3x+1)^3+10x"],
    ["-8(7-2x)^3", "8(7-2x)^3"],
    ["20x(x^2-1)^4", "20x(x^2-1)^3"],
    ["4(2x+3)(x^2+3x+1)^3", "4(2x+3)(x^2+3x+2)^3"],
  ];
  for (const [target, wrong] of cases) {
    const result = markCompositeAlgebraicEquivalence(composite(target), wrong);
    assert.equal(result.outcomeKind, "graded", `${target} vs ${wrong}`);
    assert.equal(result.isCorrect, false, `${target} vs ${wrong}`);
    assert.equal(result.outcomeReason, "value_wrong", `${target} vs ${wrong}`);
  }
});

test("out-of-V1-scope grammar returns an honest unmarkable result, never silently routed to plain polynomial marking", () => {
  const contract = composite("15(3x+2)^4");
  for (const input of [
    "-12(4x+5)^(-4)", "-12/(4x+5)^4", "x^-2", "x^(1/2)", "sqrt(x)", "1/sqrt(x+1)", "2/x", "2/(x+1)",
    "y=3x+2", "dy/dx=15(3x+2)^4", "x(30-2x)", "(x+1)^2(x-1)^3", "-6x(x^2+1)(x+2)^(-4)",
    "sin(x)", "e^x", "log(x)", "2x^2+2000/x",
  ]) {
    assert.equal(markCompositeAlgebraicEquivalence(contract, input).outcomeKind, "unmarkable", input);
  }
  assert.equal(markCompositeAlgebraicEquivalence(contract, "15(3y+2)^4").outcomeKind, "unmarkable");
});

test("multiple variables in one expression are unmarkable", () => {
  assert.equal(markCompositeAlgebraicEquivalence(composite("15(3x+2)^4"), "15(3x+2y)^4").outcomeKind, "unmarkable");
});

test("safety limits are exported, finite and enforced", () => {
  assert.deepEqual(
    { COMPOSITE_INPUT_MAX_LENGTH, COMPOSITE_TERM_LIMIT, COMPOSITE_BRACKET_EXPONENT_LIMIT, COMPOSITE_EXPANSION_TERM_LIMIT },
    { COMPOSITE_INPUT_MAX_LENGTH: 512, COMPOSITE_TERM_LIMIT: 16, COMPOSITE_BRACKET_EXPONENT_LIMIT: 12, COMPOSITE_EXPANSION_TERM_LIMIT: 256 },
  );
  assert.equal(parseCompositeAlgebraicExpression("x".repeat(600), "x").status, "malformed");
  assert.equal(parseCompositeAlgebraicExpression("(x+1)^13", "x").status, "malformed");
  assert.equal(parseCompositeAlgebraicExpression("(x^100+1)^3", "x").status, "malformed");
  const manyTerms = "(x+1)^2" + "+x".repeat(16);
  assert.equal(parseCompositeAlgebraicExpression(manyTerms, "x").status, "malformed");
  assert.equal(parseCompositeAlgebraicExpression("(x+1)^12", "x").status, "parsed");
});

test("bracket-power expansion never times out or partially compares: an oversized expansion fails closed", () => {
  const result = parseCompositeAlgebraicExpression("(x^100+1)^3", "x");
  assert.equal(result.status, "malformed");
  assert.equal((result as { value?: unknown }).value, undefined);
});

test("real Chain Rule V1 evidence: retained bare-expression forms are markable with correct, equivalent and wrong outcomes", () => {
  const evidence: Array<{ id: string; target: string; alternate: string; wrong: string }> = [
    { id: "f-003", target: "15(3x+2)^4", alternate: "15*(3x+2)^4", wrong: "15(3x+2)^5" },
    { id: "f-004", target: "15(5x-4)^2", alternate: "15*(5x-4)^2", wrong: "15(5x-4)^3" },
    { id: "f-005", target: "48(4x+1)^5", alternate: "48*(4x+1)^5", wrong: "48(4x+1)^4" },
    { id: "f-006", target: "10x(x^2+4)^4", alternate: "(10x)(x^2+4)^4", wrong: "10(x^2+4)^4" },
    { id: "f-007", target: "24x(3x^2-2)^3", alternate: "24*x*(3x^2-2)^3", wrong: "24x(3x^2-2)^4" },
    { id: "a-002", target: "5(2x+4)(x^2+4x)^4", alternate: "10(x+2)(x^2+4x)^4", wrong: "5(2x+4)(x^2+4x)^3" },
    { id: "ppq-003", target: "-8(7-2x)^3", alternate: "-8*(7-2x)^3", wrong: "8(7-2x)^3" },
    { id: "ppq-004", target: "-15(5-3x)^4", alternate: "-15*(5-3x)^4", wrong: "-15(5-3x)^5" },
    { id: "ppq-007", target: "4(2x+3)(x^2+3x+1)^3", alternate: "(8x+12)(x^2+3x+1)^3", wrong: "4(2x+3)(x^2+3x+1)^2" },
    { id: "ppq-008", target: "-10x(6-x^2)^4", alternate: "-10*x*(6-x^2)^4", wrong: "-10(6-x^2)^4" },
    { id: "ppq-010", target: "20x(x^2-1)^4", alternate: "20*x*(x^2-1)^4", wrong: "20x(x^2-1)^3" },
    { id: "ppq-011", target: "12(3x+1)^3+10x", alternate: "10x+12(3x+1)^3", wrong: "-12(3x+1)^3+10x" },
  ];
  assert.equal(evidence.length, 12);
  for (const { id, target, alternate, wrong } of evidence) {
    const contract = composite(target);
    assert.equal(markCompositeAlgebraicEquivalence(contract, target).isCorrect, true, `${id} canonical`);
    assert.equal(markCompositeAlgebraicEquivalence(contract, alternate).isCorrect, true, `${id} alternate`);
    const wrongResult = markCompositeAlgebraicEquivalence(contract, wrong);
    assert.equal(wrongResult.outcomeKind, "graded", `${id} wrong`);
    assert.equal(wrongResult.isCorrect, false, `${id} wrong`);
  }
});

test("universal marking-result metadata matches the repository convention", () => {
  const result = markCompositeAlgebraicEquivalence(composite("15(3x+2)^4"), "15(3x+2)^4");
  assert.equal(result.strategy, "composite_algebraic_equivalence");
  assert.equal(result.strategyVersion, 1);
  assert.equal(result.outcomeKind, "graded");
});
