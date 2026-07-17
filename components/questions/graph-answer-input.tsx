"use client";

import { useMemo } from "react";
import { LinkedDerivativeGraphs } from "@/components/maths/linked-derivative-graphs";
import { MathGraph } from "@/components/maths/math-graph";
import { NatureTable } from "@/components/maths/nature-table";
import type { Question } from "@/data/types";
import type { NatureTableExpectedCell, StructuredGraphAnswer } from "@/lib/maths/expression-types";

type Props = {
  question: Question;
  value: string;
  submitted: boolean;
  onChange: (value: string) => void;
};

export function GraphAnswerInput({ question, value, submitted, onChange }: Props) {
  const answer = useMemo(() => parseAnswer(value), [value]);
  const config = question.structuredAnswer;
  const graph = question.graphConfig;

  function setAnswer(next: StructuredGraphAnswer) {
    onChange(JSON.stringify(next));
  }

  return (
    <div className="grid gap-4">
      {graph?.linkedDerivative ? (
        <LinkedDerivativeGraphs expression={graph.functions[0].expression} viewport={graph.viewport} initialX={graph.linkedDerivative.initialX} />
      ) : graph ? (
        <MathGraph title={graph.title} description={graph.description} viewport={graph.viewport} functions={graph.functions} points={graph.keyPoints} />
      ) : null}

      {config?.type === "nature-table" && question.natureTableConfig ? (
        <NatureTable
          config={question.natureTableConfig}
          value={answer?.type === "nature-table" ? answer.cells : {}}
          disabled={submitted}
          onChange={(cells) => setAnswer({ type: "nature-table", cells })}
        />
      ) : null}

      {config?.type === "point-placement" ? (
        <div className="rounded-2xl border border-line bg-white p-4" data-testid="point-placement-input">
          <h3 className="m-0 text-base font-extrabold">Key points</h3>
          <p className="mt-1 text-sm text-muted">Enter mathematical coordinates. Dragging is optional in later versions and is not recorded as progress.</p>
          <div className="mt-3 grid gap-3">
            {config.expectedPoints.map((point) => {
              const current = answer?.type === "point-placement" ? answer.points.find((item) => item.id === point.id) : undefined;
              return (
                <div key={point.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 max-sm:grid-cols-1">
                  <span className="font-bold">{point.id}</span>
                  <input aria-label={`${point.id} x-coordinate`} type="number" step="0.25" disabled={submitted} value={current?.x ?? ""} onChange={(event) => updatePoint(point.id, "x", Number(event.target.value))} className="min-h-10 rounded-lg border border-line px-3" />
                  <input aria-label={`${point.id} y-coordinate`} type="number" step="0.25" disabled={submitted} value={current?.y ?? ""} onChange={(event) => updatePoint(point.id, "y", Number(event.target.value))} className="min-h-10 rounded-lg border border-line px-3" />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {config?.type === "candidate-match" ? (
        <div className="rounded-2xl border border-line bg-white p-4">
          <label className="text-sm font-extrabold text-muted" htmlFor="candidate-match">Choose the matching graph</label>
          <select id="candidate-match" disabled={submitted} value={answer?.type === "candidate-match" ? answer.selectedId : ""} onChange={(event) => setAnswer({ type: "candidate-match", selectedId: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-line px-3">
            <option value="">Choose...</option>
            <option value="candidate-a">Candidate A</option>
            <option value="candidate-b">Candidate B</option>
            <option value="candidate-c">Candidate C</option>
          </select>
        </div>
      ) : null}

      {config?.type === "interval-signs" ? (
        <div className="rounded-2xl border border-line bg-white p-4">
          <h3 className="m-0 text-base font-extrabold">Derivative signs</h3>
          <div className="mt-3 grid gap-2">
            {Object.keys(config.expectedSigns).map((id) => (
              <label key={id} className="grid grid-cols-[1fr_180px] items-center gap-3 max-sm:grid-cols-1">
                <span className="font-bold">{id}</span>
                <select disabled={submitted} value={answer?.type === "interval-signs" ? answer.intervals[id] ?? "" : ""} onChange={(event) => setIntervalSign(id, event.target.value)} className="min-h-10 rounded-lg border border-line px-3">
                  <option value="">Choose...</option>
                  <option value="positive">positive</option>
                  <option value="zero">zero</option>
                  <option value="negative">negative</option>
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  function updatePoint(id: string, axis: "x" | "y", next: number) {
    const existing = answer?.type === "point-placement" ? answer.points : [];
    const current = existing.find((point) => point.id === id) ?? { id, x: 0, y: 0 };
    setAnswer({ type: "point-placement", points: [...existing.filter((point) => point.id !== id), { ...current, [axis]: next }] });
  }

  function setIntervalSign(id: string, sign: string) {
    if (sign !== "positive" && sign !== "zero" && sign !== "negative") return;
    setAnswer({ type: "interval-signs", intervals: { ...(answer?.type === "interval-signs" ? answer.intervals : {}), [id]: sign } });
  }
}

function parseAnswer(value: string): StructuredGraphAnswer | null {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value) as StructuredGraphAnswer;
  } catch {
    return null;
  }
}

export function emptyNatureAnswer(cells: Record<string, NatureTableExpectedCell>): StructuredGraphAnswer {
  return { type: "nature-table", cells };
}
