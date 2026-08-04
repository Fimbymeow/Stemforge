import type { CompositeAlgebraicEquivalenceMarkingContract, MarkingResult } from "@/lib/marking/types";
import { parseNumericLiteral } from "@/lib/marking/numeric";
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
const IDENTITY: Polynomial = new Map([[0, { numerator: ONE, denominator: ONE }]]);

export type CompositeParseResult =
  | { status: "parsed"; value: Polynomial; normalized: string }
  | { status: "malformed" | "unmarkable"; normalized: string };

export function markCompositeAlgebraicEquivalence(contract: CompositeAlgebraicEquivalenceMarkingContract, input: string): MarkingResult {
  const parsed = parseCompositeAlgebraicExpression(input, contract.variable);
  const base = { normalizedStudentAnswer: parsed.normalized, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "malformed") return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_composite_expression" };
  if (parsed.status === "unmarkable") return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "unsupported_mathematical_form" };
  const target = parseCompositeAlgebraicExpression(contract.target, contract.variable);
  if (target.status !== "parsed") return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_composite_target" };
  if (parsed.status !== "parsed") return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_composite_state" };
  const correct = equalPolynomial(parsed.value, target.value);
  return correct ? { ...base, outcomeKind: "graded", isCorrect: true } : { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong" };
}

/**
 * Bounded recursive-descent V1 grammar: a sum/difference of terms, where each term is either a
 * plain single-variable monomial (delegated wholesale to parsePolynomial) or a product of an
 * optional leading factor (rational coefficient, one variable power, or one bare bracket) and
 * exactly one bracket raised to a non-negative integer exponent. Every accepted bracket power is
 * expanded through exact polynomial multiplication into the same Polynomial representation
 * parsePolynomial already produces, so the whole expression reduces to one canonical polynomial.
 */
export function parseCompositeAlgebraicExpression(raw: string, variable: string): CompositeParseResult {
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
    if (start === index) return { status: "malformed", normalized };
    terms.push({ sign, body: normalized.slice(start, index) });
    if (terms.length > COMPOSITE_TERM_LIMIT) return { status: "malformed", normalized };
  }

  let expression: Polynomial = new Map();
  for (const term of terms) {
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
