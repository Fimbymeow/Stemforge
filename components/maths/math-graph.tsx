"use client";

import { useId, useMemo } from "react";
import { evaluateMathExpression, exactToNumber, expressionToDisplay } from "@/lib/maths/expression-core";
import { buildGraphModel } from "@/lib/maths/graph-model";
import { graphPointToSvg, segmentToSvgPath } from "@/lib/maths/graph-sampling";
import type { GraphAxisConfig, GraphBoundary, GraphFunctionDefinition, GraphLabelPlacement, GraphPoint, GraphRegion, GraphViewport } from "@/lib/maths/expression-types";

type MathGraphProps = {
  title: string;
  description: string;
  viewport: GraphViewport;
  functions: GraphFunctionDefinition[];
  axes?: GraphAxisConfig;
  boundaries?: GraphBoundary[];
  regions?: GraphRegion[];
  points?: GraphPoint[];
  selectedX?: number;
  tangent?: { x: number; y: number; gradient: number };
  height?: number;
};

const WIDTH = 640;

export function MathGraph({ title, description, viewport, functions, axes, boundaries = [], regions = [], points = [], selectedX, tangent, height = 360 }: MathGraphProps) {
  const uid = useId().replace(/:/g, "");
  const ids = { title: `graph-${uid}-title`, desc: `graph-${uid}-desc`, clip: `graph-${uid}-clip` };
  const result = useMemo(() => buildGraphModel({ viewport, functions, axes, boundaries, regions, keyPoints: points }, WIDTH, height), [axes, boundaries, functions, height, points, regions, viewport]);
  if (result.status === "invalid") {
    return (
      <figure className="rounded-2xl border border-line bg-white p-4" data-testid="math-graph-invalid" role="status">
        <figcaption><h3 className="m-0 text-base font-extrabold">{title}</h3></figcaption>
        <p className="mt-2 text-sm text-muted">This graph is unavailable because its declaration could not be validated.</p>
      </figure>
    );
  }

  const xAxis = graphPointToSvg({ x: 0, y: 0 }, viewport, WIDTH, height).y;
  const yAxis = graphPointToSvg({ x: 0, y: 0 }, viewport, WIDTH, height).x;
  const selected = selectedX === undefined ? null : graphPointToSvg({ x: selectedX, y: 0 }, viewport, WIDTH, height).x;
  const regionDescriptions = regions.map((region) => region.description).join(" ");

  return (
    <figure className="rounded-2xl border border-line bg-white p-4" data-testid="math-graph">
      <figcaption>
        <h3 className="m-0 text-base font-extrabold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </figcaption>
      <svg className="mt-4 block h-auto w-full" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={`${ids.title} ${ids.desc}`} focusable="false">
        <title id={ids.title}>{title}</title>
        <desc id={ids.desc}>{description}. Viewport x {viewport.xMin} to {viewport.xMax}, y {viewport.yMin} to {viewport.yMax}. {regionDescriptions}</desc>
        <defs><clipPath id={ids.clip}><rect width={WIDTH} height={height} /></clipPath></defs>
        <g clipPath={`url(#${ids.clip})`}>
          {axes?.grid === "selected" ? <GraphGrid axes={axes} viewport={viewport} width={WIDTH} height={height} /> : null}
          {xAxis >= 0 && xAxis <= height ? <line x1={0} x2={WIDTH} y1={xAxis} y2={xAxis} className="stroke-ink" strokeWidth={1.6} /> : null}
          {yAxis >= 0 && yAxis <= WIDTH ? <line y1={0} y2={height} x1={yAxis} x2={yAxis} className="stroke-ink" strokeWidth={1.6} /> : null}
          <AxisTicks axes={axes} viewport={viewport} width={WIDTH} height={height} />
          {result.model.regions.map((region) => <path key={region.id} d={region.path} className="fill-forge/15 stroke-forge/25" strokeWidth={1} data-testid={`graph-region-${region.id}`} />)}
          {boundaries.map((boundary) => <Boundary key={boundary.id} boundary={boundary} viewport={viewport} width={WIDTH} height={height} />)}
          {result.model.curves.map(({ definition, segments }) => segments.map((segment, index) => (
            <path key={`${definition.id}-${index}`} d={segmentToSvgPath(segment, viewport, WIDTH, height)} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={curveClass(definition.styleRole)} data-testid={`graph-curve-${definition.id}`} />
          )))}
          {functions.map((definition) => <CurveLabel key={`label-${definition.id}`} definition={definition} viewport={viewport} width={WIDTH} height={height} />)}
          {selected !== null ? <line x1={selected} x2={selected} y1={0} y2={height} className="stroke-forge/50" strokeDasharray="6 6" strokeWidth={2} /> : null}
          {tangent ? <TangentLine tangent={tangent} viewport={viewport} width={WIDTH} height={height} /> : null}
          {points.map((point) => <GraphPointMark key={point.id ?? `${exactToNumber(point.x)}:${exactToNumber(point.y)}:${point.label ?? ""}`} point={point} viewport={viewport} width={WIDTH} height={height} />)}
        </g>
        {axes?.xLabel ? <text x={WIDTH - 8} y={Math.min(height - 8, Math.max(26, xAxis - 8))} textAnchor="end" className="fill-ink text-[26px] font-bold sm:text-[15px]">{axes.xLabel}</text> : null}
        {axes?.yLabel ? <text x={Math.min(WIDTH - 10, Math.max(10, yAxis + 10))} y={26} className="fill-ink text-[26px] font-bold sm:text-[15px]">{axes.yLabel}</text> : null}
      </svg>
      <dl className="mt-3 grid gap-2 text-sm text-muted">
        {functions.map((fn) => <div key={fn.id} className="flex gap-2"><dt className="font-bold text-ink">{fn.label ?? fn.id}:</dt><dd>{expressionToDisplay(fn.expression)}</dd></div>)}
      </dl>
    </figure>
  );
}

