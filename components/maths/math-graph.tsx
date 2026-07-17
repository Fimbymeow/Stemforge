"use client";

import { useMemo } from "react";
import { expressionToDisplay, exactToNumber } from "@/lib/maths/expression-core";
import { graphPointToSvg, sampleExpressionForGraph, segmentToSvgPath } from "@/lib/maths/graph-sampling";
import type { GraphFunctionDefinition, GraphPoint, GraphViewport } from "@/lib/maths/expression-types";

type MathGraphProps = {
  title: string;
  description: string;
  viewport: GraphViewport;
  functions: GraphFunctionDefinition[];
  points?: GraphPoint[];
  selectedX?: number;
  tangent?: { x: number; y: number; gradient: number };
  height?: number;
};

const WIDTH = 640;

export function MathGraph({ title, description, viewport, functions, points = [], selectedX, tangent, height = 360 }: MathGraphProps) {
  const sampled = useMemo(() => functions.map((fn) => ({
    fn,
    segments: sampleExpressionForGraph(fn.expression, viewport),
  })), [functions, viewport]);
  const xAxis = graphPointToSvg({ x: 0, y: 0 }, viewport, WIDTH, height).y;
  const yAxis = graphPointToSvg({ x: 0, y: 0 }, viewport, WIDTH, height).x;
  const selected = selectedX === undefined ? null : graphPointToSvg({ x: selectedX, y: 0 }, viewport, WIDTH, height).x;

  return (
    <figure className="rounded-2xl border border-line bg-white p-4" data-testid="math-graph">
      <figcaption>
        <h3 className="m-0 text-base font-extrabold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </figcaption>
      <svg
        className="mt-4 h-auto w-full overflow-visible"
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-labelledby={`${slug(title)}-title ${slug(title)}-desc`}
        focusable="false"
      >
        <title id={`${slug(title)}-title`}>{title}</title>
        <desc id={`${slug(title)}-desc`}>{description}. Viewport x {viewport.xMin} to {viewport.xMax}, y {viewport.yMin} to {viewport.yMax}.</desc>
        <GraphGrid viewport={viewport} width={WIDTH} height={height} />
        {xAxis >= 0 && xAxis <= height ? <line x1={0} x2={WIDTH} y1={xAxis} y2={xAxis} className="stroke-ink" strokeWidth={1.6} /> : null}
        {yAxis >= 0 && yAxis <= WIDTH ? <line y1={0} y2={height} x1={yAxis} x2={yAxis} className="stroke-ink" strokeWidth={1.6} /> : null}
        {sampled.map(({ fn, segments }) => segments.map((segment, index) => (
          <path
            key={`${fn.id}-${index}`}
            d={segmentToSvgPath(segment, viewport, WIDTH, height)}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={curveClass(fn.styleRole)}
            data-testid={`graph-curve-${fn.id}`}
          />
        )))}
        {selected !== null ? <line x1={selected} x2={selected} y1={0} y2={height} className="stroke-forge/50" strokeDasharray="6 6" strokeWidth={2} /> : null}
        {tangent ? <TangentLine tangent={tangent} viewport={viewport} width={WIDTH} height={height} /> : null}
        {points.map((point) => {
          const svg = graphPointToSvg({ x: exactToNumber(point.x), y: exactToNumber(point.y) }, viewport, WIDTH, height);
          return (
            <g key={`${exactToNumber(point.x)}:${exactToNumber(point.y)}:${point.label ?? ""}`} tabIndex={0} aria-label={`${point.label ?? "Point"} at x ${exactToNumber(point.x)}, y ${exactToNumber(point.y)}`}>
              <circle cx={svg.x} cy={svg.y} r={6} className="fill-white stroke-forge" strokeWidth={3} />
              {point.label ? <text x={svg.x + 9} y={svg.y - 9} className="fill-ink text-[16px] font-bold">{point.label}</text> : null}
            </g>
          );
        })}
      </svg>
      <dl className="mt-3 grid gap-2 text-sm text-muted">
        {functions.map((fn) => (
          <div key={fn.id} className="flex gap-2">
            <dt className="font-bold text-ink">{fn.label ?? fn.id}:</dt>
            <dd>{expressionToDisplay(fn.expression)}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

function GraphGrid({ viewport, width, height }: { viewport: GraphViewport; width: number; height: number }) {
  const xStep = viewport.xStep ?? 1;
  const yStep = viewport.yStep ?? 1;
  const vertical = [];
  const horizontal = [];
  for (let x = Math.ceil(viewport.xMin / xStep) * xStep; x <= viewport.xMax; x += xStep) vertical.push(x);
  for (let y = Math.ceil(viewport.yMin / yStep) * yStep; y <= viewport.yMax; y += yStep) horizontal.push(y);
  return (
    <g aria-hidden="true">
      {vertical.map((x) => {
        const sx = graphPointToSvg({ x, y: 0 }, viewport, width, height).x;
        return <line key={`x-${x}`} x1={sx} x2={sx} y1={0} y2={height} className="stroke-line" strokeWidth={1} />;
      })}
      {horizontal.map((y) => {
        const sy = graphPointToSvg({ x: 0, y }, viewport, width, height).y;
        return <line key={`y-${y}`} x1={0} x2={width} y1={sy} y2={sy} className="stroke-line" strokeWidth={1} />;
      })}
    </g>
  );
}

function TangentLine({ tangent, viewport, width, height }: { tangent: { x: number; y: number; gradient: number }; viewport: GraphViewport; width: number; height: number }) {
  const left = { x: viewport.xMin, y: tangent.y + tangent.gradient * (viewport.xMin - tangent.x) };
  const right = { x: viewport.xMax, y: tangent.y + tangent.gradient * (viewport.xMax - tangent.x) };
  const a = graphPointToSvg(left, viewport, width, height);
  const b = graphPointToSvg(right, viewport, width, height);
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-warning" strokeWidth={2.5} strokeDasharray="8 6" data-testid="graph-tangent" />;
}

function curveClass(role: GraphFunctionDefinition["styleRole"]) {
  if (role === "derivative") return "stroke-success";
  if (role === "secondary") return "stroke-muted";
  if (role === "answer") return "stroke-warning";
  return "stroke-forge";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
