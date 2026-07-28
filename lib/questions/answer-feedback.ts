import type { Question } from "@/data/types";
import type { MarkingResult } from "@/lib/answer-engine";

export type AnswerFeedbackCategory =
  | "empty" | "malformed" | "unmarkable" | "incorrect" | "correct" | "guided" | "internal_error";

export type StudentAnswerFeedback = {
  category: AnswerFeedbackCategory;
  title: string;
  message: string;
  guidance?: string;
  tone: "positive" | "constructive" | "neutral";
  shouldRecordAttempt: boolean;
  isInputError: boolean;
};

export function classifyAnswerFeedback(
  _question: Pick<Question, "answerType" | "acceptedAnswers">,
  answer: string,
  marking: MarkingResult,
): StudentAnswerFeedback {
  if (!answer.trim()) return feedback("empty", "Enter an answer", "Add an answer before submitting.", "neutral", false, true);
  if (marking.outcomeKind === "internal_error") {
    return feedback("internal_error", "We could not check this answer", "Your answer has not been counted.", "neutral", false, false, "Try submitting again or open the worked solution.");
  }
  if (marking.outcomeKind === "guided_pending") {
    return feedback("guided", "Ready to self-check", "Compare your work with the solution when you are ready.", "neutral", true, false);
  }
  if (marking.outcomeKind === "malformed") {
    return feedback("malformed", "Answer format could not be read", "We could not read this answer yet, so it has not been marked right or wrong.", "constructive", true, true, "Check the notation, then try again.");
  }
  if (marking.outcomeKind === "unmarkable") {
    return feedback("unmarkable", "This form cannot be checked safely", "This answer has not been marked right or wrong.", "constructive", true, false, "Enter a supported final-answer form or open the worked solution.");
  }
  if (marking.isCorrect) return feedback("correct", "Correct", "Your answer matches the marking contract.", "positive", true, false);
  const title = marking.outcomeReason === "form_wrong" ? "Use the requested answer form"
    : marking.outcomeReason === "precision_wrong" ? "Check the required precision"
      : marking.outcomeReason === "unit_wrong" ? "Check the unit"
        : "Not quite yet";
  const message = marking.outcomeReason === "value_wrong"
    ? "This value does not match the expected result."
    : "The mathematical value is right, but its presentation does not meet the question requirement.";
  return feedback("incorrect", title, message, "constructive", true, false, "Check the question requirement, use a hint, or compare with the worked solution.");
}

export function internalAnswerFailureFeedback(): StudentAnswerFeedback {
  return feedback("internal_error", "Your answer was not saved", "Something went wrong while saving this attempt. Your answer is still here.", "neutral", false, false, "Try submitting again. This has not been counted as a learner mistake.");
}

function feedback(
  category: AnswerFeedbackCategory,
  title: string,
  message: string,
  tone: StudentAnswerFeedback["tone"],
  shouldRecordAttempt: boolean,
  isInputError: boolean,
  guidance?: string,
): StudentAnswerFeedback {
  return { category, title, message, ...(guidance ? { guidance } : {}), tone, shouldRecordAttempt, isInputError };
}
