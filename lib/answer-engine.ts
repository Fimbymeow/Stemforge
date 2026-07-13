import type { StemForgeQuestion } from "@/data/questions";
import type { AnswerType, Question } from "@/data/types";

export type MarkingResult = {
  isCorrect: boolean | null;
  normalizedStudentAnswer: string;
  matchedAcceptedAnswer?: string;
  mode: "automatic" | "guided";
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
  };
}

export function markQuestionAnswer(question: Pick<Question, "acceptedAnswers" | "answerType">, studentAnswer: string): MarkingResult {
  if (GUIDED_ANSWER_TYPES.has(question.answerType)) {
    return {
      isCorrect: null,
      normalizedStudentAnswer: normaliseAnswer(studentAnswer),
      mode: "guided",
    };
  }

  return compareAcceptedAnswers(studentAnswer, question.acceptedAnswers);
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
