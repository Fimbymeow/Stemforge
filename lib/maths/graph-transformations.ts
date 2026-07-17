import { add, constant, exactToNumber, multiply, power, simplifyExpression, xExpression } from "@/lib/maths/expression-core";
import type { ExactNumber, GraphPoint, GraphTransformation, MathExpression } from "@/lib/maths/expression-types";

export function applyGraphTransformations(expression: MathExpression, transformations: readonly GraphTransformation[]) {
  return transformations.reduce((current, transformation) => applyGraphTransformation(current, transformation), expression);
}

export function applyGraphTransformation(expression: MathExpression, transformation: GraphTransformation): MathExpression {
  switch (transformation.type) {
    case "translateX":
      return substituteX(expression, add(xExpression, constant(-exactToNumber(transformation.value))));
    case "translateY":
      return simplifyExpression(add(expression, constant(transformation.value)));
    case "scaleX":
      return substituteX(expression, multiply(constant(reciprocal(transformation.factor)), xExpression));
    case "scaleY":
      return simplifyExpression(multiply(constant(transformation.factor), expression));
    case "reflectX":
      return simplifyExpression(multiply(constant(-1), expression));
    case "reflectY":
      return substituteX(expression, multiply(constant(-1), xExpression));
  }
}

export function transformGraphPoint(point: GraphPoint, transformations: readonly GraphTransformation[]): GraphPoint {
  return transformations.reduce((current, transformation) => {
    const x = exactToNumber(current.x);
    const y = exactToNumber(current.y);
    switch (transformation.type) {
      case "translateX": return { ...current, x: fromNumber(x + exactToNumber(transformation.value)) };
      case "translateY": return { ...current, y: fromNumber(y + exactToNumber(transformation.value)) };
      case "scaleX": return { ...current, x: fromNumber(x * exactToNumber(transformation.factor)) };
      case "scaleY": return { ...current, y: fromNumber(y * exactToNumber(transformation.factor)) };
      case "reflectX": return { ...current, y: fromNumber(-y) };
      case "reflectY": return { ...current, x: fromNumber(-x) };
    }
  }, point);
}

export function serializeTransformation(transformation: GraphTransformation) {
  if (transformation.type === "reflectX" || transformation.type === "reflectY") return transformation.type;
  const value = "value" in transformation ? transformation.value : transformation.factor;
  return `${transformation.type}:${value.numerator}/${value.denominator ?? 1}`;
}

function substituteX(expression: MathExpression, replacement: MathExpression): MathExpression {
  switch (expression.type) {
    case "constant": return expression;
    case "variable": return replacement;
    case "add": return simplifyExpression({ type: "add", terms: expression.terms.map((term) => substituteX(term, replacement)) });
    case "multiply": return simplifyExpression({ type: "multiply", factors: expression.factors.map((factor) => substituteX(factor, replacement)) });
    case "power": return simplifyExpression(power(substituteX(expression.base, replacement), expression.exponent));
    case "sin":
    case "cos":
    case "tan":
    case "exp":
    case "log":
      return simplifyExpression({ ...expression, argument: substituteX(expression.argument, replacement) });
  }
}

function fromNumber(value: number): ExactNumber {
  const rounded = Math.round(value * 1_000_000);
  return { numerator: rounded, denominator: 1_000_000 };
}

function reciprocal(value: ExactNumber): ExactNumber {
  return { numerator: value.denominator ?? 1, denominator: value.numerator };
}
