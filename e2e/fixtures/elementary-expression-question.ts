import type { Question } from "../../data/types";
import type { ElementaryExpressionEquivalenceMarkingContract } from "../../lib/marking/types";

export const ELEMENTARY_EXPRESSION_E2E_QUESTION_ID = "__e2e-elementary-expression";

export const ELEMENTARY_EXPRESSION_E2E_CASES = {
  sin: { target: "3sin(x)", prompt: "Enter 3sin(x)." },
  cos: { target: "cos(2x)", prompt: "Enter cos(2x)." },
  tan: { target: "tan(x+pi/4)", prompt: "Enter tan(x+pi/4)." },
  exponential: { target: "e^x", prompt: "Enter e^x." },
  logarithm: { target: "ln(x)", prompt: "Enter ln(x)." },
  baseLogarithm: { target: "log_2(x)", prompt: "Enter log base 2 of x." },
} as const;

export type ElementaryExpressionE2ECase = keyof typeof ELEMENTARY_EXPRESSION_E2E_CASES;

export function createElementaryExpressionE2EQuestion(caseId: ElementaryExpressionE2ECase): Question {
  const example = ELEMENTARY_EXPRESSION_E2E_CASES[caseId];
  const marking: ElementaryExpressionEquivalenceMarkingContract = {
    strategy: "elementary_expression_equivalence",
    strategyVersion: 1,
    target: example.target,
    variable: "x",
    allowedFunctions: ["sin", "cos", "tan", "ln", "log"],
    allowedConstants: ["pi", "e"],
    allowedLogBases: [2, 10],
    fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] },
  };
  return {
    id: `${ELEMENTARY_EXPRESSION_E2E_QUESTION_ID}-${caseId}`,
    questionVersion: 1,
    contentRevision: 1,
    contentStatus: "active",
    subject: "Automated verification",
    courseArea: "Test fixtures",
    specArea: "Elementary expressions",
    stage: "Foundations",
    skill: "Elementary-expression capability proof",
    title: "Elementary expression test fixture",
    questionText: example.prompt,
    marks: 1,
    answerType: "algebraic",
    marking,
    correctAnswer: example.target,
    acceptedAnswers: [example.target],
    workedSolution: `The required expression is ${example.target}.`,
    finalAnswer: example.target,
    hint: "Use the structured maths keyboard.",
    commonMistake: "Changing the function or its argument changes the expression.",
    calculatorAllowed: false,
    source: "Automated browser-test fixture",
    status: "ready",
    displayOrder: 1,
  };
}

export function isElementaryExpressionE2ECase(value: string | undefined): value is ElementaryExpressionE2ECase {
  return value !== undefined && Object.prototype.hasOwnProperty.call(ELEMENTARY_EXPRESSION_E2E_CASES, value);
}
