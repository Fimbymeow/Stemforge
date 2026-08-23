import { evaluateMathExpression, exactToNumber, validateMathExpression } from "@/lib/maths/expression-core";
import type { GraphAxisConfig, GraphBoundary, GraphFunctionDefinition, GraphPoint, GraphRegion, GraphViewport, MathExpression } from "@/lib/maths/expression-types";

export type GraphDefinitionValidationIssue = { code: string; message: string };

export const GRAPH_LIMITS = {
  maxFunctions: 6, maxRegions: 4, maxBoundaries: 12, maxPoints: 16, maxTicksPerAxis: 20,
  maxViewportSpan: 10_000, minViewportSpan: 1e-6,
} as const;

type GraphDefinitionInput = {
  viewport: GraphViewport;
  functions: GraphFunctionDefinition[];
  linkedDerivative?: { originalFunctionId: string; derivativeFunctionId: string };
  axes?: GraphAxisConfig;
  boundaries?: GraphBoundary[];
  regions?: GraphRegion[];
  keyPoints?: GraphPoint[];
};

export function validateGraphDefinition(input: GraphDefinitionInput): GraphDefinitionValidationIssue[] {
  const issues: GraphDefinitionValidationIssue[] = [];
  const { viewport } = input;
  const viewportIsValid = validViewport(viewport);
  if (!viewportIsValid) issues.push({ code: "invalid-graph-viewport", message: "Graph viewport must contain finite increasing x and y bounds within the supported size limits." });
  if (!Array.isArray(input.functions) || input.functions.length === 0) {
    issues.push({ code: "empty-graph-functions", message: "Graph must declare at least one function." });
    return issues;
  }
  if (input.functions.length > GRAPH_LIMITS.maxFunctions) issues.push({ code: "too-many-graph-functions", message: `Graph may declare at most ${GRAPH_LIMITS.maxFunctions} functions.` });

  const ids = new Set<string>();
  const functions = new Map<string, GraphFunctionDefinition>();
  for (const graphFunction of input.functions) {
    if (!validId(graphFunction?.id) || ids.has(graphFunction.id)) {
      issues.push({ code: "invalid-graph-function-id", message: `Graph function ID "${graphFunction?.id || "missing"}" is invalid or duplicated.` });
      continue;
    }
    ids.add(graphFunction.id);
    functions.set(graphFunction.id, graphFunction);
    const expression = validateMathExpression(graphFunction.expression);
    if (expression.status !== "valid") issues.push({ code: "invalid-graph-expression", message: `Graph function "${graphFunction.id}" has unsupported expression: ${expression.reasonCode}.` });
    if (!(["primary", "secondary", "derivative", "construction", "answer"] as unknown[]).includes(graphFunction.styleRole)) issues.push({ code: "invalid-graph-style-role", message: `Graph function "${graphFunction.id}" has an unsupported style role.` });
    if (!validPlacement(graphFunction.labelPlacement)) issues.push({ code: "invalid-graph-label-placement", message: `Graph function "${graphFunction.id}" has an unsupported label placement.` });
    if (graphFunction.labelAtX !== undefined && (!Number.isFinite(graphFunction.labelAtX) || validViewport(viewport) && !within(graphFunction.labelAtX, viewport.xMin, viewport.xMax))) issues.push({ code: "invalid-graph-label-position", message: `Graph function "${graphFunction.id}" label position must lie inside the x viewport.` });
    if (graphFunction.labelAtX !== undefined && evaluateMathExpression(graphFunction.expression, graphFunction.labelAtX).status !== "value") issues.push({ code: "invalid-graph-label-domain", message: `Graph function "${graphFunction.id}" label position is outside the curve domain.` });
  }
  if (input.linkedDerivative && (!ids.has(input.linkedDerivative.originalFunctionId) || !ids.has(input.linkedDerivative.derivativeFunctionId))) issues.push({ code: "invalid-linked-derivative-reference", message: "Linked derivative references a missing graph function." });
  if (viewportIsValid) {
    validateTicks(input.axes, viewport, issues);
    validateBoundaries(input.boundaries ?? [], viewport, issues);
    validatePoints(input.keyPoints ?? [], viewport, issues);
    validateRegions(input.regions ?? [], viewport, functions, issues);
  }
  return issues;
}

function validViewport(viewport: GraphViewport | undefined): viewport is GraphViewport {
  if (!viewport || !finite(viewport.xMin, viewport.xMax, viewport.yMin, viewport.yMax)) return false;
  const xSpan = viewport.xMax - viewport.xMin;
  const ySpan = viewport.yMax - viewport.yMin;
  return xSpan >= GRAPH_LIMITS.minViewportSpan && ySpan >= GRAPH_LIMITS.minViewportSpan
    && xSpan <= GRAPH_LIMITS.maxViewportSpan && ySpan <= GRAPH_LIMITS.maxViewportSpan
    && validStep(viewport.xStep) && validStep(viewport.yStep);
}

