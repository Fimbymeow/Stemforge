import type {
  DerivativeResult,
  ExactNumber,
  ExpressionEvaluationResult,
  ExpressionValidationResult,
  MathExpression,
} from "@/lib/maths/expression-types";

const MAX_EXPRESSION_DEPTH = 12;
const MAX_EXPRESSION_NODES = 160;
const EPSILON = 1e-9;

export const xExpression: MathExpression = { type: "variable", name: "x" };

export function exact(numerator: number, denominator = 1): ExactNumber {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    throw new Error("Exact numbers must use integer numerator and non-zero integer denominator.");
  }
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  return { numerator: sign * numerator / divisor, denominator: Math.abs(denominator) / divisor };
}

export function exactToNumber(value: ExactNumber) {
  return value.numerator / (value.denominator ?? 1);
}

export function constant(value: number | ExactNumber): MathExpression {
  return { type: "constant", value: typeof value === "number" ? exactFromNumber(value) : exact(value.numerator, value.denominator ?? 1) };
}

export function add(...terms: MathExpression[]): MathExpression {
  return simplifyExpression({ type: "add", terms });
}

export function multiply(...factors: MathExpression[]): MathExpression {
  return simplifyExpression({ type: "multiply", factors });
}

export function power(base: MathExpression, exponent: number | ExactNumber): MathExpression {
  return simplifyExpression({ type: "power", base, exponent: typeof exponent === "number" ? exact(exponent) : exponent });
}

export function validateMathExpression(value: unknown): ExpressionValidationResult {
  const seen = { nodes: 0 };
  return validateNode(value, 1, seen);
}

export function serializeMathExpression(expression: MathExpression): string {
  switch (expression.type) {
    case "constant": return `constant(${serializeExact(expression.value)})`;
    case "variable": return "variable(x)";
    case "add": return `add(${expression.terms.map(serializeMathExpression).join(",")})`;
    case "multiply": return `multiply(${expression.factors.map(serializeMathExpression).join(",")})`;
    case "power": return `power(${serializeMathExpression(expression.base)},${serializeExact(expression.exponent)})`;
    case "sin":
    case "cos":
    case "tan":
    case "exp":
    case "log":
      return `${expression.type}(${serializeMathExpression(expression.argument)})`;
  }
}

export function expressionToDisplay(expression: MathExpression): string {
  switch (expression.type) {
    case "constant": return formatExact(expression.value);
    case "variable": return "x";
    case "add": return expression.terms.map(expressionToDisplay).join(" + ").replace(/\+ -/g, "- ");
    case "multiply": return expression.factors.map((factor) => factor.type === "add" ? `(${expressionToDisplay(factor)})` : expressionToDisplay(factor)).join("");
    case "power": return `${expressionToDisplay(expression.base)}^${formatExact(expression.exponent)}`;
    case "sin":
    case "cos":
    case "tan":
      return `${expression.type}(${expressionToDisplay(expression.argument)})`;
    case "exp": return `e^(${expressionToDisplay(expression.argument)})`;
    case "log": return `ln(${expressionToDisplay(expression.argument)})`;
  }
}

export function evaluateMathExpression(expression: MathExpression, x: number): ExpressionEvaluationResult {
  if (!Number.isFinite(x)) return { status: "domain_error", reasonCode: "invalid_x" };
  try {
    const value = evaluateNode(expression, x);
    if (!Number.isFinite(value)) return { status: "domain_error", reasonCode: "non_finite" };
    return { status: "value", value };
  } catch (error) {
    return { status: "domain_error", reasonCode: error instanceof Error ? error.message : "domain_error" };
  }
}

export function deriveExpression(expression: MathExpression): DerivativeResult {
  const validated = validateMathExpression(expression);
  if (validated.status !== "valid") return { status: "unsupported", reasonCode: validated.reasonCode };
  const derived = derivativeNode(expression);
  if (!derived) return { status: "unsupported", reasonCode: "unsupported_derivative" };
  return { status: "supported", expression: derived, simplifiedExpression: simplifyExpression(derived) };
}

