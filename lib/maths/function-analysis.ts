import { deriveExpression, evaluateMathExpression, exact, exactToNumber } from "@/lib/maths/expression-core";
import type { ExactNumber, MathExpression, NatureTableExpectedCell, NatureTableSign } from "@/lib/maths/expression-types";

export type CriticalPoint = {
  x: ExactNumber;
  y: ExactNumber;
  nature: "maximum" | "minimum" | "stationary_inflection" | "unknown";
};

export type FunctionAnalysisResult =
  | { status: "supported"; derivative: MathExpression; criticalPoints: CriticalPoint[]; intervalSigns: Record<string, NatureTableSign> }
  | { status: "unsupported"; reasonCode: string };

export function analyseFunctionNature(expression: MathExpression, configuredCriticalValues?: readonly ExactNumber[]): FunctionAnalysisResult {
  const derivative = deriveExpression(expression);
  if (derivative.status !== "supported") return { status: "unsupported", reasonCode: derivative.reasonCode };
  const criticalValues = configuredCriticalValues?.length
    ? [...configuredCriticalValues]
    : solveLinearOrQuadraticRoots(derivative.simplifiedExpression);
  if (!criticalValues) return { status: "unsupported", reasonCode: "critical_values_required" };
  const ordered = [...criticalValues].sort((left, right) => exactToNumber(left) - exactToNumber(right));
  const intervalSigns = deriveIntervalSigns(derivative.simplifiedExpression, ordered);
  const criticalPoints: CriticalPoint[] = ordered.map((x, index) => {
    const y = evaluateMathExpression(expression, exactToNumber(x));
    const left = intervalSigns[`interval-${index}`];
    const right = intervalSigns[`interval-${index + 1}`];
    const nature: CriticalPoint["nature"] = left === "positive" && right === "negative"
      ? "maximum"
      : left === "negative" && right === "positive"
        ? "minimum"
        : left === right ? "stationary_inflection" : "unknown";
    return {
      x,
      y: y.status === "value" ? exact(Math.round(y.value * 1_000_000), 1_000_000) : exact(0),
      nature,
    };
  });
  return { status: "supported", derivative: derivative.simplifiedExpression, criticalPoints, intervalSigns };
}

export function createNatureTableExpectedAnswers(analysis: FunctionAnalysisResult): Record<string, NatureTableExpectedCell> {
  if (analysis.status !== "supported") return {};
  const answers: Record<string, NatureTableExpectedCell> = {};
  Object.entries(analysis.intervalSigns).forEach(([id, value]) => {
    answers[`sign:${id}`] = { type: "sign", value };
    answers[`trend:${id}`] = { type: "trend", value: value === "positive" ? "increasing" : value === "negative" ? "decreasing" : "stationary" };
  });
  analysis.criticalPoints.forEach((point, index) => {
    answers[`sign:critical-${index}`] = { type: "sign", value: "zero" };
    if (point.nature !== "unknown") answers[`nature:critical-${index}`] = { type: "nature", value: point.nature };
    answers[`coordinate:critical-${index}`] = { type: "coordinate", x: point.x, y: point.y };
  });
  return answers;
}

function deriveIntervalSigns(derivative: MathExpression, criticalValues: readonly ExactNumber[]) {
  const bounds = [-Infinity, ...criticalValues.map(exactToNumber), Infinity];
  const signs: Record<string, NatureTableSign> = {};
  for (let index = 0; index < bounds.length - 1; index += 1) {
    const left = bounds[index];
    const right = bounds[index + 1];
    const sample = !Number.isFinite(left) ? right - 1 : !Number.isFinite(right) ? left + 1 : (left + right) / 2;
    const value = evaluateMathExpression(derivative, sample);
    signs[`interval-${index}`] = value.status !== "value" ? "zero" : value.value > 1e-7 ? "positive" : value.value < -1e-7 ? "negative" : "zero";
  }
  return signs;
}

function solveLinearOrQuadraticRoots(expression: MathExpression): ExactNumber[] | null {
  const coefficients = polynomialCoefficients(expression);
  if (!coefficients) return null;
  const [c0 = 0, c1 = 0, c2 = 0] = coefficients;
  if (Math.abs(c2) < 1e-9) {
    if (Math.abs(c1) < 1e-9) return [];
    return [exact(Math.round((-c0 / c1) * 1_000_000), 1_000_000)];
  }
  const discriminant = c1 * c1 - 4 * c2 * c0;
  if (discriminant < -1e-9) return [];
  const sqrt = Math.sqrt(Math.max(0, discriminant));
  return [
    exact(Math.round(((-c1 - sqrt) / (2 * c2)) * 1_000_000), 1_000_000),
    exact(Math.round(((-c1 + sqrt) / (2 * c2)) * 1_000_000), 1_000_000),
  ];
}

function polynomialCoefficients(expression: MathExpression): number[] | null {
  if (expression.type === "constant") return [exactToNumber(expression.value)];
  if (expression.type === "variable") return [0, 1];
  if (expression.type === "add") {
    const total: number[] = [];
    for (const term of expression.terms) {
      const coefficients = polynomialCoefficients(term);
      if (!coefficients) return null;
      coefficients.forEach((value, index) => { total[index] = (total[index] ?? 0) + value; });
    }
    return total;
  }
  if (expression.type === "multiply") {
    let result = [1];
    for (const factor of expression.factors) {
      const coefficients = polynomialCoefficients(factor);
      if (!coefficients) return null;
      result = multiplyPolynomials(result, coefficients);
      if (result.length > 3) return null;
    }
    return result;
  }
  if (expression.type === "power" && expression.base.type === "variable") {
    const exponent = exactToNumber(expression.exponent);
    if (!Number.isInteger(exponent) || exponent < 0 || exponent > 2) return null;
    const coefficients = Array(exponent + 1).fill(0);
    coefficients[exponent] = 1;
    return coefficients;
  }
  return null;
}

function multiplyPolynomials(left: number[], right: number[]) {
  const result = Array(left.length + right.length - 1).fill(0);
  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      result[leftIndex + rightIndex] += leftValue * rightValue;
    });
  });
  return result;
}
