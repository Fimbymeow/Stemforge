import { higherMathsChainRuleQuestions } from "../../content/questions/higher-maths/chain-rule";

export const PUBLIC_CHAIN_RULE_SOURCE_ID = "hm-calc-diff-chain-f-003";
export const PUBLIC_CHAIN_RULE_DEMO_ID = PUBLIC_CHAIN_RULE_SOURCE_ID;

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

// The public demo deliberately reuses the canonical question object unchanged.
// Its learner-facing context is Practice; the legacy stage fields remain provenance only.
export const publicChainRuleDemoQuestion = canonicalSource;
