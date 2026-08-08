import type { MathInputCapabilities } from "@/lib/questions/math-input-capabilities";
import {
  printElementaryCanonical,
  printElementaryLatex,
  rationalExponent,
  unwrapAnyGroup,
  unwrapInvisibleGroup,
  type ElementaryExpressionNode as Node,
} from "@/lib/maths/elementary-expression";
import type { ElementaryConstant, ElementaryFunction } from "@/lib/marking/types";

export const RICH_MATH_NORMALIZATION_VERSION = 1 as const;
export const RICH_MATH_SOURCE_MAX_LENGTH = 2_048;
export const RICH_MATH_MAX_DEPTH = 16;
export const RICH_MATH_MAX_NODES = 128;

export type RichMathNormalizationResult =
  | { status: "ready"; canonical: string; version: typeof RICH_MATH_NORMALIZATION_VERSION }
  | { status: "incomplete"; version: typeof RICH_MATH_NORMALIZATION_VERSION }
  | { status: "unsupported"; version: typeof RICH_MATH_NORMALIZATION_VERSION }
  | { status: "invalid"; version: typeof RICH_MATH_NORMALIZATION_VERSION };

type TokenKind = "number" | "variable" | "plus" | "minus" | "multiply" | "divide" | "power" |
  "leftParen" | "rightParen" | "leftBrace" | "rightBrace" | "fraction" | "sqrt" | "constant" | "function" | "subscript" | "end";
type Token = { kind: TokenKind; value?: string };
type FailureKind = "incomplete" | "unsupported" | "invalid";

class RichMathFailure extends Error {
  constructor(readonly kind: FailureKind) { super(kind); }
}

export function normalizeRichMathSource(source: string, capabilities: MathInputCapabilities): RichMathNormalizationResult {
  if (!source.trim()) return result("incomplete");
  if (source.length > RICH_MATH_SOURCE_MAX_LENGTH) return result("invalid");
  try {
    const parser = new Parser(tokenize(source));
    const expression = parser.parse();
    validateSupported(expression, capabilities);
    return { status: "ready", canonical: printElementaryCanonical(expression), version: RICH_MATH_NORMALIZATION_VERSION };
  } catch (error) {
    return result(error instanceof RichMathFailure ? error.kind : "invalid");
  }
}

export function canonicalMathToLatex(canonical: string, capabilities: MathInputCapabilities): string | null {
  const normalized = normalizeRichMathSource(canonical, capabilities);
  if (normalized.status !== "ready") return null;
  try {
    return printElementaryLatex(new Parser(tokenize(canonical)).parse());
  } catch {
    return null;
  }
}

function result(status: FailureKind): RichMathNormalizationResult {
  return { status, version: RICH_MATH_NORMALIZATION_VERSION };
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (/\s/.test(character)) { index += 1; continue; }
    if (character === "#") throw new RichMathFailure("incomplete");
    if (character === "\\") {
      const commandMatch = /^\\([A-Za-z]+|[,!;: ])/.exec(source.slice(index));
      if (!commandMatch) throw new RichMathFailure("invalid");
      index += commandMatch[0].length;
      const command = commandMatch[1];
      if (["left", "right"].includes(command) || /[,!;: ]/.test(command)) continue;
      if (["cdot", "times"].includes(command)) { tokens.push({ kind: "multiply" }); continue; }
      if (command === "frac" || command === "dfrac" || command === "tfrac") { tokens.push({ kind: "fraction" }); continue; }
      if (command === "sqrt") { tokens.push({ kind: "sqrt" }); continue; }
      if (command === "pi") { tokens.push({ kind: "constant", value: "pi" }); continue; }
      if (["sin", "cos", "tan", "ln", "log"].includes(command)) { tokens.push({ kind: "function", value: command }); continue; }
      if (command === "placeholder") throw new RichMathFailure("incomplete");
      throw new RichMathFailure("unsupported");
    }
    if (/[0-9.]/.test(character)) {
      const match = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(source.slice(index));
      if (!match || match[0].endsWith(".")) throw new RichMathFailure("invalid");
      tokens.push({ kind: "number", value: match[0] });
      index += match[0].length;
      continue;
    }
    if (/[A-Za-z]/.test(character)) {
      const match = /^[A-Za-z]+/.exec(source.slice(index));
      if (!match) throw new RichMathFailure("invalid");
      const identifier = match[0].toLowerCase();
      if (identifier === "sqrt") tokens.push({ kind: "sqrt" });
      else if (identifier === "x") tokens.push({ kind: "variable", value: "x" });
      else if (identifier === "pi" || identifier === "e") tokens.push({ kind: "constant", value: identifier });
      else if (["sin", "cos", "tan", "ln", "log"].includes(identifier)) tokens.push({ kind: "function", value: identifier });
      else throw new RichMathFailure("unsupported");
      index += match[0].length;
      continue;
    }
    const kind: TokenKind | undefined = ({
      "+": "plus", "-": "minus", "−": "minus", "*": "multiply", "×": "multiply", "·": "multiply",
      "/": "divide", "^": "power", "_": "subscript", "(": "leftParen", ")": "rightParen", "{": "leftBrace", "}": "rightBrace",
    } as Record<string, TokenKind>)[character];
    if (!kind) throw new RichMathFailure(character === "=" ? "unsupported" : "invalid");
    tokens.push({ kind });
    index += 1;
  }
  tokens.push({ kind: "end" });
  return tokens;
}