function validateTicks(axes: GraphAxisConfig | undefined, viewport: GraphViewport, issues: GraphDefinitionValidationIssue[]) {
  if (!axes) return;
  if (axes.grid !== undefined && axes.grid !== "none" && axes.grid !== "selected") issues.push({ code: "invalid-graph-grid", message: "Graph grid mode must be none or selected." });
  for (const [axis, ticks, min, max] of [["x", axes.xTicks, viewport.xMin, viewport.xMax], ["y", axes.yTicks, viewport.yMin, viewport.yMax]] as const) {
    if (!ticks) continue;
    if (!Array.isArray(ticks) || ticks.length > GRAPH_LIMITS.maxTicksPerAxis || ticks.some((value) => !Number.isFinite(value) || !within(value, min, max))) issues.push({ code: "invalid-graph-ticks", message: `${axis}-axis ticks must be finite, lie inside the viewport and contain at most ${GRAPH_LIMITS.maxTicksPerAxis} values.` });
  }
}

function validateBoundaries(boundaries: GraphBoundary[], viewport: GraphViewport, issues: GraphDefinitionValidationIssue[]) {
  if (!Array.isArray(boundaries) || boundaries.length > GRAPH_LIMITS.maxBoundaries) {
    issues.push({ code: "invalid-graph-boundaries", message: `Graph may declare at most ${GRAPH_LIMITS.maxBoundaries} boundaries.` });
    return;
  }
  const ids = new Set<string>();
  for (const boundary of boundaries) {
    if (!validId(boundary?.id) || ids.has(boundary.id) || !Number.isFinite(boundary.value) || !(["x", "y"] as unknown[]).includes(boundary.axis)) {
      issues.push({ code: "invalid-graph-boundary", message: "Each graph boundary needs a unique ID, a supported axis and a finite value." });
      continue;
    }
    ids.add(boundary.id);
    if (!validPlacement(boundary.labelPlacement) || boundary.style !== undefined && boundary.style !== "solid" && boundary.style !== "dashed") issues.push({ code: "invalid-graph-boundary-style", message: `Boundary "${boundary.id}" has an unsupported label placement or line style.` });
    const [min, max] = boundary.axis === "x" ? [viewport.xMin, viewport.xMax] : [viewport.yMin, viewport.yMax];
    if (!within(boundary.value, min, max)) issues.push({ code: "graph-boundary-outside-viewport", message: `Boundary "${boundary.id}" lies outside the viewport.` });
  }
}

function validatePoints(points: GraphPoint[], viewport: GraphViewport, issues: GraphDefinitionValidationIssue[]) {
  if (!Array.isArray(points) || points.length > GRAPH_LIMITS.maxPoints) {
    issues.push({ code: "invalid-graph-points", message: `Graph may declare at most ${GRAPH_LIMITS.maxPoints} points.` });
    return;
  }
  for (const point of points) {
    const x = safeExact(point?.x); const y = safeExact(point?.y);
    if (x === null || y === null || !within(x, viewport.xMin, viewport.xMax) || !within(y, viewport.yMin, viewport.yMax)) issues.push({ code: "invalid-graph-point", message: "Graph points must use finite exact coordinates inside the viewport." });
    if (!validPlacement(point?.labelPlacement)) issues.push({ code: "invalid-graph-label-placement", message: "Graph point has an unsupported label placement." });
  }
}

function validateRegions(regions: GraphRegion[], viewport: GraphViewport, functions: Map<string, GraphFunctionDefinition>, issues: GraphDefinitionValidationIssue[]) {
  if (!Array.isArray(regions) || regions.length > GRAPH_LIMITS.maxRegions) {
    issues.push({ code: "invalid-graph-regions", message: `Graph may declare at most ${GRAPH_LIMITS.maxRegions} shaded regions.` });
    return;
  }
  const ids = new Set<string>();
  for (const region of regions) {
    if (!validId(region?.id) || ids.has(region.id) || !region.description?.trim() || !finite(region.fromX, region.toX) || region.fromX >= region.toX || region.fromX < viewport.xMin || region.toX > viewport.xMax) {
      issues.push({ code: "invalid-graph-region", message: "Each shaded region needs a unique ID, a description and increasing x bounds inside the viewport." });
      continue;
    }
    ids.add(region.id);
    const curveIds = region.type === "curve-to-constant" ? [region.curveId] : region.type === "between-curves" ? [region.curveAId, region.curveBId] : [];
    if (!curveIds.length || curveIds.some((id) => !functions.has(id))) {
      issues.push({ code: "invalid-graph-region-reference", message: `Region "${region.id}" references a missing curve or unsupported region type.` });
      continue;
    }
    if (region.type === "curve-to-constant" && !Number.isFinite(region.baseline)) {
      issues.push({ code: "invalid-graph-region-baseline", message: `Region "${region.id}" requires a finite baseline.` });
      continue;
    }
    if (!regionCanBeEvaluated(region, functions)) issues.push({ code: "unsafe-graph-region-domain", message: `Region "${region.id}" crosses an unsupported domain or a curve crossing. Split or correct the region before rendering.` });
  }
}

