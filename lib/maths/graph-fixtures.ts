import type { GraphQuestionConfig } from "@/data/types";
import { add, constant, exact, multiply, power, xExpression } from "@/lib/maths/expression-core";

const acceptanceCurve = add(power(xExpression, 2), multiply(constant(-2), xExpression), constant(3));

export const integrationAcceptanceGraph: GraphQuestionConfig = {
  version: 1,
  title: "Area under a quadratic curve",
  description: "The region between y = x² − 2x + 3 and the x-axis from x = 2 to x = 4 is shaded.",
  viewport: { xMin: 0, xMax: 4.5, yMin: -1, yMax: 13 },
  axes: { xLabel: "x", yLabel: "y", xTicks: [1, 2, 4], yTicks: [0, 2, 3, 11], grid: "none" },
  functions: [{ id: "f", expression: acceptanceCurve, label: "y = x² − 2x + 3", labelAtX: 3.65, labelPlacement: "above", styleRole: "primary" }],
  boundaries: [
    { id: "lower-bound", axis: "x", value: 2, label: "x = 2", style: "dashed", labelPlacement: "right" },
    { id: "upper-bound", axis: "x", value: 4, label: "x = 4", style: "dashed", labelPlacement: "left" },
  ],
  regions: [{ id: "area", type: "curve-to-constant", curveId: "f", fromX: 2, toX: 4, baseline: 0, description: "Shaded area under the curve from x equals 2 to x equals 4." }],
  keyPoints: [
    { id: "value-one", x: exact(1), y: exact(2), label: "(1, 2)", labelPlacement: "above" },
    { id: "value-two", x: exact(2), y: exact(3), label: "(2, 3)", labelPlacement: "left" },
    { id: "value-four", x: exact(4), y: exact(11), label: "(4, 11)", labelPlacement: "left" },
  ],
};

export const reciprocalGraphFixture: GraphQuestionConfig = {
  version: 1, title: "Reciprocal curve", description: "The two branches approach but never cross either axis.",
  viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, axes: { xLabel: "x", yLabel: "y", xTicks: [-4, -2, 2, 4], yTicks: [-4, -2, 2, 4], grid: "none" },
  functions: [{ id: "reciprocal", expression: power(xExpression, -1), label: "y = 1/x", labelAtX: 2, labelPlacement: "above", styleRole: "primary" }],
};

export const twoCurveGraphFixture: GraphQuestionConfig = {
  version: 1, title: "Region between two curves", description: "The bounded region between two ordered curves is shaded.",
  viewport: { xMin: -2.5, xMax: 2.5, yMin: -1, yMax: 9 }, axes: { xLabel: "x", yLabel: "y", xTicks: [-2, 0, 2], yTicks: [0, 2, 4, 6], grid: "none" },
  functions: [
    { id: "lower", expression: power(xExpression, 2), label: "y = x²", labelAtX: 1.8, labelPlacement: "below", styleRole: "primary" },
    { id: "upper", expression: add(power(xExpression, 2), constant(2)), label: "y = x² + 2", labelAtX: 1.8, labelPlacement: "above", styleRole: "secondary" },
  ],
  regions: [{ id: "between", type: "between-curves", curveAId: "upper", curveBId: "lower", fromX: -2, toX: 2, description: "Shaded region between y equals x squared plus 2 and y equals x squared." }],
};

export const negativeCoordinateGraphFixture: GraphQuestionConfig = {
  version: 1, title: "Negative coordinates", description: "A straight line shown across all four quadrants.",
  viewport: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 }, axes: { xLabel: "x", yLabel: "y", xTicks: [-3, -1, 1, 3], yTicks: [-3, -1, 1, 3], grid: "selected" },
  functions: [{ id: "line", expression: xExpression, label: "y = x", labelAtX: 2.5, labelPlacement: "above", styleRole: "primary" }],
  keyPoints: [{ id: "negative-point", x: exact(-2), y: exact(-2), label: "(−2, −2)", labelPlacement: "above" }],
};

export const graphVisualFixtures = [integrationAcceptanceGraph, reciprocalGraphFixture, twoCurveGraphFixture, negativeCoordinateGraphFixture] as const;
