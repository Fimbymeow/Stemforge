import type { Question } from "@/data/types";
import type { ElementaryConstant, ElementaryFunction, QuestionMarkingContract } from "@/lib/marking/types";

export const MATH_INPUT_CAPABILITY_VERSION = 1 as const;

export type MathInputCapabilities = {
  version: typeof MATH_INPUT_CAPABILITY_VERSION;
  variable: boolean;
  numericLiterals: boolean;
  additionSubtraction: boolean;
  multiplication: boolean;
  brackets: boolean;
  nonNegativeIntegerPowers: boolean;
  negativeIntegerPowers: boolean;
  halfPowers: boolean;
  numericFractions: boolean;
  boundedReciprocalPowers: boolean;
  boundedReciprocalSquareRoots: boolean;
  directSquareRoots: boolean;
  elementaryFractions: boolean;
  exponentialPowers: boolean;
  allowedFunctions: readonly ElementaryFunction[];
  allowedConstants: readonly ElementaryConstant[];
  allowedLogBases: readonly number[];
  maximumFunctionDepth: number;
  maximumNonNegativeExponent: number;
  maximumNegativeExponent: number;
};

const NONE: MathInputCapabilities = Object.freeze({
  version: MATH_INPUT_CAPABILITY_VERSION,
  variable: false,
  numericLiterals: false,
  additionSubtraction: false,
  multiplication: false,
  brackets: false,
  nonNegativeIntegerPowers: false,
  negativeIntegerPowers: false,
  halfPowers: false,
  numericFractions: false,
  boundedReciprocalPowers: false,
  boundedReciprocalSquareRoots: false,
  directSquareRoots: false,
  elementaryFractions: false,
  exponentialPowers: false,
  allowedFunctions: Object.freeze([]),
  allowedConstants: Object.freeze([]),
  allowedLogBases: Object.freeze([]),
  maximumFunctionDepth: 0,
  maximumNonNegativeExponent: 0,
  maximumNegativeExponent: 0,
});

const ALGEBRAIC_REGISTRY: Readonly<Record<string, MathInputCapabilities>> = Object.freeze({
  "polynomial_form@1": profile({
    variable: true,
    numericLiterals: true,
    additionSubtraction: true,
    multiplication: true,
    nonNegativeIntegerPowers: true,
    numericFractions: true,
    maximumNonNegativeExponent: 100,
  }),
  "composite_algebraic_equivalence@1": profile({
    variable: true,
    numericLiterals: true,
    additionSubtraction: true,
    multiplication: true,
    brackets: true,
    nonNegativeIntegerPowers: true,
    numericFractions: true,
    maximumNonNegativeExponent: 12,
  }),
  "composite_algebraic_equivalence@2": profile({
    variable: true,
    numericLiterals: true,
    additionSubtraction: true,
    multiplication: true,
    brackets: true,
    nonNegativeIntegerPowers: true,
    negativeIntegerPowers: true,
    halfPowers: true,
    numericFractions: true,
    boundedReciprocalPowers: true,
    boundedReciprocalSquareRoots: true,
    maximumNonNegativeExponent: 12,
    maximumNegativeExponent: 12,
  }),
  "elementary_expression_equivalence@1": profile({
    variable: true,
    numericLiterals: true,
    additionSubtraction: true,
    multiplication: true,
    brackets: true,
    nonNegativeIntegerPowers: true,
    negativeIntegerPowers: true,
    halfPowers: true,
    numericFractions: true,
    directSquareRoots: true,
    elementaryFractions: true,
    exponentialPowers: true,
    allowedFunctions: ["sin", "cos", "tan", "ln", "log"],
    allowedConstants: ["pi", "e"],
    allowedLogBases: [2, 10],
    maximumFunctionDepth: 2,
    maximumNonNegativeExponent: 12,
    maximumNegativeExponent: 12,
  }),
});

export function getMathInputCapabilities(marking: QuestionMarkingContract): MathInputCapabilities {
  const maximum = ALGEBRAIC_REGISTRY[`${marking.strategy}@${marking.strategyVersion}`] ?? NONE;
  if (marking.strategy !== "elementary_expression_equivalence") return maximum;
  return Object.freeze({
    ...maximum,
    allowedFunctions: Object.freeze(maximum.allowedFunctions.filter((name) => marking.allowedFunctions.includes(name))),
    allowedConstants: Object.freeze(maximum.allowedConstants.filter((name) => marking.allowedConstants.includes(name))),
    allowedLogBases: Object.freeze(maximum.allowedLogBases.filter((base) => marking.allowedLogBases?.includes(base))),
  });
}

export function deriveMathInputCapabilities(question: Pick<Question, "marking">): MathInputCapabilities {
  return getMathInputCapabilities(question.marking);
}

function profile(overrides: Partial<Omit<MathInputCapabilities, "version">>): MathInputCapabilities {
  return Object.freeze({ ...NONE, ...overrides, version: MATH_INPUT_CAPABILITY_VERSION });
}
