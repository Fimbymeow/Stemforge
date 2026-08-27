import type { GraphQuestionConfig } from "@/data/types";
import type {
  ExactNumber,
  GraphAxisConfig,
  GraphBoundary,
  GraphFunctionDefinition,
  GraphPoint,
  GraphRegion,
  MathExpression,
} from "@/lib/maths/expression-types";
import { validateGraphDefinition } from "@/lib/maths/graph-validation";
import type { ImportDiagnostic } from "@/lib/content-import/types";

const PROTOTYPE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const SAFE_ID = /^[a-z][a-z0-9-]{0,63}$/;

type ParsedYamlLine = { indent: number; text: string; line: number };
type YamlResult = { value?: unknown; diagnostics: ImportDiagnostic[] };

export function parseGraphConfigYaml(text: string, absoluteStartLine = 1): {
  graphConfig?: GraphQuestionConfig;
  diagnostics: ImportDiagnostic[];
} {
  const parsed = parseBoundedYaml(text, absoluteStartLine);
  if (parsed.diagnostics.length || !parsed.value) return { diagnostics: parsed.diagnostics };
  const diagnostics: ImportDiagnostic[] = [];
  const root = record(parsed.value, "graphConfig", diagnostics, absoluteStartLine);
  if (!root) return { diagnostics };
  exactKeys(root, ["version", "title", "description", "viewport", "axes", "functions", "boundaries", "regions", "keyPoints"], "graphConfig", diagnostics, absoluteStartLine);

  const viewportRecord = record(root.viewport, "graphConfig.viewport", diagnostics, absoluteStartLine);
  if (viewportRecord) exactKeys(viewportRecord, ["xMin", "xMax", "yMin", "yMax", "xStep", "yStep"], "graphConfig.viewport", diagnostics, absoluteStartLine);
  const viewport = viewportRecord ? {
    xMin: numberValue(viewportRecord.xMin, "viewport.xMin", diagnostics, absoluteStartLine),
    xMax: numberValue(viewportRecord.xMax, "viewport.xMax", diagnostics, absoluteStartLine),
    yMin: numberValue(viewportRecord.yMin, "viewport.yMin", diagnostics, absoluteStartLine),
    yMax: numberValue(viewportRecord.yMax, "viewport.yMax", diagnostics, absoluteStartLine),
    ...(viewportRecord.xStep === undefined ? {} : { xStep: numberValue(viewportRecord.xStep, "viewport.xStep", diagnostics, absoluteStartLine) }),
    ...(viewportRecord.yStep === undefined ? {} : { yStep: numberValue(viewportRecord.yStep, "viewport.yStep", diagnostics, absoluteStartLine) }),
  } : undefined;

  const functions = parseFunctions(root.functions, diagnostics, absoluteStartLine);
  const axes = root.axes === undefined ? undefined : parseAxes(root.axes, diagnostics, absoluteStartLine);
  const boundaries = root.boundaries === undefined ? undefined : parseBoundaries(root.boundaries, diagnostics, absoluteStartLine);
  const regions = root.regions === undefined ? undefined : parseRegions(root.regions, diagnostics, absoluteStartLine);
  const keyPoints = root.keyPoints === undefined ? undefined : parsePoints(root.keyPoints, diagnostics, absoluteStartLine);
  const version = numberValue(root.version, "graphConfig.version", diagnostics, absoluteStartLine);
  const title = stringValue(root.title, "graphConfig.title", diagnostics, absoluteStartLine);
  const description = stringValue(root.description, "graphConfig.description", diagnostics, absoluteStartLine);
  if (version !== 1) diagnostics.push(error("unsupported_graph_config_version", "graphConfig.version must be 1.", absoluteStartLine));
  if (diagnostics.length || !viewport || !functions) return { diagnostics };

  const graphConfig: GraphQuestionConfig = {
    version: 1,
    title,
    description,
    viewport,
    functions,
    ...(axes ? { axes } : {}),
    ...(boundaries ? { boundaries } : {}),
    ...(regions ? { regions } : {}),
    ...(keyPoints ? { keyPoints } : {}),
  };
  for (const issue of validateGraphDefinition(graphConfig)) {
    diagnostics.push(error(issue.code.replaceAll("-", "_"), issue.message, absoluteStartLine));
  }
  return diagnostics.length ? { diagnostics } : { graphConfig, diagnostics };
}

