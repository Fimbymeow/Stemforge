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
 *
 * trigonometric-differentiation -> basic-differentiation stays HARD (not softened): Basic
 * Differentiation establishes derivative notation, gradient language, evaluation and the
 * general differentiation workflow that Trigonometric Differentiation builds on. This is a
 * deliberate pedagogical prerequisite, not a route lock — the architecture keeps
 * prerequisites and learner navigation access separate.
 *
 * Six edges were added by the 51 -> 49 canonical-skill migration, matching the approved
 * final map: graph-sketching-using-calculus and differential-equations each gained a new
 * hard dependency (on stationary-points and basic-integration respectively), and the four
 * skills that succeeded the "further-integration" / "areas-using-integration" splits each
 * gained a hard dependency on the foundational skill their half of the split builds on.
 * area-between-curves's dependency on intersections-of-lines-and-curves is deliberately
 * NOT modelled here as a graph edge — only some Area Between Curves questions require
 * solving an intersection first, so it is question-level metadata
 * (QuestionCurriculumMetadata.requiredSkillIds on the specific questions that need it, once
 * authored), not a universal hard or soft skill-level dependency.
 */
export const higherMathematicsCalculusPrerequisites: PrerequisiteRelationship[] = [
  { relationshipId: "chain-rule-requires-basic-differentiation", skillPathId: "chain-rule", requiresSkillPathId: "basic-differentiation", strength: "hard" },
  { relationshipId: "trigonometric-differentiation-requires-basic-differentiation", skillPathId: "trigonometric-differentiation", requiresSkillPathId: "basic-differentiation", strength: "hard" },
  { relationshipId: "stationary-points-requires-basic-differentiation", skillPathId: "stationary-points", requiresSkillPathId: "basic-differentiation", strength: "hard" },
  { relationshipId: "graph-sketching-using-calculus-requires-stationary-points", skillPathId: "graph-sketching-using-calculus", requiresSkillPathId: "stationary-points", strength: "hard" },
  { relationshipId: "differential-equations-requires-basic-integration", skillPathId: "differential-equations", requiresSkillPathId: "basic-integration", strength: "hard" },
  { relationshipId: "integration-composite-power-requires-basic-integration", skillPathId: "integration-composite-power", requiresSkillPathId: "basic-integration", strength: "hard" },
  { relationshipId: "trigonometric-integration-requires-basic-integration", skillPathId: "trigonometric-integration", requiresSkillPathId: "basic-integration", strength: "hard" },
  { relationshipId: "area-under-curve-requires-definite-integrals", skillPathId: "area-under-curve", requiresSkillPathId: "definite-integrals", strength: "hard" },
  { relationshipId: "area-between-curves-requires-definite-integrals", skillPathId: "area-between-curves", requiresSkillPathId: "definite-integrals", strength: "hard" },
];
