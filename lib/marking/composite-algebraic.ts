import type { CompositeAlgebraicEquivalenceMarkingContract, MarkingResult } from "@/lib/marking/types";
import { parseNumericLiteral, type Rational } from "@/lib/marking/numeric";
import {
  add,
  canonical,
  equalPolynomial,
  exponentiatePolynomial,
  multiplyPolynomial,
  parsePolynomial,
  type Polynomial,
} from "@/lib/marking/polynomial";

export const COMPOSITE_INPUT_MAX_LENGTH = 512;
export const COMPOSITE_TERM_LIMIT = 16;
export const COMPOSITE_BRACKET_EXPONENT_LIMIT = 12;
export const COMPOSITE_EXPANSION_TERM_LIMIT = 256;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const IDENTITY: Polynomial = new Map([[0, { numerator: ONE, denominator: ONE }]]);

/**
 * The V2 canonical structure — approved design: a rational-coefficient polynomial factor times a
 * single canonical polynomial base raised to a negative-integer or ±1/2 rational exponent. `factor`
 * and `base` are always independently canonical Polynomials (never expanded into one another, never
 * cancelled against each other) so equality is exactly three independent exact comparisons.
 */
export type V2CompositeNode = { factor: Polynomial; base: Polynomial; exponent: Rational };

export type CompositeParseResult =
  | { status: "v1"; value: Polynomial; normalized: string }
  | { status: "v2"; value: V2CompositeNode; normalized: string }
  | { status: "malformed"; normalized: string }
  | { status: "unmarkable"; normalized: string };

export function markCompositeAlgebraicEquivalence(contract: CompositeAlgebraicEquivalenceMarkingContract, input: string): MarkingResult {
  const parsed = parseCompositeAlgebraicExpression(input, contract.variable, contract.strategyVersion);
  const base = { normalizedStudentAnswer: parsed.normalized, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "malformed") return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_composite_expression" };
  if (parsed.status === "unmarkable") return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "unsupported_mathematical_form" };
  const target = parseCompositeAlgebraicExpression(contract.target, contract.variable, contract.strategyVersion);
  if (target.status !== "v1" && target.status !== "v2") return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_composite_target" };
  const correct = equalCompositeParseResults(parsed, target);
  return correct ? { ...base, outcomeKind: "graded", isCorrect: true } : { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong" };
}

/**
 * Single entry point for both strategy versions. A version-1 contract only ever attempts the V1
 * grammar (negative/fractional exponents, reciprocals and sqrt remain unmarkable, exactly as
 * before). A version-2 contract first tries V1 — every valid V1 expression stays valid under V2 —
 * and only falls through to the V2 grammar when V1 reports the string as unmarkable (never when V1
 * reports malformed: a malformed string is malformed under any version).
 */
export function parseCompositeAlgebraicExpression(raw: string, variable: string, strategyVersion: 1 | 2 = 1): CompositeParseResult {
  const v1 = parseV1CompositeExpression(raw, variable);
  if (v1.status === "parsed") return { status: "v1", value: v1.value, normalized: v1.normalized };
  if (v1.status === "malformed" || strategyVersion !== 2) return { status: v1.status, normalized: v1.normalized };
  return parseV2CompositeExpression(raw, variable);
}

function equalCompositeParseResults(
  left: { status: "v1"; value: Polynomial } | { status: "v2"; value: V2CompositeNode },
  right: { status: "v1"; value: Polynomial } | { status: "v2"; value: V2CompositeNode },
): boolean {
  if (left.status === "v1" && right.status === "v1") return equalPolynomial(left.value, right.value);
  if (left.status === "v2" && right.status === "v2") return equalV2(left.value, right.value);
  // A V1-shaped (non-negative-integer exponent) result and a V2-shaped (negative/half exponent)
  // result belong to provably different exponent classes — never equal, never an ambiguous case.
  return false;
}

function equalV2(left: V2CompositeNode, right: V2CompositeNode): boolean {
  return equalPolynomial(left.factor, right.factor) && equalPolynomial(left.base, right.base) && equalRational(left.exponent, right.exponent);
}

