import type { StemForgeQuestion } from "@/data/questions";
import type { AnswerType, Question } from "@/data/types";
import type { StructuredGraphAnswer } from "@/lib/maths/expression-types";
import { validateStructuredGraphAnswer } from "@/lib/questions/graph-answer-validation";

export type MarkingResult = {
  isCorrect: boolean | null;
  normalizedStudentAnswer: string;
  matchedAcceptedAnswer?: string;
  mode: "automatic" | "guided";
  reason:
    | "accepted_match"
    | "accepted_mismatch"
    | "guided"
    | "structured_parse_failure"
    | "structured_contract_missing"
    | "structured_match"
    | "structured_mismatch";
};

export type LegacyPhysicsDemoAnswerState = {
  isMarkable: false;
  isCorrect: null;
  displayedAnswer: string;
  displayedUnit: string;
};

const GUIDED_ANSWER_TYPES = new Set<AnswerType>(["multi_step", "written"]);

export function canSubmitAnswer(answer: string) {
  return answer.trim().length > 0;
}

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

export function compareAcceptedAnswers(studentAnswer: string, acceptedAnswers: readonly string[]): MarkingResult {
  const normalizedStudentAnswer = normaliseAnswer(studentAnswer);
  const matchedAcceptedAnswer = acceptedAnswers.find(
    (acceptedAnswer) => normaliseAnswer(acceptedAnswer) === normalizedStudentAnswer,
  );

  return {
    isCorrect: matchedAcceptedAnswer !== undefined,
    normalizedStudentAnswer,
    matchedAcceptedAnswer,
    mode: "automatic",
    reason: matchedAcceptedAnswer === undefined ? "accepted_mismatch" : "accepted_match",
  };
}

export function markQuestionAnswer(question: Pick<Question, "acceptedAnswers" | "answerType">, studentAnswer: string): MarkingResult {
  if (question.answerType === "graph_structured" || question.answerType === "nature_table") {
    return markStructuredQuestionAnswer(question as Question, studentAnswer);
  }
  if (GUIDED_ANSWER_TYPES.has(question.answerType)) {
    return {
      isCorrect: null,
      normalizedStudentAnswer: normaliseAnswer(studentAnswer),
      mode: "guided",
      reason: "guided",
    };
  }

  return compareAcceptedAnswers(studentAnswer, question.acceptedAnswers);
}

function markStructuredQuestionAnswer(question: Question, studentAnswer: string): MarkingResult {
  let parsed: StructuredGraphAnswer;
  try {
    parsed = JSON.parse(studentAnswer) as StructuredGraphAnswer;
  } catch {
    return {
      isCorrect: false,
      normalizedStudentAnswer: "",
      mode: "automatic",
      reason: "structured_parse_failure",
    };
  }
  if (!question.structuredAnswer) {
    return {
      isCorrect: false,
      normalizedStudentAnswer: JSON.stringify(parsed),
      mode: "automatic",
      reason: "structured_contract_missing",
    };
  }
  const marked = validateStructuredGraphAnswer(question.structuredAnswer, parsed, question.natureTableConfig);
  return {
    isCorrect: marked.isCorrect,
    normalizedStudentAnswer: marked.normalizedAnswer,
    matchedAcceptedAnswer: marked.isCorrect ? "structured-answer" : undefined,
    mode: "automatic",
    reason: marked.isCorrect ? "structured_match" : "structured_mismatch",
  };
}

// Legacy Physics is a visual demo: its input is read-only and no student answer is evaluated.
export function getLegacyPhysicsDemoAnswerState(question: Pick<StemForgeQuestion, "answer" | "answerUnit">): LegacyPhysicsDemoAnswerState {
  return {
    isMarkable: false,
    isCorrect: null,
    displayedAnswer: question.answer,
    displayedUnit: question.answerUnit,
  };
}