export function parseGraphExpression(source: string): MathExpression {
  return new ExpressionParser(source).parse();
}

function parseFunctions(value: unknown, diagnostics: ImportDiagnostic[], line: number): GraphFunctionDefinition[] | undefined {
  const values = list(value, "graphConfig.functions", diagnostics, line);
  if (!values) return undefined;
  return values.flatMap((item, index) => {
    const entry = record(item, `functions[${index}]`, diagnostics, line);
    if (!entry) return [];
    exactKeys(entry, ["id", "expression", "label", "labelAtX", "labelPlacement", "styleRole"], `functions[${index}]`, diagnostics, line);
    let expression: MathExpression | undefined;
    try {
      expression = parseGraphExpression(stringValue(entry.expression, `functions[${index}].expression`, diagnostics, line));
    } catch (caught) {
      diagnostics.push(error("invalid_graph_expression_syntax", caught instanceof Error ? caught.message : "Graph expression is invalid.", line));
    }
    if (!expression) return [];
    return [{
      id: stringValue(entry.id, `functions[${index}].id`, diagnostics, line),
      expression,
      styleRole: enumValue(entry.styleRole, ["primary", "secondary", "derivative", "construction", "answer"] as const, `functions[${index}].styleRole`, diagnostics, line),
      ...(entry.label === undefined ? {} : { label: stringValue(entry.label, `functions[${index}].label`, diagnostics, line) }),
      ...(entry.labelAtX === undefined ? {} : { labelAtX: numberValue(entry.labelAtX, `functions[${index}].labelAtX`, diagnostics, line) }),
      ...(entry.labelPlacement === undefined ? {} : { labelPlacement: placement(entry.labelPlacement, diagnostics, line) }),
    }];
  });
}

function parseAxes(value: unknown, diagnostics: ImportDiagnostic[], line: number): GraphAxisConfig | undefined {
  const entry = record(value, "graphConfig.axes", diagnostics, line);
  if (!entry) return undefined;
  exactKeys(entry, ["xLabel", "yLabel", "xTicks", "yTicks", "grid"], "graphConfig.axes", diagnostics, line);
  return {
    ...(entry.xLabel === undefined ? {} : { xLabel: stringValue(entry.xLabel, "axes.xLabel", diagnostics, line) }),
    ...(entry.yLabel === undefined ? {} : { yLabel: stringValue(entry.yLabel, "axes.yLabel", diagnostics, line) }),
    ...(entry.xTicks === undefined ? {} : { xTicks: numberList(entry.xTicks, "axes.xTicks", diagnostics, line) }),
    ...(entry.yTicks === undefined ? {} : { yTicks: numberList(entry.yTicks, "axes.yTicks", diagnostics, line) }),
    ...(entry.grid === undefined ? {} : { grid: enumValue(entry.grid, ["none", "selected"] as const, "axes.grid", diagnostics, line) }),
  };
}

