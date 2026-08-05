import type { StemForgeQuestion } from "@/data/questions";
import type { Question } from "@/data/types";
import type { StructuredGraphAnswer } from "@/lib/maths/expression-types";
import { markClosedVocabularyTextAnswer } from "@/lib/marking/closed-vocabulary-text";
import { markCompositeAlgebraicEquivalence } from "@/lib/marking/composite-algebraic";
import { markNumeric } from "@/lib/marking/numeric";
import { markPolynomial } from "@/lib/marking/polynomial";
import type { MarkingResult } from "@/lib/marking/types";
import { validateStructuredGraphAnswer } from "@/lib/questions/graph-answer-validation";

export type { MarkingResult } from "@/lib/marking/types";

export type LegacyPhysicsDemoAnswerState = {
  isMarkable: false;
  isCorrect: null;
  displayedAnswer: string;
  displayedUnit: string;
};

export function canSubmitAnswer(answer: string) {
  return answer.trim().length > 0;
}

/** Compatibility-only legacy normaliser. New strategies must not use it. */
export function normaliseAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/\u2212/g, "-")
    .replace(/\u03c0/g, "pi")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[×·]/g, "*")
    .replace(/\s+/g, "")
    .replace(/\*/g, "")
    .replace(/\{|\}/g, "");
}

/** Compatibility-only helper retained for the bounded legacy-collision audit. */
export function compareAcceptedAnswers(studentAnswer: string, acceptedAnswers: readonly string[]) {
  const normalizedStudentAnswer = normaliseAnswer(studentAnswer);
  const matchedAcceptedAnswer = acceptedAnswers.find((acceptedAnswer) => normaliseAnswer(acceptedAnswer) === normalizedStudentAnswer);
  return { isCorrect: matchedAcceptedAnswer !== undefined, normalizedStudentAnswer, matchedAcceptedAnswer };
}

export function markQuestionAnswer(question: Pick<Question, "marking" | "structuredAnswer" | "natureTableConfig">, studentAnswer: string): MarkingResult {
  try {
    const contract = question.marking;
    if (!contract) return internal("numeric", 1, studentAnswer, "marking_contract_missing");
    if (contract.strategy === "numeric") return markNumeric(contract, studentAnswer);
    if (contract.strategy === "polynomial_form") return markPolynomial(contract, studentAnswer);
    if (contract.strategy === "composite_algebraic_equivalence") return markCompositeAlgebraicEquivalence(contract, studentAnswer);
    if (contract.strategy === "closed_vocabulary_text_answer") return markClosedVocabularyTextAnswer(contract, studentAnswer);
    if (contract.strategy === "multiple_choice") {
      const correct = studentAnswer === contract.correctOptionId;
      return {
        outcomeKind: "graded", isCorrect: correct, ...(correct ? {} : { outcomeReason: "value_wrong" as const }),
        normalizedStudentAnswer: studentAnswer, matchedAcceptedAnswer: correct ? contract.correctOptionId : undefined,
        strategy: contract.strategy, strategyVersion: contract.strategyVersion,
      };
    }
    if (contract.strategy === "guided_self_check") {
      return { outcomeKind: "guided_pending", isCorrect: null, normalizedStudentAnswer: studentAnswer, strategy: contract.strategy, strategyVersion: contract.strategyVersion };
    }
    if (contract.strategy === "structured_graph") return markStructured(question as Question, studentAnswer);
    return internal("numeric", 1, studentAnswer, "unknown_marking_strategy");
  } catch {
    const contract = question.marking;
    return internal(contract?.strategy ?? "numeric", contract?.strategyVersion ?? 1, studentAnswer, "unexpected_marker_failure");
  }
}

function markStructured(question: Question, studentAnswer: string): MarkingResult {
  const contract = question.marking;
  if (contract.strategy !== "structured_graph") return internal("structured_graph", 1, studentAnswer, "strategy_contract_mismatch");
  let parsed: StructuredGraphAnswer;
  try {
    parsed = JSON.parse(studentAnswer) as StructuredGraphAnswer;
  } catch {
    return {
      outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_structured",
      normalizedStudentAnswer: "", strategy: contract.strategy, strategyVersion: contract.strategyVersion,
    };
  }
  if (!question.structuredAnswer) return internal(contract.strategy, contract.strategyVersion, studentAnswer, "structured_contract_missing");
  const marked = validateStructuredGraphAnswer(question.structuredAnswer, parsed, question.natureTableConfig);
  return {
    outcomeKind: "graded", isCorrect: marked.isCorrect, ...(marked.isCorrect ? {} : { outcomeReason: "value_wrong" as const }),
    normalizedStudentAnswer: marked.normalizedAnswer, matchedAcceptedAnswer: marked.isCorrect ? "structured-answer" : undefined,
    strategy: contract.strategy, strategyVersion: contract.strategyVersion,
  };
}

function internal(strategy: MarkingResult["strategy"], strategyVersion: number, input: string, diagnosticReason: string): MarkingResult {
  return { outcomeKind: "internal_error", isCorrect: null, normalizedStudentAnswer: input, strategy, strategyVersion, diagnosticReason };
}

export function getLegacyPhysicsDemoAnswerState(question: Pick<StemForgeQuestion, "answer" | "answerUnit">): LegacyPhysicsDemoAnswerState {
  return { isMarkable: false, isCorrect: null, displayedAnswer: question.answer, displayedUnit: question.answerUnit };
}
