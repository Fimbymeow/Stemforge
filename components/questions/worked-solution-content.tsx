"use client";

import { useMemo, useState } from "react";
import { MathContent } from "@/components/questions/math-content";
import {
  deriveWorkedSolutionPresentation,
  type StructuredSolutionStep,
} from "@/lib/questions/worked-solution";

export function WorkedSolutionContent({
  solution,
  finalAnswer,
}: {
  solution: string | readonly StructuredSolutionStep[];
  finalAnswer: string;
}) {
  const presentation = useMemo(() => deriveWorkedSolutionPresentation(solution), [solution]);
  const [revealedCount, setRevealedCount] = useState(1);

  if (presentation.mode === "full") {
    return (
      <div data-testid="full-solution-fallback">
        <MathContent>{presentation.content}</MathContent>
        <FinalAnswer answer={finalAnswer} />
      </div>
    );
  }

  const allRevealed = revealedCount >= presentation.steps.length;
  return (
    <div data-testid="progressive-solution">
      <ol className="grid gap-3" aria-label="Worked solution steps">
        {presentation.steps.slice(0, revealedCount).map((step, index) => (
          <li key={`${step.title}-${index}`} className="rounded-xl border border-line bg-paper p-4">
            <p className="font-mono text-xs font-extrabold uppercase text-forge">Step {index + 1}</p>
            <h3 className="mt-1 text-base font-extrabold">{step.title}</h3>
            <div className="mt-2"><MathContent>{step.body}</MathContent></div>
          </li>
        ))}
      </ol>
      {!allRevealed ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            aria-label={`Show step ${revealedCount + 1} of ${presentation.steps.length}`}
            onClick={() => setRevealedCount((current) => Math.min(presentation.steps.length, current + 1))}
            className="inline-flex min-h-10 items-center rounded-lg bg-forge px-4 text-sm font-extrabold text-white"
          >
            Show next step
          </button>
          <button
            type="button"
            onClick={() => setRevealedCount(presentation.steps.length)}
            className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-forge"
          >
            Show full solution
          </button>
        </div>
      ) : <FinalAnswer answer={finalAnswer} />}
    </div>
  );
}

function FinalAnswer({ answer }: { answer: string }) {
  return (
    <div className="mt-4 rounded-xl border border-forge/20 bg-forge-soft p-4">
      <p className="mb-1 text-sm font-extrabold text-forge">Final answer</p>
      <MathContent>{answer}</MathContent>
    </div>
  );
}
