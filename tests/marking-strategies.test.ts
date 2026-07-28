import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { markQuestionAnswer } from "../lib/answer-engine";
import { auditLegacyAcceptedAnswerCollisions, auditLegacyNumericCollisions } from "../lib/marking/legacy-collision-audit";
import { markNumeric, NUMERIC_DIGIT_LIMIT, NUMERIC_EXPONENT_LIMIT, NUMERIC_INPUT_MAX_LENGTH } from "../lib/marking/numeric";
import { markPolynomial, POLYNOMIAL_COEFFICIENT_DIGIT_LIMIT, POLYNOMIAL_EXPONENT_LIMIT, POLYNOMIAL_INPUT_MAX_LENGTH, POLYNOMIAL_TERM_LIMIT } from "../lib/marking/polynomial";
import type { NumericMarkingContract, PolynomialMarkingContract } from "../lib/marking/types";

function numeric(target: string, comparison: NumericMarkingContract["comparison"] = { type: "exact" }, presentation?: NumericMarkingContract["presentation"]) {
  return { strategy: "numeric", strategyVersion: 1, target, comparison, ...(presentation ? { presentation } : {}), fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] } } satisfies NumericMarkingContract;
}
function polynomial(target: string): PolynomialMarkingContract {
  return { strategy: "polynomial_form", strategyVersion: 1, target, variable: "x", fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] } };
}

test("numeric literal grammar accepts exact rational equivalents", () => {
  const contract = numeric("14");
  for (const input of ["14", "+14", "014", "14.0", "28/2", "1400%", "1.4e1", " 14 ", "\u221214e0".replace("\u2212", "+")]) {
    assert.deepEqual({ input, result: markNumeric(contract, input).isCorrect }, { input, result: true });
  }
  assert.equal(markNumeric(numeric("0"), "-0").isCorrect, true);
  assert.equal(markNumeric(numeric("-1/2"), "1/-2").isCorrect, true);
});

test("numeric malformed and unmarkable classes fail without an incorrect judgement", () => {
  for (const input of ["5.", "1 4", "1/0", "1//2", "1e", "--1", "1e++2", "NaN", "Infinity", ""]) {
    const result = markNumeric(numeric("14"), input);
    assert.equal(result.outcomeKind, "malformed", input);
    assert.equal(result.isCorrect, null);
  }
  assert.equal(markNumeric(numeric("1"), "1/2+1/2").outcomeKind, "unmarkable");
  for (const input of ["1+13", "1×4", "1*4", "2*7", "sqrt(196)", "2^3"]) {
    const result = markNumeric(numeric("14"), input);
    assert.equal(result.outcomeKind, "unmarkable", input);
    assert.equal(result.isCorrect, null);
  }
});

test("numeric exact, absolute and relative tolerance boundaries are rational and inclusive", () => {
  assert.equal(markNumeric(numeric("1/3"), "0.3333333333333333").isCorrect, false);
  assert.equal(markNumeric(numeric("10", { type: "absolute_tolerance", amount: "1/10" }), "10.1").isCorrect, true);
  assert.equal(markNumeric(numeric("10", { type: "absolute_tolerance", amount: "1/10" }), "10.1001").isCorrect, false);
  assert.equal(markNumeric(numeric("100", { type: "relative_tolerance", amount: "1/100" }), "101").isCorrect, true);
  assert.equal(markNumeric(numeric("100", { type: "relative_tolerance", amount: "1/100" }), "101.01").isCorrect, false);
});

test("rounded decimal-place policy uses exact half-away-from-zero and lexical precision", () => {
  const contract = numeric("3.14159265", { type: "decimal_places_rounded", places: 2 });
  assert.equal(markNumeric(contract, "3.14").isCorrect, true);
  assert.equal(markNumeric(contract, "3.140").outcomeReason, "precision_wrong");
  for (const input of ["3.1", "3.141", "3.1399"]) assert.equal(markNumeric(contract, input).outcomeReason, "value_wrong");
  for (const input of ["314/100", "3.14e0"]) assert.equal(markNumeric(contract, input).outcomeReason, "precision_wrong");
  assert.equal(markNumeric(numeric("-1.25", { type: "decimal_places_rounded", places: 1 }), "-1.3").isCorrect, true);
});

