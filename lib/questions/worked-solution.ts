export type StructuredSolutionStep = {
  title: string;
  body: string;
};

export type WorkedSolutionPresentation =
  | { mode: "progressive"; steps: StructuredSolutionStep[] }
  | { mode: "full"; content: string };

export function deriveWorkedSolutionPresentation(
  solution: string | readonly StructuredSolutionStep[],
): WorkedSolutionPresentation {
  if (typeof solution === "string") return { mode: "full", content: solution };
  const steps = solution.filter((step) => step.title.trim() && step.body.trim()).map((step) => ({ ...step }));
  return steps.length > 1 ? { mode: "progressive", steps } : { mode: "full", content: steps[0]?.body ?? "" };
}

export function workedSolutionEndsWithFinalAnswer(
  solution: string | readonly StructuredSolutionStep[],
  finalAnswer: string,
) {
  const content = typeof solution === "string"
    ? solution
    : solution.findLast((step) => step.body.trim())?.body ?? "";
  const normalizedContent = normalizeSolutionEnding(content);
  const normalizedAnswer = normalizeSolutionEnding(finalAnswer);
  if (!normalizedAnswer || !normalizedContent.endsWith(normalizedAnswer)) return false;
  const answerStart = normalizedContent.length - normalizedAnswer.length;
  if (answerStart === 0) return true;
  const precedingCharacter = normalizedContent[answerStart - 1];
  const firstAnswerCharacter = normalizedAnswer[0];
  return !(isExpressionTokenCharacter(precedingCharacter) && isExpressionTokenCharacter(firstAnswerCharacter));
}

function normalizeSolutionEnding(value: string) {
  return value
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replace(/[$\s{}.,;:]+/g, "")
    .toLowerCase();
}

function isExpressionTokenCharacter(value: string) {
  return /[a-z0-9]/.test(value);
}