class Parser {
  private position = 0;
  private nodes = 0;
  private depth = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const expression = this.withDepth(() => this.parseAddition());
    if (this.peek().kind !== "end") throw new RichMathFailure("invalid");
    return expression;
  }

  private parseAddition(): Node {
    let left = this.parseProduct();
    while (this.peek().kind === "plus" || this.peek().kind === "minus") {
      const operator = this.consume().kind === "plus" ? "+" : "-";
      if (!startsPrimary(this.peek().kind)) throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
      left = this.node({ type: "binary", operator, left, right: this.parseProduct() });
    }
    return left;
  }

  private parseProduct(): Node {
    let left = this.parseUnary();
    while (true) {
      const next = this.peek().kind;
      if (next === "multiply" || next === "divide") {
        const operator = this.consume().kind === "multiply" ? "*" : "/";
        if (!startsPrimary(this.peek().kind)) throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
        left = this.node({ type: "binary", operator, left, right: this.parseUnary() });
        continue;
      }
      if (startsImplicitPrimary(next)) {
        left = this.node({ type: "binary", operator: "*", left, right: this.parseUnary() });
        continue;
      }
      return left;
    }
  }

  private parseUnary(): Node {
    if (this.peek().kind === "plus" || this.peek().kind === "minus") {
      const operator = this.consume().kind === "plus" ? "+" : "-";
      if (!startsPrimary(this.peek().kind)) throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
      return this.node({ type: "unary", operator, value: this.parseUnary() });
    }
    return this.parsePower();
  }

  private parsePower(): Node {
    let base = this.parsePrimary();
    if (this.peek().kind === "power") {
      this.consume();
      if (!startsPrimary(this.peek().kind)) throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
      base = this.node({ type: "power", base, exponent: this.withDepth(() => this.parseUnary()) });
    }
    return base;
  }

  private parsePrimary(): Node {
    const token = this.consume();
    if (token.kind === "number") return this.node({ type: "number", value: token.value ?? "" });
    if (token.kind === "variable") return this.node({ type: "variable", name: "x" });
    if (token.kind === "constant") return this.node({ type: "constant", name: token.value as ElementaryConstant });
    if (token.kind === "leftParen") return this.parseGroup("rightParen", true);
    if (token.kind === "leftBrace") return this.parseGroup("rightBrace", false);
    if (token.kind === "fraction") {
      const numerator = this.parseRequiredBraceGroup();
      const denominator = this.parseRequiredBraceGroup();
      return this.node({ type: "binary", operator: "/", left: numerator, right: denominator });
    }
    if (token.kind === "sqrt") {
      if (this.peek().kind === "leftBrace") return this.node({ type: "sqrt", value: this.parseRequiredBraceGroup() });
      if (this.peek().kind === "leftParen") {
        this.consume();
        const group = this.parseGroup("rightParen", false);
        return this.node({ type: "sqrt", value: group });
      }
      throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
    }
    if (token.kind === "function") {
      const name = token.value as ElementaryFunction;
      const logBase = name === "log" ? this.parseOptionalLogBase() : undefined;
      let argument: Node;
      if (this.peek().kind === "leftParen") {
        this.consume();
        argument = this.parseGroup("rightParen", false);
      } else if (this.peek().kind === "leftBrace") {
        argument = this.parseRequiredBraceGroup();
      } else {
        if (!startsPrimary(this.peek().kind)) throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
        argument = this.withDepth(() => this.parseUnary());
      }
      return this.node({ type: "function", name, argument, ...(logBase === undefined ? {} : { logBase }) });
    }
    throw new RichMathFailure(token.kind === "end" ? "incomplete" : "invalid");
  }

  private parseOptionalLogBase(): number | undefined {
    if (this.peek().kind !== "subscript") return undefined;
    this.consume();
    let token: Token;
    if (this.peek().kind === "leftBrace") {
      this.consume();
      if (this.peek().kind === "rightBrace") throw new RichMathFailure("incomplete");
      token = this.consume();
      if (this.peek().kind !== "rightBrace") throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
      this.consume();
    } else token = this.consume();
    if (token.kind !== "number" || !/^\d+$/.test(token.value ?? "")) throw new RichMathFailure("unsupported");
    const base = Number(token.value);
    if (!Number.isSafeInteger(base) || base < 2) throw new RichMathFailure("unsupported");
    return base;
  }

  private parseRequiredBraceGroup(): Node {
    if (this.peek().kind !== "leftBrace") throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
    this.consume();
    return this.parseGroup("rightBrace", false);
  }

  private parseGroup(close: "rightParen" | "rightBrace", visible: boolean): Node {
    if (this.peek().kind === close) throw new RichMathFailure("incomplete");
    const value = this.withDepth(() => this.parseAddition());
    if (this.peek().kind !== close) throw new RichMathFailure(this.peek().kind === "end" ? "incomplete" : "invalid");
    this.consume();
    return this.node({ type: "group", value, visible });
  }

  private peek() { return this.tokens[this.position] ?? { kind: "end" as const }; }
  private consume() { return this.tokens[this.position++] ?? { kind: "end" as const }; }
  private node<T extends Node>(node: T): T {
    this.nodes += 1;
    if (this.nodes > RICH_MATH_MAX_NODES) throw new RichMathFailure("invalid");
    return node;
  }
  private withDepth<T>(callback: () => T): T {
    this.depth += 1;
    if (this.depth > RICH_MATH_MAX_DEPTH) throw new RichMathFailure("invalid");
    try { return callback(); } finally { this.depth -= 1; }
  }
}