export function simplifyExpression(expression: MathExpression): MathExpression {
  switch (expression.type) {
    case "add": {
      const terms = expression.terms.map(simplifyExpression).flatMap((term) => term.type === "add" ? term.terms : [term]);
      let constantSum = 0;
      const nonConstants: MathExpression[] = [];
      for (const term of terms) {
        if (term.type === "constant") constantSum += exactToNumber(term.value);
        else nonConstants.push(term);
      }
      const all = [constantSum === 0 ? null : constant(constantSum), ...nonConstants].filter((item): item is MathExpression => item !== null);
      if (all.length === 0) return constant(0);
      if (all.length === 1) return all[0];
      return { type: "add", terms: all };
    }
    case "multiply": {
      const factors = expression.factors.map(simplifyExpression).flatMap((factor) => factor.type === "multiply" ? factor.factors : [factor]);
      let constantProduct = 1;
      const nonConstants: MathExpression[] = [];
      for (const factor of factors) {
        if (factor.type === "constant") constantProduct *= exactToNumber(factor.value);
        else nonConstants.push(factor);
      }
      if (Math.abs(constantProduct) < EPSILON) return constant(0);
      const all = [constantProduct === 1 && nonConstants.length ? null : constant(constantProduct), ...nonConstants].filter((item): item is MathExpression => item !== null);
      if (all.length === 0) return constant(1);
      if (all.length === 1) return all[0];
      return { type: "multiply", factors: all };
    }
    case "power": {
      const base = simplifyExpression(expression.base);
      if (exactToNumber(expression.exponent) === 0) return constant(1);
      if (exactToNumber(expression.exponent) === 1) return base;
      return { ...expression, base };
    }
    case "sin":
    case "cos":
    case "tan":
    case "exp":
    case "log":
      return { ...expression, argument: simplifyExpression(expression.argument) };
    default:
      return expression;
  }
}

function derivativeNode(expression: MathExpression): MathExpression | null {
  switch (expression.type) {
    case "constant": return constant(0);
    case "variable": return constant(1);
    case "add": {
      const terms = expression.terms.map(derivativeNode);
      return terms.every(Boolean) ? add(...(terms as MathExpression[])) : null;
    }
    case "multiply": {
      const nonConstant = expression.factors.filter((factor) => factor.type !== "constant");
      if (nonConstant.length > 1) return null;
      const derived = derivativeNode(nonConstant[0] ?? constant(1));
      if (!derived) return null;
      const constants = expression.factors.filter((factor) => factor.type === "constant");
      return multiply(...constants, derived);
    }
    case "power": {
      if (expression.base.type !== "variable") return null;
      const n = exactToNumber(expression.exponent);
      if (!Number.isInteger(n)) return null;
      return multiply(constant(n), power(xExpression, n - 1));
    }
    case "sin": return chain(expression.argument, { type: "cos", argument: expression.argument });
    case "cos": return chain(expression.argument, multiply(constant(-1), { type: "sin", argument: expression.argument }));
    case "exp": return chain(expression.argument, { type: "exp", argument: expression.argument });
    case "log": return chain(expression.argument, { type: "power", base: expression.argument, exponent: exact(-1) });
    case "tan":
      return null;
  }
}

function chain(argument: MathExpression, outerDerivative: MathExpression) {
  const inner = derivativeNode(argument);
  if (!inner) return null;
  return multiply(outerDerivative, inner);
}

