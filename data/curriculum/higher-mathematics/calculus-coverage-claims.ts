import type { SpecificationCoverageClaim } from "@/lib/curriculum/specification-mapping";

/**
 * Twenty-one claims off nineteen verified specification points. Two live skills
 * ("further-integration", "areas-using-integration") still bundle multiple official
 * statements under one skill path — reported as a mismatch (see calculus-skill-map.ts),
 * not resolved here, since no live registry data changes in this pass.
 *
 * hm-calc-stationary-nature-sketching is one compound official statement covering three
 * distinct abilities (finding stationary points, classifying their nature, sketching the
 * curve) — split into three claims here, per "if an official specification point contains
 * several distinct abilities, split it into several explicit internal coverage claims."
 * The split happens at the claim level only; the underlying specification point stays one
 * verified statement with one verbatim officialStatement.
 */

const claim = (
  claimId: string,
  specPointId: string,
  summary: string,
  primarySkillId: string,
  reinforcedBySkillIds: string[] = [],
): SpecificationCoverageClaim => ({ claimId, specPointId, summary, primarySkillId, reinforcedBySkillIds, status: "active" });

export const higherMathematicsCalculusCoverageClaims: SpecificationCoverageClaim[] = [
  claim("claim-diff-power-rule", "hm-calc-diff-power-rule", "Basic Differentiation teaches the power rule and evaluating the derivative.", "basic-differentiation"),
  claim("claim-diff-trig", "hm-calc-diff-trig", "Trigonometric Differentiation teaches differentiating k sin x and k cos x.", "trigonometric-differentiation"),
  claim("claim-diff-chain-rule", "hm-calc-diff-chain-rule", "Chain Rule teaches differentiating composite functions.", "chain-rule"),

  claim("claim-tangent", "hm-calc-tangent", "Tangents (currently the live skill \"tangents-and-normals\") teaches finding a tangent line equation from a derivative.", "tangents-and-normals", ["basic-differentiation"]),
  claim("claim-increasing-decreasing", "hm-calc-increasing-decreasing", "Increasing and Decreasing Functions teaches determining monotonic intervals.", "increasing-and-decreasing-functions", ["basic-differentiation"]),

  claim("claim-stationary-find", "hm-calc-stationary-nature-sketching", "Covers the \"determining stationary points\" component of the compound official statement.", "stationary-points", ["basic-differentiation"]),
  claim("claim-stationary-nature", "hm-calc-stationary-nature-sketching", "Covers the \"determining their nature\" component of the compound official statement.", "nature-of-stationary-points", ["stationary-points"]),
  claim("claim-curve-sketching", "hm-calc-stationary-nature-sketching", "Covers the \"sketching the graph...axis intersections...end behaviour\" component of the compound official statement.", "graph-sketching-using-calculus", ["stationary-points", "nature-of-stationary-points"]),

  claim("claim-integration-power", "hm-calc-integration-power", "Basic Integration teaches anti-derivatives of powers of x.", "basic-integration"),
  claim("claim-integration-linear-power-unit", "hm-calc-integration-linear-power-unit", "Further Integration currently covers (x+q)^n, bundled with three other official statements in the live registry.", "further-integration", ["basic-integration"]),
  claim("claim-integration-trig-simple", "hm-calc-integration-trig-simple", "Further Integration currently covers p cos x / p sin x, bundled with three other official statements in the live registry.", "further-integration"),
  claim("claim-integration-linear-power-scaled", "hm-calc-integration-linear-power-scaled", "Further Integration currently covers (px+q)^n, bundled with three other official statements in the live registry.", "further-integration", ["basic-integration"]),
  claim("claim-integration-trig-composite", "hm-calc-integration-trig-composite", "Further Integration currently covers p cos(qx+r) / p sin(qx+r), bundled with three other official statements in the live registry.", "further-integration"),
  claim("claim-differential-equations", "hm-calc-differential-equations", "Differential Equations teaches solving dy/dx = f(x) by integration.", "differential-equations", ["basic-integration"]),

  claim("claim-definite-integrals", "hm-calc-definite-integrals", "Definite Integrals teaches evaluating a definite integral using exact limits.", "definite-integrals", ["basic-integration", "further-integration"]),

  claim("claim-optimisation", "hm-calc-optimisation", "Optimisation teaches using differentiation to solve contextual maximum/minimum problems.", "optimisation", ["stationary-points", "nature-of-stationary-points"]),
  claim("claim-closed-interval-extrema", "hm-calc-closed-interval-extrema", "Greatest and Least Values on Closed Intervals teaches finding extrema on a closed interval.", "greatest-and-least-values-on-closed-intervals", ["stationary-points"]),
  claim("claim-rates-of-change", "hm-calc-rates-of-change", "Rates of Change teaches solving contextual rate-of-change problems using differentiation.", "rates-of-change", ["basic-differentiation"]),

  claim("claim-area-under-curve", "hm-calc-area-under-curve", "Areas Using Integration currently covers area between a curve and the axis, bundled with area-between-curves in the live registry.", "areas-using-integration", ["definite-integrals"]),
  claim("claim-area-between-curves", "hm-calc-area-between-curves", "Areas Using Integration currently covers area between curves, bundled with area-under-curve in the live registry.", "areas-using-integration"),
  claim("claim-reconstruct-function", "hm-calc-reconstruct-function", "Recovering a Function from a Rate of Change teaches reconstructing a function from a rate and an initial condition.", "reconstructing-a-function-from-a-rate-and-initial-conditions", ["differential-equations"]),
];
