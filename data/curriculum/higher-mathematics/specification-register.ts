import { higherMathsCalculusStrandIds } from "@/data/higher-maths";
import { higherMathsAlgebraTrigonometryStrandIds } from "@/data/higher-maths/algebra-trigonometry";
import { higherMathsLinesCirclesSequencesStrandIds } from "@/data/higher-maths/lines-circles-sequences";
import { higherMathsVectorStrandIds } from "@/data/higher-maths/vectors";
import type { CourseSpecificationRegister, SpecificationArea, VerifiedSpecificationPoint } from "@/lib/curriculum/specification-register";

/**
 * SOURCE-VERIFIED — extracted directly from the downloaded official document, not from
 * this repository's prior taxonomy, Achieve, Clelland, or any AI summary.
 *
 * Publisher:        Scottish Qualifications Authority (SQA)
 * Document title:   "Higher Mathematics" course specification
 * Course code:      C847 76 (course assessment code X847 76), SCQF level 6
 * Edition:          May 2023 (version 3.0)
 * Official course page: https://www.sqa.org.uk/sqa/46501.html
 * Direct PDF URL:   https://www.sqa.org.uk/files_ccc/h-course-spec-mathematics.pdf
 * Retrieved:        2026-08-07, downloaded and read in full (36 PDF pages) for this pass
 *
 * The assessable content is taken from the "Skills, knowledge and understanding for the
 * course assessment" tables on printed pages 5–9. Every officialStatement below is copied
 * from those tables' explanation bullets; authoringSummary values are Orthic-authored
 * paraphrases. Appendix 2 is deliberately not used as a source of assessed requirements.
 *
 * Official table headings map to register areas. The headings are not repeated as
 * specification points; the assessed explanation bullets beneath them are the points.
 */

const AREA_IDS = higherMathsCalculusStrandIds;
const ALGEBRA_IDS = higherMathsAlgebraTrigonometryStrandIds;
const VECTOR_IDS = higherMathsVectorStrandIds;
const GEOMETRY_IDS = higherMathsLinesCirclesSequencesStrandIds;
export const higherMathematicsReasoningAreaIds = {
  selectingStrategy: "reasoning-selecting-strategy",
  explainingSolution: "reasoning-explaining-solution",
} as const;
const DOCUMENT_ID = "sqa-h-course-spec-mathematics-2023-v3";
const SOURCE_SECTION_PREFIX = "Skills, knowledge and understanding for the course assessment";

const areas: SpecificationArea[] = [
  { areaId: ALGEBRA_IDS.manipulatingAlgebraicExpressions, courseId: "higher-maths", title: "Manipulating algebraic expressions", order: 1, status: "active" },
  { areaId: ALGEBRA_IDS.manipulatingTrigonometricExpressions, courseId: "higher-maths", title: "Manipulating trigonometric expressions", order: 2, status: "active" },
  { areaId: ALGEBRA_IDS.identifyingSketchingRelatedFunctions, courseId: "higher-maths", title: "Identifying and sketching related functions", order: 3, status: "active" },
  { areaId: ALGEBRA_IDS.determiningCompositeInverseFunctions, courseId: "higher-maths", title: "Determining composite and inverse functions", order: 4, status: "active" },
  { areaId: ALGEBRA_IDS.solvingAlgebraicEquations, courseId: "higher-maths", title: "Solving algebraic equations", order: 5, status: "active" },
  { areaId: ALGEBRA_IDS.solvingTrigonometricEquations, courseId: "higher-maths", title: "Solving trigonometric equations", order: 6, status: "active" },
  { areaId: VECTOR_IDS.determiningVectorConnections, courseId: "higher-maths", title: "Determining vector connections", order: 7, status: "active" },
  { areaId: VECTOR_IDS.workingWithVectors, courseId: "higher-maths", title: "Working with vectors", order: 8, status: "active" },
  { areaId: AREA_IDS.differentiatingFunctions, courseId: "higher-maths", title: "Differentiating functions", order: 9, status: "active" },
  { areaId: AREA_IDS.investigatingFunctions, courseId: "higher-maths", title: "Using differentiation to investigate the nature and properties of functions", order: 10, status: "active" },
  { areaId: AREA_IDS.integratingFunctions, courseId: "higher-maths", title: "Integrating functions", order: 11, status: "active" },
  { areaId: AREA_IDS.definiteIntegrals, courseId: "higher-maths", title: "Using integration to calculate definite integrals", order: 12, status: "active" },
  { areaId: AREA_IDS.applyingDifferentialCalculus, courseId: "higher-maths", title: "Applying differential calculus", order: 13, status: "active" },
  { areaId: AREA_IDS.applyingIntegralCalculus, courseId: "higher-maths", title: "Applying integral calculus", order: 14, status: "active" },
  { areaId: GEOMETRY_IDS.rectilinearShapes, courseId: "higher-maths", title: "Applying algebraic skills to rectilinear shapes", order: 15, status: "active" },
  { areaId: GEOMETRY_IDS.circlesAndGraphs, courseId: "higher-maths", title: "Applying algebraic skills to circles and graphs", order: 16, status: "active" },
  { areaId: GEOMETRY_IDS.modellingSequences, courseId: "higher-maths", title: "Modelling situations using sequences", order: 17, status: "active" },
  { areaId: higherMathematicsReasoningAreaIds.selectingStrategy, courseId: "higher-maths", title: "Interpreting a situation and identifying a strategy", order: 18, status: "active" },
  { areaId: higherMathematicsReasoningAreaIds.explainingSolution, courseId: "higher-maths", title: "Explaining a solution and relating it to context", order: 19, status: "active" },
];

