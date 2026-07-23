import { ACTIVE_CONTENT_STATUS } from "@/data/content-metadata";
import type { CourseArea, SpecificationStrand } from "@/data/types";
import { createHigherMathsPlaceholder } from "@/data/higher-maths/placeholder";

export const higherMathsAlgebraTrigonometryStrandIds = {
  manipulatingAlgebraicExpressions: "manipulating-algebraic-expressions",
  manipulatingTrigonometricExpressions: "manipulating-trigonometric-expressions",
  identifyingSketchingRelatedFunctions: "identifying-sketching-related-functions",
  determiningCompositeInverseFunctions: "determining-composite-inverse-functions",
  solvingAlgebraicEquations: "solving-algebraic-equations",
  solvingTrigonometricEquations: "solving-trigonometric-equations",
} as const;

const courseHref = "/subjects/higher-maths/algebra-and-trigonometry";

const strands: SpecificationStrand[] = [
  {
    id: higherMathsAlgebraTrigonometryStrandIds.manipulatingAlgebraicExpressions,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name: "Manipulating algebraic expressions",
    description: "Factorise polynomials, use logarithm and exponent laws, and complete the square.",
    displayOrder: 1,
    href: courseHref,
  },
  {
    id: higherMathsAlgebraTrigonometryStrandIds.manipulatingTrigonometricExpressions,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name: "Manipulating trigonometric expressions",
    description: "Apply addition and double-angle formulae, identities, and wave-function form.",
    displayOrder: 2,
    href: courseHref,
  },
  {
    id: higherMathsAlgebraTrigonometryStrandIds.identifyingSketchingRelatedFunctions,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name: "Identifying and sketching related functions",
    description: "Transform graphs, sketch derivative graphs and recognise inverse logarithmic and exponential graphs.",
    displayOrder: 3,
    href: courseHref,
  },
  {
    id: higherMathsAlgebraTrigonometryStrandIds.determiningCompositeInverseFunctions,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name: "Determining composite and inverse functions",
    description: "Determine composite and inverse functions while accounting for domain and range.",
    displayOrder: 4,
    href: courseHref,
  },
  {
    id: higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name: "Solving algebraic equations",
    description: "Solve polynomial, logarithmic and exponential equations and find intersections.",
    displayOrder: 5,
    href: courseHref,
  },
  {
    id: higherMathsAlgebraTrigonometryStrandIds.solvingTrigonometricEquations,
    contentStatus: ACTIVE_CONTENT_STATUS,
    name: "Solving trigonometric equations",
    description: "Solve trigonometric equations in degrees or radians within a stated interval.",
    displayOrder: 6,
    href: courseHref,
  },
];

function placeholder(
  specArea: string,
  slug: string,
  specificationStrandId: string,
  displayOrder: number,
  name: string,
  description: string,
) {
  return createHigherMathsPlaceholder({
    slug,
    specificationStrandId,
    displayOrder,
    name,
    description,
    parentHref: `${courseHref}/${specArea}`,
  });
}

