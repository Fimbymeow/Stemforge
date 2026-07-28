import type { MarkingResult, NumericMarkingContract } from "@/lib/marking/types";

export const NUMERIC_INPUT_MAX_LENGTH = 256;
export const NUMERIC_DIGIT_LIMIT = 128;
export const NUMERIC_EXPONENT_LIMIT = 1000;
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);

export type Rational = { numerator: bigint; denominator: bigint };
type LiteralKind = "integer" | "decimal" | "fraction" | "percentage" | "scientific";
export type ParsedNumeric = {
  status: "parsed";
  value: Rational;
  normalized: string;
  kind: LiteralKind;
  decimalPlaces: number | null;
  significantFigures: number;
  simplifiedFraction: boolean;
};
type NumericFailure = { status: "malformed" | "unmarkable"; normalized: string };

export function markNumeric(contract: NumericMarkingContract, input: string): MarkingResult {
  const parsed = parseNumericLiteral(input);
  const base = { normalizedStudentAnswer: parsed.normalized, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "malformed") return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_numeric" };
  if (parsed.status === "unmarkable") return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "expression_not_permitted" };
  const target = parseNumericLiteral(contract.target);
  if (target.status !== "parsed") return internalNumeric(contract, input, "invalid_numeric_target");
  if (parsed.status !== "parsed") return internalNumeric(contract, input, "invalid_numeric_state");
  const comparison = compareNumeric(parsed, target, contract);
  if (!comparison.equal) return { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong" };
  const presentationReason = presentationFailure(parsed, contract);
  if (presentationReason) return { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: presentationReason };
  return { ...base, outcomeKind: "graded", isCorrect: true };
}