test("rounded significant figures accepts scientific notation and enforces expressed figures", () => {
  const contract = numeric("0.0314159", { type: "significant_figures_rounded", figures: 3 });
  for (const input of ["0.0314", "3.14e-2"]) assert.equal(markNumeric(contract, input).isCorrect, true);
  for (const input of ["0.03140", "3.140e-2"]) assert.equal(markNumeric(contract, input).outcomeReason, "precision_wrong");
  for (const input of ["0.031", "0.03142"]) assert.equal(markNumeric(contract, input).outcomeReason, "value_wrong");
});

test("significant-figure policies require a meaningful displayed-digit form", () => {
  const rounded = numeric("0.5", { type: "significant_figures_rounded", figures: 3 });
  const presented = numeric("0.5", { type: "exact" }, { type: "significant_figures", figures: 3 });
  for (const contract of [rounded, presented]) {
    assert.deepEqual(
      { kind: markNumeric(contract, "1/2").outcomeKind, correct: markNumeric(contract, "1/2").isCorrect, reason: markNumeric(contract, "1/2").outcomeReason },
      { kind: "graded", correct: false, reason: "precision_wrong" },
    );
    assert.equal(markNumeric(contract, "0.500").isCorrect, true);
    assert.equal(markNumeric(contract, "5.00e-1").isCorrect, true);
    assert.equal(markNumeric(contract, "0.50").outcomeReason, "precision_wrong");
  }
});

test("rounding hardening covers negative values, power-of-ten carry and integer trailing-zero convention", () => {
  assert.equal(markNumeric(numeric("-0.005", { type: "decimal_places_rounded", places: 2 }), "-0.01").isCorrect, true);
  assert.equal(markNumeric(numeric("9.995", { type: "decimal_places_rounded", places: 2 }), "10.00").isCorrect, true);
  assert.equal(markNumeric(numeric("1000", { type: "significant_figures_rounded", figures: 1 }), "1000").isCorrect, true);
  assert.equal(markNumeric(numeric("1000", { type: "significant_figures_rounded", figures: 4 }), "1000").outcomeReason, "precision_wrong");
  assert.equal(markNumeric(numeric("1000", { type: "significant_figures_rounded", figures: 4 }), "1.000e3").isCorrect, true);
});

test("numeric presentation policies separate form and precision from value", () => {
  assert.equal(markNumeric(numeric("1/2", { type: "exact" }, { type: "simplified_fraction" }), "2/4").outcomeReason, "form_wrong");
  assert.equal(markNumeric(numeric("1/2", { type: "exact" }, { type: "fraction" }), "2/4").isCorrect, true);
  assert.equal(markNumeric(numeric("1/2", { type: "exact" }, { type: "percentage" }), "50%").isCorrect, true);
  assert.equal(markNumeric(numeric("1/2", { type: "exact" }, { type: "decimal_places", places: 2 }), "0.50").isCorrect, true);
});

test("numeric bounds are finite and exported", () => {
  assert.deepEqual({ NUMERIC_INPUT_MAX_LENGTH, NUMERIC_DIGIT_LIMIT, NUMERIC_EXPONENT_LIMIT }, { NUMERIC_INPUT_MAX_LENGTH: 256, NUMERIC_DIGIT_LIMIT: 128, NUMERIC_EXPONENT_LIMIT: 1000 });
  assert.equal(markNumeric(numeric("1"), "1".repeat(257)).outcomeKind, "malformed");
  assert.equal(markNumeric(numeric("1"), "1e1001").outcomeKind, "malformed");
});

