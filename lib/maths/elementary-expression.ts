import type { ElementaryConstant, ElementaryFunction } from "@/lib/marking/types";

/**
 * Shared bounded expression model for rich-source normalization and conservative marking.
 * It is deliberately a syntax tree, not a simplifier or general symbolic-algebra engine.
 */
export type ElementaryExpressionNode =
  | { type: "number"; value: string }
  | { type: "variable"; name: "x" }
  | { type: "constant"; name: ElementaryConstant }
  | { type: "unary"; operator: "+" | "-"; value: ElementaryExpressionNode }
  | { type: "binary"; operator: "+" | "-" | "*" | "/"; left: ElementaryExpressionNode; right: ElementaryExpressionNode }
  | { type: "power"; base: ElementaryExpressionNode; exponent: ElementaryExpressionNode }
  | { type: "group"; value: ElementaryExpressionNode; visible: boolean }
  | { type: "sqrt"; value: ElementaryExpressionNode }
  | { type: "function"; name: ElementaryFunction; argument: ElementaryExpressionNode; logBase?: number };

export function printElementaryCanonical(node: ElementaryExpressionNode, parentPrecedence = 0): string {
  const value = unwrapInvisibleGroup(node);
  if (value.type === "number") return value.value;
  if (value.type === "variable") return value.name;
  if (value.type === "constant") return value.name;
  if (value.type === "group") return `(${printElementaryCanonical(value.value)})`;
  if (value.type === "sqrt") return `sqrt(${printElementaryCanonical(value.value)})`;
  if (value.type === "function") {
    // Canonical V1 log notation is log(x) for an unbased/common logarithm and log_2(x) for an authorised explicit base.
    const base = value.name === "log" && value.logBase !== undefined ? `_${value.logBase}` : "";
    return `${value.name}${base}(${printElementaryCanonical(value.argument)})`;
  }
  if (value.type === "unary") return `${value.operator}${printElementaryCanonical(value.value, 4)}`;
  if (value.type === "power") {
    const base = value.base.type === "group" && value.base.visible
      ? printElementaryCanonical(value.base)
      : printElementaryCanonical(value.base, 4);
    const exponent = rationalExponent(value.exponent);
    const canonicalExponent = unwrapAnyGroup(value.exponent);
    const exponentText = exponent
      ? exponent.denominator === 1 && exponent.numerator >= 0
        ? String(exponent.numerator)
        : exponent.denominator === 1
          ? `(${exponent.numerator})`
          : `(${exponent.numerator}/${exponent.denominator})`
      : canonicalExponent.type === "variable"
        ? printElementaryCanonical(canonicalExponent)
        : `(${printElementaryCanonical(canonicalExponent)})`;
    return `${base}^${exponentText}`;
  }
  const precedence = value.operator === "+" || value.operator === "-" ? 1 : 2;
  const left = printElementaryCanonical(value.left, precedence);
  const right = printElementaryCanonical(value.right, precedence + (value.operator === "-" || value.operator === "/" ? 1 : 0));
  const operator = value.operator === "*" && canJuxtapose(value.left, value.right) ? "" : value.operator;
  const printed = `${left}${operator}${right}`;
  return precedence < parentPrecedence ? `(${printed})` : printed;
}

export function printElementaryLatex(node: ElementaryExpressionNode, parentPrecedence = 0): string {
  const value = unwrapInvisibleGroup(node);
  if (value.type === "number") return value.value;
  if (value.type === "variable") return value.name;
  if (value.type === "constant") return value.name === "pi" ? "\\pi" : "e";
  if (value.type === "group") return `\\left(${printElementaryLatex(value.value)}\\right)`;
  if (value.type === "sqrt") return `\\sqrt{${printElementaryLatex(value.value)}}`;
  if (value.type === "function") {
    const base = value.name === "log" && value.logBase !== undefined ? `_{${value.logBase}}` : "";
    return `\\${value.name}${base}\\left(${printElementaryLatex(value.argument)}\\right)`;
  }
  if (value.type === "unary") return `${value.operator}${printElementaryLatex(value.value, 4)}`;
  if (value.type === "power") {
    const rational = rationalExponent(value.exponent);
    const exponentText = rational
      ? rational.denominator === 1
        ? String(rational.numerator)
        : `${rational.numerator < 0 ? "-" : ""}\\frac{${Math.abs(rational.numerator)}}{${rational.denominator}}`
      : printElementaryLatex(unwrapAnyGroup(value.exponent));
    return `${printElementaryLatex(value.base, 4)}^{${exponentText}}`;
  }
  if (value.operator === "/") return `\\frac{${printElementaryLatex(value.left)}}{${printElementaryLatex(value.right)}}`;
  const precedence = value.operator === "+" || value.operator === "-" ? 1 : 2;
  const operator = value.operator === "*" ? "" : value.operator;
  const printed = `${printElementaryLatex(value.left, precedence)}${operator}${printElementaryLatex(value.right, precedence + (value.operator === "-" ? 1 : 0))}`;
  return precedence < parentPrecedence ? `\\left(${printed}\\right)` : printed;
}

export function rationalExponent(node: ElementaryExpressionNode): { numerator: number; denominator: number } | null {
  const value = unwrapAnyGroup(node);
  if (isIntegerNode(value)) return { numerator: integerNodeValue(value), denominator: 1 };
  if (value.type === "unary" && value.operator === "-" && isIntegerNode(value.value)) {
    return { numerator: -integerNodeValue(value.value), denominator: 1 };
  }
  if (value.type === "binary" && value.operator === "/" && isIntegerNode(value.left) && isIntegerNode(value.right)) {
    const denominator = integerNodeValue(value.right);
    return denominator ? { numerator: integerNodeValue(value.left), denominator } : null;
  }
  if (value.type === "unary" && value.operator === "-") {
    const fraction = rationalExponent(value.value);
    return fraction ? { numerator: -fraction.numerator, denominator: fraction.denominator } : null;
  }
  return null;
}

export function unwrapInvisibleGroup(node: ElementaryExpressionNode): ElementaryExpressionNode {
  return node.type === "group" && !node.visible ? unwrapInvisibleGroup(node.value) : node;
}

export function unwrapAnyGroup(node: ElementaryExpressionNode): ElementaryExpressionNode {
  return node.type === "group" ? unwrapAnyGroup(node.value) : node;
}

function isIntegerNode(node: ElementaryExpressionNode): boolean {
  const value = unwrapAnyGroup(node);
  return value.type === "number" && /^\d+$/.test(value.value) ||
    value.type === "unary" && (value.operator === "+" || value.operator === "-") && isIntegerNode(value.value);
}

function integerNodeValue(node: ElementaryExpressionNode): number {
  const value = unwrapAnyGroup(node);
  if (value.type === "number") return Number(value.value);
  if (value.type === "unary") return (value.operator === "-" ? -1 : 1) * integerNodeValue(value.value);
  return Number.NaN;
}

function canJuxtapose(left: ElementaryExpressionNode, right: ElementaryExpressionNode): boolean {
  const l = unwrapInvisibleGroup(left);
  const r = unwrapInvisibleGroup(right);
  const leftCoefficient = l.type === "number" || l.type === "variable" || l.type === "group" || l.type === "power" ||
    l.type === "unary" && isIntegerNode(l) ||
    l.type === "binary" && l.operator === "*" && canJuxtapose(l.right, r) ||
    l.type === "binary" && l.operator === "/";
  const rightAlgebraic = r.type === "variable" || r.type === "constant" || r.type === "group" || r.type === "sqrt" || r.type === "power" || r.type === "function";
  return leftCoefficient && rightAlgebraic;
}
