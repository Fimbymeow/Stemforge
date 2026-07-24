import type { CanonicalContentSource } from "@/data/canonical-content";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import { calculateSkillPathProgress, getQuestionProgressForVersion, selectNextQuestionId } from "@/lib/progress/calculations";
import type { ProgressEvidence } from "@/lib/progress/types";
import type { PracticeSession } from "@/lib/practice/practice-types";

export type LearnerNextActionKind =
  | "resume_practice"
  | "resume_question"
  | "continue_question"
  | "start_stage"
  | "start_learning"
  | "review_question"
  | "retry_session"
  | "practice_again"
  | "none";

export type LearnerNextActionIntent = "resuming" | "continuing" | "starting" | "reviewing" | "practising" | "unavailable";

export type LearnerNextAction = {
  kind: LearnerNextActionKind;
  intent: LearnerNextActionIntent;
  href: string | null;
  label: string;
  title: string;
  reason: string;
  subjectId: string | null;
  courseId: string | null;
  pathId: string | null;
  stageId: string | null;
  questionId: string | null;
  questionVersion: number | null;
  practiceSessionId: string | null;
};

export type LearnerNextActionInput = {
  evidence: ProgressEvidence;
  source?: CanonicalContentSource;
  activePracticeSession?: PracticeSession | null;
};

export function deriveSkillPathNextAction(
  input: LearnerNextActionInput & { pathId: string },
): LearnerNextAction {
  const resolver = input.source ? createContentResolver(input.source) : contentResolver;
  const questionVersions = resolver.getQuestionVersions();
  const context = resolver.getPathContext(input.pathId);
  if (!context?.skillPath.isAvailable) return unavailableAction();

  const practice = actionForActivePractice(input.activePracticeSession, resolver);
  if (practice?.pathId === input.pathId) return practice;

  const unfinished = latestCurrentVersionUnfinishedQuestion(
    input.evidence,
    resolver,
    questionVersions,
    input.pathId,
  );
  if (unfinished) {
    return questionAction({
      kind: "resume_question",
      intent: "resuming",
      context: unfinished.context,
      label: "Resume question",
      title: `Resume ${unfinished.context.stage.name}`,
      reason: unfinished.reason,
    });
  }

  const progress = calculateSkillPathProgress(context.skillPath, input.evidence, questionVersions);
  const nextQuestionId = selectNextQuestionId(context.skillPath, input.evidence, questionVersions);
  if (nextQuestionId) {
    const questionContext = resolver.getQuestionContext(nextQuestionId);
    if (questionContext?.skillPath.slug === input.pathId) {
      const reassessment = progress.reassessmentRequiredQuestionIds.includes(nextQuestionId)
        || progress.reassessmentRecommendedQuestionIds.includes(nextQuestionId);
      if (reassessment) {
        return questionAction({
          kind: "review_question",
          intent: "reviewing",
          context: questionContext,
          label: "Review updated question",
          title: `Review ${questionContext.stage.name}`,
          reason: "This question has changed since your earlier work, so revisiting it is the safest next step.",
        });
      }

      const stageProgress = progress.stageProgress[questionContext.stage.id];
      const stages = context.skillPath.learningStages ?? [];
      const stageIndex = stages.findIndex((stage) => stage.id === questionContext.stage.id);
      const precedingStagesComplete = stageIndex > 0 && stages
        .slice(0, stageIndex)
        .every((stage) => progress.stageProgress[stage.id]?.completionPercentage === 100);
      const beginningStage = precedingStagesComplete && (stageProgress?.attemptedCount ?? 0) === 0;
      return questionAction({
        kind: progress.attemptedCount === 0 ? "start_learning" : beginningStage ? "start_stage" : "continue_question",
        intent: progress.attemptedCount === 0 || beginningStage ? "starting" : "continuing",
        context: questionContext,
        label: progress.attemptedCount === 0
          ? "Start learning"
          : beginningStage
            ? `Begin ${questionContext.stage.name}`
            : `Continue ${questionContext.stage.name}`,
        title: progress.attemptedCount === 0
          ? `Start ${context.skillPath.name}`
          : beginningStage
            ? `Begin ${questionContext.stage.name}`
            : `Continue ${context.skillPath.name}`,
        reason: progress.attemptedCount === 0
          ? `Begin with the first ${questionContext.stage.name} question. Your progress is saved automatically.`
          : beginningStage
            ? `You completed the previous stage. ${questionContext.stage.name} is the recommended next step.`
            : "Continue with the next incomplete question in your current stage.",
      });
    }
  }

  const review = actionForReview([context], input.evidence, resolver, questionVersions);
  if (review) return review;
  return {
    kind: "practice_again",
    intent: "practising",
    href: "/practice",
    label: "Practise again",
    title: `Practise ${context.skillPath.name}`,
    reason: "You have completed the guided questions currently available. Use targeted practice to keep the skill fresh.",
    subjectId: context.subject.subjectSlug,
    courseId: context.courseArea.slug,
    pathId: context.skillPath.slug,
    stageId: null,
    questionId: null,
    questionVersion: null,
    practiceSessionId: null,
  };
}

