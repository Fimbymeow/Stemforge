import type { SpecificationCoverageClaim } from "@/lib/curriculum/specification-mapping";

/**
 * Twenty-one claims off nineteen verified specification points — unchanged by the 51 -> 49
 * canonical-skill migration. Specification points and coverage claims are distinct from
 * canonical skills: merging or splitting a canonical skill does not, by itself, require
 * merging or splitting the claims that reference it. Where a merge absorbed a skill whose
 * identity no longer exists, the affected claim is repointed to the surviving skill instead
 * of being deleted, since it still represents a genuine, distinct specification assertion.
 *
 * hm-calc-stationary-nature-sketching is one compound official statement covering three
 * distinct abilities (finding stationary points, classifying their nature, sketching the
 * curve) — still split into three claims here, per "if an official specification point
 * contains several distinct abilities, split it into several explicit internal coverage
 * claims." Two of those three claims (claim-stationary-find, claim-stationary-nature) now
 * share the same primarySkillId ("stationary-points"), since the canonical map merged
 * "Stationary Points" and "Nature of Stationary Points" into one surviving identity,
 * "Stationary Points and Their Nature" — they remain two claims, not one, because they
 * record two distinct official abilities, not a duplicate assertion. (See
 * lib/curriculum/specification-mapping.ts for the corresponding validator change this
 * required.) claim-curve-sketching stays mapped separately to
 * "graph-sketching-using-calculus", per "Curve Sketching Using Calculus remains separate."
 *
 * The four integration claims that used to bundle under the single live "further-integration"
 * skill now split across its two successor identities, matching the specification's own
 * finer granularity: claim-integration-linear-power-unit and
 * claim-integration-linear-power-scaled map to "integration-composite-power";
 * claim-integration-trig-simple and claim-integration-trig-composite map to
 * "trigonometric-integration". The two area claims that used to bundle under
 * "areas-using-integration" now map to its two successor identities,
 * "area-under-curve" and "area-between-curves", each already a distinct official bullet.
 * claim-reconstruct-function is repointed from the retired placeholder identity
 * "reconstructing-a-function-from-a-rate-and-initial-conditions" to the surviving
 * "differential-equations" skill it was merged into.
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

  claim("claim-tangent", "hm-calc-tangent", "Tangents teaches finding a tangent line equation from a derivative.", "tangents-and-normals", ["basic-differentiation"]),
  claim("claim-increasing-decreasing", "hm-calc-increasing-decreasing", "Increasing and Decreasing Functions teaches determining monotonic intervals.", "increasing-and-decreasing-functions", ["basic-differentiation"]),

  claim("claim-stationary-find", "hm-calc-stationary-nature-sketching", "Covers the \"determining stationary points\" component of the compound official statement.", "stationary-points", ["basic-differentiation"]),
  claim("claim-stationary-nature", "hm-calc-stationary-nature-sketching", "Covers the \"determining their nature\" component of the compound official statement — now mapped to the same surviving \"Stationary Points and Their Nature\" skill as claim-stationary-find, since the two canonical skills merged.", "stationary-points"),
  claim("claim-curve-sketching", "hm-calc-stationary-nature-sketching", "Covers the \"sketching the graph...axis intersections...end behaviour\" component of the compound official statement.", "graph-sketching-using-calculus", ["stationary-points"]),

  claim("claim-integration-power", "hm-calc-integration-power", "Basic Integration teaches anti-derivatives of powers of x.", "basic-integration"),
  claim("claim-integration-linear-power-unit", "hm-calc-integration-linear-power-unit", "Integration of Bracket Powers covers (x+q)^n.", "integration-composite-power", ["basic-integration"]),
  claim("claim-integration-trig-simple", "hm-calc-integration-trig-simple", "Trigonometric Integration covers p cos x / p sin x.", "trigonometric-integration"),
  claim("claim-integration-linear-power-scaled", "hm-calc-integration-linear-power-scaled", "Integration of Bracket Powers covers (px+q)^n.", "integration-composite-power", ["basic-integration"]),
  claim("claim-integration-trig-composite", "hm-calc-integration-trig-composite", "Trigonometric Integration covers p cos(qx+r) / p sin(qx+r).", "trigonometric-integration"),
  claim("claim-differential-equations", "hm-calc-differential-equations", "Differential Equations teaches solving dy/dx = f(x) by integration.", "differential-equations", ["basic-integration"]),

  claim("claim-definite-integrals", "hm-calc-definite-integrals", "Definite Integrals teaches evaluating a definite integral using exact limits.", "definite-integrals", ["basic-integration", "integration-composite-power", "trigonometric-integration"]),

  claim("claim-optimisation", "hm-calc-optimisation", "Optimisation teaches using differentiation to solve contextual maximum/minimum problems.", "optimisation", ["stationary-points"]),
  claim("claim-closed-interval-extrema", "hm-calc-closed-interval-extrema", "Greatest and Least Values on Closed Intervals teaches finding extrema on a closed interval.", "greatest-and-least-values-on-closed-intervals", ["stationary-points"]),
  claim("claim-rates-of-change", "hm-calc-rates-of-change", "Rates of Change teaches solving contextual rate-of-change problems using differentiation.", "rates-of-change", ["basic-differentiation"]),

  claim("claim-area-under-curve", "hm-calc-area-under-curve", "Area Between a Curve and the Axis teaches finding area between a curve and the x-axis.", "area-under-curve", ["definite-integrals"]),
  claim("claim-area-between-curves", "hm-calc-area-between-curves", "Area Between Curves or a Line and a Curve teaches finding area between a line and a curve, or between two curves.", "area-between-curves", ["definite-integrals"]),
  claim("claim-reconstruct-function", "hm-calc-reconstruct-function", "Differential Equations teaches reconstructing a function from a rate and an initial condition, absorbing the retired \"Recovering a Function from a Rate of Change\" skill.", "differential-equations"),
];