function verified(
  specPointId: string,
  areaId: string,
  itemLabel: string,
  page: number,
  officialStatement: string,
  authoringSummary: string,
): VerifiedSpecificationPoint {
  return {
    verificationStatus: "verified",
    specPointId,
    courseId: "higher-maths",
    areaId,
    officialReference: {
      documentId: DOCUMENT_ID,
      section: `${SOURCE_SECTION_PREFIX} > ${sourceCategoryForArea(areaId)}`,
      page,
      itemLabel,
    },
    officialStatement,
    authoringSummary,
    mandatory: true,
    status: "active",
  };
}

function sourceCategoryForArea(areaId: string) {
  const algebraAreaIds: readonly string[] = [
    ALGEBRA_IDS.manipulatingAlgebraicExpressions,
    ALGEBRA_IDS.manipulatingTrigonometricExpressions,
    ALGEBRA_IDS.identifyingSketchingRelatedFunctions,
    ALGEBRA_IDS.determiningCompositeInverseFunctions,
    ALGEBRA_IDS.solvingAlgebraicEquations,
    ALGEBRA_IDS.solvingTrigonometricEquations,
  ];
  if (algebraAreaIds.includes(areaId)) return "Algebraic and trigonometric skills";
  const vectorAreaIds: readonly string[] = [VECTOR_IDS.determiningVectorConnections, VECTOR_IDS.workingWithVectors];
  if (vectorAreaIds.includes(areaId)) return "Geometric skills";
  const calculusAreaIds: readonly string[] = [
    AREA_IDS.differentiatingFunctions,
    AREA_IDS.investigatingFunctions,
    AREA_IDS.integratingFunctions,
    AREA_IDS.definiteIntegrals,
    AREA_IDS.applyingDifferentialCalculus,
    AREA_IDS.applyingIntegralCalculus,
  ];
  if (calculusAreaIds.includes(areaId)) return "Calculus skills";
  const algebraicGeometryAreaIds: readonly string[] = [GEOMETRY_IDS.rectilinearShapes, GEOMETRY_IDS.circlesAndGraphs, GEOMETRY_IDS.modellingSequences];
  if (algebraicGeometryAreaIds.includes(areaId)) {
    return "Algebraic and geometric skills";
  }
  const reasoningAreaIds: readonly string[] = [higherMathematicsReasoningAreaIds.selectingStrategy, higherMathematicsReasoningAreaIds.explainingSolution];
  if (reasoningAreaIds.includes(areaId)) {
    return "Reasoning skills";
  }
  throw new Error(`Unknown Higher Mathematics source category for area "${areaId}".`);
}