export const higherMathsAlgebraTrigonometryCourseArea: CourseArea = {
  slug: "algebra-and-trigonometry",
  contentStatus: ACTIVE_CONTENT_STATUS,
  name: "Algebra and Trigonometry",
  description: "Develop the algebra, functions, graphs and trigonometry required across Higher Maths.",
  href: courseHref,
  available: false,
  progress: 0,
  questionsCompleted: 0,
  specificationStrands: strands,
  specAreas: [
    {
      slug: "polynomials",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Polynomials",
      description: "Factorise, solve and interpret higher-order polynomial and quadratic expressions.",
      href: `${courseHref}/polynomials`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("polynomials", "factorising-cubics-and-quartics", higherMathsAlgebraTrigonometryStrandIds.manipulatingAlgebraicExpressions, 1, "Factorising cubics and quartics", "Factorise cubic and quartic polynomial expressions."),
        placeholder("polynomials", "polynomial-equations", higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations, 1, "Polynomial equations", "Solve cubic and quartic equations using appropriate polynomial techniques."),
        placeholder("polynomials", "discriminant-and-nature-of-roots", higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations, 2, "Discriminant and nature of roots", "Use the discriminant and the nature of roots to determine unknown values."),
        placeholder("polynomials", "quadratic-inequalities", higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations, 3, "Quadratic inequalities", "Solve quadratic inequalities and express their solution sets clearly."),
        placeholder("polynomials", "completing-the-square-non-unit-leading-coefficient", higherMathsAlgebraTrigonometryStrandIds.identifyingSketchingRelatedFunctions, 1, "Completing the square with a non-unit leading coefficient", "Complete the square when the coefficient of x squared is not 1."),
      ],
    },
    {
      slug: "logarithms-and-exponentials",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Logarithms and Exponentials",
      description: "Use logarithm and exponent laws to solve equations and model relationships.",
      href: `${courseHref}/logarithms-and-exponentials`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("logarithms-and-exponentials", "laws-of-logarithms-and-exponents", higherMathsAlgebraTrigonometryStrandIds.manipulatingAlgebraicExpressions, 2, "Laws of logarithms and exponents", "Simplify numerical expressions using the laws of logarithms and exponents."),
        placeholder("logarithms-and-exponentials", "logarithmic-and-exponential-equations", higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations, 4, "Logarithmic and exponential equations", "Solve logarithmic and exponential equations."),
        placeholder("logarithms-and-exponentials", "logarithmic-and-exponential-modelling", higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations, 5, "Logarithmic and exponential modelling", "Find constants, confirm relationships and model logarithmic or exponential situations."),
      ],
    },
    {
      slug: "functions-and-graphs",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Functions and Graphs",
      description: "Transform and relate functions, including composites, inverses, domains and ranges.",
      href: `${courseHref}/functions-and-graphs`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("functions-and-graphs", "graph-transformations", higherMathsAlgebraTrigonometryStrandIds.identifyingSketchingRelatedFunctions, 2, "Graph transformations", "Identify and sketch functions after single or combined graph transformations."),
        placeholder("functions-and-graphs", "sketching-derivative-graphs", higherMathsAlgebraTrigonometryStrandIds.identifyingSketchingRelatedFunctions, 3, "Sketching derivative graphs", "Sketch the graph of a derivative from the graph of the original function."),
        placeholder("functions-and-graphs", "inverse-logarithmic-and-exponential-graphs", higherMathsAlgebraTrigonometryStrandIds.identifyingSketchingRelatedFunctions, 4, "Inverse logarithmic and exponential graphs", "Sketch inverse logarithmic and exponential functions."),
        placeholder("functions-and-graphs", "composite-functions", higherMathsAlgebraTrigonometryStrandIds.determiningCompositeInverseFunctions, 1, "Composite functions", "Determine composite functions across algebraic, trigonometric, logarithmic and exponential forms."),
        placeholder("functions-and-graphs", "inverse-functions-domain-and-range", higherMathsAlgebraTrigonometryStrandIds.determiningCompositeInverseFunctions, 2, "Inverse functions, domain and range", "Determine inverse functions and use domain and range correctly."),
      ],
    },
    {
      slug: "trigonometric-skills",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Trigonometric Skills",
      description: "Use formulae and identities to rewrite expressions and solve trigonometric equations.",
      href: `${courseHref}/trigonometric-skills`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("trigonometric-skills", "addition-and-double-angle-formulae", higherMathsAlgebraTrigonometryStrandIds.manipulatingTrigonometricExpressions, 1, "Addition and double-angle formulae", "Apply the addition and double-angle formulae."),
        placeholder("trigonometric-skills", "trigonometric-identities", higherMathsAlgebraTrigonometryStrandIds.manipulatingTrigonometricExpressions, 2, "Trigonometric identities", "Apply and prove the trigonometric identities required by the course."),
        placeholder("trigonometric-skills", "wave-function-form", higherMathsAlgebraTrigonometryStrandIds.manipulatingTrigonometricExpressions, 3, "Wave-function form", "Convert a cos x + b sin x into an equivalent sine or cosine wave form."),
        placeholder("trigonometric-skills", "solving-trigonometric-equations", higherMathsAlgebraTrigonometryStrandIds.solvingTrigonometricEquations, 1, "Solving trigonometric equations", "Solve equations in degrees or radians, including formulae, identities and wave functions."),
      ],
    },
    {
      slug: "intersections",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Intersections",
      description: "Find intersections between lines and curves using algebraic methods.",
      href: `${courseHref}/intersections`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("intersections", "intersections-of-lines-and-curves", higherMathsAlgebraTrigonometryStrandIds.solvingAlgebraicEquations, 6, "Intersections of lines and curves", "Find intersections of a straight line and a curve or of two curves."),
      ],
    },
  ],
};
