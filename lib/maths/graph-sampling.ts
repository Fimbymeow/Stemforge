import { evaluateMathExpression } from "@/lib/maths/expression-core";
import type { GraphViewport, MathExpression, SampledSegment } from "@/lib/maths/expression-types";

export type GraphSamplingOptions = {
  samples?: number;
  discontinuityThreshold?: number;
};

export function sampleExpressionForGraph(
  expression: MathExpression,
  viewport: GraphViewport,
  options: GraphSamplingOptions = {},
): SampledSegment[] {
  const samples = Math.max(16, Math.min(options.samples ?? 160, 600));
  const discontinuityThreshold = options.discontinuityThreshold ?? Math.max(20, Math.abs(viewport.yMax - viewport.yMin) * 3);
  const dx = (viewport.xMax - viewport.xMin) / samples;
  const segments: SampledSegment[] = [];
  let current: SampledSegment = [];
  let previousY: number | null = null;

  for (let index = 0; index <= samples; index += 1) {
    const x = viewport.xMin + dx * index;
    const result = evaluateMathExpression(expression, x);
    if (result.status !== "value" || result.value < viewport.yMin - discontinuityThreshold || result.value > viewport.yMax + discontinuityThreshold) {
      if (current.length > 0) segments.push(current);
      current = [];
      previousY = null;
      continue;
    }
    if (previousY !== null && Math.abs(result.value - previousY) > discontinuityThreshold) {
      if (current.length > 0) segments.push(current);
      current = [];
    }
    current.push({ x, y: result.value });
    previousY = result.value;
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

export function graphPointToSvg(point: { x: number; y: number }, viewport: GraphViewport, width: number, height: number) {
  return {
    x: ((point.x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * width,
    y: height - ((point.y - viewport.yMin) / (viewport.yMax - viewport.yMin)) * height,
  };
}

export function segmentToSvgPath(segment: SampledSegment, viewport: GraphViewport, width: number, height: number) {
  return segment.map((point, index) => {
    const svg = graphPointToSvg(point, viewport, width, height);
    return `${index === 0 ? "M" : "L"}${svg.x.toFixed(2)} ${svg.y.toFixed(2)}`;
  }).join(" ");
}