function equalRational(left: Rational, right: Rational): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

type V1ParseResult = { status: "parsed"; value: Polynomial; normalized: string } | { status: "malformed" | "unmarkable"; normalized: string };

/**
 * Bounded recursive-descent V1 grammar: a sum/difference of terms, where each term is either a
 * plain single-variable monomial (delegated wholesale to parsePolynomial) or a product of an
 * optional leading factor (rational coefficient, one variable power, or one bare bracket) and
 * exactly one bracket raised to a non-negative integer exponent. Every accepted bracket power is
 * expanded through exact polynomial multiplication into the same Polynomial representation
 * parsePolynomial already produces, so the whole expression reduces to one canonical polynomial.
 */
function parseV1CompositeExpression(raw: string, variable: string): V1ParseResult {
  let normalized = raw.trim().replace(/−/g, "-").replace(/[×·]/g, "*")
    .replace(/⁰/g, "^0").replace(/¹/g, "^1").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5").replace(/⁶/g, "^6").replace(/⁷/g, "^7").replace(/⁸/g, "^8").replace(/⁹/g, "^9")
    .replace(/\^\{(\d+)\}/g, "^$1");
  if (!normalized || normalized.length > COMPOSITE_INPUT_MAX_LENGTH) return { status: "malformed", normalized };
  if (variable === "e" || !/^[a-z]$/i.test(variable)) return { status: "unmarkable", normalized };
  if (/=/.test(normalized)) return { status: "unmarkable", normalized };
  if (/\[|\]/.test(normalized)) return { status: "unmarkable", normalized };
  // Recognised-but-out-of-V1-scope exponent shapes: negative, fractional, or parenthesised exponents.
  if (/\^\s*\(|\^\s*-|\^\s*\d+\s*\/|\^\s*\d*\.\d/.test(normalized)) return { status: "unmarkable", normalized };
  if (/[a-z]/i.test(normalized.replace(new RegExp(variable, "gi"), ""))) return { status: "unmarkable", normalized };
  if (/{|}/.test(normalized) || /\d\s+\d/.test(normalized)) return { status: "malformed", normalized };
  normalized = normalized.replace(/\s+/g, "");
  // A "/" surviving this far is either a numeric fraction (handled inside numeric-literal parsing)
  // or division by a variable/bracket, which is an algebraic denominator and out of V1 scope.
  if (/\/\s*[a-z(]/i.test(normalized)) return { status: "unmarkable", normalized };
  if (/\/{2,}/.test(normalized)) return { status: "malformed", normalized };
  if (/[+\-*^]$/.test(normalized) || /^[*^]/.test(normalized)) return { status: "malformed", normalized };
  if (!isBalanced(normalized)) return { status: "malformed", normalized };

  const split = splitTopLevelTerms(normalized);
  if (split.status !== "ok") return { status: "malformed", normalized };

  let expression: Polynomial = new Map();
  for (const term of split.terms) {
    const parsedTerm = parseTermToPolynomial(term.body, variable);
    if (parsedTerm.status !== "parsed") return { status: parsedTerm.status, normalized };
    const signed = term.sign === -ONE ? negate(parsedTerm.value) : parsedTerm.value;
    expression = sumPolynomial(expression, signed);
  }
  for (const [power, coefficient] of expression) if (coefficient.numerator === ZERO) expression.delete(power);
  return { status: "parsed", value: expression, normalized: canonical(expression, variable) };
}

type TermResult =
  | { status: "parsed"; value: Polynomial }
  | { status: "malformed" | "unmarkable" };

function parseTermToPolynomial(body: string, variable: string): TermResult {
  if (!body.includes("(")) {
    const parsed = parsePolynomial(body, variable);
    if (parsed.status !== "parsed") return { status: parsed.status };
    return { status: "parsed", value: parsed.value };
  }

  let index = 0;
  let leading: Polynomial = IDENTITY;
  let bracketPower: Polynomial | undefined;
  let sawVariablePower = false;
  let sawBareBracket = false;

  while (index < body.length) {
    const ch = body[index];
    if (ch === "*") {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const match = /^\d+\/\d+|^\d+\.\d+|^\.\d+|^\d+/.exec(body.slice(index));
      if (!match) return { status: "malformed" };
      const literal = parseNumericLiteral(match[0]);
      if (literal.status !== "parsed" || literal.kind === "percentage" || literal.kind === "scientific") return { status: "malformed" };
      leading = multiplyPolynomial(leading, new Map([[0, literal.value]]));
      index += match[0].length;
      continue;
    }
    if (ch.toLowerCase() === variable.toLowerCase()) {
      if (sawVariablePower || sawBareBracket) return { status: "unmarkable" };
      index += 1;
      let exponent = 1;
      const exponentMatch = /^\^(\d+)/.exec(body.slice(index));
      if (exponentMatch) {
        exponent = Number(exponentMatch[1]);
        index += exponentMatch[0].length;
      }
      if (exponent > COMPOSITE_BRACKET_EXPONENT_LIMIT) return { status: "malformed" };
      leading = multiplyPolynomial(leading, new Map([[exponent, { numerator: ONE, denominator: ONE }]]));
      sawVariablePower = true;
      continue;
    }
    if (ch === "(") {
      const close = findMatchingParen(body, index);
      if (close === -1) return { status: "malformed" };
      const innerText = body.slice(index + 1, close);
      index = close + 1;
      const exponentMatch = /^\^(\d+)/.exec(body.slice(index));
      if (exponentMatch) {
        if (bracketPower) return { status: "unmarkable" };
        const exponent = Number(exponentMatch[1]);
        if (exponent > COMPOSITE_BRACKET_EXPONENT_LIMIT) return { status: "malformed" };
        const inner = parsePolynomial(innerText, variable);
        if (inner.status !== "parsed") return { status: inner.status };
        const innerDegree = Math.max(0, ...inner.value.keys());
        if (innerDegree * exponent > COMPOSITE_EXPANSION_TERM_LIMIT) return { status: "malformed" };
        bracketPower = exponentiatePolynomial(inner.value, exponent);
        index += exponentMatch[0].length;
        continue;
      }
      // A bracket with no explicit exponent: only supported as a single leading polynomial
      // factor alongside a genuine bracket power elsewhere in the same term (e.g. 4(2x+3)(x^2+3x+1)^3).
      if (bracketPower || sawBareBracket || sawVariablePower) return { status: "unmarkable" };
      const inner = parsePolynomial(innerText, variable);
      if (inner.status !== "parsed") return { status: inner.status };
      leading = multiplyPolynomial(leading, inner.value);
      sawBareBracket = true;
      continue;
    }
    return { status: "malformed" };
  }

  if (!bracketPower) return { status: "unmarkable" };
  return { status: "parsed", value: multiplyPolynomial(leading, bracketPower) };
}

/**
 * V2 grammar: exactly one term of the shape `[leading factor](base)^(exponent)` or its reciprocal
 * `[leading factor]/(base)^n` / `[leading factor]/sqrt(base)` / `[leading factor]/(c*sqrt(base))`,
 * where `exponent` is a negative integer or exactly ±1/2. Sums are never supported at V2 — a V2
 * term must occupy the entire expression.
 */
function parseV2CompositeExpression(raw: string, variable: string): CompositeParseResult {
  let normalized = raw.trim().replace(/−/g, "-").replace(/[×·]/g, "*")
    .replace(/⁰/g, "^0").replace(/¹/g, "^1").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5").replace(/⁶/g, "^6").replace(/⁷/g, "^7").replace(/⁸/g, "^8").replace(/⁹/g, "^9")
    .replace(/\^\{(\d+)\}/g, "^$1");
  if (!normalized || normalized.length > COMPOSITE_INPUT_MAX_LENGTH) return { status: "malformed", normalized };
  if (variable === "e" || !/^[a-z]$/i.test(variable)) return { status: "unmarkable", normalized };
  if (/=/.test(normalized)) return { status: "unmarkable", normalized };
  if (/\[|\]/.test(normalized)) return { status: "unmarkable", normalized };
  if (/[a-z]/i.test(normalized.replace(/sqrt/gi, "").replace(new RegExp(variable, "gi"), ""))) return { status: "unmarkable", normalized };
  if (/{|}/.test(normalized) || /\d\s+\d/.test(normalized)) return { status: "malformed", normalized };
  normalized = normalized.replace(/\s+/g, "");
  if (/\/{2,}/.test(normalized)) return { status: "malformed", normalized };
  if (/[+\-*^]$/.test(normalized) || /^[*^]/.test(normalized)) return { status: "malformed", normalized };
  if (!isBalanced(normalized)) return { status: "malformed", normalized };

  const split = splitTopLevelTerms(normalized);
  if (split.status !== "ok") return { status: "malformed", normalized };
  // No sums at V2: a V2 term must occupy the entire expression.
  if (split.terms.length !== 1) return { status: "unmarkable", normalized };

  const { sign, body } = split.terms[0];
  const parsedTerm = parseV2Term(body, variable);
  if (parsedTerm.status !== "parsed") return { status: parsedTerm.status, normalized };
  const value: V2CompositeNode = sign === -ONE ? { ...parsedTerm.value, factor: negate(parsedTerm.value.factor) } : parsedTerm.value;
  return { status: "v2", value, normalized: canonicalV2(value, variable) };
}

type V2TermResult = { status: "parsed"; value: V2CompositeNode } | { status: "malformed" | "unmarkable" };

function parseV2Term(body: string, variable: string): V2TermResult {
  // A trailing explicit "^(exponent)" always means direct-exponent form, even when a "/" appears
  // earlier as part of the leading coefficient (e.g. "5/2(5x+4)^(-1/2)" is (5/2)·base^(-1/2) under
  // ordinary left-to-right division/multiplication precedence, not a reciprocal of everything after
  // the "/"). Reciprocal notation only applies when no such trailing exponent is present — there the
  // "/" is what encodes the exponent (e.g. "-6x/(x^2+1)^4", "1/sqrt(2x+7)").
  if (/\^\((-\d+|-1\/2|1\/2)\)$/.test(body)) return parseDirectExponentForm(body, variable);
  const slashIndex = findTopLevelSlash(body);
  if (slashIndex !== -1) return parseReciprocalForm(body.slice(0, slashIndex), body.slice(slashIndex + 1), variable);
  return { status: "unmarkable" };
}

/** `factor/(base)^n`, `factor/sqrt(base)`, or `factor/(c*sqrt(base))` — reciprocal notation. */
function parseReciprocalForm(numeratorText: string, denominatorText: string, variable: string): V2TermResult {
  if (!numeratorText || !denominatorText) return { status: "malformed" };
  const stripped = stripEnclosingParens(denominatorText);

  const bracketPowerMatch = /^\((.+)\)\^(\d+)$/.exec(stripped);
  if (bracketPowerMatch) {
    const [, baseText, exponentText] = bracketPowerMatch;
    const n = Number(exponentText);
    if (!Number.isInteger(n) || n <= 0 || n > COMPOSITE_BRACKET_EXPONENT_LIMIT) return { status: "malformed" };
    const base = parsePolynomial(baseText, variable);
    if (base.status !== "parsed") return { status: base.status };
    const factor = parsePolynomial(numeratorText, variable);
    if (factor.status !== "parsed") return { status: factor.status };
    return { status: "parsed", value: { factor: factor.value, base: base.value, exponent: { numerator: -BigInt(n), denominator: ONE } } };
  }

  const sqrtMatch = /^(\d+(?:\.\d+|\/\d+)?)?\*?sqrt\((.+)\)$/.exec(stripped);
  if (sqrtMatch) {
    const [, coefficientText, baseText] = sqrtMatch;
    const base = parsePolynomial(baseText, variable);
    if (base.status !== "parsed") return { status: base.status };
    const numeratorFactor = parsePolynomial(numeratorText, variable);
    if (numeratorFactor.status !== "parsed") return { status: numeratorFactor.status };
    let factor = numeratorFactor.value;
    if (coefficientText) {
      const coefficientLiteral = parseNumericLiteral(coefficientText);
      if (coefficientLiteral.status !== "parsed" || coefficientLiteral.kind === "percentage" || coefficientLiteral.kind === "scientific") return { status: "malformed" };
      if (coefficientLiteral.value.numerator === ZERO) return { status: "malformed" };
      factor = multiplyPolynomial(factor, new Map([[0, reciprocalRational(coefficientLiteral.value)]]));
    }
    return { status: "parsed", value: { factor, base: base.value, exponent: { numerator: -ONE, denominator: TWO } } };
  }

  return { status: "unmarkable" };
}

/** `[leading factor](base)^(exponent)`, exponent one of `-n`, `-1/2`, `1/2`. */
function parseDirectExponentForm(body: string, variable: string): V2TermResult {
  const trailingExponentMatch = /\^\((-\d+|-1\/2|1\/2)\)$/.exec(body);
  if (!trailingExponentMatch) return { status: "unmarkable" };
  const exponentText = trailingExponentMatch[1];
  const exponent: Rational | null =
    exponentText === "1/2" ? { numerator: ONE, denominator: TWO }
    : exponentText === "-1/2" ? { numerator: -ONE, denominator: TWO }
    : parseNegativeIntegerExponent(exponentText);
  if (!exponent) return { status: "malformed" };

  const beforeExponent = body.slice(0, body.length - trailingExponentMatch[0].length);
  if (!beforeExponent.endsWith(")")) return { status: "unmarkable" };
  const baseCloseIndex = beforeExponent.length - 1;
  const baseOpenIndex = findMatchingOpenParen(beforeExponent, baseCloseIndex);
  if (baseOpenIndex === -1) return { status: "malformed" };
  const baseText = beforeExponent.slice(baseOpenIndex + 1, baseCloseIndex);
  const base = parsePolynomial(baseText, variable);
  if (base.status !== "parsed") return { status: base.status };

  const leadingText = beforeExponent.slice(0, baseOpenIndex);
  let factor: Polynomial = IDENTITY;
  if (leadingText) {
    const leading = parseFactorPrefix(leadingText, variable);
    if (leading.status !== "parsed") return { status: leading.status };
    factor = leading.value;
  }
  return { status: "parsed", value: { factor, base: base.value, exponent } };
}

function parseNegativeIntegerExponent(text: string): Rational | null {
  const n = Number(text);
  if (!Number.isInteger(n) || n >= 0 || Math.abs(n) > COMPOSITE_BRACKET_EXPONENT_LIMIT) return null;
  return { numerator: BigInt(n), denominator: ONE };
}

/**
 * Parses a bracket-free-of-its-own-power leading factor: an optional numeric coefficient, optional
 * single variable power, or optional single bare bracket (mutually exclusive with the variable
 * power, mirroring V1's leading-factor rule) — e.g. "-6x", "(7/2)". A stray "^" here means a second
 * powered bracket exists in the term (e.g. "-6x(x^2+1)(x+2)^(-4)" or "(x+1)^(-2)(x-1)^(-3)"), which
 * V2 does not support — reported as unmarkable, not a false match.
 */
function parseFactorPrefix(text: string, variable: string): { status: "parsed"; value: Polynomial } | { status: "malformed" | "unmarkable" } {
  if (text.includes("^")) return { status: "unmarkable" };
  let index = 0;
  let leading: Polynomial = IDENTITY;
  let sawVariablePower = false;
  let sawBareBracket = false;
  let sawToken = false;
  while (index < text.length) {
    const ch = text[index];
    if (ch === "*") {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const match = /^\d+\/\d+|^\d+\.\d+|^\.\d+|^\d+/.exec(text.slice(index));
      if (!match) return { status: "malformed" };
      const literal = parseNumericLiteral(match[0]);
      if (literal.status !== "parsed" || literal.kind === "percentage" || literal.kind === "scientific") return { status: "malformed" };
      leading = multiplyPolynomial(leading, new Map([[0, literal.value]]));
      index += match[0].length;
      sawToken = true;
      continue;
    }
    if (ch.toLowerCase() === variable.toLowerCase()) {
      if (sawVariablePower || sawBareBracket) return { status: "unmarkable" };
      index += 1;
      leading = multiplyPolynomial(leading, new Map([[1, { numerator: ONE, denominator: ONE }]]));
      sawVariablePower = true;
      sawToken = true;
      continue;
    }
    if (ch === "(") {
      if (sawVariablePower || sawBareBracket) return { status: "unmarkable" };
      const close = findMatchingParen(text, index);
      if (close === -1) return { status: "malformed" };
      const inner = parsePolynomial(text.slice(index + 1, close), variable);
      if (inner.status !== "parsed") return { status: inner.status };
      leading = multiplyPolynomial(leading, inner.value);
      sawBareBracket = true;
      sawToken = true;
      index = close + 1;
      continue;
    }
    return { status: "malformed" };
  }
  if (!sawToken) return { status: "malformed" };
  return { status: "parsed", value: leading };
}

function findTopLevelSlash(body: string): number {
  let depth = 0;
  for (let index = 0; index < body.length; index += 1) {
    const ch = body[index];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "/" && depth === 0) return index;
  }
  return -1;
}

/** Strips repeated fully-enclosing paren layers, e.g. "((x+3)^3)" -> "(x+3)^3", "(2sqrt(x))" -> "2sqrt(x)". */
function stripEnclosingParens(text: string): string {
  let result = text;
  let iterations = 0;
  while (iterations < 5 && result.length >= 2 && result[0] === "(" && findMatchingParen(result, 0) === result.length - 1) {
    result = result.slice(1, -1);
    iterations += 1;
  }
  return result;
}

function reciprocalRational(value: Rational): Rational {
  const sign = value.numerator < ZERO ? -ONE : ONE;
  return { numerator: sign * value.denominator, denominator: sign * value.numerator };
}

function canonicalV2(value: V2CompositeNode, variable: string): string {
  return `${canonical(value.factor, variable)}::(${canonical(value.base, variable)})^${value.exponent.numerator}/${value.exponent.denominator}`;
}

function splitTopLevelTerms(normalized: string): { status: "ok"; terms: Array<{ sign: bigint; body: string }> } | { status: "malformed" } {
  const terms: Array<{ sign: bigint; body: string }> = [];
  let index = 0;
  while (index < normalized.length) {
    let sign = ONE;
    if (normalized[index] === "+" || normalized[index] === "-") {
      sign = normalized[index] === "-" ? -ONE : ONE;
      index += 1;
    }
    const start = index;
    let depth = 0;
    while (index < normalized.length) {
      const ch = normalized[index];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (depth === 0 && (ch === "+" || ch === "-")) break;
      index += 1;
    }
    if (start === index) return { status: "malformed" };
    terms.push({ sign, body: normalized.slice(start, index) });
    if (terms.length > COMPOSITE_TERM_LIMIT) return { status: "malformed" };
  }
  return { status: "ok", terms };
}

function findMatchingParen(body: string, openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < body.length; index += 1) {
    if (body[index] === "(") depth += 1;
    else if (body[index] === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function findMatchingOpenParen(body: string, closeIndex: number): number {
  let depth = 0;
  for (let index = closeIndex; index >= 0; index -= 1) {
    if (body[index] === ")") depth += 1;
    else if (body[index] === "(") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function isBalanced(value: string): boolean {
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function sumPolynomial(base: Polynomial, term: Polynomial): Polynomial {
  const result: Polynomial = new Map(base);
  for (const [power, coefficient] of term) {
    const previous = result.get(power) ?? { numerator: ZERO, denominator: ONE };
    result.set(power, add(previous, coefficient));
  }
  return result;
}

function negate(value: Polynomial): Polynomial {
  const result: Polynomial = new Map();
  for (const [power, coefficient] of value) result.set(power, { numerator: -coefficient.numerator, denominator: coefficient.denominator });
  return result;
}