function evaluateNode(expression: MathExpression, x: number): number {
  switch (expression.type) {
    case "constant": return exactToNumber(expression.value);
    case "variable": return x;
    case "add": return expression.terms.reduce((total, term) => total + evaluateNode(term, x), 0);
    case "multiply": return expression.factors.reduce((total, factor) => total * evaluateNode(factor, x), 1);
    case "power": {
      const base = evaluateNode(expression.base, x);
      const exponent = exactToNumber(expression.exponent);
      if (base < 0 && !Number.isInteger(exponent)) throw new Error("power_domain");
      return Math.pow(base, exponent);
    }
    case "sin": return Math.sin(evaluateNode(expression.argument, x));
    case "cos": return Math.cos(evaluateNode(expression.argument, x));
    case "tan": {
      const argument = evaluateNode(expression.argument, x);
      if (Math.abs(Math.cos(argument)) < 1e-6) throw new Error("tan_asymptote");
      return Math.tan(argument);
    }
    case "exp": return Math.exp(evaluateNode(expression.argument, x));
    case "log": {
      const argument = evaluateNode(expression.argument, x);
      if (argument <= 0) throw new Error("log_domain");
      return Math.log(argument);
    }
  }
}

function validateNode(value: unknown, depth: number, seen: { nodes: number }): ExpressionValidationResult {
  if (depth > MAX_EXPRESSION_DEPTH) return { status: "invalid", reasonCode: "too_deep" };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { status: "invalid", reasonCode: "not_object" };
  seen.nodes += 1;
  if (seen.nodes > MAX_EXPRESSION_NODES) return { status: "invalid", reasonCode: "too_many_nodes" };
  const expression = value as MathExpression;
  switch (expression.type) {
    case "constant": return isExactNumber(expression.value) ? { status: "valid", nodeCount: seen.nodes, depth } : { status: "invalid", reasonCode: "invalid_constant" };
    case "variable": return expression.name === "x" ? { status: "valid", nodeCount: seen.nodes, depth } : { status: "invalid", reasonCode: "unsupported_variable" };
    case "add": return validateChildren(expression.terms, depth, seen, "invalid_terms");
    case "multiply": return validateChildren(expression.factors, depth, seen, "invalid_factors");
    case "power": {
      if (!isExactNumber(expression.exponent)) return { status: "invalid", reasonCode: "invalid_exponent" };
      if (Math.abs(exactToNumber(expression.exponent)) > 8) return { status: "invalid", reasonCode: "exponent_too_large" };
      return validateNode(expression.base, depth + 1, seen);
    }
    case "sin":
    case "cos":
    case "tan":
    case "exp":
    case "log":
      return validateNode(expression.argument, depth + 1, seen);
    default:
      return { status: "invalid", reasonCode: "unsupported_node" };
  }
}

function validateChildren(children: unknown, depth: number, seen: { nodes: number }, reasonCode: string): ExpressionValidationResult {
  if (!Array.isArray(children) || children.length === 0 || children.length > 12) return { status: "invalid", reasonCode };
  let maxDepth = depth;
  for (const child of children) {
    const result = validateNode(child, depth + 1, seen);
    if (result.status !== "valid") return result;
    maxDepth = Math.max(maxDepth, result.depth);
  }
  return { status: "valid", nodeCount: seen.nodes, depth: maxDepth };
}

function isExactNumber(value: unknown): value is ExactNumber {
  if (!value || typeof value !== "object") return false;
  const item = value as ExactNumber;
  return Number.isInteger(item.numerator) && (item.denominator === undefined || Number.isInteger(item.denominator)) && (item.denominator ?? 1) !== 0;
}

function serializeExact(value: ExactNumber) {
  const simplified = exact(value.numerator, value.denominator ?? 1);
  return `${simplified.numerator}/${simplified.denominator ?? 1}`;
}

function formatExact(value: ExactNumber) {
  const simplified = exact(value.numerator, value.denominator ?? 1);
  return (simplified.denominator ?? 1) === 1 ? String(simplified.numerator) : `${simplified.numerator}/${simplified.denominator}`;
}

function gcd(left: number, right: number): number {
  let a = left;
  let b = right;
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function exactFromNumber(value: number) {
  if (!Number.isFinite(value)) throw new Error("Exact numbers must be finite.");
  if (Number.isInteger(value)) return exact(value);
  return exact(Math.round(value * 1_000_000), 1_000_000);
}