export function deriveLearnerNextAction(input: LearnerNextActionInput): LearnerNextAction {
  const resolver = input.source ? createContentResolver(input.source) : contentResolver;
  const questionVersions = resolver.getQuestionVersions();
  const availableContexts = resolver.getAllPathContexts().filter((context) => context.skillPath.isAvailable);

  const practice = actionForActivePractice(input.activePracticeSession, resolver);
  if (practice) return practice;

  const unfinished = latestCurrentVersionUnfinishedQuestion(input.evidence, resolver, questionVersions);
  if (unfinished) {
    return questionAction({
      kind: "resume_question",
      intent: "resuming",
      context: unfinished.context,
      label: "Resume question",
      title: `Resume ${unfinished.context.stage.name}`,
      reason: unfinished.reason,
    });
  }

  const orderedContexts = [...availableContexts].sort((left, right) =>
    compareNullableDates(latestPathActivity(right.skillPath.slug, input.evidence), latestPathActivity(left.skillPath.slug, input.evidence)),
  );
  const startedContexts = orderedContexts.filter((context) => hasPathActivity(context.skillPath.slug, input.evidence));

  for (const context of startedContexts) {
    const progress = calculateSkillPathProgress(context.skillPath, input.evidence, questionVersions);
    const nextQuestionId = selectNextQuestionId(context.skillPath, input.evidence, questionVersions);
    if (!nextQuestionId) continue;
    const questionContext = resolver.getQuestionContext(nextQuestionId);
    if (!questionContext || questionContext.skillPath.slug !== context.skillPath.slug) continue;

    const reassessment = progress.reassessmentRequiredQuestionIds.includes(nextQuestionId)
      || progress.reassessmentRecommendedQuestionIds.includes(nextQuestionId);
    if (reassessment) {
      return questionAction({
        kind: "review_question",
        intent: "reviewing",
        context: questionContext,
        label: "Review updated question",
        title: `Review ${questionContext.stage.name}`,
        reason: "This question has changed since your earlier work, so revisiting it is the safest next step.",
      });
    }

    const stageProgress = progress.stageProgress[questionContext.stage.id];
    const stages = context.skillPath.learningStages ?? [];
    const stageIndex = stages.findIndex((stage) => stage.id === questionContext.stage.id);
    const precedingStagesComplete = stageIndex > 0 && stages
      .slice(0, stageIndex)
      .every((stage) => progress.stageProgress[stage.id]?.completionPercentage === 100);
    const beginningStage = precedingStagesComplete && (stageProgress?.attemptedCount ?? 0) === 0;
    return questionAction({
      kind: beginningStage ? "start_stage" : "continue_question",
      intent: beginningStage ? "starting" : "continuing",
      context: questionContext,
      label: beginningStage ? `Begin ${questionContext.stage.name}` : `Continue ${questionContext.stage.name}`,
      title: beginningStage ? `Begin ${questionContext.stage.name}` : `Continue ${context.skillPath.name}`,
      reason: beginningStage
        ? `You completed the previous stage. ${questionContext.stage.name} is the recommended next step.`
        : "Continue with the next incomplete question in your current stage.",
    });
  }

  const review = actionForReview(orderedContexts, input.evidence, resolver, questionVersions);
  if (review) return review;

  const firstAvailable = availableContexts[0];
  if (firstAvailable) {
    const firstQuestionId = selectNextQuestionId(firstAvailable.skillPath, input.evidence, questionVersions);
    const firstQuestion = firstQuestionId ? resolver.getQuestionContext(firstQuestionId) : undefined;
    if (firstQuestion) {
      return questionAction({
        kind: "start_learning",
        intent: "starting",
        context: firstQuestion,
        label: "Start learning",
        title: `Start ${firstAvailable.skillPath.name}`,
        reason: `Begin with the first ${firstQuestion.stage.name} question. Your progress is saved automatically.`,
      });
    }

    return {
      kind: "practice_again",
      intent: "practising",
      href: "/practice",
      label: "Practise again",
      title: `Practise ${firstAvailable.skillPath.name}`,
      reason: "You have completed the guided questions currently available. Use targeted practice to keep the skill fresh.",
      subjectId: firstAvailable.subject.subjectSlug,
      courseId: firstAvailable.courseArea.slug,
      pathId: firstAvailable.skillPath.slug,
      stageId: null,
      questionId: null,
      questionVersion: null,
      practiceSessionId: null,
    };
  }

  return unavailableAction();
}

