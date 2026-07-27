import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import type { PracticeQuestionReference, PracticeSession } from "@/lib/practice/practice-types";
import type {
  GuidedSelfAssessmentEvent,
  ProgressEvidence,
  QuestionAttempt,
  QuestionSupportEvent,
} from "@/lib/progress/types";

export type PracticeQuestionPrimaryStatus = "unanswered" | "attempted" | "complete";
export type PracticeQuestionStatus = {
  questionId: string;
  primary: PracticeQuestionPrimaryStatus;
  skipped: boolean;
  unavailable: boolean;
  guided: boolean;
  awaitingSelfCheck: boolean;
  selfAssessment: GuidedSelfAssessmentEvent["outcome"] | null;
  latestAttempt: QuestionAttempt | null;
  attemptCount: number;
  supportUsed: boolean;
  worthRevisit: boolean;
};

export function derivePracticeQuestionStatuses(
  session: PracticeSession,
  evidence: ProgressEvidence,
  source: CanonicalContentSource = canonicalContent,
) {
  return session.questionReferences.map((reference) =>
    derivePracticeQuestionStatus(session, reference, evidence, source));
}

export function derivePracticeQuestionStatus(
  session: PracticeSession,
  reference: PracticeQuestionReference,
  evidence: ProgressEvidence,
  source: CanonicalContentSource = canonicalContent,
): PracticeQuestionStatus {
  const resolved = resolvePracticeReference(reference, source);
  const guided = resolved.status === "resolved" &&
    (resolved.question.answerType === "written" || resolved.question.answerType === "multi_step");
  const attempts = evidence.attempts.filter((item) =>
    item.questionId === reference.questionId &&
    belongsToSession(item.practiceSessionId, item.attemptedAt, session) &&
    item.isGenuine &&
    item.versionEvidence.kind === "known" &&
    item.versionEvidence.questionVersion === reference.questionVersion);
  const latestAttempt = latest(attempts, (item) => item.attemptedAt);
  const assessments = evidence.guidedSelfAssessments.filter((item) =>
    item.practiceSessionId === session.sessionId &&
    item.questionId === reference.questionId &&
    item.versionEvidence.kind === "known" &&
    item.versionEvidence.questionVersion === reference.questionVersion &&
    Boolean(latestAttempt) &&
    Date.parse(item.occurredAt) >= Date.parse(latestAttempt!.attemptedAt));
  const latestAssessment = latest(assessments, (item) => item.occurredAt);
  const supportUsed = evidence.supportEvents.some((item) =>
    item.questionId === reference.questionId &&
    belongsToSession(item.practiceSessionId, item.occurredAt, session));
  const selfAssessment = latestAssessment?.outcome ?? null;
  const skipped = skippedIds(session).includes(reference.questionId) && !latestAttempt && !latestAssessment;
  const complete = guided
    ? Boolean(latestAttempt && latestAssessment)
    : latestAttempt?.isCorrect === true;
  const primary: PracticeQuestionPrimaryStatus = complete ? "complete" : latestAttempt ? "attempted" : "unanswered";
  return {
    questionId: reference.questionId,
    primary,
    skipped,
    unavailable: resolved.status !== "resolved",
    guided,
    awaitingSelfCheck: guided && Boolean(latestAttempt) && !latestAssessment,
    selfAssessment,
    latestAttempt,
    attemptCount: attempts.length,
    supportUsed,
    worthRevisit: latestAttempt?.isCorrect === false ||
      attempts.length > 1 ||
      supportUsed ||
      selfAssessment === "unsure" ||
      selfAssessment === "needs_review" ||
      skipped,
  };
}

function belongsToSession(practiceSessionId: string | undefined, occurredAt: string, session: PracticeSession) {
  if (practiceSessionId !== undefined) return practiceSessionId === session.sessionId;
  const occurred = Date.parse(occurredAt);
  const started = Date.parse(session.startedAt);
  const completed = session.completedAt ? Date.parse(session.completedAt) : null;
  return occurred >= started && (completed === null || occurred <= completed);
}

function skippedIds(session: PracticeSession) {
  return session.status === "completed" && session.finalSkippedQuestionIds
    ? session.finalSkippedQuestionIds
    : session.skippedQuestionIds;
}

function latest<T extends { sequence: number }>(items: readonly T[], timestamp: (item: T) => string): T | null {
  return [...items].sort((left, right) =>
    Date.parse(timestamp(left)) - Date.parse(timestamp(right)) || left.sequence - right.sequence).at(-1) ?? null;
}

export function practiceStatusLabel(status: PracticeQuestionStatus) {
  if (status.unavailable) return "Unavailable";
  if (status.awaitingSelfCheck) return "Awaiting self-check";
  if (status.primary === "complete") return status.selfAssessment === "confident" ? "Complete · Confident" : "Complete";
  if (status.skipped) return "Skipped";
  if (status.primary === "attempted") return "Attempted";
  return "Not answered";
}

export type { QuestionSupportEvent };
