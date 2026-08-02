import { getActiveRecords } from "@/lib/content-selectors";
import { contentResolver } from "@/lib/content-resolver";
import { deriveSkillPathNextAction } from "@/lib/learning/next-action";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { ProgressEvidence, ProgressStatus } from "@/lib/progress/types";
import type { PracticeSession } from "@/lib/practice/practice-types";
import { deriveSkillReviewState } from "@/lib/review/derivation";
import type { ReviewDueReason } from "@/lib/review/types";

export const WORKING_CONTEXT_NOTES_ORIGIN_PREFIX = "stemforge:working-context-notes-origin:";

export type WorkingContextStageModel = {
  id: string;
  name: string;
  description: string;
  completed: number;
  total: number;
  href: string;
  reviewDue: boolean;
};

export type WorkingContextModel = {
  pathId: string;
  skillName: string;
  subjectName: string;
  subjectHref: string;
  higherMathsHref: string;
  stageName: string;
  primaryLabel: string;
  primaryHref: string;
  nextActionReason: string;
  progressSummary: string;
  collapsedSummary: string;
  reviewCount: number;
  reviewHref: string | null;
  reviewReason: ReviewDueReason;
  notesHref: string | null;
  practiceHref: string;
  overviewHref: string;
  questionBankHref: string;
  completed: number;
  total: number;
  isComplete: boolean;
  status: ProgressStatus;
  completionPercentage: number;
  stages: WorkingContextStageModel[];
};

export type LessonContinuationAction = {
  href: string;
  label: string;
};

export function deriveLessonContinuationAction(input: {
  pathId: string;
  evidence: ProgressEvidence;
}): LessonContinuationAction | null {
  const context = contentResolver.getPathContext(input.pathId);
  if (!context?.skillPath.isAvailable) return null;
  const stages = context.skillPath.learningStages ?? [];
  const progress = calculateSkillPathProgress(
    context.skillPath,
    input.evidence,
    contentResolver.getQuestionVersions(),
  );
  const isComplete = progress.totalQuestions > 0
    && progress.completedQuestionIds.length >= progress.totalQuestions;

  if (isComplete) {
    const reviewState = deriveSkillReviewState(context.skillPath, input.evidence);
    if (reviewState.due) {
      return {
        href: `/practice?review=1&path=${encodeURIComponent(input.pathId)}`,
        label: "Start Review",
      };
    }
    const foundations = stages[0];
    return foundations?.questionIds[0]
      ? { href: `/question/${foundations.questionIds[0]}`, label: "Revisit Foundations" }
      : null;
  }

  const nextAction = deriveSkillPathNextAction(input);
  const stageIndex = stages.findIndex((stage) => stage.id === nextAction.stageId);
  const stage = stageIndex >= 0 ? stages[stageIndex] : stages[0];
  const href = nextAction.href ?? (stage?.questionIds[0] ? `/question/${stage.questionIds[0]}` : null);
  if (!href || !stage) return null;
  const label = stageIndex === 1
    ? "Continue to Applications"
    : stageIndex >= 2
      ? "Continue to Exam practice"
      : "Continue to Foundations";
  return { href, label };
}

