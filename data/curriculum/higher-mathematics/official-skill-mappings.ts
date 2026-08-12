import type { CanonicalSkillSpecificationMapping } from "@/lib/curriculum/official-skill-mapping";

const mapping = (
  skillPathId: string,
  primarySpecPointId: string,
  additionalSpecPointIds: string[] = [],
): CanonicalSkillSpecificationMapping => ({
  skillPathId,
  primarySpecPointId,
  officialSpecificationPointIds: [primarySpecPointId, ...additionalSpecPointIds],
});

/**
 * Whole-course bridge between the 49 Orthic teaching skills and the official
 * Higher Mathematics requirements. Official wording remains in specification-register.ts;
 * this file contains stable identities only.
 */
export const higherMathematicsOfficialSkillMappings: CanonicalSkillSpecificationMapping[] = [
  mapping("factorising-cubics-and-quartics", "hm-alg-factorising-polynomials"),
  mapping("laws-of-logarithms-and-exponents", "hm-alg-log-exponent-laws-numerical"),
  mapping("polynomial-equations", "hm-alg-polynomial-equations"),
  mapping("discriminant-and-nature-of-roots", "hm-alg-discriminant-unknown"),
  mapping("quadratic-inequalities", "hm-alg-quadratic-inequalities"),
  mapping("completing-the-square-non-unit-leading-coefficient", "hm-alg-completing-square-non-unit"),
  mapping("logarithmic-and-exponential-equations", "hm-alg-log-exp-equations", ["hm-alg-log-exponent-laws-equations"]),
  mapping("logarithmic-and-exponential-modelling", "hm-alg-log-exp-modelling", ["hm-alg-log-exp-parameters", "hm-alg-log-exp-linearisation"]),
  mapping("graph-transformations", "hm-func-graph-transformations"),
  mapping("sketching-derivative-graphs", "hm-func-derivative-graph"),
  mapping("composite-functions", "hm-func-composite", ["hm-func-domain-range"]),
  mapping("inverse-functions-domain-and-range", "hm-func-inverse", ["hm-func-domain-range", "hm-func-inverse-log-exp-graph"]),
  mapping("addition-and-double-angle-formulae", "hm-trig-addition-double-angle"),
  mapping("trigonometric-identities", "hm-trig-identities"),
  mapping("wave-function-form", "hm-trig-wave-function"),
  mapping("solving-trigonometric-equations", "hm-trig-solving-equations"),
  mapping("intersections-of-lines-and-curves", "hm-alg-line-curve-intersections"),

  mapping("vector-pathways-and-resultants-in-three-dimensions", "hm-vector-resultant-pathways"),
  mapping("collinearity", "hm-vector-collinearity"),
  mapping("internal-division-of-a-line", "hm-vector-internal-division"),
  mapping("unit-vectors-and-ijk-basis", "hm-vector-unit-ijk"),
  mapping("scalar-product-and-angle-between-vectors", "hm-vector-scalar-product-angle"),
  mapping("scalar-product-properties-and-perpendicularity", "hm-vector-scalar-product-properties"),

  mapping("basic-differentiation", "hm-calc-diff-power-rule"),
  mapping("trigonometric-differentiation", "hm-calc-diff-trig"),
  mapping("chain-rule", "hm-calc-diff-chain-rule"),
  mapping("tangents-and-normals", "hm-calc-tangent"),
  mapping("increasing-and-decreasing-functions", "hm-calc-increasing-decreasing"),
  mapping("stationary-points", "hm-calc-stationary-nature-sketching"),
  mapping("graph-sketching-using-calculus", "hm-calc-stationary-nature-sketching"),
  mapping("basic-integration", "hm-calc-integration-power"),
  mapping("integration-composite-power", "hm-calc-integration-linear-power-unit", ["hm-calc-integration-linear-power-scaled"]),
  mapping("trigonometric-integration", "hm-calc-integration-trig-simple", ["hm-calc-integration-trig-composite"]),
  mapping("differential-equations", "hm-calc-differential-equations", ["hm-calc-reconstruct-function"]),
  mapping("definite-integrals", "hm-calc-definite-integrals"),
  mapping("optimisation", "hm-calc-optimisation", ["hm-reason-select-strategy", "hm-reason-explain-solution"]),
  mapping("greatest-and-least-values-on-closed-intervals", "hm-calc-closed-interval-extrema"),
  mapping("rates-of-change", "hm-calc-rates-of-change", ["hm-reason-select-strategy", "hm-reason-explain-solution"]),
  mapping("area-under-curve", "hm-calc-area-under-curve", ["hm-reason-select-strategy", "hm-reason-explain-solution"]),
  mapping("area-between-curves", "hm-calc-area-between-curves", ["hm-reason-select-strategy", "hm-reason-explain-solution"]),

  mapping("parallel-and-perpendicular-lines", "hm-geom-parallel-perpendicular-lines", ["hm-geom-lines-perpendicular"]),
  mapping("gradient-and-angle", "hm-geom-gradient-angle"),
  mapping("medians-altitudes-and-perpendicular-bisectors", "hm-geom-triangle-lines"),
  mapping("equation-of-a-circle", "hm-geom-circle-equation"),
  mapping("tangency-to-a-circle", "hm-geom-circle-tangency"),
  mapping("line-circle-intersections", "hm-geom-circle-intersections"),
  mapping("circle-circle-intersections", "hm-geom-circle-intersections"),
  mapping("recurrence-relations", "hm-seq-recurrence"),
  mapping("limits-of-sequences", "hm-seq-limit"),
];
