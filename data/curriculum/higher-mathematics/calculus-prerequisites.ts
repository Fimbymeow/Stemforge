import type { PrerequisiteRelationship } from "@/lib/curriculum/prerequisite-graph";

/**
 * Only genuine, skill-level HARD prerequisites are modelled here. Chain Rule's conditional,
 * question-level dependency on Trigonometric Differentiation is intentionally absent — see
 * the comment on chainRuleContract in calculus-skill-contracts.ts.
 *
 * stationary-points -> basic-differentiation is added in this pass because it is required
 * by basic-differentiation-question-review.ts's fixture metadata (a stationary point cannot
 * be found without differentiating first) — added here specifically to keep that fixture's
 * requiredSkillIds inside its declared prerequisite closure, not as a broader graph
 * expansion. Other similarly-obvious edges (e.g. tangents-and-normals, rates-of-change,
 * each -> basic-differentiation) remain unmodelled and are a natural follow-up, left out to
 * keep this pass narrow, per instruction.
 */
export const higherMathematicsCalculusPrerequisites: PrerequisiteRelationship[] = [
  { relationshipId: "chain-rule-requires-basic-differentiation", skillPathId: "chain-rule", requiresSkillPathId: "basic-differentiation", strength: "hard" },
  { relationshipId: "trigonometric-differentiation-requires-basic-differentiation", skillPathId: "trigonometric-differentiation", requiresSkillPathId: "basic-differentiation", strength: "hard" },
  { relationshipId: "stationary-points-requires-basic-differentiation", skillPathId: "stationary-points", requiresSkillPathId: "basic-differentiation", strength: "hard" },
];
