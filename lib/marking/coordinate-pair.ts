import { parseNumericLiteral } from "@/lib/marking/numeric";
import type { CoordinatePairMarkingContract, MarkingResult } from "@/lib/marking/types";

export function markCoordinatePair(contract: CoordinatePairMarkingContract, input: string): MarkingResult {
  const parsed = parseCoordinate(input);
  const base = { normalizedStudentAnswer: parsed.normalized, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "malformed") return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_coordinate_pair" };
  if (parsed.status === "unmarkable") return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "unsupported_mathematical_form" };
  const target = parseCoordinate(contract.target);
  if (!("x" in target)) return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_coordinate_target" };
  if (!("x" in parsed)) return { ...base, outcomeKind: "internal_error", isCorrect: null, diagnosticReason: "invalid_coordinate_state" };
  const correct = equal(target.x, parsed.x) && equal(target.y, parsed.y);
  return correct ? { ...base, outcomeKind: "graded", isCorrect: true } : { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong" };
}

type Parsed = ReturnType<typeof parseNumericLiteral>;
function parseCoordinate(raw: string): { status: "parsed"; x: Extract<Parsed, { status: "parsed" }>; y: Extract<Parsed, { status: "parsed" }>; normalized: string } | { status: "malformed" | "unmarkable"; normalized: string } {
  const normalized = raw.trim().replace(/\u2212/g, "-");
  const body = normalized.replace(/^\(/, "").replace(/\)$/, "").replace(/\s+/g, "");
  const assignment = /^x=([^,]+),y=([^,]+)$/i.exec(body);
  const pair = assignment ? [assignment[1], assignment[2]] : body.split(",");
  if (pair.length !== 2 || pair.some((value) => !value)) return { status: "malformed", normalized };
  const x = parseNumericLiteral(pair[0]); const y = parseNumericLiteral(pair[1]);
  if (x.status === "unmarkable" || y.status === "unmarkable") return { status: "unmarkable", normalized };
  if (x.status !== "parsed" || y.status !== "parsed") return { status: "malformed", normalized };
  return { status: "parsed", x, y, normalized: `(${x.normalized},${y.normalized})` };
}
function equal(a: Extract<Parsed, { status: "parsed" }>, b: Extract<Parsed, { status: "parsed" }>) { return a.value.numerator === b.value.numerator && a.value.denominator === b.value.denominator; }
