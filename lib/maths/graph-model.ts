import { evaluateMathExpression } from "@/lib/maths/expression-core";
import { graphPointToSvg } from "@/lib/maths/graph-sampling";
import { validateGraphDefinition, type GraphDefinitionValidationIssue } from "@/lib/maths/graph-validation";
import type { GraphAxisConfig, GraphBoundary, GraphFunctionDefinition, GraphPoint, GraphRegion, GraphViewport, SampledPoint, SampledSegment } from "@/lib/maths/expression-types";

export type GraphModelInput = {
  viewport: GraphViewport;
  functions: GraphFunctionDefinition[];
  axes?: GraphAxisConfig;
  boundaries?: GraphBoundary[];
  regions?: GraphRegion[];
  keyPoints?: GraphPoint[];
};

export type GraphRegionModel = { id: string; description: string; path: string };
export type GraphModel = {
  curves: Array<{ definition: GraphFunctionDefinition; segments: SampledSegment[] }>;
  regions: GraphRegionModel[];
};
export type GraphModelResult = { status: "ready"; model: GraphModel } | { status: "invalid"; issues: GraphDefinitionValidationIssue[] };

const BASE_INTERVALS = 96;
const MAX_REFINEMENT_DEPTH = 8;
const MAX_SCREEN_ERROR = 0.75;
const REGION_SAMPLES = 256;
const MAX_MODEL_POINTS = 12_000;

/**
 * Builds immutable SVG-ready geometry from a validated graph declaration. The x
 * and y scales are intentionally independent mathematical transforms into a
 * fixed viewBox; responsive CSS preserves that viewBox aspect ratio.
 */
export function buildGraphModel(input: GraphModelInput, width: number, height: number): GraphModelResult {
  const issues = validateGraphDefinition(input);
  if (issues.length) return { status: "invalid", issues };
  const curves = input.functions.map((definition) => ({ definition, segments: adaptiveSample(definition, input.viewport, width, height) }));
  if (curves.reduce((total, curve) => total + curve.segments.reduce((count, segment) => count + segment.length, 0), 0) > MAX_MODEL_POINTS) return { status: "invalid", issues: [{ code: "graph-sampling-limit", message: "Graph exceeds the bounded sampling complexity limit." }] };
  const regions: GraphRegionModel[] = [];
  for (const region of input.regions ?? []) {
    const path = regionPath(region, input.functions, input.viewport, width, height);
    if (!path) return { status: "invalid", issues: [{ code: "unsafe-graph-region-domain", message: `Region "${region.id}" could not be evaluated safely.` }] };
    regions.push({ id: region.id, description: region.description, path });
  }
  return { status: "ready", model: { curves, regions } };
}

export function adaptiveSample(definition: GraphFunctionDefinition, viewport: GraphViewport, width: number, height: number): SampledSegment[] {
  const all: SampledSegment[] = [];
  const dx = (viewport.xMax - viewport.xMin) / BASE_INTERVALS;
  for (let index = 0; index < BASE_INTERVALS; index += 1) {
    const fromX = viewport.xMin + dx * index;
    const toX = index === BASE_INTERVALS - 1 ? viewport.xMax : fromX + dx;
    for (const segment of sampleInterval(definition, viewport, width, height, fromX, toX, 0)) appendSegment(all, segment);
  }
  return all.filter((segment) => segment.length > 1);
}

function sampleInterval(definition: GraphFunctionDefinition, viewport: GraphViewport, width: number, height: number, fromX: number, toX: number, depth: number): SampledSegment[] {
  const midX = (fromX + toX) / 2;
  const left = valueAt(definition, fromX);
  const middle = valueAt(definition, midX);
  const right = valueAt(definition, toX);
  const canRefine = depth < MAX_REFINEMENT_DEPTH;
  if (!left || !middle || !right) {
    if (!left && !middle && !right) return [];
    if (!canRefine) return [];
    return [...sampleInterval(definition, viewport, width, height, fromX, midX, depth + 1), ...sampleInterval(definition, viewport, width, height, midX, toX, depth + 1)];
  }

  const a = graphPointToSvg(left, viewport, width, height);
  const m = graphPointToSvg(middle, viewport, width, height);
  const b = graphPointToSvg(right, viewport, width, height);
  const linearMidY = (a.y + b.y) / 2;
  const screenError = Math.abs(m.y - linearMidY);
  const screenJump = Math.abs(a.y - b.y);
  const farOutside = [a.y, m.y, b.y].some((y) => y < -height * 8 || y > height * 9);
  if (canRefine && (screenError > MAX_SCREEN_ERROR || screenJump > height * 1.5 || farOutside)) {
    return [...sampleInterval(definition, viewport, width, height, fromX, midX, depth + 1), ...sampleInterval(definition, viewport, width, height, midX, toX, depth + 1)];
  }
  if (screenJump > height * 2 || farOutside) return [];
  return [[left, middle, right]];
}

function valueAt(definition: GraphFunctionDefinition, x: number): SampledPoint | null {
  const result = evaluateMathExpression(definition.expression, x);
  return result.status === "value" ? { x, y: result.value } : null;
}

function appendSegment(segments: SampledSegment[], next: SampledSegment) {
  if (!next.length) return;
  const current = segments.at(-1);
  if (current && Math.abs(current.at(-1)!.x - next[0].x) < 1e-10 && Math.abs(current.at(-1)!.y - next[0].y) < 1e-8) current.push(...next.slice(1));
  else segments.push([...next]);
}

function regionPath(region: GraphRegion, functions: GraphFunctionDefinition[], viewport: GraphViewport, width: number, height: number) {
  const curveA = functions.find((candidate) => candidate.id === (region.type === "curve-to-constant" ? region.curveId : region.curveAId));
  const curveB = region.type === "between-curves" ? functions.find((candidate) => candidate.id === region.curveBId) : null;
  const baseline = region.type === "curve-to-constant" ? region.baseline : 0;
  if (!curveA) return null;
  const top: SampledPoint[] = [];
  const bottom: SampledPoint[] = [];
  for (let index = 0; index <= REGION_SAMPLES; index += 1) {
    const x = region.fromX + (region.toX - region.fromX) * index / REGION_SAMPLES;
    const a = valueAt(curveA, x);
    const b = curveB ? valueAt(curveB, x) : { x, y: baseline };
    if (!a || !b) return null;
    top.push(a); bottom.push(b);
  }
  const points = [...top, ...bottom.reverse()].map((point) => graphPointToSvg(point, viewport, width, height));
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ") + " Z";
}
