import {
  ELEMENTARY_CONSTANTS,
  ELEMENTARY_FUNCTIONS,
  type ElementaryExpressionEquivalenceMarkingContract,
  type MarkingResult,
} from "@/lib/marking/types";
import { getMathInputCapabilities } from "@/lib/questions/math-input-capabilities";
import { normalizeRichMathSource } from "@/lib/questions/rich-math-normalization";

/**
 * Conservative V1 equivalence: both answers must normalize to the same bounded syntax tree.
 * No identities, numerical approximation, arbitrary simplification or sample-point guessing.
 */
export function markElementaryExpression(
  contract: ElementaryExpressionEquivalenceMarkingContract,
  input: string,
): MarkingResult {
  const capabilities = getMathInputCapabilities(contract);
  const parsed = normalizeRichMathSource(input, capabilities);
  const base = { strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (parsed.status === "unsupported") {
    return { ...base, outcomeKind: "unmarkable", isCorrect: null, outcomeReason: "unsupported_mathematical_form", normalizedStudentAnswer: input };
  }
  if (parsed.status !== "ready") {
    return { ...base, outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_elementary_expression", normalizedStudentAnswer: input };
  }
  const target = normalizeRichMathSource(contract.target, capabilities);
  if (target.status !== "ready") {
    return { ...base, outcomeKind: "internal_error", isCorrect: null, normalizedStudentAnswer: parsed.canonical, diagnosticReason: "invalid_elementary_expression_target" };
  }
  const correct = parsed.canonical === target.canonical;
  return correct
    ? { ...base, outcomeKind: "graded", isCorrect: true, normalizedStudentAnswer: parsed.canonical, matchedAcceptedAnswer: target.canonical }
    : { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong", normalizedStudentAnswer: parsed.canonical };
}

export function validateElementaryExpressionContract(contract: ElementaryExpressionEquivalenceMarkingContract) {
  if (contract.variable !== "x") return false;
  if (new Set(contract.allowedFunctions).size !== contract.allowedFunctions.length) return false;
  if (new Set(contract.allowedConstants).size !== contract.allowedConstants.length) return false;
  if (contract.allowedFunctions.some((name) => !ELEMENTARY_FUNCTIONS.includes(name))) return false;
  if (contract.allowedConstants.some((name) => !ELEMENTARY_CONSTANTS.includes(name))) return false;
  if (contract.allowedLogBases?.some((base) => ![2, 10].includes(base))) return false;
  if (contract.allowedLogBases?.length && !contract.allowedFunctions.includes("log")) return false;
  return normalizeRichMathSource(contract.target, getMathInputCapabilities(contract)).status === "ready";
}
