import type { Question } from "../../data/types";
import { higherMathsChainRuleQuestions } from "../../content/questions/higher-maths/chain-rule";

export const PUBLIC_CHAIN_RULE_DEMO_ID = "orthic-public-chain-rule-square-v1";
export const PUBLIC_CHAIN_RULE_SOURCE_ID = "hm-calc-diff-chain-f-003";

const canonicalSource = higherMathsChainRuleQuestions.find(
  (candidate) => candidate.id === PUBLIC_CHAIN_RULE_SOURCE_ID,
);

if (
  !canonicalSource
  || canonicalSource.contentStatus !== "active"
  || canonicalSource.skillPathId !== "chain-rule"
  || canonicalSource.marking.strategy !== "composite_algebraic_equivalence"
) {
  throw new Error("The canonical source for the public Chain Rule demo is unavailable or incompatible.");
}

export const publicChainRuleDemoQuestion: Question = {
  ...canonicalSource,
  id: PUBLIC_CHAIN_RULE_DEMO_ID,
  questionVersion: 1,
  contentRevision: 1,
  questionText: "Differentiate $y=(3x+2)^2$ with respect to $x$.",
  marking: {
    ...canonicalSource.marking,
    target: "6(3x+2)",
    fixtures: {
      correct: [
        { input: "6(3x+2)" },
        { input: "6*(3x+2)" },
        { input: "18x+12" },
      ],
      incorrect: [
        { input: "2(3x+2)", reason: "value_wrong" },
      ],
      malformed: canonicalSource.marking.fixtures.malformed,
      unmarkable: canonicalSource.marking.fixtures.unmarkable,
    },
  },
  correctAnswer: "6(3x+2)",
  acceptedAnswers: ["6(3x+2)", "6*(3x+2)", "18x+12"],
  finalAnswer: "6(3x+2)",
  hint: "Bring down the outside power 2, then multiply by the derivative of $3x+2$.",
  workedSolution: "$$\ny=(3x+2)^2\n$$\nDifferentiate the outside power:\n$$\n2(3x+2).\n$$\nThen multiply by the derivative of the bracket:\n$$\n\\frac{d}{dx}(3x+2)=3.\n$$\nSo\n$$\n\\frac{dy}{dx}=2(3x+2)\\cdot3\n$$\n$$\n\\frac{dy}{dx}=6(3x+2).\n$$",
  commonMistake: "Writing $2(3x+2)$ and forgetting to multiply by 3.",
  source: "Public Orthic demo adapted from canonical Chain Rule Foundations content",
};
