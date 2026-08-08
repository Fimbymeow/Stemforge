import type { SkillPath } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { deriveMistakeLog } from "@/lib/mistakes/derivation";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { ProgressEvidence } from "@/lib/progress/types";
import { deriveSkillReviewState } from "@/lib/review/derivation";
import type { ReviewDueReason } from "@/lib/review/types";

export type AttentionReasonCode =
  | "content_updated"
  | "reassessment_required"
  | "reassessment_recommended"
  | "open_mistakes"
  | "incomplete_stage"
  | "review_recently_incorrect"
  | "review_due_after_time"
  | "healthy"
  | "not_started";

export type AttentionReason = {
  code: AttentionReasonCode;
  detail: string;
  needsAttention: boolean;
};

export type SkillAttentionModel = {
  primaryReason: AttentionReason;
  reasons: AttentionReason[];
  needsAttention: boolean;
};

/**
 * Pure read-side explanation of inspectable learning evidence. The order in this
 * function is the display precedence; it is deliberately independent of the
 * next-action engine and emits no score or persisted state.
 */
export function deriveSkillAttention(input: {
  skillPath: SkillPath;
  evidence: ProgressEvidence;
  now?: Date;
}): SkillAttentionModel {
  const { skillPath, evidence } = input;
  const versions = contentResolver.getQuestionVersions();
  const progress = calculateSkillPathProgress(skillPath, evidence, versions);
  const review = deriveSkillReviewState(skillPath, evidence, input.now ?? new Date());
  const mistakes = deriveMistakeLog(evidence, contentResolver.getPathContext(skillPath.slug)?.subject.subjectSlug);
  const openMistakes = mistakes.openGroups.find((group) => group.skillPathId === skillPath.slug)?.items ?? [];
  const reasons: AttentionReason[] = [];

  if (progress.reassessmentRequiredQuestionIds.length > 0 || progress.reassessmentRecommendedQuestionIds.length > 0) {
    const requiredIds = new Set(progress.reassessmentRequiredQuestionIds);
    const contentUpdated = evidence.attempts.some((attempt) =>
      requiredIds.has(attempt.questionId) &&
      attempt.skillPathId === skillPath.slug &&
      attempt.versionEvidence.kind === "known" &&
      attempt.versionEvidence.questionVersion < (versions[attempt.questionId] ?? 1),
    ) || evidence.supportEvents.some((event) =>
      requiredIds.has(event.questionId) &&
      event.skillPathId === skillPath.slug &&
      event.versionEvidence.kind === "known" &&
      event.versionEvidence.questionVersion < (versions[event.questionId] ?? 1),
    );
    reasons.push(contentUpdated
      ? reason("content_updated", "Updated content needs a quick recheck. Your earlier progress is saved.", true)
      : progress.reassessmentRequiredQuestionIds.length > 0
        ? reason("reassessment_required", "Earlier progress is saved; a short recheck is needed.", true)
        : reason("reassessment_recommended", "Earlier progress is saved; a quick recheck is recommended.", true));
  }

  if (review.due && review.reason === "content_changed" && !reasons.some((item) => item.code === "content_updated")) {
    reasons.push(reason("content_updated", "Updated content needs a quick recheck. Your earlier progress is saved.", true));
  }

  if (openMistakes.length > 0) {
    reasons.push(reason(
      "open_mistakes",
      `${openMistakes.length} unresolved question${openMistakes.length === 1 ? "" : "s"}`,
      true,
    ));
  }

  const currentStage = (skillPath.learningStages ?? []).find((stage) =>
    (progress.stageProgress[stage.id]?.completionPercentage ?? 0) < 100,
  );
  const hasEvidence = hasPathEvidence(skillPath.slug, evidence);
  if (hasEvidence && currentStage) {
    const stageProgress = progress.stageProgress[currentStage.id];
    reasons.push(reason(
      "incomplete_stage",
      `${displayStageName(currentStage.name)}: ${stageProgress?.completedQuestionIds.length ?? 0} of ${stageProgress?.totalQuestions ?? currentStage.questionIds.length} complete`,
      true,
    ));
  }

  const reviewReason = attentionReviewReason(review.reason);
  if (review.due && reviewReason) reasons.push(reviewReason);

  if (!reasons.length) {
    reasons.push(hasEvidence
      ? reason("healthy", "No attention needed right now.", false)
      : reason("not_started", "Not started", false));
  }

  return {
    primaryReason: reasons[0],
    reasons,
    needsAttention: reasons.some((item) => item.needsAttention),
  };
}

export function formatReviewDueReason(reasonCode: ReviewDueReason): string | null {
  switch (reasonCode) {
    case "recently_incorrect": return "Review is due after a recent incorrect answer.";
    case "due_after_time": return "Review is due to keep earlier learning fresh.";
    case "content_changed": return "This topic was updated, so Review includes a quick recheck.";
    default: return null;
  }
}

function attentionReviewReason(reasonCode: ReviewDueReason): AttentionReason | null {
  const detail = formatReviewDueReason(reasonCode);
  if (!detail) return null;
  if (reasonCode === "recently_incorrect") return reason("review_recently_incorrect", detail, true);
  if (reasonCode === "due_after_time") return reason("review_due_after_time", detail, true);
  return null; // content_changed is already represented by the higher-precedence reassessment reason.
}

function hasPathEvidence(pathId: string, evidence: ProgressEvidence) {
  return evidence.attempts.some((item) => item.skillPathId === pathId) ||
    evidence.supportEvents.some((item) => item.skillPathId === pathId) ||
    evidence.guidedSelfAssessments.some((item) => item.skillPathId === pathId) ||
    evidence.achievementSnapshots.some((item) => item.pathId === pathId) ||
    evidence.reviewEvents.some((item) => item.target.targetType === "skill" && item.target.targetId === pathId);
}

function reason(code: AttentionReasonCode, detail: string, needsAttention: boolean): AttentionReason {
  return { code, detail, needsAttention };
}

function displayStageName(name: string) {
  return name === "Past Paper-style Questions" ? "Exam practice" : name;
}
