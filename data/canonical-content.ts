import { higherMathsDifferentiationQuestions } from "@/content/questions/higher-maths/differentiation";
import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";
import type { Question, Subject } from "@/data/types";

export type CanonicalContentSource = {
  subjects: readonly Subject[];
  questions: readonly Question[];
};

/**
 * The one production registry for the canonical learner runtime. Higher Physics
 * remains subject navigation data plus its separate legacy question registry.
 */
export const canonicalContent: CanonicalContentSource = {
  subjects: [higherMaths, higherPhysics],
  questions: higherMathsDifferentiationQuestions,
};