function parseBoundaries(value: unknown, diagnostics: ImportDiagnostic[], line: number): GraphBoundary[] | undefined {
  const values = list(value, "graphConfig.boundaries", diagnostics, line);
  if (!values) return undefined;
  return values.flatMap((item, index) => {
    const entry = record(item, `boundaries[${index}]`, diagnostics, line);
    if (!entry) return [];
    exactKeys(entry, ["id", "axis", "value", "label", "labelPlacement", "style"], `boundaries[${index}]`, diagnostics, line);
    return [{
      id: stringValue(entry.id, `boundaries[${index}].id`, diagnostics, line),
      axis: enumValue(entry.axis, ["x", "y"] as const, `boundaries[${index}].axis`, diagnostics, line),
      value: numberValue(entry.value, `boundaries[${index}].value`, diagnostics, line),
      ...(entry.label === undefined ? {} : { label: stringValue(entry.label, `boundaries[${index}].label`, diagnostics, line) }),
      ...(entry.labelPlacement === undefined ? {} : { labelPlacement: placement(entry.labelPlacement, diagnostics, line) }),
      ...(entry.style === undefined ? {} : { style: enumValue(entry.style, ["solid", "dashed"] as const, `boundaries[${index}].style`, diagnostics, line) }),
    }];
  });
}

function parseRegions(value: unknown, diagnostics: ImportDiagnostic[], line: number): GraphRegion[] | undefined {
  const values = list(value, "graphConfig.regions", diagnostics, line);
  if (!values) return undefined;
  const output: GraphRegion[] = [];
  values.forEach((item, index) => {
    const entry = record(item, `regions[${index}]`, diagnostics, line);
    if (!entry) return;
    const type = enumValue(entry.type, ["curve-to-constant", "between-curves"] as const, `regions[${index}].type`, diagnostics, line);
    if (type === "curve-to-constant") {
      exactKeys(entry, ["id", "type", "curveId", "fromX", "toX", "baseline", "description"], `regions[${index}]`, diagnostics, line);
      output.push({ id: stringValue(entry.id, `regions[${index}].id`, diagnostics, line), type, curveId: stringValue(entry.curveId, `regions[${index}].curveId`, diagnostics, line), fromX: numberValue(entry.fromX, `regions[${index}].fromX`, diagnostics, line), toX: numberValue(entry.toX, `regions[${index}].toX`, diagnostics, line), baseline: numberValue(entry.baseline, `regions[${index}].baseline`, diagnostics, line), description: stringValue(entry.description, `regions[${index}].description`, diagnostics, line) });
      return;
    }
    exactKeys(entry, ["id", "type", "curveAId", "curveBId", "fromX", "toX", "description"], `regions[${index}]`, diagnostics, line);
    output.push({ id: stringValue(entry.id, `regions[${index}].id`, diagnostics, line), type, curveAId: stringValue(entry.curveAId, `regions[${index}].curveAId`, diagnostics, line), curveBId: stringValue(entry.curveBId, `regions[${index}].curveBId`, diagnostics, line), fromX: numberValue(entry.fromX, `regions[${index}].fromX`, diagnostics, line), toX: numberValue(entry.toX, `regions[${index}].toX`, diagnostics, line), description: stringValue(entry.description, `regions[${index}].description`, diagnostics, line) });
  });
  return output;
}

function parsePoints(value: unknown, diagnostics: ImportDiagnostic[], line: number): GraphPoint[] | undefined {
  const values = list(value, "graphConfig.keyPoints", diagnostics, line);
  if (!values) return undefined;
  return values.flatMap((item, index) => {
    const entry = record(item, `keyPoints[${index}]`, diagnostics, line);
    if (!entry) return [];
    exactKeys(entry, ["id", "x", "y", "label", "labelPlacement"], `keyPoints[${index}]`, diagnostics, line);
    return [{
      x: exactValue(entry.x, `keyPoints[${index}].x`, diagnostics, line),
      y: exactValue(entry.y, `keyPoints[${index}].y`, diagnostics, line),
      ...(entry.id === undefined ? {} : { id: stringValue(entry.id, `keyPoints[${index}].id`, diagnostics, line) }),
      ...(entry.label === undefined ? {} : { label: stringValue(entry.label, `keyPoints[${index}].label`, diagnostics, line) }),
      ...(entry.labelPlacement === undefined ? {} : { labelPlacement: placement(entry.labelPlacement, diagnostics, line) }),
    }];
  });
}