const points: VerifiedSpecificationPoint[] = [
  // Algebraic and trigonometric skills (pp5-6)
  verified("hm-alg-factorising-polynomials", ALGEBRA_IDS.manipulatingAlgebraicExpressions, "Manipulating algebraic expressions", 5, "factorising a cubic or quartic polynomial expression", "Factorise cubic and quartic polynomial expressions."),
  verified("hm-alg-log-exponent-laws-numerical", ALGEBRA_IDS.manipulatingAlgebraicExpressions, "Manipulating algebraic expressions", 5, "simplifying a numerical expression using the laws of logarithms and exponents", "Use logarithm and exponent laws to simplify numerical expressions."),
  verified("hm-trig-addition-double-angle", ALGEBRA_IDS.manipulatingTrigonometricExpressions, "Manipulating trigonometric expressions", 5, "applying the addition formulae and/or double angle formulae", "Apply addition and double-angle formulae."),
  verified("hm-trig-identities", ALGEBRA_IDS.manipulatingTrigonometricExpressions, "Manipulating trigonometric expressions", 5, "applying trigonometric identities", "Apply the trigonometric identities required by the course."),
  verified("hm-trig-wave-function", ALGEBRA_IDS.manipulatingTrigonometricExpressions, "Manipulating trigonometric expressions", 5, "converting a cos x + b sin x to k cos(x ± α) or k sin(x ± α), k > 0", "Convert a linear combination of sine and cosine to equivalent wave-function form."),
  verified("hm-func-graph-transformations", ALGEBRA_IDS.identifyingSketchingRelatedFunctions, "Identifying and sketching related functions", 5, "identifying a function from a graph, or sketching a function after a transformation of the form kf(x), f(kx), f(x) + k, f(x + k) or a combination of these", "Identify or sketch functions after the listed transformations."),
  verified("hm-func-derivative-graph", ALGEBRA_IDS.identifyingSketchingRelatedFunctions, "Identifying and sketching related functions", 5, "sketching y = f′(x) given the graph of y = f(x)", "Sketch a derivative graph from the original function graph."),
  verified("hm-func-inverse-log-exp-graph", ALGEBRA_IDS.identifyingSketchingRelatedFunctions, "Identifying and sketching related functions", 5, "sketching the inverse of a logarithmic or an exponential function", "Sketch inverse logarithmic and exponential functions."),
  verified("hm-alg-completing-square-non-unit", ALGEBRA_IDS.identifyingSketchingRelatedFunctions, "Identifying and sketching related functions", 5, "completing the square in a quadratic expression where the coefficient of x² is non-unitary", "Complete the square when the leading quadratic coefficient is not one."),
  verified("hm-func-domain-range", ALGEBRA_IDS.determiningCompositeInverseFunctions, "Determining composite and inverse functions", 5, "knowledge and use of the terms domain and range is expected", "Use domain and range correctly with composite and inverse functions."),
  verified("hm-func-composite", ALGEBRA_IDS.determiningCompositeInverseFunctions, "Determining composite and inverse functions", 5, "determining a composite function given f(x) and g(x), where f(x) and g(x) can be trigonometric, logarithmic, exponential or algebraic functions", "Determine composite functions across the listed function families."),
  verified("hm-func-inverse", ALGEBRA_IDS.determiningCompositeInverseFunctions, "Determining composite and inverse functions", 5, "determining f⁻¹(x) of functions", "Determine inverse functions."),
  verified("hm-alg-polynomial-equations", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "solving a cubic or quartic polynomial equation", "Solve cubic and quartic polynomial equations."),
  verified("hm-alg-discriminant-unknown", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "using the discriminant to find an unknown, given the nature of the roots of an equation", "Use the discriminant and root conditions to determine an unknown."),
  verified("hm-alg-quadratic-inequalities", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "solving quadratic inequalities, ax² + bx + c ≥ 0 or ≤ 0", "Solve quadratic inequalities."),
  verified("hm-alg-log-exp-equations", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "solving logarithmic and exponential equations", "Solve logarithmic and exponential equations."),
  verified("hm-alg-log-exponent-laws-equations", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "using the laws of logarithms and exponents", "Use logarithm and exponent laws while solving equations."),
  verified("hm-alg-log-exp-parameters", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "solving equations of the specified logarithmic forms for a and b, given two pairs of corresponding values of x and y", "Determine parameters in logarithmic or exponential relationships from paired values."),
  verified("hm-alg-log-exp-linearisation", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "using a straight-line graph to confirm relationships of the form y = axᵇ or y = abˣ", "Use straight-line transformations to confirm power or exponential relationships."),
  verified("hm-alg-log-exp-modelling", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "mathematically modelling situations involving the logarithmic or exponential function", "Model situations using logarithmic or exponential functions."),
  verified("hm-alg-line-curve-intersections", ALGEBRA_IDS.solvingAlgebraicEquations, "Solving algebraic equations", 6, "finding the coordinates of the point(s) of intersection of a straight line and a curve or of two curves", "Find intersections of a line and curve or two curves."),
  verified("hm-trig-solving-equations", ALGEBRA_IDS.solvingTrigonometricEquations, "Solving trigonometric equations", 6, "solving trigonometric equations in degrees or radians, including those involving the wave function or trigonometric formulae or identities, in a given interval", "Solve trigonometric equations in a stated interval."),

  // Geometric skills: vectors (p7)
  verified("hm-vector-resultant-pathways", VECTOR_IDS.determiningVectorConnections, "Determining vector connections", 7, "determining the resultant of vector pathways in three dimensions", "Determine resultants of three-dimensional vector pathways."),
  verified("hm-vector-collinearity", VECTOR_IDS.determiningVectorConnections, "Determining vector connections", 7, "working with collinearity", "Establish and use vector collinearity."),
  verified("hm-vector-internal-division", VECTOR_IDS.determiningVectorConnections, "Determining vector connections", 7, "determining the coordinates of an internal division point of a line", "Determine coordinates of an internal division point."),
  verified("hm-vector-scalar-product-angle", VECTOR_IDS.workingWithVectors, "Working with vectors", 7, "evaluating a scalar product given suitable information and determining the angle between two vectors", "Evaluate a scalar product and determine an angle between vectors."),
  verified("hm-vector-scalar-product-properties", VECTOR_IDS.workingWithVectors, "Working with vectors", 7, "applying properties of the scalar product", "Apply scalar-product properties, including perpendicularity."),
  verified("hm-vector-unit-ijk", VECTOR_IDS.workingWithVectors, "Working with vectors", 7, "using and finding unit vectors including i, j, k as a basis", "Use and find unit vectors in the i, j, k basis."),
  // Differentiating functions (p6) — 3 official bullets
  verified(
    "hm-calc-diff-power-rule", AREA_IDS.differentiatingFunctions, "Differentiating functions", 7,
    "differentiating an algebraic function which is, or can be simplified to, an expression in powers of x",
    "Apply the power rule to differentiate polynomial expressions, including terms that need simplifying into powers of x first. This is the natural home for evaluating the resulting derivative at a stated x-value — the specification does not list evaluation as a separate skill from differentiating the function.",
  ),
  verified(
    "hm-calc-diff-trig", AREA_IDS.differentiatingFunctions, "Differentiating functions", 7,
    "differentiating k sin x and k cos x",
    "Differentiate sine and cosine functions with a scalar coefficient k.",
  ),
  verified(
    "hm-calc-diff-chain-rule", AREA_IDS.differentiatingFunctions, "Differentiating functions", 7,
    "differentiating a composite function using the chain rule",
    "Differentiate composite (function-of-a-function) expressions using the chain rule.",
  ),

  // Using differentiation to investigate the nature and properties of functions (p6) — 3 official bullets
  verified(
    "hm-calc-tangent", AREA_IDS.investigatingFunctions, "Using differentiation to investigate the nature and properties of functions", 7,
    "determining the equation of a tangent to a curve at a given point by differentiation",
    "Find the equation of the tangent line to a curve at a given point. The official wording names only the tangent — normal-line work is not listed anywhere in this document as a Calculus assessable statement.",
  ),
  verified(
    "hm-calc-increasing-decreasing", AREA_IDS.investigatingFunctions, "Using differentiation to investigate the nature and properties of functions", 7,
    "determining where a function is strictly increasing or decreasing",
    "Use the sign of the derivative to determine the intervals over which a function is strictly increasing or decreasing.",
  ),
  verified(
    "hm-calc-stationary-nature-sketching", AREA_IDS.investigatingFunctions, "Using differentiation to investigate the nature and properties of functions", 7,
    "sketching the graph of an algebraic function by determining stationary points and their nature as well as intersections with the axes and behaviour of f(x) for large positive and negative values of x",
    "One compound official statement: finding stationary points, classifying their nature, and using axis intercepts and end behaviour together to sketch a curve. The specification treats this as a single assessable statement, not three — any split into separate canonical skills (finding / classifying / sketching) is a pedagogical decision layered on top of this one statement, not a direct reflection of separate official wording. See the accompanying coverage claims, which split it three ways at the claim level rather than inventing three official statements.",
  ),

  // Integrating functions (p7) — 6 official bullets
  verified(
    "hm-calc-integration-power", AREA_IDS.integratingFunctions, "Integrating functions", 8,
    "integrating an algebraic function which is, or can be, simplified to an expression of powers of x",
    "Find anti-derivatives of polynomial expressions, including the constant of integration.",
  ),
  verified(
    "hm-calc-integration-linear-power-unit", AREA_IDS.integratingFunctions, "Integrating functions", 8,
    "integrating functions of the form f(x) = (x + q)^n, n ≠ −1",
    "Integrate a power of a simple linear expression (unit coefficient of x) using the reverse chain rule.",
  ),
  verified(
    "hm-calc-integration-trig-simple", AREA_IDS.integratingFunctions, "Integrating functions", 8,
    "integrating functions of the form f(x) = p cos x and f(x) = p sin x",
    "Integrate a scalar multiple of sin x or cos x.",
  ),
  verified(
    "hm-calc-integration-linear-power-scaled", AREA_IDS.integratingFunctions, "Integrating functions", 8,
    "integrating functions of the form f(x) = (px + q)^n, n ≠ −1",
    "Integrate a power of a general linear expression (non-unit coefficient of x) using the reverse chain rule — the generalisation of the unit-coefficient case above.",
  ),
  verified(
    "hm-calc-integration-trig-composite", AREA_IDS.integratingFunctions, "Integrating functions", 8,
    "integrating functions of the form f(x) = p cos(qx + r) and p sin(qx + r)",
    "Integrate a scalar multiple of sin or cos of a general linear argument — the composite/shifted generalisation of the simple trig case above.",
  ),
  verified(
    "hm-calc-differential-equations", AREA_IDS.integratingFunctions, "Integrating functions", 8,
    "solving differential equations of the form dy/dx = f(x)",
    "Solve a first-order differential equation of this form by integration, using an initial condition to find the constant of integration. Officially grouped under Integrating Functions, not Applying Integral Calculus — this resolves the placement question the prior taxonomy left open.",
  ),

  // Using integration to calculate definite integrals (p7) — 1 official bullet
  verified(
    "hm-calc-definite-integrals", AREA_IDS.definiteIntegrals, "Using integration to calculate definite integrals", 8,
    "calculating definite integrals of functions with limits which are integers, radians, surds or fractions",
    "Evaluate a definite integral using exact limits of any of the listed forms.",
  ),

  // Applying differential calculus (p7) — 3 official bullets
  verified(
    "hm-calc-optimisation", AREA_IDS.applyingDifferentialCalculus, "Applying differential calculus", 8,
    "determining the optimal solution for a given problem",
    "Use differentiation to solve an optimisation problem set in context.",
  ),
  verified(
    "hm-calc-closed-interval-extrema", AREA_IDS.applyingDifferentialCalculus, "Applying differential calculus", 8,
    "determining the greatest and/or least values of a function on a closed interval",
    "Find the greatest and/or least value(s) of a function restricted to a closed interval.",
  ),
  verified(
    "hm-calc-rates-of-change", AREA_IDS.applyingDifferentialCalculus, "Applying differential calculus", 8,
    "solving problems using rate of change",
    "Solve a contextual problem that turns on interpreting or using a rate of change.",
  ),

  // Applying integral calculus (p7) — 3 official bullets
  verified(
    "hm-calc-area-under-curve", AREA_IDS.applyingIntegralCalculus, "Applying integral calculus", 8,
    "finding the area between a curve and the x-axis",
    "Use integration to find the area enclosed between a curve and the x-axis.",
  ),
  verified(
    "hm-calc-area-between-curves", AREA_IDS.applyingIntegralCalculus, "Applying integral calculus", 8,
    "finding the area between a straight line and a curve or two curves",
    "Use integration to find the area enclosed between a line and a curve, or between two curves — officially one statement, distinct from the curve-and-axis case above.",
  ),
  verified(
    "hm-calc-reconstruct-function", AREA_IDS.applyingIntegralCalculus, "Applying integral calculus", 8,
    "determining and using a function from a given rate of change and initial conditions",
    "Recover a function from a stated rate of change and an initial condition, then use it.",
  ),
  // Algebraic and geometric skills (p9)
  verified("hm-geom-parallel-perpendicular-lines", GEOMETRY_IDS.rectilinearShapes, "Applying algebraic skills to rectilinear shapes", 9, "finding the equation of a line parallel to and a line perpendicular to a given line", "Find equations of parallel and perpendicular lines."),
  verified("hm-geom-gradient-angle", GEOMETRY_IDS.rectilinearShapes, "Applying algebraic skills to rectilinear shapes", 9, "using m = tan θ to calculate a gradient or angle", "Use the gradient-angle relationship."),
  verified("hm-geom-triangle-lines", GEOMETRY_IDS.rectilinearShapes, "Applying algebraic skills to rectilinear shapes", 9, "using properties of medians, altitudes and perpendicular bisectors in problems involving the equation of a line and intersection of lines", "Use medians, altitudes and perpendicular bisectors in coordinate problems."),
  verified("hm-geom-lines-perpendicular", GEOMETRY_IDS.rectilinearShapes, "Applying algebraic skills to rectilinear shapes", 9, "determining whether or not two lines are perpendicular", "Determine whether two lines are perpendicular."),
  verified("hm-geom-circle-equation", GEOMETRY_IDS.circlesAndGraphs, "Applying algebraic skills to circles and graphs", 9, "determining and using the equation of a circle", "Determine and use circle equations."),
  verified("hm-geom-circle-tangency", GEOMETRY_IDS.circlesAndGraphs, "Applying algebraic skills to circles and graphs", 9, "using properties of tangency in the solution of a problem", "Use circle tangency properties in problems."),
  verified("hm-geom-circle-intersections", GEOMETRY_IDS.circlesAndGraphs, "Applying algebraic skills to circles and graphs", 9, "determining the intersection of circles or a line and a circle", "Determine circle-circle and line-circle intersections."),
  verified("hm-seq-recurrence", GEOMETRY_IDS.modellingSequences, "Modelling situations using sequences", 9, "determining a recurrence relation from given information and using it to calculate a required term", "Determine and use recurrence relations."),
  verified("hm-seq-limit", GEOMETRY_IDS.modellingSequences, "Modelling situations using sequences", 9, "finding and interpreting the limit of a sequence, where it exists", "Find and interpret sequence limits."),
  // Reasoning skills (p9). These are cross-cutting requirements, not extra canonical skills.
  verified("hm-reason-select-strategy", higherMathematicsReasoningAreaIds.selectingStrategy, "Interpreting a situation where mathematics can be used and identifying a strategy", 9, "analysing a situation and identifying an appropriate use of mathematical skills", "Select an appropriate mathematical strategy for a situation."),
  verified("hm-reason-explain-solution", higherMathematicsReasoningAreaIds.explainingSolution, "Explaining a solution and, where appropriate, relating it to context", 9, "explaining why a particular solution is appropriate in a given context", "Explain and interpret a solution in its context."),
];

export const higherMathematicsSpecificationRegister: CourseSpecificationRegister = {
  courseId: "higher-maths",
  qualification: { subject: "Mathematics", level: "Higher" },
  sourceDocument: {
    documentId: DOCUMENT_ID,
    title: "Higher Mathematics course specification",
    publisher: "Scottish Qualifications Authority (SQA)",
    sourceUrl: "https://www.sqa.org.uk/files_ccc/h-course-spec-mathematics.pdf",
    retrievedAt: new Date("2026-08-07T00:00:00.000Z").toISOString(),
    versionLabel: "May 2023 (version 3.0) — confirmed current by Qualifications Scotland on 7 August 2026",
  },
  registerVersion: 3,
  areas,
  points,
};
