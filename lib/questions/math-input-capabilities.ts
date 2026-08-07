import type { Question } from "@/data/types";

export type MathInputCapabilities = {
  squareRoot: boolean;
  pi: boolean;
};

export function deriveMathInputCapabilities(question: Question): MathInputCapabilities {
  const marking = question.marking;
  const correctInputs = "fixtures" in marking
    ? marking.fixtures?.correct.map((fixture) => fixture.input.toLowerCase()) ?? []
    : [];
  return {
    squareRoot: correctInputs.some((input) => input.includes("sqrt(")),
    pi: correctInputs.some((input) => /(^|[^a-z])pi([^a-z]|$)/.test(input)),
  };
}
