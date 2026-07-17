export type ExactNumber = {
  numerator: number;
  denominator?: number;
};

export type MathExpression =
  | { type: "constant"; value: ExactNumber }
  | { type: "variable"; name: "x" }
  | { type: "add"; terms: MathExpression[] }
  | { type: "multiply"; factors: MathExpression[] }
  | { type: "power"; base: MathExpression; exponent: ExactNumber }
  | { type: "sin"; argument: MathExpression }
  | { type: "cos"; argument: MathExpression }
  | { type: "tan"; argument: MathExpression }
  | { type: "exp"; argument: MathExpression }
  | { type: "log"; argument: MathExpression };

export type ExpressionEvaluationResult =
  | { status: "value"; value: number }
  | { status: "domain_error"; reasonCode: string };

export type ExpressionValidationResult =
  | { status: "valid"; nodeCount: number; depth: number }
  | { status: "invalid"; reasonCode: string };

export type DerivativeResult =
  | { status: "supported"; expression: MathExpression; simplifiedExpression: MathExpression }
  | { status: "unsupported"; reasonCode: string };

export type GraphViewport = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xStep?: number;
  yStep?: number;
};

export type GraphFunctionDefinition = {
  id: string;
  expression: MathExpression;
  label?: string;
  styleRole: "primary" | "secondary" | "derivative" | "construction" | "answer";
};

export type GraphPoint = {
  x: ExactNumber;
  y: ExactNumber;
  label?: string;
};

export type GraphTransformation =
  | { type: "translateX"; value: ExactNumber }
  | { type: "translateY"; value: ExactNumber }
  | { type: "scaleX"; factor: ExactNumber }
  | { type: "scaleY"; factor: ExactNumber }
  | { type: "reflectX" }
  | { type: "reflectY" };

export type SampledPoint = { x: number; y: number };
export type SampledSegment = SampledPoint[];

export type NatureTableSign = "positive" | "zero" | "negative";
export type NatureTableTrend = "increasing" | "decreasing" | "stationary";
export type NatureTableNature = "maximum" | "minimum" | "stationary_inflection";

export type NatureTableExpectedCell =
  | { type: "sign"; value: NatureTableSign }
  | { type: "trend"; value: NatureTableTrend }
  | { type: "nature"; value: NatureTableNature }
  | { type: "coordinate"; x: ExactNumber; y: ExactNumber };

export type NatureTableRowConfig = {
  id: string;
  label: string;
  kind: NatureTableExpectedCell["type"];
};

export type NatureTableConfig = {
  id: string;
  criticalValues: ExactNumber[];
  rows: NatureTableRowConfig[];
  expectedAnswers: Record<string, NatureTableExpectedCell>;
};

export type StructuredGraphAnswer =
  | { type: "point-placement"; points: Array<{ id: string; x: number; y: number }> }
  | { type: "interval-signs"; intervals: Record<string, NatureTableSign> }
  | { type: "candidate-match"; selectedId: string }
  | { type: "transformation-sequence"; transformations: GraphTransformation[] }
  | { type: "nature-table"; cells: Record<string, NatureTableExpectedCell> };