function startsPrimary(kind: TokenKind) {
  return kind === "number" || kind === "variable" || kind === "constant" || kind === "function" || kind === "leftParen" || kind === "leftBrace" ||
    kind === "fraction" || kind === "sqrt" || kind === "plus" || kind === "minus";
}

function startsImplicitPrimary(kind: TokenKind) {
  return kind === "number" || kind === "variable" || kind === "constant" || kind === "function" || kind === "leftParen" || kind === "leftBrace" || kind === "fraction" || kind === "sqrt";
}

function validateSupported(node: Node, capabilities: MathInputCapabilities, allowSquareRoot = false, functionDepth = 0): void {
  if (node.type === "number") { if (!capabilities.numericLiterals) unsupported(); return; }
  if (node.type === "variable") { if (!capabilities.variable) unsupported(); return; }
  if (node.type === "constant") { if (!capabilities.allowedConstants.includes(node.name)) unsupported(); return; }
  if (node.type === "function") {
    if (!capabilities.allowedFunctions.includes(node.name) || functionDepth >= capabilities.maximumFunctionDepth) unsupported();
    if (node.name === "log" && node.logBase !== undefined && !capabilities.allowedLogBases.includes(node.logBase)) unsupported();
    validateSupported(node.argument, capabilities, false, functionDepth + 1);
    return;
  }
  if (node.type === "unary") { if (!capabilities.additionSubtraction) unsupported(); validateSupported(node.value, capabilities, allowSquareRoot, functionDepth); return; }
  if (node.type === "group") {
    if (node.visible && !capabilities.brackets) unsupported();
    validateSupported(node.value, capabilities, allowSquareRoot, functionDepth);
    return;
  }
  if (node.type === "sqrt") {
    const direct = capabilities.directSquareRoots && isExactScalarRadicand(node.value);
    const reciprocal = allowSquareRoot && capabilities.boundedReciprocalSquareRoots && isPolynomialShape(node.value, capabilities);
    if (!direct && !reciprocal) unsupported();
    return;
  }
  if (node.type === "power") {
    if (node.base.type === "constant" && node.base.name === "e" && capabilities.exponentialPowers) {
      validateSupported(node.base, capabilities, false, functionDepth);
      validateSupported(node.exponent, capabilities, false, functionDepth);
      return;
    }
    validateSupported(node.base, capabilities, false, functionDepth);
    const exponent = rationalExponent(node.exponent);
    if (!exponent) unsupported();
    if (exponent.denominator === 1 && exponent.numerator >= 0) {
      if (!capabilities.nonNegativeIntegerPowers || exponent.numerator > capabilities.maximumNonNegativeExponent) unsupported();
      return;
    }
    if (exponent.denominator === 1 && exponent.numerator < 0) {
      if (!capabilities.negativeIntegerPowers || Math.abs(exponent.numerator) > capabilities.maximumNegativeExponent) unsupported();
      return;
    }
    if (exponent.denominator === 2 && Math.abs(exponent.numerator) === 1 && capabilities.halfPowers) return;
    unsupported();
  }
  if (node.operator === "+" || node.operator === "-") {
    if (!capabilities.additionSubtraction) unsupported();
    validateSupported(node.left, capabilities, false, functionDepth);
    validateSupported(node.right, capabilities, false, functionDepth);
    return;
  }
  if (node.operator === "*") {
    if (!capabilities.multiplication) unsupported();
    validateSupported(node.left, capabilities, allowSquareRoot, functionDepth);
    validateSupported(node.right, capabilities, allowSquareRoot, functionDepth);
    return;
  }
  validateDivision(node.left, node.right, capabilities);
}

