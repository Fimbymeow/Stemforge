export const MARKING_STRATEGIES = [
  "numeric",
  "polynomial_form",
  "composite_algebraic_equivalence",
  "elementary_expression_equivalence",
  "linear_equation_equivalence",
  "coordinate_pair",
  "multipart",
  "closed_vocabulary_text_answer",
  "multiple_choice",
  "guided_self_check",
  "structured_graph",
] as const;

export type MarkingStrategy = (typeof MARKING_STRATEGIES)[number];
export type MarkerOutcomeKind = "graded" | "guided_pending" | "unmarkable" | "malformed" | "internal_error";
export type GradedIncorrectReason = "value_wrong" | "form_wrong" | "precision_wrong" | "unit_wrong";
export type MalformedReason = "malformed_numeric" | "malformed_polynomial" | "malformed_composite_expression" | "malformed_elementary_expression" | "malformed_closed_vocabulary_text" | "malformed_linear_equation" | "malformed_coordinate_pair" | "malformed_multipart" | "malformed_structured";
export type UnmarkableReason = "expression_not_permitted" | "unsupported_mathematical_form";
export type MarkerOutcomeReason = GradedIncorrectReason | MalformedReason | UnmarkableReason;

export type MarkingResult = {
  outcomeKind: MarkerOutcomeKind;
  isCorrect: boolean | null;
  outcomeReason?: MarkerOutcomeReason;
  normalizedStudentAnswer: string;
  matchedAcceptedAnswer?: string;
  strategy: MarkingStrategy;
  strategyVersion: number;
  diagnosticReason?: string;
  partResults?: MarkingPartResult[];
};

export type MarkingPartResult = {
  fieldId: string;
  label: string;
  outcomeKind: MarkerOutcomeKind;
  isCorrect: boolean | null;
  outcomeReason?: MarkerOutcomeReason;
  normalizedStudentAnswer: string;
  strategy: Exclude<MarkingStrategy, "multipart">;
  strategyVersion: number;
};

export type MarkingFixture = { input: string; reason?: MarkerOutcomeReason };
export type MarkingFixtures = {
  correct: MarkingFixture[];
  incorrect: MarkingFixture[];
  malformed: MarkingFixture[];
  unmarkable: MarkingFixture[];
};

export type NumericComparisonPolicy =
  | { type: "exact" }
  | { type: "absolute_tolerance"; amount: string }
  | { type: "relative_tolerance"; amount: string }
  | { type: "decimal_places_rounded"; places: number }
  | { type: "significant_figures_rounded"; figures: number };

export type NumericPresentationPolicy =
  | { type: "integer" }
  | { type: "fraction" }
  | { type: "simplified_fraction" }
  | { type: "decimal" }
  | { type: "percentage" }
  | { type: "decimal_places"; places: number }
  | { type: "significant_figures"; figures: number };

export type NumericMarkingContract = {
  strategy: "numeric";
  strategyVersion: 1;
  target: string;
  comparison: NumericComparisonPolicy;
  presentation?: NumericPresentationPolicy;
  fixtures: MarkingFixtures;
};

export type PolynomialMarkingContract = {
  strategy: "polynomial_form";
  strategyVersion: 1;
  target: string;
  variable: string;
  fixtures: MarkingFixtures;
};

export type CompositeAlgebraicEquivalenceMarkingContract = {
  strategy: "composite_algebraic_equivalence";
  strategyVersion: 1 | 2;
  target: string;
  variable: string;
  fixtures: MarkingFixtures;
};

export const ELEMENTARY_FUNCTIONS = ["sin", "cos", "tan", "ln", "log"] as const;
export const ELEMENTARY_CONSTANTS = ["pi", "e"] as const;
export type ElementaryFunction = (typeof ELEMENTARY_FUNCTIONS)[number];
export type ElementaryConstant = (typeof ELEMENTARY_CONSTANTS)[number];

export type ElementaryExpressionEquivalenceMarkingContract = {
  strategy: "elementary_expression_equivalence";
  strategyVersion: 1;
  target: string;
  variable: "x";
  allowedFunctions: ElementaryFunction[];
  allowedConstants: ElementaryConstant[];
  allowedLogBases?: number[];
  fixtures: MarkingFixtures;
};

export type ClosedVocabularyTextAnswerMarkingContract = {
  strategy: "closed_vocabulary_text_answer";
  strategyVersion: 1;
  target: string;
  acceptedAnswers: string[];
  fixtures: MarkingFixtures;
};

export type MultipleChoiceMarkingContract = {
  strategy: "multiple_choice";
  strategyVersion: 1;
  correctOptionId: string;
  fixtures?: MarkingFixtures;
};

export type GuidedMarkingContract = {
  strategy: "guided_self_check";
  strategyVersion: 1;
};

