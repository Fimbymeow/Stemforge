import type { Question } from "@/data/types";
import type { QuestionMarkingContract } from "@/lib/marking/types";

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
});

export function getMathInputCapabilities(marking: QuestionMarkingContract): MathInputCapabilities {
  return ALGEBRAIC_REGISTRY[`${marking.strategy}@${marking.strategyVersion}`] ?? NONE;
}

export function deriveMathInputCapabilities(question: Pick<Question, "marking">): MathInputCapabilities {
  return getMathInputCapabilities(question.marking);
}

function profile(overrides: Partial<Omit<MathInputCapabilities, "version">>): MathInputCapabilities {
  return Object.freeze({ ...NONE, ...overrides, version: MATH_INPUT_CAPABILITY_VERSION });
}