export function derivePracticeSummaryNextAction(
  input: LearnerNextActionInput & { completedSession: PracticeSession; incorrectQuestionIds: readonly string[] },
): LearnerNextAction {
  if (input.completedSession.status === "completed" && input.incorrectQuestionIds.length > 0) {
    return {
      kind: "retry_session",
      intent: "reviewing",
      href: null,
      label: "Retry incorrect",
      title: "Retry this session's incorrect questions",
      reason: `${input.incorrectQuestionIds.length} question${input.incorrectQuestionIds.length === 1 ? "" : "s"} from this session ${input.incorrectQuestionIds.length === 1 ? "is" : "are"} ready to retry.`,
      subjectId: input.completedSession.questionReferences[0]?.subjectId ?? null,
      courseId: input.completedSession.courseId,
      pathId: input.completedSession.questionReferences[0]?.pathId ?? null,
      stageId: null,
      questionId: null,
      questionVersion: null,
      practiceSessionId: input.completedSession.sessionId,
    };
  }
  return deriveLearnerNextAction(input);
}

function actionForActivePractice(
  session: PracticeSession | null | undefined,
  resolver: ReturnType<typeof createContentResolver>,
): LearnerNextAction | null {
  if (!session || session.status !== "active") return null;
  const reference = session.questionReferences[session.currentQuestionIndex];
  const question = reference ? resolver.getQuestion(reference.questionId) : undefined;
  const context = reference ? resolver.getQuestionContext(reference.questionId) : undefined;
  if (!reference || !question || !context || !context.skillPath.isAvailable) return null;
  if (question.questionVersion !== reference.questionVersion || question.contentRevision !== reference.contentRevision) return null;
  return {
    kind: "resume_practice",
    intent: "resuming",
    href: `/practice/session/${session.sessionId}`,
    label: "Resume practice",
    title: "Finish your practice session",
    reason: `Continue from question ${session.currentQuestionIndex + 1} of ${session.questionReferences.length}.`,
    subjectId: reference.subjectId,
    courseId: reference.courseId,
    pathId: reference.pathId,
    stageId: reference.stageId,
    questionId: reference.questionId,
    questionVersion: reference.questionVersion,
    practiceSessionId: session.sessionId,
  };
}

function latestCurrentVersionUnfinishedQuestion(
  evidence: ProgressEvidence,
  resolver: ReturnType<typeof createContentResolver>,
  questionVersions: Readonly<Record<string, number>>,
  pathId?: string,
) {
  const events = [
    ...evidence.attempts.filter((attempt) => attempt.isGenuine).map((attempt) => ({
      questionId: attempt.questionId,
      occurredAt: attempt.attemptedAt,
      sequence: attempt.sequence,
      version: attempt.versionEvidence,
      reason: attempt.isCorrect === false
        ? "Return to the question you last attempted and complete it before moving on."
        : "Continue the question you were working on.",
    })),
    ...evidence.supportEvents.map((event) => ({
      questionId: event.questionId,
      occurredAt: event.occurredAt,
      sequence: event.sequence,
      version: event.versionEvidence,
      reason: event.type === "hint_viewed"
        ? "Return to the question where you used a hint and finish your answer."
        : "Return to the question you were working through.",
    })),
  ].sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt) || right.sequence - left.sequence);

  for (const event of events) {
    const context = resolver.getQuestionContext(event.questionId);
    const version = questionVersions[event.questionId];
    if (!context || !context.skillPath.isAvailable || !version) continue;
    if (pathId && context.skillPath.slug !== pathId) continue;
    if (event.version.kind !== "known" || event.version.questionVersion !== version) continue;
    const progress = getQuestionProgressForVersion(event.questionId, version, evidence);
    if (!progress.completed) return { context, reason: event.reason };
  }
  return null;
}

