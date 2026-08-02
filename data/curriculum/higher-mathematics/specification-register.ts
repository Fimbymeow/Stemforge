import { higherMathsCalculusStrandIds } from "@/data/higher-maths";
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
 * Retrieved:        2026-08-02, downloaded and read in full (34 pages) for this pass
 *
 * The Calculus assessable content lives in the "Skills, knowledge and understanding for
 * the course assessment" section's "Calculus skills" table (document pages 6–7). Every
 * officialStatement below is copied verbatim from that table's "Explanation" bullets — the
 * only text in this file taken from the official document; authoringSummary paraphrases
 * are original. Appendix 2 (pages 19–31, non-mandatory "suggested learning and teaching
 * contexts") was read but is deliberately not used as a source of assessable statements —
 * it illustrates delivery, it does not define what is examined.
 *
 * The official table has exactly six Calculus skill headings, each with its own bullet
 * list — these headings map 1:1 onto this register's six areas below (their IDs were
 * already correct in the provisional register; only the points beneath them needed
 * independent re-extraction). The headings themselves are NOT independently re-copied as
 * separate points; they are area titles, not assessable statements.
 */

const AREA_IDS = higherMathsCalculusStrandIds;
const DOCUMENT_ID = "sqa-h-course-spec-mathematics-2023-v3";

const areas: SpecificationArea[] = [
  { areaId: AREA_IDS.differentiatingFunctions, courseId: "higher-maths", title: "Differentiating functions", order: 1, status: "active" },
  { areaId: AREA_IDS.investigatingFunctions, courseId: "higher-maths", title: "Using differentiation to investigate the nature and properties of functions", order: 2, status: "active" },
  { areaId: AREA_IDS.integratingFunctions, courseId: "higher-maths", title: "Integrating functions", order: 3, status: "active" },
  { areaId: AREA_IDS.definiteIntegrals, courseId: "higher-maths", title: "Using integration to calculate definite integrals", order: 4, status: "active" },
  { areaId: AREA_IDS.applyingDifferentialCalculus, courseId: "higher-maths", title: "Applying differential calculus", order: 5, status: "active" },
  { areaId: AREA_IDS.applyingIntegralCalculus, courseId: "higher-maths", title: "Applying integral calculus", order: 6, status: "active" },
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
      section: "Skills, knowledge and understanding for the course assessment > Calculus skills",
      page,
      itemLabel,
    },
    officialStatement,
    authoringSummary,
    mandatory: true,
    status: "active",
  };
}

