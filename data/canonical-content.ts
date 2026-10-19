import { higherMathsDifferentiationQuestions } from "@/content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "@/content/questions/higher-maths/chain-rule";
import { higherMathsTangentsAndNormalsQuestions } from "@/content/questions/higher-maths/tangents-and-normals";
import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";
import type { Question, Subject } from "@/data/types";

export type CanonicalContentSource = {
  subjects: readonly Subject[];
  questions: readonly Question[];
};

export type CanonicalQuestionModuleRegistration = {
  skillPathId: string;
  outputPath: `content/questions/higher-maths/${string}.ts`;
  questionsExport: string;
  practiceQuestionIdsExport: string;
  runtimeStatus: "wired" | "registered_for_import";
};

/**
 * Explicit ownership boundary for importer-generated Higher Maths question modules.
 * A registered destination may be created or replaced by the importer; registration
 * alone does not add its questions to the live canonical runtime.
 */
export const canonicalQuestionModuleRegistry = [
  {
    skillPathId: "basic-differentiation",
    outputPath: "content/questions/higher-maths/basic-differentiation.ts",
    questionsExport: "higherMathsDifferentiationQuestions",
    practiceQuestionIdsExport: "basicDifferentiationPracticeQuestionIds",
    runtimeStatus: "wired",
  },
  {
    skillPathId: "chain-rule",
    outputPath: "content/questions/higher-maths/chain-rule.ts",
    questionsExport: "higherMathsChainRuleQuestions",
    practiceQuestionIdsExport: "chainRulePracticeQuestionIds",
    runtimeStatus: "wired",
  },
  {
    skillPathId: "tangents-and-normals",
    outputPath: "content/questions/higher-maths/tangents-and-normals.ts",
    questionsExport: "higherMathsTangentsAndNormalsQuestions",
    practiceQuestionIdsExport: "tangentsAndNormalsPracticeQuestionIds",
    runtimeStatus: "wired",
  },
] as const satisfies readonly CanonicalQuestionModuleRegistration[];

/**
 * The one production registry for the canonical learner runtime. Higher Physics
 * remains subject navigation data plus its separate legacy question registry.
 */
export const canonicalContent: CanonicalContentSource = {
  subjects: [higherMaths, higherPhysics],
  questions: [
    ...higherMathsDifferentiationQuestions,
    ...higherMathsChainRuleQuestions,
    ...higherMathsTangentsAndNormalsQuestions,
  ],
};
