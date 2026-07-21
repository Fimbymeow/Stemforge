import type { Question } from "@/data/types";
import type { MarkingResult } from "@/lib/answer-engine";

export type AnswerFeedbackCategory =
  | "empty"
  | "malformed"
  | "unsupported_format"
  | "incorrect"
  | "correct"
  | "guided"
  | "internal_error";

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
  question: Pick<Question, "answerType" | "acceptedAnswers">,
  answer: string,
  marking: MarkingResult,
): StudentAnswerFeedback {
  const trimmed = answer.trim();
  if (!trimmed) {
    return feedback("empty", "Enter an answer", "Add an answer before submitting.", "neutral", false, true);
  }

  if (marking.mode === "guided") {
    return feedback(
      "guided",
      "Ready to self-check",
      "Compare your work with the solution when you are ready.",
      "neutral",
      true,
      false,
    );
  }

  if (marking.isCorrect) {
    return feedback("correct", "Correct", "Your answer matches an accepted answer.", "positive", true, false);
  }

  if (marking.reason === "structured_parse_failure") {
    return feedback(
      "malformed",
      "Check the answer format",
      "We could not read this answer yet.",
      "constructive",
      true,
      true,
      "Review each required graph or table entry, then try again.",
    );
  }

  const formatIssue = findSafeFormatIssue(question, trimmed);
  if (formatIssue) return formatIssue;

  return feedback(
    "incorrect",
    "Not quite yet",
    "This answer does not match an accepted result.",
    "constructive",
    true,
    false,
    "Check the mathematics, use a hint, or compare with the worked solution after this attempt.",
  );
}

export function internalAnswerFailureFeedback(): StudentAnswerFeedback {
  return feedback(
    "internal_error",
    "Your answer was not saved",
    "Something went wrong while saving this attempt. Your answer is still here.",
    "neutral",
    false,
    false,
    "Try submitting again. This has not been counted as a learner mistake.",
  );
}

function findSafeFormatIssue(
  question: Pick<Question, "answerType" | "acceptedAnswers">,
  answer: string,
): StudentAnswerFeedback | null {
  const grouping = groupingIssue(answer);
  if (grouping) {
    return feedback(
      "malformed",
      "Check the brackets",
      "We could not read this answer yet.",
      "constructive",
      true,
      true,
      grouping,
    );
  }

  if (/(?:\^|[+*/=]|sqrt\()\s*$/i.test(answer) || /(?:^|[^\d])-\s*$/.test(answer)) {
    return feedback(
      "malformed",
      "Finish the expression",
      "This answer looks incomplete.",
      "constructive",
      true,
      true,
      "Add the missing number, power, or expression before submitting.",
    );
  }

  if (answer.includes("=") && !question.acceptedAnswers.some((accepted) => accepted.includes("="))) {
    return feedback(
      "unsupported_format",
      "Enter only the requested result",
      "The expected answer format does not include an equals sign.",
      "constructive",
      true,
      true,
      question.answerType === "numerical" ? "Enter the numerical result only." : "Enter the expression only, such as 5x^2.",
    );
  }

  if (question.answerType === "numerical" && /[a-z]/i.test(answer) && !question.acceptedAnswers.some((accepted) => /[a-z]/i.test(accepted))) {
    return feedback(
      "unsupported_format",
      "Use numerical notation",
      "We could not read this as the requested numerical answer.",
      "constructive",
      true,
      true,
      "Enter numbers and mathematical symbols rather than a sentence.",
    );
  }

  if ((question.answerType === "algebraic" || question.answerType === "numerical") && /[^0-9a-z\s+\-*/^().,{}\[\]\u03c0\u221a\u2212\u00b2\u00b3]/i.test(answer)) {
    return feedback(
      "unsupported_format",
      "Use supported notation",
      "This answer contains notation the marker does not support.",
      "constructive",
      true,
      true,
      "Use ^ for powers, such as x^2, and * for multiplication when helpful.",
    );
  }

  return null;
}

function groupingIssue(value: string) {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const openings = new Set(Object.values(pairs));
  const stack: string[] = [];
  for (const character of value) {
    if (openings.has(character)) stack.push(character);
    else if (character in pairs && stack.pop() !== pairs[character]) return "Check that brackets close in the same order they open.";
  }
  return stack.length ? "Close every bracket before submitting." : null;
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
  return {
    category,
    title,
    message,
    ...(guidance ? { guidance } : {}),
    tone,
    shouldRecordAttempt,
    isInputError,
  };
}
