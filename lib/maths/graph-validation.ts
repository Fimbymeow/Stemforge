import { validateMathExpression } from "@/lib/maths/expression-core";
import type { GraphFunctionDefinition, GraphViewport } from "@/lib/maths/expression-types";

export type GraphDefinitionValidationIssue = { code: string; message: string };

export function validateGraphDefinition(input: {
  viewport: GraphViewport;
  functions: GraphFunctionDefinition[];
  linkedDerivative?: { originalFunctionId: string; derivativeFunctionId: string };
}): GraphDefinitionValidationIssue[] {
  const issues: GraphDefinitionValidationIssue[] = [];
  const { viewport } = input;
  if (!viewport || !Number.isFinite(viewport.xMin) || !Number.isFinite(viewport.xMax)
      || !Number.isFinite(viewport.yMin) || !Number.isFinite(viewport.yMax)
      || viewport.xMin >= viewport.xMax || viewport.yMin >= viewport.yMax) {
    issues.push({ code: "invalid-graph-viewport", message: "Graph viewport must contain finite increasing x and y bounds." });
  }
  if (!Array.isArray(input.functions) || input.functions.length === 0) {
    issues.push({ code: "empty-graph-functions", message: "Graph must declare at least one function." });
    return issues;
  }
  const ids = new Set<string>();
  for (const graphFunction of input.functions) {
    if (!graphFunction.id || ids.has(graphFunction.id)) issues.push({ code: "invalid-graph-function-id", message: `Graph function ID "${graphFunction.id || "missing"}" is missing or duplicated.` });
    ids.add(graphFunction.id);
    const expression = validateMathExpression(graphFunction.expression);
    if (expression.status !== "valid") issues.push({ code: "invalid-graph-expression", message: `Graph function "${graphFunction.id}" has unsupported expression: ${expression.reasonCode}.` });
  }
  if (input.linkedDerivative && (!ids.has(input.linkedDerivative.originalFunctionId) || !ids.has(input.linkedDerivative.derivativeFunctionId))) {
    issues.push({ code: "invalid-linked-derivative-reference", message: "Linked derivative references a missing graph function." });
  }
  return issues;
}