function validateDivision(numerator: Node, denominator: Node, capabilities: MathInputCapabilities) {
  if (isIntegerLiteral(numerator) && isIntegerLiteral(denominator)) {
    if (!capabilities.numericFractions || integerValue(denominator) === 0) unsupported();
    return;
  }
  if (capabilities.elementaryFractions && isPositiveNumericLiteral(denominator)) {
    validateSupported(numerator, capabilities);
    return;
  }
  if (!isPolynomialShape(numerator, capabilities)) unsupported();
  if (denominator.type === "group" && denominator.visible && !capabilities.brackets) unsupported();
  const denominatorValue = unwrapAnyGroup(denominator);
  if (denominatorValue.type === "power" && capabilities.boundedReciprocalPowers) {
    const exponent = rationalExponent(denominatorValue.exponent);
    if (!exponent || exponent.denominator !== 1 || exponent.numerator <= 0 || exponent.numerator > capabilities.maximumNegativeExponent ||
        !isPolynomialShape(denominatorValue.base, capabilities)) unsupported();
    return;
  }
  if (capabilities.boundedReciprocalSquareRoots && isBoundedRootDenominator(denominatorValue, capabilities)) return;
  unsupported();
}

function isBoundedRootDenominator(node: Node, capabilities: MathInputCapabilities): boolean {
  if (node.type === "sqrt") return isPolynomialShape(node.value, capabilities);
  if (node.type !== "binary" || node.operator !== "*") return false;
  const left = unwrapInvisibleGroup(node.left);
  const right = unwrapInvisibleGroup(node.right);
  return (isPositiveNumericLiteral(left) && right.type === "sqrt" && isPolynomialShape(right.value, capabilities)) ||
    (isPositiveNumericLiteral(right) && left.type === "sqrt" && isPolynomialShape(left.value, capabilities));
}

function isPolynomialShape(node: Node, capabilities: MathInputCapabilities): boolean {
  const value = unwrapInvisibleGroup(node);
  if (value.type === "number" || value.type === "variable") return true;
  if (value.type === "group") return capabilities.brackets && isPolynomialShape(value.value, capabilities);
  if (value.type === "unary") return isPolynomialShape(value.value, capabilities);
  if (value.type === "binary" && (value.operator === "+" || value.operator === "-" || value.operator === "*")) {
    return isPolynomialShape(value.left, capabilities) && isPolynomialShape(value.right, capabilities);
  }
  if (value.type === "binary" && value.operator === "/") return capabilities.numericFractions && isIntegerLiteral(value.left) && isIntegerLiteral(value.right) && integerValue(value.right) !== 0;
  if (value.type === "power") {
    const exponent = rationalExponent(value.exponent);
    return Boolean(exponent && exponent.denominator === 1 && exponent.numerator >= 0 &&
      exponent.numerator <= capabilities.maximumNonNegativeExponent && isPolynomialShape(value.base, capabilities));
  }
  return false;
}

function isIntegerLiteral(node: Node): boolean {
  const value = unwrapAnyGroup(node);
  return value.type === "number" && /^\d+$/.test(value.value) ||
    value.type === "unary" && (value.operator === "+" || value.operator === "-") && isIntegerLiteral(value.value);
}

function integerValue(node: Node): number {
  const value = unwrapAnyGroup(node);
  if (value.type === "number") return Number(value.value);
  if (value.type === "unary") return (value.operator === "-" ? -1 : 1) * integerValue(value.value);
  return Number.NaN;
}

function isPositiveNumericLiteral(node: Node): boolean {
  const value = unwrapInvisibleGroup(node);
  if (value.type === "number") return Number(value.value) > 0;
  if (value.type === "binary" && value.operator === "/" && isIntegerLiteral(value.left) && isIntegerLiteral(value.right)) {
    return integerValue(value.left) / integerValue(value.right) > 0;
  }
  return false;
}

function isExactScalarRadicand(node: Node): boolean {
  const value = unwrapAnyGroup(node);
  if (value.type === "number") return Number(value.value) >= 0;
  if (value.type === "binary" && value.operator === "/") return isIntegerLiteral(value.left) && isIntegerLiteral(value.right) && integerValue(value.right) > 0;
  return false;
}

function unsupported(): never { throw new RichMathFailure("unsupported"); }