export function parseNumericLiteral(raw: string): ParsedNumeric | NumericFailure {
  const normalized = raw.trim().replace(/\u2212/g, "-");
  if (!normalized || normalized.length > NUMERIC_INPUT_MAX_LENGTH) return { status: "malformed", normalized };
  if (/^(?:NaN|[+-]?Infinity)$/i.test(normalized)) return { status: "malformed", normalized };
  if (/\s/.test(normalized)) return { status: "malformed", normalized };
  if (/^[+-]{2,}/.test(normalized) || /[eE][+-]{2,}/.test(normalized)) return { status: "malformed", normalized };
  let body = normalized;
  let percentage = false;
  if (body.endsWith("%")) {
    percentage = true;
    body = body.slice(0, -1);
    if (!body) return { status: "malformed", normalized };
  } else if (body.includes("%")) return { status: "malformed", normalized };
  if (body.includes("/")) {
    if (percentage || /\/{2,}/.test(body)) return { status: "malformed", normalized };
    if (!/^[+-]?\d+\/[+-]?\d+$/.test(body)) {
      return /[+*×·()^-]|[a-z_]/i.test(body.replace(/^[+-]/, "")) ? { status: "unmarkable", normalized } : { status: "malformed", normalized };
    }
    const [left, right] = body.split("/");
    if (digitCount(left) > NUMERIC_DIGIT_LIMIT || digitCount(right) > NUMERIC_DIGIT_LIMIT) return { status: "malformed", normalized };
    const numerator = BigInt(left);
    const denominator = BigInt(right);
    if (denominator === ZERO) return { status: "malformed", normalized };
    return {
      status: "parsed", value: rational(numerator, denominator), normalized, kind: "fraction",
      decimalPlaces: null, significantFigures: countSignificantFigures(body), simplifiedFraction: gcd(abs(numerator), abs(denominator)) === ONE && denominator > ZERO,
    };
  }
  const expressionProbe = body.replace(/^[+-]/, "").replace(/[eE][+-]/g, "e");
  if (/[*×·()^]|sqrt|[a-df-z_]/i.test(body) || /[+-]/.test(expressionProbe)) {
    return { status: "unmarkable", normalized };
  }
  const match = /^([+-]?)(?:(\d+)(?:\.(\d+))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(body);
  if (!match || body.endsWith(".")) return { status: "malformed", normalized };
  const integer = match[2] ?? "0";
  const fraction = match[3] ?? match[4] ?? "";
  const exponentText = match[5];
  if (integer.length + fraction.length > NUMERIC_DIGIT_LIMIT) return { status: "malformed", normalized };
  const exponent = exponentText ? Number(exponentText) : 0;
  if (!Number.isInteger(exponent) || Math.abs(exponent) > NUMERIC_EXPONENT_LIMIT) return { status: "malformed", normalized };
  let numerator = BigInt(`${integer}${fraction}` || "0");
  if (match[1] === "-") numerator = -numerator;
  let denominator = pow10(fraction.length);
  if (exponent > 0) numerator *= pow10(exponent);
  if (exponent < 0) denominator *= pow10(-exponent);
  if (percentage) denominator *= BigInt(100);
  return {
    status: "parsed",
    value: rational(numerator, denominator),
    normalized,
    kind: percentage ? "percentage" : exponentText ? "scientific" : body.includes(".") ? "decimal" : "integer",
    decimalPlaces: !percentage && !exponentText && body.includes(".") ? fraction.length : null,
    significantFigures: countSignificantFigures(body),
    simplifiedFraction: false,
  };
}

function compareNumeric(student: ParsedNumeric, target: ParsedNumeric, contract: NumericMarkingContract) {
  const policy = contract.comparison;
  if (policy.type === "exact") return { equal: equal(student.value, target.value) };
  if (policy.type === "absolute_tolerance" || policy.type === "relative_tolerance") {
    const tolerance = parseNumericLiteral(policy.amount);
    if (tolerance.status !== "parsed" || tolerance.value.numerator < ZERO) return { equal: false };
    const allowed = policy.type === "absolute_tolerance" ? tolerance.value : multiply(tolerance.value, absolute(target.value));
    return { equal: lessThanOrEqual(absolute(subtract(student.value, target.value)), allowed) };
  }
  const rounded = policy.type === "decimal_places_rounded"
    ? roundDecimalPlaces(target.value, policy.places)
    : roundSignificantFigures(target.value, policy.figures);
  return { equal: rounded !== null && equal(student.value, rounded) };
}

function presentationFailure(student: ParsedNumeric, contract: NumericMarkingContract): "form_wrong" | "precision_wrong" | null {
  const comparison = contract.comparison;
  if (comparison.type === "decimal_places_rounded") return student.kind === "decimal" && student.decimalPlaces === comparison.places ? null : "precision_wrong";
  if (comparison.type === "significant_figures_rounded") {
    return student.kind !== "fraction" && student.significantFigures === comparison.figures ? null : "precision_wrong";
  }
  const policy = contract.presentation;
  if (!policy) return null;
  if (policy.type === "integer") return student.kind === "integer" ? null : "form_wrong";
  if (policy.type === "fraction") return student.kind === "fraction" ? null : "form_wrong";
  if (policy.type === "simplified_fraction") return student.kind === "fraction" && student.simplifiedFraction ? null : "form_wrong";
  if (policy.type === "decimal") return student.kind === "decimal" ? null : "form_wrong";
  if (policy.type === "percentage") return student.kind === "percentage" ? null : "form_wrong";
  if (policy.type === "decimal_places") return student.kind === "decimal" && student.decimalPlaces === policy.places ? null : "precision_wrong";
  return student.kind !== "fraction" && student.significantFigures === policy.figures ? null : "precision_wrong";
}

function roundDecimalPlaces(value: Rational, places: number) {
  if (!Number.isInteger(places) || Math.abs(places) > NUMERIC_EXPONENT_LIMIT) return null;
  if (places >= 0) return rational(roundInteger(rational(value.numerator * pow10(places), value.denominator)), pow10(places));
  const factor = pow10(-places);
  return rational(roundInteger(rational(value.numerator, value.denominator * factor)) * factor, ONE);
}

function roundSignificantFigures(value: Rational, figures: number) {
  if (!Number.isInteger(figures) || figures <= 0 || value.numerator === ZERO) return null;
  const order = decimalOrder(absolute(value));
  return roundDecimalPlaces(value, figures - 1 - order);
}

function decimalOrder(value: Rational) {
  let order = value.numerator >= value.denominator ? 0 : -1;
  if (order === 0) while (value.numerator >= value.denominator * pow10(order + 1)) order += 1;
  else while (value.numerator * pow10(-order) < value.denominator) order -= 1;
  return order;
}

function roundInteger(value: Rational) {
  const sign = value.numerator < ZERO ? -ONE : ONE;
  const numerator = abs(value.numerator);
  const quotient = numerator / value.denominator;
  const remainder = numerator % value.denominator;
  return sign * (remainder * TWO >= value.denominator ? quotient + ONE : quotient);
}

function countSignificantFigures(raw: string) {
  const significand = raw.replace(/^[+-]/, "").split(/[eE]/)[0].replace("%", "");
  const digits = significand.replace(".", "");
  const fromFirst = digits.replace(/^0+/, "");
  if (!fromFirst) return significand.includes(".") ? Math.max(1, (significand.split(".")[1] ?? "").length) : 1;
  return significand.includes(".") ? fromFirst.length : fromFirst.replace(/0+$/, "").length;
}

function digitCount(value: string) { return value.replace(/\D/g, "").length; }
function pow10(power: number) { return TEN ** BigInt(power); }
function abs(value: bigint) { return value < ZERO ? -value : value; }
function gcd(left: bigint, right: bigint): bigint { while (right) [left, right] = [right, left % right]; return left || ONE; }
function rational(numerator: bigint, denominator: bigint): Rational {
  if (numerator === ZERO) return { numerator: ZERO, denominator: ONE };
  const sign = denominator < ZERO ? -ONE : ONE;
  const divisor = gcd(abs(numerator), abs(denominator));
  return { numerator: sign * numerator / divisor, denominator: abs(denominator) / divisor };
}
function equal(left: Rational, right: Rational) { return left.numerator === right.numerator && left.denominator === right.denominator; }
function subtract(left: Rational, right: Rational) { return rational(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator); }
function multiply(left: Rational, right: Rational) { return rational(left.numerator * right.numerator, left.denominator * right.denominator); }
function absolute(value: Rational) { return { numerator: abs(value.numerator), denominator: value.denominator }; }
function lessThanOrEqual(left: Rational, right: Rational) { return left.numerator * right.denominator <= right.numerator * left.denominator; }
function internalNumeric(contract: NumericMarkingContract, input: string, diagnosticReason: string): MarkingResult {
  return { outcomeKind: "internal_error", isCorrect: null, normalizedStudentAnswer: input, strategy: contract.strategy, strategyVersion: contract.strategyVersion, diagnosticReason };
}