const points: VerifiedSpecificationPoint[] = [
  // Differentiating functions (p6) — 3 official bullets
  verified(
    "hm-calc-diff-power-rule", AREA_IDS.differentiatingFunctions, "Differentiating functions", 6,
    "differentiating an algebraic function which is, or can be simplified to, an expression in powers of x",
    "Apply the power rule to differentiate polynomial expressions, including terms that need simplifying into powers of x first. This is the natural home for evaluating the resulting derivative at a stated x-value — the specification does not list evaluation as a separate skill from differentiating the function.",
  ),
  verified(
    "hm-calc-diff-trig", AREA_IDS.differentiatingFunctions, "Differentiating functions", 6,
    "differentiating k sin x and k cos x",
    "Differentiate sine and cosine functions with a scalar coefficient k.",
  ),
  verified(
    "hm-calc-diff-chain-rule", AREA_IDS.differentiatingFunctions, "Differentiating functions", 6,
    "differentiating a composite function using the chain rule",
    "Differentiate composite (function-of-a-function) expressions using the chain rule.",
  ),

  // Using differentiation to investigate the nature and properties of functions (p6) — 3 official bullets
  verified(
    "hm-calc-tangent", AREA_IDS.investigatingFunctions, "Using differentiation to investigate the nature and properties of functions", 6,
    "determining the equation of a tangent to a curve at a given point by differentiation",
    "Find the equation of the tangent line to a curve at a given point. The official wording names only the tangent — normal-line work is not listed anywhere in this document as a Calculus assessable statement.",
  ),
  verified(
    "hm-calc-increasing-decreasing", AREA_IDS.investigatingFunctions, "Using differentiation to investigate the nature and properties of functions", 6,
    "determining where a function is strictly increasing or decreasing",
    "Use the sign of the derivative to determine the intervals over which a function is strictly increasing or decreasing.",
  ),
  verified(
    "hm-calc-stationary-nature-sketching", AREA_IDS.investigatingFunctions, "Using differentiation to investigate the nature and properties of functions", 6,
    "sketching the graph of an algebraic function by determining stationary points and their nature as well as intersections with the axes and behaviour of f(x) for large positive and negative values of x",
    "One compound official statement: finding stationary points, classifying their nature, and using axis intercepts and end behaviour together to sketch a curve. The specification treats this as a single assessable statement, not three — any split into separate canonical skills (finding / classifying / sketching) is a pedagogical decision layered on top of this one statement, not a direct reflection of separate official wording. See the accompanying coverage claims, which split it three ways at the claim level rather than inventing three official statements.",
  ),

  // Integrating functions (p7) — 6 official bullets
  verified(
    "hm-calc-integration-power", AREA_IDS.integratingFunctions, "Integrating functions", 7,
    "integrating an algebraic function which is, or can be, simplified to an expression of powers of x",
    "Find anti-derivatives of polynomial expressions, including the constant of integration.",
  ),
  verified(
    "hm-calc-integration-linear-power-unit", AREA_IDS.integratingFunctions, "Integrating functions", 7,
    "integrating functions of the form f(x) = (x + q)^n, n ≠ −1",
    "Integrate a power of a simple linear expression (unit coefficient of x) using the reverse chain rule.",
  ),
  verified(
    "hm-calc-integration-trig-simple", AREA_IDS.integratingFunctions, "Integrating functions", 7,
    "integrating functions of the form f(x) = p cos x and f(x) = p sin x",
    "Integrate a scalar multiple of sin x or cos x.",
  ),
  verified(
    "hm-calc-integration-linear-power-scaled", AREA_IDS.integratingFunctions, "Integrating functions", 7,
    "integrating functions of the form f(x) = (px + q)^n, n ≠ −1",
    "Integrate a power of a general linear expression (non-unit coefficient of x) using the reverse chain rule — the generalisation of the unit-coefficient case above.",
  ),
  verified(
    "hm-calc-integration-trig-composite", AREA_IDS.integratingFunctions, "Integrating functions", 7,
    "integrating functions of the form f(x) = p cos(qx + r) and p sin(qx + r)",
    "Integrate a scalar multiple of sin or cos of a general linear argument — the composite/shifted generalisation of the simple trig case above.",
  ),
  verified(
    "hm-calc-differential-equations", AREA_IDS.integratingFunctions, "Integrating functions", 7,
    "solving differential equations of the form dy/dx = f(x)",
    "Solve a first-order differential equation of this form by integration, using an initial condition to find the constant of integration. Officially grouped under Integrating Functions, not Applying Integral Calculus — this resolves the placement question the prior taxonomy left open.",
  ),

  // Using integration to calculate definite integrals (p7) — 1 official bullet
  verified(
    "hm-calc-definite-integrals", AREA_IDS.definiteIntegrals, "Using integration to calculate definite integrals", 7,
    "calculating definite integrals of functions with limits which are integers, radians, surds or fractions",
    "Evaluate a definite integral using exact limits of any of the listed forms.",
  ),

  // Applying differential calculus (p7) — 3 official bullets
  verified(
    "hm-calc-optimisation", AREA_IDS.applyingDifferentialCalculus, "Applying differential calculus", 7,
    "determining the optimal solution for a given problem",
    "Use differentiation to solve an optimisation problem set in context.",
  ),
  verified(
    "hm-calc-closed-interval-extrema", AREA_IDS.applyingDifferentialCalculus, "Applying differential calculus", 7,
    "determining the greatest and/or least values of a function on a closed interval",
    "Find the greatest and/or least value(s) of a function restricted to a closed interval.",
  ),
  verified(
    "hm-calc-rates-of-change", AREA_IDS.applyingDifferentialCalculus, "Applying differential calculus", 7,
    "solving problems using rate of change",
    "Solve a contextual problem that turns on interpreting or using a rate of change.",
  ),

  // Applying integral calculus (p7) — 3 official bullets
  verified(
    "hm-calc-area-under-curve", AREA_IDS.applyingIntegralCalculus, "Applying integral calculus", 7,
    "finding the area between a curve and the x-axis",
    "Use integration to find the area enclosed between a curve and the x-axis.",
  ),
  verified(
    "hm-calc-area-between-curves", AREA_IDS.applyingIntegralCalculus, "Applying integral calculus", 7,
    "finding the area between a straight line and a curve or two curves",
    "Use integration to find the area enclosed between a line and a curve, or between two curves — officially one statement, distinct from the curve-and-axis case above.",
  ),
  verified(
    "hm-calc-reconstruct-function", AREA_IDS.applyingIntegralCalculus, "Applying integral calculus", 7,
    "determining and using a function from a given rate of change and initial conditions",
    "Recover a function from a stated rate of change and an initial condition, then use it.",
  ),
];

export const higherMathematicsSpecificationRegister: CourseSpecificationRegister = {
  courseId: "higher-maths",
  qualification: { subject: "Mathematics", level: "Higher" },
  sourceDocument: {
    documentId: DOCUMENT_ID,
    title: "Higher Mathematics course specification",
    publisher: "Scottish Qualifications Authority (SQA)",
    sourceUrl: "https://www.sqa.org.uk/files_ccc/h-course-spec-mathematics.pdf",
    retrievedAt: new Date("2026-08-02T00:00:00.000Z").toISOString(),
    versionLabel: "May 2023 (version 3.0) — verified, full text downloaded and read; extract stored locally in this file",
  },
  registerVersion: 2,
  areas,
  points,
};