function parseBoundedYaml(text: string, absoluteStartLine: number): YamlResult {
  if (text.length > 100_000) return { diagnostics: [error("graph_yaml_too_large", "Graph YAML exceeds the supported text bound.", absoluteStartLine)] };
  const diagnostics: ImportDiagnostic[] = [];
  const physical = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: ParsedYamlLine[] = [];
  for (let index = 0; index < physical.length; index += 1) {
    const raw = physical[index];
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    if (/\t/.test(raw) || /(?:^|\s)[&*!][^\s]*/.test(raw) || /<<\s*:/.test(raw)) {
      diagnostics.push(error("unsupported_graph_yaml_syntax", "Graph YAML does not support tabs, tags, anchors, aliases or merge keys.", absoluteStartLine + index));
      continue;
    }
    const indent = raw.length - raw.trimStart().length;
    if (indent % 2 !== 0) diagnostics.push(error("invalid_graph_yaml_indentation", "Graph YAML indentation must use two-space steps.", absoluteStartLine + index));
    lines.push({ indent, text: raw.trim(), line: absoluteStartLine + index });
  }
  if (diagnostics.length || !lines.length) return { diagnostics: diagnostics.length ? diagnostics : [error("empty_graph_yaml", "Graph configuration cannot be empty.", absoluteStartLine)] };
  let cursor = 0;
  const parseNode = (indent: number): unknown => {
    if (cursor >= lines.length || lines[cursor].indent < indent) return undefined;
    if (lines[cursor].indent > indent) throw yamlError("Unexpected indentation.", lines[cursor].line);
    if (lines[cursor].text.startsWith("- ")) {
      const output: unknown[] = [];
      while (cursor < lines.length && lines[cursor].indent === indent && lines[cursor].text.startsWith("- ")) {
        const current = lines[cursor++];
        const rest = current.text.slice(2).trim();
        if (!rest) output.push(parseNode(indent + 2));
        else if (/^[A-Za-z][A-Za-z0-9]*\s*:/.test(rest)) {
          const entry = Object.create(null) as Record<string, unknown>;
          parseMapPair(entry, rest, current.line, indent + 2);
          while (cursor < lines.length && lines[cursor].indent === indent + 2 && !lines[cursor].text.startsWith("- ")) {
            const child = lines[cursor++];
            parseMapPair(entry, child.text, child.line, indent + 4);
          }
          output.push(entry);
        } else output.push(parseScalar(rest, current.line));
      }
      return output;
    }
    const output = Object.create(null) as Record<string, unknown>;
    while (cursor < lines.length && lines[cursor].indent === indent && !lines[cursor].text.startsWith("- ")) {
      const current = lines[cursor++];
      parseMapPair(output, current.text, current.line, indent + 2);
    }
    return output;

    function parseMapPair(target: Record<string, unknown>, source: string, line: number, childIndent: number) {
      const match = /^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$/.exec(source);
      if (!match) throw yamlError("Expected a plain mapping key followed by a colon.", line);
      const [, key, rest = ""] = match;
      if (PROTOTYPE_KEYS.has(key)) throw yamlError(`Forbidden YAML key "${key}".`, line);
      if (Object.prototype.hasOwnProperty.call(target, key)) throw yamlError(`Duplicate YAML key "${key}".`, line);
      if (rest === ">" || rest === "|") {
        const parts: string[] = [];
        while (cursor < lines.length && lines[cursor].indent >= childIndent) parts.push(lines[cursor++].text);
        target[key] = rest === ">" ? parts.join(" ") : parts.join("\n");
      } else if (rest) target[key] = parseScalar(rest, line);
      else target[key] = parseNode(childIndent);
    }
  };
  try {
    const value = parseNode(lines[0].indent);
    if (cursor !== lines.length) throw yamlError("Graph YAML contains an unexpected structure.", lines[cursor].line);
    return { value, diagnostics };
  } catch (caught) {
    const detail = caught instanceof YamlParseError ? caught : new YamlParseError("Graph YAML is malformed.", absoluteStartLine);
    return { diagnostics: [error("malformed_graph_yaml", detail.message, detail.line)] };
  }
}

