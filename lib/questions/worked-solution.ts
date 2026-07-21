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
