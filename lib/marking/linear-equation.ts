import type { LinearEquationEquivalenceMarkingContract, MarkingResult } from "@/lib/marking/types";

type Rational = { n: bigint; d: bigint };
type Linear = { x: Rational; y: Rational; c: Rational };
type ParseResult = { status: "parsed"; value: Linear; normalized: string } | { status: "malformed" | "unmarkable"; normalized: string };
const Z = rational(BigInt(0));
const O = rational(BigInt(1));

/** Bounded exact parser for affine equations in x and y. No solving or general CAS is attempted. */
export function markLinearEquation(contract: LinearEquationEquivalenceMarkingContract, input: string): MarkingResult {
  const parsed = parseLinearEquation(input);
  const base = { normalizedStudentAnswer: parsed.normalized, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "malformed") return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_linear_equation" };
  if (parsed.status === "unmarkable") return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "unsupported_mathematical_form" };
  const target = parseLinearEquation(contract.target);
  if (!("value" in target)) return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_linear_equation_target" };
  if (!("value" in parsed)) return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_linear_equation_state" };
  const correct = proportional(parsed.value, target.value);
  return correct
    ? { ...base, outcomeKind: "graded", isCorrect: true }
    : { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong" };
}

export function parseLinearEquation(raw: string): ParseResult {
  const normalized = raw.trim().replace(/\u2212/g, "-").replace(/[×·]/g, "*").replace(/\s+/g, "");
  if (!normalized || normalized.length > 512) return { status: "malformed", normalized };
  if ((normalized.match(/=/g) ?? []).length !== 1) return { status: normalized.includes("=") ? "unmarkable" : "malformed", normalized };
  const [leftText, rightText] = normalized.split("=");
  if (!leftText || !rightText) return { status: "malformed", normalized };
  try {
    const left = new Parser(tokenize(leftText)).parse();
    const right = new Parser(tokenize(rightText)).parse();
    const value = subtract(left, right);
    if (zero(value.x) && zero(value.y)) return { status: "unmarkable", normalized };
    return { status: "parsed", value, normalized };
  } catch (error) {
    return { status: error instanceof Unsupported ? "unmarkable" : "malformed", normalized };
  }
}

class Unsupported extends Error {}
type Token = { kind: "number" | "variable" | "op" | "left" | "right"; value: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (let index = 0; index < text.length;) {
    const rest = text.slice(index);
    const number = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(rest);
    if (number) { tokens.push({ kind: "number", value: number[0] }); index += number[0].length; continue; }
    const char = text[index];
    if (char === "x" || char === "y") { tokens.push({ kind: "variable", value: char }); index += 1; continue; }
    if ("+-*/".includes(char)) { tokens.push({ kind: "op", value: char }); index += 1; continue; }
    if (char === "(") { tokens.push({ kind: "left", value: char }); index += 1; continue; }
    if (char === ")") { tokens.push({ kind: "right", value: char }); index += 1; continue; }
    if (char === "^" || /[a-z]/i.test(char)) throw new Unsupported();
    throw new Error("invalid token");
  }
  return tokens;
}