function parseScalar(source: string, line: number): unknown {
  if (source.startsWith("[") && source.endsWith("]")) return splitFlowList(source.slice(1, -1)).map((item) => parseScalar(item, line));
  if ((source.startsWith('"') && source.endsWith('"')) || (source.startsWith("'") && source.endsWith("'"))) return source.slice(1, -1);
  if (/^(true|false)$/i.test(source)) return source.toLowerCase() === "true";
  if (/^null$/i.test(source)) return null;
  if (/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(source)) return Number(source);
  if (/[\[\]{}]/.test(source)) throw yamlError("Unsupported flow-style YAML scalar.", line);
  return source;
}

function splitFlowList(source: string) {
  if (!source.trim()) return [];
  return source.split(",").map((item) => item.trim()).filter(Boolean);
}

class YamlParseError extends Error { constructor(message: string, readonly line: number) { super(message); } }
function yamlError(message: string, line: number) { return new YamlParseError(message, line); }

class ExpressionParser {
  private cursor = 0;
  private readonly tokens: string[];
  constructor(source: string) {
    if (!source.trim() || source.length > 500) throw new Error("Graph expression must be non-empty and at most 500 characters.");
    const tokens = source.match(/(?:\d+(?:\.\d+)?|\.\d+)|[A-Za-z]+|[()+\-*/^]/g) ?? [];
    if (tokens.join("").toLowerCase() !== source.replace(/\s+/g, "").toLowerCase()) throw new Error("Graph expression contains unsupported characters.");
    this.tokens = tokens;
  }
  parse() {
    const value = this.additive();
    if (this.peek()) throw new Error(`Unexpected token "${this.peek()}" in graph expression.`);
    return value;
  }
  private additive(): MathExpression {
    const terms = [this.multiplicative()];
    while (this.peek() === "+" || this.peek() === "-") {
      const operator = this.take();
      const right = this.multiplicative();
      terms.push(operator === "+" ? right : { type: "multiply", factors: [constantExpression(-1), right] });
    }
    return terms.length === 1 ? terms[0] : { type: "add", terms };
  }
  private multiplicative(): MathExpression {
    const factors = [this.unary()];
    while (this.peek() === "*" || this.peek() === "/") {
      const operator = this.take();
      const right = this.unary();
      factors.push(operator === "*" ? right : { type: "power", base: right, exponent: { numerator: -1 } });
    }
    return factors.length === 1 ? factors[0] : { type: "multiply", factors };
  }
  private power(): MathExpression {
    let base = this.primary();
    if (this.peek() === "^") {
      this.take();
      const sign = this.peek() === "-" ? (this.take(), -1) : this.peek() === "+" ? (this.take(), 1) : 1;
      const token = this.take();
      if (!/^\d+(?:\.\d+)?$/.test(token)) throw new Error("Graph powers must use a numeric exponent.");
      base = { type: "power", base, exponent: exactFromDecimal(`${sign < 0 ? "-" : ""}${token}`) };
    }
    return base;
  }
  private unary(): MathExpression {
    if (this.peek() === "+") { this.take(); return this.unary(); }
    if (this.peek() === "-") { this.take(); return { type: "multiply", factors: [constantExpression(-1), this.unary()] }; }
    return this.power();
  }
  private primary(): MathExpression {
    const token = this.take();
    if (/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(token)) return { type: "constant", value: exactFromDecimal(token) };
    if (token.toLowerCase() === "x") return { type: "variable", name: "x" };
    if (token === "(") {
      const value = this.additive();
      if (this.take() !== ")") throw new Error("Graph expression has an unmatched parenthesis.");
      return value;
    }
    const name = token.toLowerCase();
    if (["sin", "cos", "tan", "exp", "log"].includes(name)) {
      if (this.take() !== "(") throw new Error(`Function ${name} must be followed by parentheses.`);
      const argument = this.additive();
      if (this.take() !== ")") throw new Error(`Function ${name} has an unmatched parenthesis.`);
      return { type: name as "sin", argument } as MathExpression;
    }
    throw new Error(`Unsupported graph expression token "${token || "end of expression"}".`);
  }
  private peek() { return this.tokens[this.cursor] ?? ""; }
  private take() { return this.tokens[this.cursor++] ?? ""; }
}