export function deriveWorkingContextModel(input: {
  pathId: string;
  evidence: ProgressEvidence;
  activePracticeSession?: PracticeSession | null;
}): WorkingContextModel | null {
  const context = contentResolver.getPathContext(input.pathId);
  if (!context?.skillPath.isAvailable) return null;

  const progress = calculateSkillPathProgress(
    context.skillPath,
    input.evidence,
    contentResolver.getQuestionVersions(),
  );
  const nextAction = deriveSkillPathNextAction(input);
  const isComplete = progress.totalQuestions > 0
    && progress.completedQuestionIds.length >= progress.totalQuestions;
  const reviewState = deriveSkillReviewState(context.skillPath, input.evidence);
  const reviewQuestionIds = [...new Set([
    ...reviewState.reassessmentQuestionIds,
    ...reviewState.ordinaryRecoveryQuestionIds,
  ])].filter((questionId) => contentResolver.getQuestionContext(questionId)?.skillPath.slug === input.pathId);
  const activeStage = nextAction.stageId
    ? context.skillPath.learningStages?.find((stage) => stage.id === nextAction.stageId)
    : context.skillPath.learningStages?.find((stage) =>
        (progress.stageProgress[stage.id]?.completionPercentage ?? 0) < 100,
      ) ?? context.skillPath.learningStages?.at(-1);
  const stageName = activeStage?.name ?? "Learning path";
  const practiceHref = workingContextPracticeHref(input.pathId);
  const reviewCount = reviewState.due ? 1 : 0;
  const reviewHref = reviewState.due
    ? `/practice?review=1&path=${encodeURIComponent(input.pathId)}`
    : null;
  const notesHref = context.skillPath.lessonDocument || getActiveRecords(context.skillPath.notes ?? []).length
    ? `/subjects/${context.subject.subjectSlug}/revision-notes`
    : null;
  const isFreshStart = progress.attemptedCount === 0 && nextAction.kind === "start_learning";
  const primaryHref = !isComplete && isFreshStart && notesHref
    ? notesHref
    : isComplete
    ? (reviewHref ?? practiceHref)
    : nextAction.href ?? context.skillPath.href;
  const primaryLabel = isComplete
    ? (reviewCount > 0
      ? "Start Review"
        : "Practise this skill")
    : nextAction.kind === "resume_practice"
      ? "Resume practice"
    : progress.attemptedCount === 0
      ? "Start"
      : "Continue";
  const stageProgress = activeStage ? progress.stageProgress[activeStage.id] : null;
  const stageCompleted = stageProgress?.completedQuestionIds.length ?? 0;
  const stageTotal = stageProgress?.totalQuestions ?? 0;
  const collapsedSummary = isComplete
    ? "All stages complete"
    : `${stageName} · ${stageCompleted}/${stageTotal}${reviewQuestionIds.length ? ` · ${reviewQuestionIds.length} to review` : ""}`;

  return {
    pathId: context.skillPath.slug,
    skillName: context.skillPath.name,
    subjectName: context.subject.subjectName,
    subjectHref: context.subject.href,
    higherMathsHref: context.subject.href,
    stageName,
    primaryLabel,
    primaryHref,
    nextActionReason: isFreshStart
      ? "Read the lesson first, then continue into Foundations."
      : nextAction.reason,
    progressSummary: isComplete
      ? "All stages complete"
      : `${stageName} · ${stageCompleted} of ${stageTotal} complete`,
    collapsedSummary,
    reviewCount,
    reviewHref,
    reviewReason: reviewState.reason,
    notesHref,
    practiceHref,
    overviewHref: context.skillPath.href,
    questionBankHref: `/subjects/${context.subject.subjectSlug}/question-bank`,
    completed: progress.completedQuestionIds.length,
    total: progress.totalQuestions,
    isComplete,
    status: progress.status,
    completionPercentage: progress.completionPercentage,
    stages: (context.skillPath.learningStages ?? []).map((stage) => {
      const item = progress.stageProgress[stage.id];
      return {
        id: stage.id,
        name: stage.name,
        description: stage.description,
        completed: item?.completedQuestionIds.length ?? 0,
        total: item?.totalQuestions ?? stage.questionIds.length,
        href: stage.questionIds[0] ? `/question/${stage.questionIds[0]}` : context.skillPath.href,
        reviewDue: stage.questionIds.some((questionId) => reviewQuestionIds.includes(questionId)),
      };
    }),
  };
}

export function parseWorkingContextPathId(value: unknown) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return null;
  const context = contentResolver.getPathContext(candidate);
  return context?.skillPath.isAvailable ? context.skillPath.slug : null;
}

export function workingContextPracticeHref(pathId: string) {
  return `/practice?path=${encodeURIComponent(pathId)}`;
}

/** Single source of truth for the rail/hub/overview Review due label. */
export function formatReviewDueLabel(reviewCount: number): string {
  return `Review ${reviewCount} skill${reviewCount === 1 ? "" : "s"} due`;
}

export function questionHelpNotesHref(input: {
  subjectSlug: string;
  questionId: string;
  questionNumber: number;
  noteId: string;
  token: string;
}) {
  const params = new URLSearchParams({
    fromQuestion: input.questionId,
    questionNumber: String(input.questionNumber),
    originToken: input.token,
  });
  return `/subjects/${input.subjectSlug}/revision-notes?${params.toString()}#${encodeURIComponent(input.noteId)}`;
}
