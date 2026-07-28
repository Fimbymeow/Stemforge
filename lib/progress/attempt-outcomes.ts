import type { MarkerOutcomeKind, MarkerOutcomeReason, MarkingStrategy } from "@/lib/marking/types";
import type { QuestionAttempt } from "@/lib/progress/types";

export type EffectiveAttemptOutcome = {
  kind: Exclude<MarkerOutcomeKind, "internal_error">;
  reason?: MarkerOutcomeReason;
  legacy: boolean;
};

export function effectiveAttemptOutcome(attempt: QuestionAttempt): EffectiveAttemptOutcome {
  if (attempt.outcomeKind) return { kind: attempt.outcomeKind, reason: attempt.outcomeReason, legacy: false };
  if (attempt.isCorrect === true) return { kind: "graded", legacy: true };
  if (attempt.isCorrect === false) return { kind: "graded", legacy: true };
  return { kind: "guided_pending", legacy: true };
}

export function isGradedAttempt(attempt: QuestionAttempt) {
  return effectiveAttemptOutcome(attempt).kind === "graded";
}

export function isGradedIncorrectAttempt(attempt: QuestionAttempt) {
  return isGradedAttempt(attempt) && attempt.isCorrect === false;
}

export function isGradedCorrectAttempt(attempt: QuestionAttempt) {
  return isGradedAttempt(attempt) && attempt.isCorrect === true;
}

export type NewAttemptMarkerFields = {
  outcomeKind: Exclude<MarkerOutcomeKind, "internal_error">;
  outcomeReason?: MarkerOutcomeReason;
  strategy: MarkingStrategy;
  strategyVersion: number;
};