function GraphGrid({ axes, viewport, width, height }: { axes: GraphAxisConfig; viewport: GraphViewport; width: number; height: number }) {
  return <g aria-hidden="true">{(axes.xTicks ?? []).map((x) => { const sx = graphPointToSvg({ x, y: 0 }, viewport, width, height).x; return <line key={`gx-${x}`} x1={sx} x2={sx} y1={0} y2={height} className="stroke-line" />; })}{(axes.yTicks ?? []).map((y) => { const sy = graphPointToSvg({ x: 0, y }, viewport, width, height).y; return <line key={`gy-${y}`} x1={0} x2={width} y1={sy} y2={sy} className="stroke-line" />; })}</g>;
}

function AxisTicks({ axes, viewport, width, height }: { axes?: GraphAxisConfig; viewport: GraphViewport; width: number; height: number }) {
  if (!axes) return null;
  const xAxisY = Math.min(height - 16, Math.max(16, graphPointToSvg({ x: 0, y: 0 }, viewport, width, height).y));
  const yAxisX = Math.min(width - 28, Math.max(28, graphPointToSvg({ x: 0, y: 0 }, viewport, width, height).x));
  return <g aria-hidden="true" className="fill-muted text-[21px] sm:text-[13px]">{(axes.xTicks ?? []).map((x) => { const sx = graphPointToSvg({ x, y: 0 }, viewport, width, height).x; return <g key={`tx-${x}`}><line x1={sx} x2={sx} y1={xAxisY - 4} y2={xAxisY + 4} className="stroke-ink" /><text x={sx} y={xAxisY + 25} textAnchor="middle">{formatNumber(x)}</text></g>; })}{(axes.yTicks ?? []).map((y) => { const sy = graphPointToSvg({ x: 0, y }, viewport, width, height).y; return <g key={`ty-${y}`}><line x1={yAxisX - 4} x2={yAxisX + 4} y1={sy} y2={sy} className="stroke-ink" /><text x={yAxisX - 7} y={sy + 7} textAnchor="end">{formatNumber(y)}</text></g>; })}</g>;
}

