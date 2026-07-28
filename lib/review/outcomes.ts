import type { PracticeSession } from "@/lib/practice/practice-types";
import { isGradedCorrectAttempt, isGradedIncorrectAttempt } from "@/lib/progress/attempt-outcomes";
import type { ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import type {
  ReviewEvidenceRef,
  ReviewOutcome,
  ReviewTargetAssignment,
} from "@/lib/review/types";
import { canonicalEvidenceRefs, MAX_REVIEW_EVIDENCE_REFS } from "@/lib/review/validation";

export type ReviewTargetResolution =
  | { resolved: false; target: ReviewTargetAssignment }
  | {
      resolved: true;
      target: ReviewTargetAssignment;
      outcome: ReviewOutcome;
      occurredAt: string;
      sequence: number;
      evidenceRefs: ReviewEvidenceRef[];
    };

type QuestionResolution =
  | { resolved: false }
  | {
      resolved: true;
      outcome: ReviewOutcome;
      occurredAt: string;
      sequence: number;
      evidenceRefs: ReviewEvidenceRef[];
      requiredEvidenceRefs: ReviewEvidenceRef[];
    };

export function deriveReviewTargetResolution(
  session: PracticeSession,
  assignment: ReviewTargetAssignment,
  evidence: ProgressEvidence,
): ReviewTargetResolution {
  const questionResults = assignment.questionIds.map((questionId) =>
    deriveQuestionResolution(session, questionId, evidence));
  if (questionResults.some((result) => !result.resolved)) return { resolved: false, target: assignment };
  const resolved = questionResults as Extract<QuestionResolution, { resolved: true }>[];
  const outcome: ReviewOutcome = resolved.some((result) => result.outcome === "incorrect")
    ? "incorrect"
    : resolved.some((result) => result.outcome === "solution_assisted")
      ? "solution_assisted"
      : resolved.some((result) => result.outcome === "hint_assisted")
        ? "hint_assisted"
        : "independent_success";
  const terminal = [...resolved].sort((left, right) =>
    compareCoordinate(left.occurredAt, left.sequence, "", right.occurredAt, right.sequence, "")).at(-1)!;
  return {
    resolved: true,
    target: assignment,
    outcome,
    occurredAt: terminal.occurredAt,
    sequence: terminal.sequence,
    evidenceRefs: boundedEvidenceRefs(
      resolved.flatMap((result) => result.requiredEvidenceRefs),
      resolved.flatMap((result) => result.evidenceRefs),
    ),
  };
}

function deriveQuestionResolution(
  session: PracticeSession,
  questionId: string,
  evidence: ProgressEvidence,
): QuestionResolution {
  const startedAt = Date.parse(session.startedAt);
  const attempts = evidence.attempts.filter((attempt) =>
    attempt.questionId === questionId &&
    attempt.practiceSessionId === session.sessionId &&
    Date.parse(attempt.attemptedAt) >= startedAt,
  ).sort(compareAttempt);
  const support = evidence.supportEvents.filter((event) =>
    event.questionId === questionId &&
    event.practiceSessionId === session.sessionId &&
    Date.parse(event.occurredAt) >= startedAt,
  ).sort(compareSupport);
  const firstCorrect = attempts.find(isGradedCorrectAttempt);
  if (!firstCorrect) return { resolved: false };
  const includedAttempts = attempts.filter((attempt) =>
    compareCoordinate(
      attempt.attemptedAt, attempt.sequence, attempt.eventId,
      firstCorrect.attemptedAt, firstCorrect.sequence, firstCorrect.eventId,
    ) <= 0);
  const includedSupport = support.filter((event) =>
    compareCoordinate(
      event.occurredAt, event.sequence, event.eventId,
      firstCorrect.attemptedAt, firstCorrect.sequence, firstCorrect.eventId,
    ) <= 0);
  const firstIncorrect = includedAttempts.find(isGradedIncorrectAttempt);
  const firstSolution = includedSupport.find((event) => event.type === "solution_viewed");
  const firstHint = includedSupport.find((event) => event.type === "hint_viewed");
  const outcome: ReviewOutcome = firstIncorrect
    ? "incorrect"
    : firstSolution
      ? "solution_assisted"
      : firstHint || firstCorrect.hintViewedBeforeSubmission
        ? "hint_assisted"
        : "independent_success";
  return {
    resolved: true,
    outcome,
    occurredAt: firstCorrect.attemptedAt,
    sequence: firstCorrect.sequence,
    evidenceRefs: [
      ...includedAttempts.map((attempt) => ({ evidenceKind: "attempt" as const, eventId: attempt.eventId })),
      ...includedSupport.map((event) => ({ evidenceKind: "support_event" as const, eventId: event.eventId })),
    ],
    requiredEvidenceRefs: [
      { evidenceKind: "attempt", eventId: firstCorrect.eventId },
      ...(firstIncorrect ? [{ evidenceKind: "attempt" as const, eventId: firstIncorrect.eventId }] : []),
      ...(firstSolution ? [{ evidenceKind: "support_event" as const, eventId: firstSolution.eventId }] : []),
      ...(!firstSolution && firstHint
        ? [{ evidenceKind: "support_event" as const, eventId: firstHint.eventId }]
        : []),
    ],
  };
}

function boundedEvidenceRefs(required: readonly ReviewEvidenceRef[], all: readonly ReviewEvidenceRef[]) {
  const canonicalRequired = canonicalEvidenceRefs(required);
  const requiredKeys = new Set(canonicalRequired.map(evidenceRefKey));
  const optional = canonicalEvidenceRefs(all).filter((reference) => !requiredKeys.has(evidenceRefKey(reference)));
  return canonicalEvidenceRefs([
    ...canonicalRequired,
    ...optional.slice(0, MAX_REVIEW_EVIDENCE_REFS - canonicalRequired.length),
  ]);
}

function evidenceRefKey(reference: ReviewEvidenceRef) {
  return `${reference.evidenceKind}:${reference.eventId}`;
}

export function compareEvidence(
  left: Pick<QuestionAttempt, "attemptedAt" | "sequence" | "eventId">,
  right: Pick<QuestionAttempt, "attemptedAt" | "sequence" | "eventId">,
) {
  return compareCoordinate(
    left.attemptedAt, left.sequence, left.eventId,
    right.attemptedAt, right.sequence, right.eventId,
  );
}

export function compareCoordinate(
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

function compareAttempt(left: QuestionAttempt, right: QuestionAttempt) {
  return compareEvidence(left, right);
}

function compareSupport(left: QuestionSupportEvent, right: QuestionSupportEvent) {
  return compareCoordinate(
    left.occurredAt, left.sequence, left.eventId,
    right.occurredAt, right.sequence, right.eventId,
  );
}
