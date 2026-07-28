import type { MarkingResult, PolynomialMarkingContract } from "@/lib/marking/types";
import { parseNumericLiteral, type Rational } from "@/lib/marking/numeric";

export const POLYNOMIAL_INPUT_MAX_LENGTH = 512;
export const POLYNOMIAL_TERM_LIMIT = 64;
export const POLYNOMIAL_EXPONENT_LIMIT = 100;
export const POLYNOMIAL_COEFFICIENT_DIGIT_LIMIT = 128;
const ZERO = BigInt(0);
const ONE = BigInt(1);

type Polynomial = Map<number, Rational>;
type ParseResult = { status: "parsed"; value: Polynomial; normalized: string } | { status: "malformed" | "unmarkable"; normalized: string };

export function markPolynomial(contract: PolynomialMarkingContract, input: string): MarkingResult {
  const parsed = parsePolynomial(input, contract.variable);
  const base = { normalizedStudentAnswer: parsed.normalized, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "malformed") return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_polynomial" };
  if (parsed.status === "unmarkable") return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "unsupported_mathematical_form" };
  const target = parsePolynomial(contract.target, contract.variable);
  if (target.status !== "parsed") return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_polynomial_target" };
  if (parsed.status !== "parsed") return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_polynomial_state" };
  const correct = equalPolynomial(parsed.value, target.value);
  return correct ? { ...base, outcomeKind: "graded", isCorrect: true } : { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong" };
}

export function parsePolynomial(raw: string, variable: string): ParseResult {
  let normalized = raw.trim().replace(/\u2212/g, "-").replace(/[×·]/g, "*")
    .replace(/⁰/g, "^0").replace(/¹/g, "^1").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5").replace(/⁶/g, "^6").replace(/⁷/g, "^7").replace(/⁸/g, "^8").replace(/⁹/g, "^9")
    .replace(/\^\{(\d+)\}/g, "^$1");
  if (!normalized || normalized.length > POLYNOMIAL_INPUT_MAX_LENGTH) return { status: "malformed", normalized };
  if (variable === "e" || !/^[a-z]$/i.test(variable)) return { status: "unmarkable", normalized };
  if (/[=()[\]]/.test(normalized) || /\^\s*-/.test(normalized) || /[a-z]/i.test(normalized.replace(new RegExp(variable, "gi"), "")) ||
      /(?:x\s*\*\s*x)/i.test(normalized) || /\d[eE][+-]?\d/.test(normalized)) return { status: "unmarkable", normalized };
  if (/[{}]/.test(normalized) || /\d\s+\d/.test(normalized)) return { status: "malformed", normalized };
  normalized = normalized.replace(/\s+/g, "");
  if (/\/{2,}/.test(normalized)) return { status: "malformed", normalized };
  if (/[+\-*/^]$/.test(normalized) || /^[*/^]/.test(normalized)) return { status: "malformed", normalized };
  const terms: Array<{ sign: bigint; body: string }> = [];
  let index = 0;
  while (index < normalized.length) {
    let sign = ONE;
    if (normalized[index] === "+" || normalized[index] === "-") {
      sign = normalized[index] === "-" ? -ONE : ONE;
      index += 1;
    }
    const start = index;
    while (index < normalized.length && normalized[index] !== "+" && normalized[index] !== "-") index += 1;
    if (start === index) return { status: "malformed", normalized };
    terms.push({ sign, body: normalized.slice(start, index) });
    if (terms.length > POLYNOMIAL_TERM_LIMIT) return { status: "malformed", normalized };
  }
  const polynomial: Polynomial = new Map();
  for (const term of terms) {
    const parsed = parseTerm(term.body, variable);
    if (!parsed) return { status: "malformed", normalized };
    if (parsed.status === "unmarkable") return { status: "unmarkable", normalized };
    const coefficient = { numerator: parsed.coefficient.numerator * term.sign, denominator: parsed.coefficient.denominator };
    const previous = polynomial.get(parsed.exponent) ?? { numerator: ZERO, denominator: ONE };
    polynomial.set(parsed.exponent, add(previous, coefficient));
  }
  for (const [exponent, coefficient] of polynomial) if (coefficient.numerator === ZERO) polynomial.delete(exponent);
  return { status: "parsed", value: polynomial, normalized: canonical(polynomial, variable) };
}

function parseTerm(body: string, variable: string): { status: "parsed"; coefficient: Rational; exponent: number } | { status: "unmarkable" } | null {
  const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const variableMatch = new RegExp(`^(?:(\\d+(?:\\.\\d+)?|\\.\\d+|\\d+\\/\\d+)(\\*)?)?${escaped}(?:\\^(\\d+))?$`, "i").exec(body);
  if (variableMatch) {
    const coefficientText = variableMatch[1] ?? "1";
    if (coefficientText.replace(/\D/g, "").length > POLYNOMIAL_COEFFICIENT_DIGIT_LIMIT) return null;
    const parsed = parseNumericLiteral(coefficientText);
    const exponent = Number(variableMatch[3] ?? "1");
    if (parsed.status !== "parsed" || parsed.kind === "percentage" || parsed.kind === "scientific" || exponent > POLYNOMIAL_EXPONENT_LIMIT) return null;
    return { status: "parsed", coefficient: parsed.value, exponent };
  }
  if (body.includes(variable) || body.includes("*") || body.includes("^")) return { status: "unmarkable" };
  const parsed = parseNumericLiteral(body);
  if (parsed.status !== "parsed" || parsed.kind === "percentage" || parsed.kind === "scientific") return null;
  return { status: "parsed", coefficient: parsed.value, exponent: 0 };
}

function add(left: Rational, right: Rational): Rational {
  const numerator = left.numerator * right.denominator + right.numerator * left.denominator;
  const denominator = left.denominator * right.denominator;
  const divisor = gcd(abs(numerator), denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}
function equalPolynomial(left: Polynomial, right: Polynomial) {
  if (left.size !== right.size) return false;
  return [...left].every(([power, coefficient]) => {
    const other = right.get(power);
    return other?.numerator === coefficient.numerator && other.denominator === coefficient.denominator;
  });
}
function canonical(value: Polynomial, variable: string) {
  return [...value.entries()].sort(([a], [b]) => b - a).map(([power, coefficient]) =>
    `${coefficient.numerator}/${coefficient.denominator}:${variable}^${power}`).join("|") || "0";
}
function abs(value: bigint) { return value < ZERO ? -value : value; }
function gcd(left: bigint, right: bigint): bigint { while (right) [left, right] = [right, left % right]; return left || ONE; }