function actionForReview(
  contexts: ReturnType<ReturnType<typeof createContentResolver>["getAllPathContexts"]>,
  evidence: ProgressEvidence,
  resolver: ReturnType<typeof createContentResolver>,
  questionVersions: Readonly<Record<string, number>>,
) {
  for (const context of contexts) {
    const progress = calculateSkillPathProgress(context.skillPath, evidence, questionVersions);
    const reviewQuestionId = [
      ...progress.reassessmentRequiredQuestionIds,
      ...progress.reviewQuestionIds,
      ...progress.reassessmentRecommendedQuestionIds,
    ].find((questionId) => Boolean(resolver.getQuestionContext(questionId)));
    const questionContext = reviewQuestionId ? resolver.getQuestionContext(reviewQuestionId) : undefined;
    if (!questionContext) continue;
    const count = new Set([
      ...progress.reassessmentRequiredQuestionIds,
      ...progress.reviewQuestionIds,
      ...progress.reassessmentRecommendedQuestionIds,
    ]).size;
    return questionAction({
      kind: "review_question",
      intent: "reviewing",
      context: questionContext,
      label: `Review ${count} question${count === 1 ? "" : "s"}`,
      title: `Review ${context.skillPath.name}`,
      reason: "A completed question is ready to revisit so you can strengthen it independently.",
    });
  }
  return null;
}

function questionAction(input: {
  kind: LearnerNextActionKind;
  intent: LearnerNextActionIntent;
  context: NonNullable<ReturnType<ReturnType<typeof createContentResolver>["getQuestionContext"]>>;
  label: string;
  title: string;
  reason: string;
}): LearnerNextAction {
  return {
    kind: input.kind,
    intent: input.intent,
    href: `/question/${input.context.question.id}`,
    label: input.label,
    title: input.title,
    reason: input.reason,
    subjectId: input.context.subject.subjectSlug,
    courseId: input.context.courseArea.slug,
    pathId: input.context.skillPath.slug,
    stageId: input.context.stage.id,
    questionId: input.context.question.id,
    questionVersion: input.context.question.questionVersion,
    practiceSessionId: null,
  };
}

function unavailableAction(): LearnerNextAction {
  return {
    kind: "none",
    intent: "unavailable",
    href: null,
    label: "No learning action available",
    title: "Learning content is unavailable",
    reason: "No available learning path has a safe question destination right now.",
    subjectId: null,
    courseId: null,
    pathId: null,
    stageId: null,
    questionId: null,
    questionVersion: null,
    practiceSessionId: null,
  };
}

function hasPathActivity(pathId: string, evidence: ProgressEvidence) {
  return evidence.attempts.some((item) => item.skillPathId === pathId)
    || evidence.supportEvents.some((item) => item.skillPathId === pathId)
    || evidence.achievementSnapshots.some((item) => item.pathId === pathId);
}

function latestPathActivity(pathId: string, evidence: ProgressEvidence) {
  const dates = [
    ...evidence.attempts.filter((item) => item.skillPathId === pathId).map((item) => item.attemptedAt),
    ...evidence.supportEvents.filter((item) => item.skillPathId === pathId).map((item) => item.occurredAt),
    ...evidence.achievementSnapshots.filter((item) => item.pathId === pathId).map((item) => item.achievedAt),
  ];
  return dates.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

function compareNullableDates(left: string | null, right: string | null) {
  return (left ? Date.parse(left) : 0) - (right ? Date.parse(right) : 0);
}
