"use client";

import { useMemo, useState } from "react";
import { deriveExpression, evaluateMathExpression } from "@/lib/maths/expression-core";
import { MathGraph } from "@/components/maths/math-graph";
import type { GraphFunctionDefinition, GraphViewport, MathExpression } from "@/lib/maths/expression-types";

export function LinkedDerivativeGraphs({
  expression,
  viewport,
  initialX = 0,
}: {
  expression: MathExpression;
  viewport: GraphViewport;
  initialX?: number;
}) {
  const [selectedX, setSelectedX] = useState(initialX);
  const derivative = useMemo(() => deriveExpression(expression), [expression]);
  const y = evaluateMathExpression(expression, selectedX);
  const gradient = derivative.status === "supported" ? evaluateMathExpression(derivative.simplifiedExpression, selectedX) : null;
  const original: GraphFunctionDefinition = { id: "f", expression, label: "f(x)", styleRole: "primary" };
  const derivativeFunction: GraphFunctionDefinition | null = derivative.status === "supported"
    ? { id: "f-prime", expression: derivative.simplifiedExpression, label: "f'(x)", styleRole: "derivative" }
    : null;

  return (
    <section className="grid gap-4" data-testid="linked-derivative-graphs">
      <div className="rounded-2xl border border-line bg-white p-4">
        <label htmlFor="linked-x" className="text-sm font-extrabold text-muted">Shared x-value</label>
        <input
          id="linked-x"
          type="range"
          min={viewport.xMin}
          max={viewport.xMax}
          step={0.25}
          value={selectedX}
          onChange={(event) => setSelectedX(Number(event.target.value))}
          className="mt-2 w-full"
        />
        <p className="mt-2 text-sm text-muted" data-testid="linked-gradient-summary">
          At x = {selectedX.toFixed(2)}, f(x) {y.status === "value" ? `= ${y.value.toFixed(2)}` : "is undefined"} and f&apos;(x) {gradient?.status === "value" ? `= ${gradient.value.toFixed(2)}` : "is unavailable"}.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <MathGraph
          title="Original graph"
          description="Function with tangent line at the selected x-value"
          viewport={viewport}
          functions={[original]}
          selectedX={selectedX}
          tangent={y.status === "value" && gradient?.status === "value" ? { x: selectedX, y: y.value, gradient: gradient.value } : undefined}
        />
        {derivativeFunction ? (
          <MathGraph
            title="Derivative graph"
            description="Derivative value aligned to the same x-coordinate"
            viewport={viewport}
            functions={[derivativeFunction]}
            selectedX={selectedX}
          />
        ) : (
          <div className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">Derivative view is unavailable for this expression.</div>
        )}
      </div>
    </section>
  );
}