function regionCanBeEvaluated(region: GraphRegion, functions: Map<string, GraphFunctionDefinition>) {
  const a = functions.get(region.type === "curve-to-constant" ? region.curveId : region.curveAId)!;
  const b = region.type === "between-curves" ? functions.get(region.curveBId)! : null;
  const baseline = region.type === "curve-to-constant" ? region.baseline : 0;
  for (let index = 0; index < 512; index += 1) {
    const fromX = region.fromX + (region.toX - region.fromX) * index / 512;
    const toX = region.fromX + (region.toX - region.fromX) * (index + 1) / 512;
    const aRange = intervalForExpression(a.expression, fromX, toX);
    const bRange = b ? intervalForExpression(b.expression, fromX, toX) : { min: baseline, max: baseline };
    if (!aRange || !bRange) return false;
    const difference = { min: aRange.min - bRange.max, max: aRange.max - bRange.min };
    if (difference.min <= 1e-10 && difference.max >= -1e-10) return false;
  }
  return true;
}

type NumericInterval = { min: number; max: number };

/** Conservative interval arithmetic: regions render only when curve ordering is provable. */
function intervalForExpression(expression: MathExpression, xMin: number, xMax: number): NumericInterval | null {
  switch (expression.type) {
    case "constant": {
      const value = exactToNumber(expression.value);
      return Number.isFinite(value) ? { min: value, max: value } : null;
    }
    case "variable": return { min: xMin, max: xMax };
    case "add": {
      let result = { min: 0, max: 0 };
      for (const term of expression.terms) {
        const range = intervalForExpression(term, xMin, xMax);
        if (!range) return null;
        result = { min: result.min + range.min, max: result.max + range.max };
      }
      return finiteInterval(result);
    }
    case "multiply": {
      let result = { min: 1, max: 1 };
      for (const factor of expression.factors) {
        const range = intervalForExpression(factor, xMin, xMax);
        if (!range) return null;
        const candidates = [result.min * range.min, result.min * range.max, result.max * range.min, result.max * range.max];
        result = { min: Math.min(...candidates), max: Math.max(...candidates) };
      }
      return finiteInterval(result);
    }
    case "power": {
      const base = intervalForExpression(expression.base, xMin, xMax);
      const exponent = exactToNumber(expression.exponent);
      if (!base || !Number.isFinite(exponent)) return null;
      if (Number.isInteger(exponent)) return integerPowerInterval(base, exponent);
      if (base.min < 0 || exponent < 0 && base.min <= 0) return null;
      return finiteInterval({ min: Math.pow(base.min, exponent), max: Math.pow(base.max, exponent) });
    }
    case "sin":
    case "cos": return intervalForExpression(expression.argument, xMin, xMax) ? { min: -1, max: 1 } : null;
    case "tan": return null;
    case "exp": {
      const argument = intervalForExpression(expression.argument, xMin, xMax);
      return argument ? finiteInterval({ min: Math.exp(argument.min), max: Math.exp(argument.max) }) : null;
    }
    case "log": {
      const argument = intervalForExpression(expression.argument, xMin, xMax);
      return argument && argument.min > 0 ? finiteInterval({ min: Math.log(argument.min), max: Math.log(argument.max) }) : null;
    }
  }
}

function integerPowerInterval(base: NumericInterval, exponent: number): NumericInterval | null {
  if (exponent < 0) {
    if (base.min <= 0 && base.max >= 0) return null;
    const positive = integerPowerInterval(base, -exponent);
    if (!positive || positive.min === 0) return null;
    return finiteInterval({ min: 1 / positive.max, max: 1 / positive.min });
  }
  if (exponent === 0) return { min: 1, max: 1 };
  const left = Math.pow(base.min, exponent);
  const right = Math.pow(base.max, exponent);
  const min = exponent % 2 === 0 && base.min <= 0 && base.max >= 0 ? 0 : Math.min(left, right);
  return finiteInterval({ min, max: Math.max(left, right) });
}

function finiteInterval(value: NumericInterval): NumericInterval | null {
  return Number.isFinite(value.min) && Number.isFinite(value.max) && value.min <= value.max ? value : null;
}

function validId(value: unknown): value is string { return typeof value === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(value); }
function validPlacement(value: unknown) { return value === undefined || value === "above" || value === "below" || value === "left" || value === "right"; }
function validStep(value: number | undefined) { return value === undefined || Number.isFinite(value) && value > 0; }
function within(value: number, min: number, max: number) { return value >= min && value <= max; }
function finite(...values: number[]) { return values.every(Number.isFinite); }
function safeExact(value: GraphPoint["x"] | undefined) {
  if (!value || !Number.isInteger(value.numerator) || !Number.isInteger(value.denominator ?? 1) || (value.denominator ?? 1) === 0) return null;
  const number = exactToNumber(value);
  return Number.isFinite(number) ? number : null;
}