function Boundary({ boundary, viewport, width, height }: { boundary: GraphBoundary; viewport: GraphViewport; width: number; height: number }) {
  const point = graphPointToSvg({ x: boundary.axis === "x" ? boundary.value : 0, y: boundary.axis === "y" ? boundary.value : 0 }, viewport, width, height);
  const vertical = boundary.axis === "x";
  const anchor = vertical ? { x: point.x, y: 18 } : { x: width - 8, y: point.y };
  const offset = labelOffset(boundary.labelPlacement ?? (vertical ? "right" : "above"));
  return <g data-testid={`graph-boundary-${boundary.id}`}><line x1={vertical ? point.x : 0} x2={vertical ? point.x : width} y1={vertical ? 0 : point.y} y2={vertical ? height : point.y} className="stroke-muted" strokeWidth={1.8} strokeDasharray={boundary.style === "solid" ? undefined : "6 5"} />{boundary.label ? <text x={anchor.x + offset.x} y={anchor.y + offset.y} textAnchor={offset.anchor} className="fill-muted text-[23px] font-bold sm:text-[14px]">{boundary.label}</text> : null}</g>;
}

function CurveLabel({ definition, viewport, width, height }: { definition: GraphFunctionDefinition; viewport: GraphViewport; width: number; height: number }) {
  if (!definition.label || definition.labelAtX === undefined) return null;
  const evaluated = evaluateMathExpression(definition.expression, definition.labelAtX);
  if (evaluated.status !== "value" || evaluated.value < viewport.yMin || evaluated.value > viewport.yMax) return null;
  const point = graphPointToSvg({ x: definition.labelAtX, y: evaluated.value }, viewport, width, height);
  const offset = labelOffset(definition.labelPlacement ?? "above");
  return <text x={point.x + offset.x} y={point.y + offset.y} textAnchor={offset.anchor} className="fill-ink text-[25px] font-bold sm:text-[15px]">{definition.label}</text>;
}

function GraphPointMark({ point, viewport, width, height }: { point: GraphPoint; viewport: GraphViewport; width: number; height: number }) {
  const x = exactToNumber(point.x); const y = exactToNumber(point.y); const svg = graphPointToSvg({ x, y }, viewport, width, height); const offset = labelOffset(point.labelPlacement ?? "above");
  return <g aria-hidden="true"><circle cx={svg.x} cy={svg.y} r={6} className="fill-white stroke-forge" strokeWidth={3} />{point.label ? <text x={svg.x + offset.x} y={svg.y + offset.y} textAnchor={offset.anchor} className="fill-ink text-[23px] font-bold sm:text-[14px]">{point.label}</text> : null}</g>;
}

function TangentLine({ tangent, viewport, width, height }: { tangent: { x: number; y: number; gradient: number }; viewport: GraphViewport; width: number; height: number }) {
  const a = graphPointToSvg({ x: viewport.xMin, y: tangent.y + tangent.gradient * (viewport.xMin - tangent.x) }, viewport, width, height);
  const b = graphPointToSvg({ x: viewport.xMax, y: tangent.y + tangent.gradient * (viewport.xMax - tangent.x) }, viewport, width, height);
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-warning" strokeWidth={2.5} strokeDasharray="8 6" data-testid="graph-tangent" />;
}

function labelOffset(placement: GraphLabelPlacement) {
  if (placement === "below") return { x: 0, y: 20, anchor: "middle" as const };
  if (placement === "left") return { x: -9, y: 5, anchor: "end" as const };
  if (placement === "right") return { x: 9, y: 5, anchor: "start" as const };
  return { x: 0, y: -10, anchor: "middle" as const };
}
function curveClass(role: GraphFunctionDefinition["styleRole"]) { if (role === "derivative") return "stroke-success"; if (role === "secondary") return "stroke-muted"; if (role === "answer") return "stroke-warning"; return "stroke-forge"; }
function formatNumber(value: number) { return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(4))); }
