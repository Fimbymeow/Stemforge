import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import type { PracticeSession } from "@/lib/practice/practice-types";
import type { ProgressEvidence } from "@/lib/progress/types";

export type PracticeSessionSummary = {
  sessionId: string;
  mode: PracticeSession["mode"];
  questionCount: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  supportUsedCount: number;
  elapsedSeconds: number | null;
  pathIds: string[];
  suggestedNextAction: "retry_incorrect" | "continue_path" | "start_targeted" | "dashboard";
};

export function derivePracticeSessionSummary(
  session: PracticeSession,
  evidence: ProgressEvidence,
  source: CanonicalContentSource = canonicalContent,
): PracticeSessionSummary {
  const questionIds = session.questionReferences.map((reference) => reference.questionId);
  const relevantAttempts = evidence.attempts.filter((attempt) =>
    questionIds.includes(attempt.questionId) &&
    attempt.isGenuine &&
    attempt.versionEvidence.kind === "known" &&
    session.questionReferences.some((reference) =>
      reference.questionId === attempt.questionId &&
      reference.questionVersion === attempt.versionEvidence.questionVersion),
  );
  const latestByQuestion = new Map<string, (typeof relevantAttempts)[number]>();
  for (const attempt of relevantAttempts) {
    const previous = latestByQuestion.get(attempt.questionId);
    if (!previous || Date.parse(attempt.attemptedAt) > Date.parse(previous.attemptedAt) || attempt.sequence > previous.sequence) {
      latestByQuestion.set(attempt.questionId, attempt);
    }
  }
  const supportUsedCount = evidence.supportEvents.filter((event) =>
    questionIds.includes(event.questionId) && event.afterGenuineAttempt,
  ).length;
  const pathIds = [...new Set(session.questionReferences.map((reference) => {
    const resolved = resolvePracticeReference(reference, source);
    return resolved.status === "resolved" ? resolved.context.skillPath.slug : reference.pathId;
  }))];
  const attemptedCount = latestByQuestion.size;
  const correctCount = [...latestByQuestion.values()].filter((attempt) => attempt.isCorrect === true).length;
  const incorrectCount = [...latestByQuestion.values()].filter((attempt) => attempt.isCorrect === false).length;
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    questionCount: session.questionReferences.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    unansweredCount: session.questionReferences.length - attemptedCount,
    supportUsedCount,
    elapsedSeconds: session.timing.type === "timed" ? session.timing.elapsedSeconds : null,
    pathIds,
    suggestedNextAction: incorrectCount > 0 ? "retry_incorrect" : pathIds.length ? "continue_path" : "dashboard",
  };
}
