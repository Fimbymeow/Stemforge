import type { ProgressEvidence, QuestionAttempt } from "@/lib/progress/types";

/**
 * Shared ordinary-attempt independence rule used by Review recovery and read-side
 * learning projections. The caller must provide attempts for one question/version
 * in deterministic evidence order.
 */
export function isIndependentOrdinaryAttempt(
  attempt: QuestionAttempt,
  evidence: ProgressEvidence,
  orderedAttempts: readonly QuestionAttempt[],
) {
  if (attempt.hintViewedBeforeSubmission) return false;
  const previous = orderedAttempts.filter((candidate) => compareAttempt(candidate, attempt) < 0).at(-1);
  return !evidence.supportEvents.some((event) => {
    if (event.questionId !== attempt.questionId || event.type !== "solution_viewed") return false;
    if (attempt.practiceSessionId) {
      return event.practiceSessionId === attempt.practiceSessionId &&
        compareCoordinate(
          event.occurredAt,
          event.sequence,
          event.eventId,
          attempt.attemptedAt,
          attempt.sequence,
          attempt.eventId,
        ) < 0;
    }
    const afterPrevious = !previous || compareCoordinate(
      event.occurredAt,
      event.sequence,
      event.eventId,
      previous.attemptedAt,
      previous.sequence,
      previous.eventId,
    ) > 0;
    return !event.practiceSessionId && afterPrevious && compareCoordinate(
      event.occurredAt,
      event.sequence,
      event.eventId,
      attempt.attemptedAt,
      attempt.sequence,
      attempt.eventId,
    ) < 0;
  });
}

function compareAttempt(
  left: Pick<QuestionAttempt, "attemptedAt" | "sequence" | "eventId">,
  right: Pick<QuestionAttempt, "attemptedAt" | "sequence" | "eventId">,
) {
  return compareCoordinate(
    left.attemptedAt,
    left.sequence,
    left.eventId,
    right.attemptedAt,
    right.sequence,
    right.eventId,
  );
}

function compareCoordinate(
  leftTime: string,
  leftSequence: number,
  leftId: string,
  rightTime: string,
  rightSequence: number,
  rightId: string,
) {
  return Date.parse(leftTime) - Date.parse(rightTime) ||
    leftSequence - rightSequence ||
    leftId.localeCompare(rightId);
}
