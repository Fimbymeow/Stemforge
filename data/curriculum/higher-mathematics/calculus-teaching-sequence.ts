import { higherMathsCalculusStrandIds } from "@/data/higher-maths";
import type { CanonicalSkillSequence } from "@/lib/curriculum/teaching-sequence";

const AREA_IDS = higherMathsCalculusStrandIds;

const entry = (areaId: string, skillPathId: string, recommendedOrder: number): CanonicalSkillSequence => ({
  courseId: "higher-maths",
  areaId,
  skillPathId,
  recommendedOrder,
});

/**
 * Recommended teaching order, not the prerequisite graph (lib/curriculum/prerequisite-graph.ts
 * stays limited to genuine hard/soft dependencies). Basic Differentiation is taught before
 * Trigonometric Differentiation before Chain Rule — Trigonometric Differentiation is not a
 * prerequisite of Chain Rule, but teaching it first still reads more naturally, exactly the
 * example the brief itself gives. No entry here changes what a learner is allowed to open.
 *
 * Reconciled against the approved 49-skill migration: 17 entries for 17 final Calculus
 * skills. "nature-of-stationary-points" is gone (merged into "stationary-points");
 * "further-integration" is replaced by its two successors
 * ("integration-composite-power", "trigonometric-integration"); "areas-using-integration"
 * is replaced by its two successors ("area-under-curve", "area-between-curves");
 * "reconstructing-a-function-from-a-rate-and-initial-conditions" is gone (merged into
 * "differential-equations", sequenced alongside the other Integrating Functions skills
 * rather than under Applying Integral Calculus); "mixed-differentiation-practice" is gone
 * (excluded from the canonical map entirely).
 */
export const higherMathematicsCalculusTeachingSequence: CanonicalSkillSequence[] = [
  entry(AREA_IDS.differentiatingFunctions, "basic-differentiation", 1),
  entry(AREA_IDS.differentiatingFunctions, "trigonometric-differentiation", 2),
  entry(AREA_IDS.differentiatingFunctions, "chain-rule", 3),

  entry(AREA_IDS.investigatingFunctions, "tangents-and-normals", 1),
  entry(AREA_IDS.investigatingFunctions, "increasing-and-decreasing-functions", 2),
  entry(AREA_IDS.investigatingFunctions, "stationary-points", 3),
  entry(AREA_IDS.investigatingFunctions, "graph-sketching-using-calculus", 4),

  entry(AREA_IDS.integratingFunctions, "basic-integration", 1),
  entry(AREA_IDS.integratingFunctions, "integration-composite-power", 2),
  entry(AREA_IDS.integratingFunctions, "trigonometric-integration", 3),
  entry(AREA_IDS.integratingFunctions, "differential-equations", 4),

  entry(AREA_IDS.definiteIntegrals, "definite-integrals", 1),

  entry(AREA_IDS.applyingDifferentialCalculus, "greatest-and-least-values-on-closed-intervals", 1),
  entry(AREA_IDS.applyingDifferentialCalculus, "optimisation", 2),
  entry(AREA_IDS.applyingDifferentialCalculus, "rates-of-change", 3),

  entry(AREA_IDS.applyingIntegralCalculus, "area-under-curve", 1),
  entry(AREA_IDS.applyingIntegralCalculus, "area-between-curves", 2),
];
