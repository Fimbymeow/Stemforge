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
 */
export const higherMathematicsCalculusTeachingSequence: CanonicalSkillSequence[] = [
  entry(AREA_IDS.differentiatingFunctions, "basic-differentiation", 1),
  entry(AREA_IDS.differentiatingFunctions, "trigonometric-differentiation", 2),
  entry(AREA_IDS.differentiatingFunctions, "chain-rule", 3),

  entry(AREA_IDS.investigatingFunctions, "tangents-and-normals", 1),
  entry(AREA_IDS.investigatingFunctions, "increasing-and-decreasing-functions", 2),
  entry(AREA_IDS.investigatingFunctions, "stationary-points", 3),
  entry(AREA_IDS.investigatingFunctions, "nature-of-stationary-points", 4),
  entry(AREA_IDS.investigatingFunctions, "graph-sketching-using-calculus", 5),

  entry(AREA_IDS.integratingFunctions, "basic-integration", 1),
  entry(AREA_IDS.integratingFunctions, "further-integration", 2),
  entry(AREA_IDS.integratingFunctions, "differential-equations", 3),

  entry(AREA_IDS.definiteIntegrals, "definite-integrals", 1),

  entry(AREA_IDS.applyingDifferentialCalculus, "greatest-and-least-values-on-closed-intervals", 1),
  entry(AREA_IDS.applyingDifferentialCalculus, "optimisation", 2),
  entry(AREA_IDS.applyingDifferentialCalculus, "rates-of-change", 3),

  // "areas-using-integration" still bundles both official area statements (§ skill-map) —
  // referencing the one live skillPathId, not the two not-yet-split proposed names, keeps
  // every entry in this file pointing at a skill that actually exists today.
  entry(AREA_IDS.applyingIntegralCalculus, "areas-using-integration", 1),
  entry(AREA_IDS.applyingIntegralCalculus, "reconstructing-a-function-from-a-rate-and-initial-conditions", 2),
];
