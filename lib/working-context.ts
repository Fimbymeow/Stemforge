import { getActiveRecords } from "@/lib/content-selectors";
import { contentResolver } from "@/lib/content-resolver";
import { deriveSkillPathNextAction } from "@/lib/learning/next-action";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { ProgressEvidence, ProgressStatus } from "@/lib/progress/types";
import type { PracticeSession } from "@/lib/practice/practice-types";

export const WORKING_CONTEXT_NOTES_ORIGIN_PREFIX = "stemforge:working-context-notes-origin:";

export type WorkingContextStageModel = {
  id: string;
  name: string;
  description: string;
  completed: number;
  total: number;
  href: string;
};

export type WorkingContextModel = {
  pathId: string;
  skillName: string;
  subjectName: string;
  subjectHref: string;
  higherMathsHref: string;
  stageName: string;
  primaryLabel: "Start" | "Continue" | "Resume practice" | "Practise this skill";
  primaryHref: string;
  nextActionReason: string;
  progressSummary: string;
  collapsedSummary: string;
  reviewCount: number;
  reviewHref: string | null;
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
  const reviewQuestionIds = [...new Set([
    ...progress.reassessmentRequiredQuestionIds,
    ...progress.reviewQuestionIds,
    ...progress.reassessmentRecommendedQuestionIds,
  ])].filter((questionId) => contentResolver.getQuestionContext(questionId)?.skillPath.slug === input.pathId);
  const activeStage = nextAction.stageId
    ? context.skillPath.learningStages?.find((stage) => stage.id === nextAction.stageId)
    : context.skillPath.learningStages?.find((stage) =>
        (progress.stageProgress[stage.id]?.completionPercentage ?? 0) < 100,
      ) ?? context.skillPath.learningStages?.at(-1);
  const stageName = activeStage?.name ?? "Learning path";
  const practiceHref = workingContextPracticeHref(input.pathId);
  const primaryHref = isComplete ? practiceHref : nextAction.href ?? context.skillPath.href;
  const primaryLabel = isComplete
    ? "Practise this skill"
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
    nextActionReason: nextAction.reason,
    progressSummary: isComplete
      ? "All stages complete"
      : `${stageName} · ${stageCompleted} of ${stageTotal} complete`,
    collapsedSummary,
    reviewCount: reviewQuestionIds.length,
    reviewHref: reviewQuestionIds[0] ? `/question/${reviewQuestionIds[0]}` : null,
    notesHref: getActiveRecords(context.skillPath.notes ?? []).length
      ? `/subjects/${context.subject.subjectSlug}/revision-notes`
      : null,
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