export type StructuredGraphMarkingContract = {
  strategy: "structured_graph";
  strategyVersion: 1;
};

export type LinearEquationEquivalenceMarkingContract = {
  strategy: "linear_equation_equivalence";
  strategyVersion: 1;
  target: string;
  variables: ["x", "y"];
  fixtures: MarkingFixtures;
};

export type CoordinatePairMarkingContract = {
  strategy: "coordinate_pair";
  strategyVersion: 1;
  target: string;
  fixtures: MarkingFixtures;
};

export type AtomicMarkingContract =
  | NumericMarkingContract
  | PolynomialMarkingContract
  | CompositeAlgebraicEquivalenceMarkingContract
  | ElementaryExpressionEquivalenceMarkingContract
  | LinearEquationEquivalenceMarkingContract
  | CoordinatePairMarkingContract
  | ClosedVocabularyTextAnswerMarkingContract;

export type MultipartFieldMarkingContract = {
  id: string;
  label: string;
  inputType: "numeric" | "algebraic" | "coordinate" | "line_equation" | "text";
  marking: AtomicMarkingContract;
};

export type MultipartMarkingContract = {
  strategy: "multipart";
  strategyVersion: 1;
  fields: MultipartFieldMarkingContract[];
};

export type QuestionMarkingContract =
  | AtomicMarkingContract
  | MultipartMarkingContract
  | MultipleChoiceMarkingContract
  | GuidedMarkingContract
  | StructuredGraphMarkingContract;

export type PersistedMarkerMetadata = {
  outcomeKind?: Exclude<MarkerOutcomeKind, "internal_error">;
  outcomeReason?: MarkerOutcomeReason;
  strategy?: MarkingStrategy;
  strategyVersion?: number;
};

export function hasCompleteMarkerMetadata(value: PersistedMarkerMetadata) {
  return value.outcomeKind !== undefined || value.outcomeReason !== undefined ||
    value.strategy !== undefined || value.strategyVersion !== undefined;
}

export function isLegalPersistedMarkerMetadata(value: PersistedMarkerMetadata) {
  if (!hasCompleteMarkerMetadata(value)) return true;
  if (!value.outcomeKind || !value.strategy) return false;
  const allowedVersions: number[] = value.strategy === "composite_algebraic_equivalence" ? [1, 2] : [1];
  if (value.strategyVersion === undefined || !allowedVersions.includes(value.strategyVersion)) return false;
  if (!MARKING_STRATEGIES.includes(value.strategy)) return false;
  if (value.outcomeKind === "graded") {
    return value.strategy !== "guided_self_check" &&
      (value.outcomeReason === undefined || ["value_wrong", "form_wrong", "precision_wrong", "unit_wrong"].includes(value.outcomeReason));
  }
  if (value.outcomeKind === "guided_pending") return value.strategy === "guided_self_check" && value.outcomeReason === undefined;
  if (value.outcomeKind === "malformed") {
    return (value.strategy === "numeric" && value.outcomeReason === "malformed_numeric") ||
      (value.strategy === "polynomial_form" && value.outcomeReason === "malformed_polynomial") ||
      (value.strategy === "composite_algebraic_equivalence" && value.outcomeReason === "malformed_composite_expression") ||
      (value.strategy === "elementary_expression_equivalence" && value.outcomeReason === "malformed_elementary_expression") ||
      (value.strategy === "linear_equation_equivalence" && value.outcomeReason === "malformed_linear_equation") ||
      (value.strategy === "coordinate_pair" && value.outcomeReason === "malformed_coordinate_pair") ||
      (value.strategy === "multipart" && value.outcomeReason === "malformed_multipart") ||
      (value.strategy === "closed_vocabulary_text_answer" && value.outcomeReason === "malformed_closed_vocabulary_text") ||
      (value.strategy === "structured_graph" && value.outcomeReason === "malformed_structured");
  }
  if (value.outcomeKind === "unmarkable") {
    return (value.strategy === "numeric" && value.outcomeReason === "expression_not_permitted") ||
      (value.strategy === "polynomial_form" && value.outcomeReason === "unsupported_mathematical_form") ||
      (value.strategy === "composite_algebraic_equivalence" && value.outcomeReason === "unsupported_mathematical_form") ||
      (value.strategy === "elementary_expression_equivalence" && value.outcomeReason === "unsupported_mathematical_form") ||
      (value.strategy === "linear_equation_equivalence" && value.outcomeReason === "unsupported_mathematical_form") ||
      (value.strategy === "coordinate_pair" && value.outcomeReason === "unsupported_mathematical_form") ||
      (value.strategy === "multipart" && value.outcomeReason === "unsupported_mathematical_form") ||
      (value.strategy === "closed_vocabulary_text_answer" && value.outcomeReason === "expression_not_permitted");
  }
  return false;
}