function constantExpression(value: number): MathExpression { return { type: "constant", value: { numerator: value } }; }
function exactFromDecimal(value: string): ExactNumber {
  const negative = value.startsWith("-");
  const unsigned = value.replace(/^[-+]/, "");
  const [whole, decimal = ""] = unsigned.split(".");
  const denominator = 10 ** decimal.length;
  const numerator = (Number(whole || "0") * denominator + Number(decimal || "0")) * (negative ? -1 : 1);
  const divisor = gcd(Math.abs(numerator), denominator);
  return denominator / divisor === 1 ? { numerator: numerator / divisor } : { numerator: numerator / divisor, denominator: denominator / divisor };
}
function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a || 1; }

function exactValue(value: unknown, path: string, diagnostics: ImportDiagnostic[], line: number): ExactNumber {
  if (typeof value === "number" && Number.isFinite(value)) return exactFromDecimal(String(value));
  if (typeof value === "string" && /^[-+]?\d+\/[-+]?\d+$/.test(value)) {
    const [numerator, denominator] = value.split("/").map(Number);
    if (denominator !== 0) return { numerator, denominator };
  }
  diagnostics.push(error("invalid_graph_exact_number", `${path} must be a finite number or quoted fraction.`, line));
  return { numerator: 0 };
}
function record(value: unknown, path: string, diagnostics: ImportDiagnostic[], line: number): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  diagnostics.push(error("invalid_graph_yaml_shape", `${path} must be a YAML mapping.`, line)); return undefined;
}
function list(value: unknown, path: string, diagnostics: ImportDiagnostic[], line: number): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  diagnostics.push(error("invalid_graph_yaml_shape", `${path} must be a YAML list.`, line)); return undefined;
}
function stringValue(value: unknown, path: string, diagnostics: ImportDiagnostic[], line: number): string {
  if (typeof value === "string" && value.trim() && value.length <= 2_000) return value.trim();
  diagnostics.push(error("invalid_graph_string", `${path} must be a non-empty bounded string.`, line)); return "";
}
function numberValue(value: unknown, path: string, diagnostics: ImportDiagnostic[], line: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  diagnostics.push(error("invalid_graph_number", `${path} must be a finite number.`, line)); return Number.NaN;
}
function numberList(value: unknown, path: string, diagnostics: ImportDiagnostic[], line: number) {
  const values = list(value, path, diagnostics, line); return values?.map((item, index) => numberValue(item, `${path}[${index}]`, diagnostics, line)) ?? [];
}
function enumValue<const T extends readonly string[]>(value: unknown, allowed: T, path: string, diagnostics: ImportDiagnostic[], line: number): T[number] {
  if (typeof value === "string" && allowed.includes(value)) return value as T[number];
  diagnostics.push(error("invalid_graph_enum", `${path} must be one of: ${allowed.join(", ")}.`, line)); return allowed[0];
}
function placement(value: unknown, diagnostics: ImportDiagnostic[], line: number) { return enumValue(value, ["above", "below", "left", "right"] as const, "labelPlacement", diagnostics, line); }
function exactKeys(value: Record<string, unknown>, allowed: string[], path: string, diagnostics: ImportDiagnostic[], line: number) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) diagnostics.push(error(PROTOTYPE_KEYS.has(key) ? "prototype_polluting_graph_yaml_key" : "unknown_graph_yaml_key", `Unknown ${path} key "${key}".`, line));
}
function error(code: string, message: string, line: number): ImportDiagnostic { return { code, severity: "error", message, lineRange: { start: line, end: line } }; }