test("polynomial canonicalisation is exact and bounded", () => {
  const first = polynomial("5x^4");
  for (const input of ["5x^4", "5*x^4", "5×x^4", "5 x^4", "5x^{4}", "5x⁴", "5x^4+0"]) assert.equal(markPolynomial(first, input).isCorrect, true, input);
  const second = polynomial("12x^3-4x");
  for (const input of ["12x^3-4x", "-4x+12x^3", "6x^3+6x^3-4x", "12x^3-4x+0"]) assert.equal(markPolynomial(second, input).isCorrect, true, input);
  assert.equal(markPolynomial(polynomial("2x"), "x+x").isCorrect, true);
  for (const input of ["2(x+1)", "(x+1)^2", "y=5x^4", "x*x*x", "1e-3x", "x^-1"]) assert.equal(markPolynomial(first, input).outcomeKind, "unmarkable", input);
  for (const input of ["5x^", "5x^4+", "5x^{", "1//2x"]) assert.equal(markPolynomial(first, input).outcomeKind, "malformed", input);
  assert.deepEqual({ POLYNOMIAL_INPUT_MAX_LENGTH, POLYNOMIAL_TERM_LIMIT, POLYNOMIAL_EXPONENT_LIMIT, POLYNOMIAL_COEFFICIENT_DIGIT_LIMIT }, { POLYNOMIAL_INPUT_MAX_LENGTH: 512, POLYNOMIAL_TERM_LIMIT: 64, POLYNOMIAL_EXPONENT_LIMIT: 100, POLYNOMIAL_COEFFICIENT_DIGIT_LIMIT: 128 });
});

test("all five strategy results carry universal metadata", () => {
  const numerical = higherMathsDifferentiationQuestions[2];
  const results = [
    markQuestionAnswer(numerical, "14"),
    markQuestionAnswer(higherMathsDifferentiationQuestions[0], "5x^4"),
    markQuestionAnswer({ marking: { strategy: "multiple_choice", strategyVersion: 1, correctOptionId: "a" } }, "a"),
    markQuestionAnswer({ marking: { strategy: "guided_self_check", strategyVersion: 1 } }, "working"),
    markQuestionAnswer({ marking: { strategy: "structured_graph", strategyVersion: 1 } }, "{broken"),
  ];
  assert.deepEqual(results.map((result) => result.strategy), ["numeric", "polynomial_form", "multiple_choice", "guided_self_check", "structured_graph"]);
  assert.ok(results.every((result) => result.strategyVersion === 1));
  assert.equal(results[4].outcomeKind, "malformed");
});

test("bounded legacy collision audit justifies only demonstrated production version bumps", () => {
  const collisions14 = auditLegacyNumericCollisions("14");
  const collisions29 = auditLegacyNumericCollisions("29");
  assert.ok(collisions14.some((item) => item.input === "1*4" && item.classification === "mathematically_different"));
  assert.ok(collisions29.some((item) => item.input === "2*9" && item.classification === "mathematically_different"));
  for (const target of ["4", "3", "8", "2"]) assert.ok(!auditLegacyNumericCollisions(target).some((item) => item.classification === "mathematically_different"));
});

test("expanded live collision audit covers every migrated accepted alias and all required version bumps", () => {
  const concrete = new Map<string, string[]>();
  for (const question of higherMathsDifferentiationQuestions) {
    const collisions = question.marking.strategy === "numeric"
      ? auditLegacyAcceptedAnswerCollisions(question.acceptedAnswers, { strategy: "numeric" })
      : question.marking.strategy === "polynomial_form"
        ? auditLegacyAcceptedAnswerCollisions(question.acceptedAnswers, {
            strategy: "polynomial_form",
            variable: question.marking.variable,
          })
        : [];
    concrete.set(question.id, collisions
      .filter((item) => item.classification === "mathematically_different")
      .map((item) => item.input));
  }
  assert.deepEqual(
    [...concrete].filter(([, collisions]) => collisions.length > 0).map(([questionId]) => questionId),
    ["hm-calc-diff-basic-f-002", "hm-calc-diff-basic-f-003", "hm-calc-diff-basic-a-002"],
  );
  const polynomialCollisions = concrete.get("hm-calc-diff-basic-f-002") ?? [];
  for (const input of ["1*2x^3-4x", "1×2x^3-4x", "1·2x^3-4x"]) {
    assert.ok(polynomialCollisions.includes(input), input);
    const question = higherMathsDifferentiationQuestions[1];
    assert.equal(markQuestionAnswer(question, input).outcomeKind, "unmarkable");
    assert.notEqual(markQuestionAnswer(question, input).isCorrect, true);
  }
});