class Parser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}
  parse() { const value = this.sum(); if (this.index !== this.tokens.length) throw new Error("trailing token"); return value; }
  private sum(): Linear {
    let value = this.product();
    while (this.peek("op", "+") || this.peek("op", "-")) { const op = this.take().value; const rhs = this.product(); value = op === "+" ? add(value, rhs) : subtract(value, rhs); }
    return value;
  }
  private product(): Linear {
    let value = this.unary();
    while (true) {
      const explicit = this.peek("op", "*") || this.peek("op", "/");
      const implicit = this.nextStartsFactor();
      if (!explicit && !implicit) break;
      const op = explicit ? this.take().value : "*";
      const rhs = this.unary();
      if (op === "/") {
        if (!zero(rhs.x) || !zero(rhs.y) || zero(rhs.c)) throw new Unsupported();
        value = scale(value, divide(O, rhs.c));
      } else value = multiplyLinear(value, rhs);
    }
    return value;
  }
  private unary(): Linear {
    if (this.peek("op", "+")) { this.take(); return this.unary(); }
    if (this.peek("op", "-")) { this.take(); return scale(this.unary(), rational(BigInt(-1))); }
    const token = this.take();
    if (token.kind === "number") return constant(parseDecimal(token.value));
    if (token.kind === "variable") return token.value === "x" ? { x: O, y: Z, c: Z } : { x: Z, y: O, c: Z };
    if (token.kind === "left") { const value = this.sum(); if (this.take().kind !== "right") throw new Error("missing close"); return value; }
    throw new Error("factor expected");
  }
  private nextStartsFactor() { const token = this.tokens[this.index]; return token?.kind === "number" || token?.kind === "variable" || token?.kind === "left"; }
  private peek(kind: Token["kind"], value?: string) { const token = this.tokens[this.index]; return token?.kind === kind && (value === undefined || token.value === value); }
  private take() { const token = this.tokens[this.index++]; if (!token) throw new Error("unexpected end"); return token; }
}

function multiplyLinear(a: Linear, b: Linear) {
  const aConstant = zero(a.x) && zero(a.y); const bConstant = zero(b.x) && zero(b.y);
  if (!aConstant && !bConstant) throw new Unsupported();
  return aConstant ? scale(b, a.c) : scale(a, b.c);
}
function proportional(a: Linear, b: Linear) {
  const pairs: Array<[Rational, Rational]> = [[a.x, b.x], [a.y, b.y], [a.c, b.c]];
  const pivot = pairs.find(([, right]) => !zero(right));
  if (!pivot || zero(pivot[0])) return false;
  const ratio = divide(pivot[0], pivot[1]);
  return pairs.every(([left, right]) => equal(left, multiply(right, ratio)));
}
function constant(c: Rational): Linear { return { x: Z, y: Z, c }; }
function add(a: Linear, b: Linear): Linear { return { x: addR(a.x, b.x), y: addR(a.y, b.y), c: addR(a.c, b.c) }; }
function subtract(a: Linear, b: Linear): Linear { return { x: subR(a.x, b.x), y: subR(a.y, b.y), c: subR(a.c, b.c) }; }
function scale(a: Linear, by: Rational): Linear { return { x: multiply(a.x, by), y: multiply(a.y, by), c: multiply(a.c, by) }; }
function parseDecimal(value: string) { const [whole, fraction = ""] = value.split("."); return rational(BigInt(`${whole || "0"}${fraction}`), BigInt(10) ** BigInt(fraction.length)); }
function rational(n: bigint, d = BigInt(1)): Rational { if (d === BigInt(0)) throw new Error("zero denominator"); if (n === BigInt(0)) return { n: BigInt(0), d: BigInt(1) }; const sign = d < BigInt(0) ? BigInt(-1) : BigInt(1); const g = gcd(abs(n), abs(d)); return { n: sign * n / g, d: abs(d) / g }; }
function gcd(a: bigint, b: bigint): bigint { while (b) [a, b] = [b, a % b]; return a || BigInt(1); }
function abs(v: bigint) { return v < BigInt(0) ? -v : v; }
function addR(a: Rational, b: Rational) { return rational(a.n * b.d + b.n * a.d, a.d * b.d); }
function subR(a: Rational, b: Rational) { return rational(a.n * b.d - b.n * a.d, a.d * b.d); }
function multiply(a: Rational, b: Rational) { return rational(a.n * b.n, a.d * b.d); }
function divide(a: Rational, b: Rational) { return rational(a.n * b.d, a.d * b.n); }
function equal(a: Rational, b: Rational) { return a.n === b.n && a.d === b.d; }
function zero(a: Rational) { return a.n === BigInt(0); }
