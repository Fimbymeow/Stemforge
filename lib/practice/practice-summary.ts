import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import { derivePracticeQuestionStatuses } from "@/lib/practice/practice-question-status";
import type { PracticeSession } from "@/lib/practice/practice-types";
import type { ProgressEvidence } from "@/lib/progress/types";

export type PracticeSessionSummary = {
  sessionId: string;
  mode: PracticeSession["mode"];
  questionCount: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  incorrectQuestionIds: string[];
  unansweredCount: number;
  supportUsedCount: number;
  skippedCount: number;
  unavailableCount: number;
  confidentCount: number;
  unsureCount: number;
  needsReviewCount: number;
  revisitQuestionIds: string[];
  elapsedSeconds: number | null;
  pathIds: string[];
  suggestedNextAction: "retry_incorrect" | "continue_path" | "start_targeted" | "dashboard";
};

export function derivePracticeSessionSummary(
  session: PracticeSession,
  evidence: ProgressEvidence,
  source: CanonicalContentSource = canonicalContent,
): PracticeSessionSummary {
  const statuses = derivePracticeQuestionStatuses(session, evidence, source);
  const pathIds = [...new Set(session.questionReferences.map((reference) => {
    const resolved = resolvePracticeReference(reference, source);
    return resolved.status === "resolved" ? resolved.context.skillPath.slug : reference.pathId;
  }))];
  const attemptedCount = statuses.filter((status) => status.latestAttempt).length;
  const correctCount = statuses.filter((status) => status.latestAttempt?.isCorrect === true).length;
  const incorrectQuestionIds = statuses.filter((status) => status.latestAttempt?.isCorrect === false).map((status) => status.questionId);
  const incorrectCount = incorrectQuestionIds.length;
  const revisitQuestionIds = statuses.filter((status) => status.worthRevisit).map((status) => status.questionId);
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    questionCount: session.questionReferences.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    incorrectQuestionIds,
    unansweredCount: statuses.filter((status) =>
      status.primary === "unanswered" && !status.skipped && !status.unavailable).length,
    supportUsedCount: statuses.filter((status) => status.supportUsed).length,
    skippedCount: statuses.filter((status) => status.skipped).length,
    unavailableCount: statuses.filter((status) => status.unavailable).length,
    confidentCount: statuses.filter((status) => status.selfAssessment === "confident").length,
    unsureCount: statuses.filter((status) => status.selfAssessment === "unsure").length,
    needsReviewCount: statuses.filter((status) => status.selfAssessment === "needs_review").length,
    revisitQuestionIds,
    elapsedSeconds: session.timing.type === "timed" ? session.timing.elapsedSeconds : null,
    pathIds,
    suggestedNextAction: revisitQuestionIds.length > 0 ? "retry_incorrect" : pathIds.length ? "continue_path" : "dashboard",
  };
}
