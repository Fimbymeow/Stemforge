import type { LearningStage, LearningStageName, SkillPath } from "@/data/types";
import type {
  DashboardProgressSummary,
  ProgressEvidence,
  ProgressPayload,
  ProgressStatus,
  QuestionAttempt,
  QuestionOutcome,
  QuestionProgressState,
  QuestionSupportEvent,
  SkillPathProgress,
  StageProgress,
} from "@/lib/progress/types";

export const MASTERY_CONTRIBUTIONS: Readonly<Record<QuestionOutcome, number>> = {
  not_attempted: 0,
  attempted_unresolved: 0.1,
  completed_with_solution: 0.35,
  correct_with_hint: 0.7,
  independently_correct_after_error: 0.85,
  independently_correct_first_attempt: 1,
  legacy_completed: 0.1,
  legacy_correct_unknown_support: 0.7,
};

export const STAGE_MASTERY_WEIGHTS: Readonly<Record<LearningStageName, number>> = {
  Foundations: 0.25,
  Applications: 0.35,
  "Past Paper-style Questions": 0.4,
};

export function recordQuestionSubmission(payload: ProgressPayload, attempt: QuestionAttempt): ProgressPayload {
  return { ...payload, data: { ...payload.data, attempts: [...payload.data.attempts, { ...attempt }] } };
}

export function recordSupportEvent(payload: ProgressPayload, event: QuestionSupportEvent): ProgressPayload {
  return { ...payload, data: { ...payload.data, supportEvents: [...payload.data.supportEvents, { ...event }] } };
}

export function resetPathProgress(payload: ProgressPayload, skillPathId: string): ProgressPayload {
  return {
    ...payload,
    data: {
      attempts: payload.data.attempts.filter((attempt) => attempt.skillPathId !== skillPathId),
      supportEvents: payload.data.supportEvents.filter((event) => event.skillPathId !== skillPathId),
      achievementSnapshots: payload.data.achievementSnapshots,
    },
  };
}

export function isGenuineAnswer(answer: string) {
  return answer.trim().length > 0;
}

export function getQuestionProgress(questionId: string, evidence: ProgressEvidence): QuestionProgressState {
  return getQuestionProgressForVersion(questionId, 1, evidence);
}

export function getQuestionProgressForVersion(
  questionId: string,
  currentVersion: number,
  evidence: ProgressEvidence,
): QuestionProgressState {
  const historicalAttempts = evidence.attempts.filter((attempt) => attempt.questionId === questionId && attempt.isGenuine);
  const historicalEvents = evidence.supportEvents.filter((event) => event.questionId === questionId);
  const currentAttempts = historicalAttempts.filter(
    (attempt) => attempt.versionEvidence.kind === "known" && attempt.versionEvidence.questionVersion === currentVersion,
  );
  const currentEvents = historicalEvents.filter(
    (event) => event.versionEvidence.kind === "known" && event.versionEvidence.questionVersion === currentVersion,
  );
  const unknownAttempts = historicalAttempts.filter((attempt) => attempt.versionEvidence.kind === "unknown_legacy");
  const unknownEvents = historicalEvents.filter((event) => event.versionEvidence.kind === "unknown_legacy");
  const olderKnown = historicalAttempts.some(
    (attempt) => attempt.versionEvidence.kind === "known" && attempt.versionEvidence.questionVersion < currentVersion,
  ) || historicalEvents.some(
    (event) => event.versionEvidence.kind === "known" && event.versionEvidence.questionVersion < currentVersion,
  );
  const hasUnknown = unknownAttempts.length > 0 || unknownEvents.length > 0;
  const currentLatest = currentAttempts.at(-1);
  const compatibleLatest = currentLatest ?? (currentVersion === 1 ? unknownAttempts.at(-1) : undefined);
  const currentSolutionViewed = currentEvents.some((event) => event.type === "solution_viewed" && event.afterGenuineAttempt);
  const historicalSolutionViewed = historicalEvents.some((event) => event.type === "solution_viewed" && event.afterGenuineAttempt);
  const historicalLegacyCompleted = historicalAttempts.some((attempt) => attempt.legacyCompleted === true);
  const currentVersionCompleted = currentAttempts.some((attempt) => attempt.isCorrect === true) || currentSolutionViewed;
  const historicalCompleted = historicalAttempts.some((attempt) => attempt.isCorrect === true) || historicalSolutionViewed || historicalLegacyCompleted;
  // Unknown evidence remains visible for unchanged version-1 content, but it is
  // never promoted to strict current-version mastery evidence.
  const legacyCompatibleCompleted = currentVersion === 1 && hasUnknown && historicalCompleted;
  const historicalBestOutcome = deriveBestDemonstratedOutcome(historicalAttempts, historicalEvents);
  const bestOutcome = deriveBestDemonstratedOutcome(currentAttempts, currentEvents);
  const correctWithoutSolution =
    bestOutcome === "independently_correct_first_attempt" ||
    bestOutcome === "independently_correct_after_error" ||
    bestOutcome === "correct_with_hint";

  return {
    questionId,
    attempted: currentAttempts.length > 0 || (currentVersion === 1 && unknownAttempts.length > 0),
    completed: currentVersionCompleted || legacyCompatibleCompleted,
    latestResult: compatibleLatest?.isCorrect ?? null,
    bestOutcome,
    masteryContribution: MASTERY_CONTRIBUTIONS[bestOutcome],
    reviewRecommended: shouldRecommendReview(currentAttempts, currentEvents, bestOutcome) || hasUnknown || olderKnown,
    genuineAttemptCount: currentAttempts.length,
    incorrectAttemptCount: currentAttempts.filter((attempt) => attempt.isCorrect === false).length,
    hintViewed: currentEvents.some((event) => event.type === "hint_viewed"),
    solutionViewed: currentSolutionViewed,
    correctWithoutSolution,
    navigationEligible: currentVersionCompleted || legacyCompatibleCompleted,
    currentVersion,
    currentVersionAttempted: currentAttempts.length > 0,
    currentVersionCompleted,
    historicalAttempted: historicalAttempts.length > 0,
    historicalCompleted,
    historicalBestOutcome,
    historicalMasteryContribution: MASTERY_CONTRIBUTIONS[historicalBestOutcome],
    versionEvidenceStatus: deriveVersionEvidenceStatus(currentAttempts.length > 0 || currentEvents.length > 0, olderKnown, hasUnknown),
    reassessment: currentVersionCompleted
      ? "none"
      : olderKnown
        ? "required"
        : hasUnknown
          ? (currentVersion > 1 ? "required" : "recommended")
          : "none",
  };
}

export function deriveBestDemonstratedOutcome(
  attempts: readonly QuestionAttempt[],
  events: readonly QuestionSupportEvent[],
): QuestionOutcome {
  const genuine = attempts.filter((attempt) => attempt.isGenuine);
  const outcomes: QuestionOutcome[] = [];
  for (const [index, attempt] of genuine.entries()) {
    if (attempt.isCorrect === true) {
      if (attempt.supportKnowledge === "unknown_legacy") outcomes.push("legacy_correct_unknown_support");
      else if (attempt.hintViewedBeforeSubmission) outcomes.push("correct_with_hint");
      else if (genuine.slice(0, index).some((previous) => previous.isCorrect === false)) {
        outcomes.push("independently_correct_after_error");
      } else outcomes.push("independently_correct_first_attempt");
    }
  }
  if (events.some((event) => event.type === "solution_viewed" && event.afterGenuineAttempt)) {
    outcomes.push("completed_with_solution");
  }
  if (genuine.some((attempt) => attempt.legacyCompleted)) outcomes.push("legacy_completed");
  if (!outcomes.length && genuine.length) outcomes.push("attempted_unresolved");
  if (!outcomes.length) return "not_attempted";
  return outcomes.reduce((best, outcome) =>
    MASTERY_CONTRIBUTIONS[outcome] > MASTERY_CONTRIBUTIONS[best] ? outcome : best,
  );
}

export function shouldRecommendReview(
  attempts: readonly QuestionAttempt[],
  events: readonly QuestionSupportEvent[],
  bestOutcome = deriveBestDemonstratedOutcome(attempts, events),
) {
  const genuine = attempts.filter((attempt) => attempt.isGenuine);
  const latest = genuine.at(-1);
  return (
    events.some((event) => event.type === "solution_viewed" && event.afterGenuineAttempt) ||
    genuine.filter((attempt) => attempt.isCorrect === false).length >= 2 ||
    bestOutcome === "correct_with_hint" ||
    bestOutcome === "legacy_completed" ||
    bestOutcome === "legacy_correct_unknown_support" ||
    (MASTERY_CONTRIBUTIONS[bestOutcome] >= 0.7 && latest?.isCorrect === false)
  );
}

export function calculateStageProgress(
  skillPath: SkillPath,
  stage: LearningStage,
  evidence: ProgressEvidence,
  questionVersions: Readonly<Record<string, number>> = {},
): StageProgress {
  const states = stage.questionIds.map((questionId) => getQuestionProgressForVersion(questionId, questionVersions[questionId] ?? 1, evidence));
  const attempted = states.filter((state) => state.attempted);
  const completed = states.filter((state) => state.completed);
  const latestCorrect = states.filter((state) => state.latestResult === true);
  const firstAttempts = stage.questionIds
    .map((questionId) => evidence.attempts.find((attempt) =>
      attempt.questionId === questionId &&
      attempt.isGenuine &&
      attempt.versionEvidence.kind === "known" &&
      attempt.versionEvidence.questionVersion === (questionVersions[questionId] ?? 1),
    ))
    .filter((attempt): attempt is QuestionAttempt => Boolean(attempt));
  const masteryScore = percentFromRatio(states.reduce((sum, state) => sum + state.masteryContribution, 0), states.length);
  const historicalMasteryScore = percentFromRatio(states.reduce((sum, state) => sum + state.historicalMasteryContribution, 0), states.length);
  const independentPerformancePercentage = percent(states.filter((state) => state.correctWithoutSolution).length, states.length);
  const completionPercentage = percent(completed.length, states.length);

  return {
    stageId: stage.id,
    attemptedQuestionIds: attempted.map((state) => state.questionId),
    completedQuestionIds: completed.map((state) => state.questionId),
    correctQuestionIds: latestCorrect.map((state) => state.questionId),
    reviewQuestionIds: states.filter((state) => state.reviewRecommended).map((state) => state.questionId),
    totalQuestions: states.length,
    attemptedCount: attempted.length,
    correctCount: latestCorrect.length,
    completionPercentage,
    firstAttemptAccuracyPercentage: firstAttempts.length
      ? percent(firstAttempts.filter((attempt) => attempt.isCorrect === true).length, firstAttempts.length)
      : null,
    latestAttemptAccuracyPercentage: attempted.length ? percent(latestCorrect.length, attempted.length) : null,
    accuracyPercentage: attempted.length ? percent(latestCorrect.length, attempted.length) : null,
    masteryScore,
    independentPerformancePercentage,
    status: deriveStageStatus({ attemptedCount: attempted.length, completedCount: completed.length, total: states.length, masteryScore, independentPerformancePercentage }),
    currentVersionCompletedQuestionIds: states.filter((state) => state.currentVersionCompleted).map((state) => state.questionId),
    historicalCompletedQuestionIds: states.filter((state) => state.historicalCompleted).map((state) => state.questionId),
    currentVersionCompletionPercentage: percent(states.filter((state) => state.currentVersionCompleted).length, states.length),
    historicalCompletionPercentage: percent(states.filter((state) => state.historicalCompleted).length, states.length),
    reassessmentRecommendedQuestionIds: states.filter((state) => state.reassessment === "recommended").map((state) => state.questionId),
    reassessmentRequiredQuestionIds: states.filter((state) => state.reassessment === "required").map((state) => state.questionId),
    newPracticeAvailable: states.some((state) => state.historicalAttempted) && states.some((state) => !state.historicalAttempted),
    historicalMasteryScore,
    currentVersionStatus: deriveStageStatus({
      attemptedCount: states.filter((state) => state.currentVersionAttempted).length,
      completedCount: states.filter((state) => state.currentVersionCompleted).length,
      total: states.length,
      masteryScore,
      independentPerformancePercentage,
    }),
    historicalStatus: deriveStageStatus({
      attemptedCount: states.filter((state) => state.historicalAttempted).length,
      completedCount: states.filter((state) => state.historicalCompleted).length,
      total: states.length,
      masteryScore: historicalMasteryScore,
      independentPerformancePercentage: percent(
        states.filter((state) => state.historicalMasteryContribution >= MASTERY_CONTRIBUTIONS.correct_with_hint).length,
        states.length,
      ),
    }),
  };
}

export function calculateSkillPathProgress(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  questionVersions: Readonly<Record<string, number>> = {},
): SkillPathProgress {
  const stages = skillPath.learningStages ?? [];
  const stageProgress = Object.fromEntries(stages.map((stage) => [stage.id, calculateStageProgress(skillPath, stage, evidence, questionVersions)]));
  const questionIds = stages.flatMap((stage) => stage.questionIds);
  const states = questionIds.map((questionId) => getQuestionProgressForVersion(questionId, questionVersions[questionId] ?? 1, evidence));
  const attempted = states.filter((state) => state.attempted);
  const completed = states.filter((state) => state.completed);
  const latestCorrect = states.filter((state) => state.latestResult === true);
  const firstAttempts = questionIds
    .map((questionId) => evidence.attempts.find((attempt) =>
      attempt.questionId === questionId &&
      attempt.isGenuine &&
      attempt.versionEvidence.kind === "known" &&
      attempt.versionEvidence.questionVersion === (questionVersions[questionId] ?? 1),
    ))
    .filter((attempt): attempt is QuestionAttempt => Boolean(attempt));
  const masteryScore = calculatePathWeightedMastery(stages, stageProgress);
  const historicalMasteryScore = calculatePathWeightedMasteryByField(stages, stageProgress, "historicalMasteryScore");
  const independentPerformancePercentage = percent(states.filter((state) => state.correctWithoutSolution).length, states.length);
  const allStagesCompleted = stages.length > 0 && stages.every((stage) => stageProgress[stage.id]?.completionPercentage === 100);
  const pastPaperStage = stages.find((stage) => stage.name === "Past Paper-style Questions");
  const pastPaperMastery = pastPaperStage ? stageProgress[pastPaperStage.id]?.masteryScore ?? 0 : null;

  return {
    skillPathId: skillPath.slug,
    attemptedQuestionIds: attempted.map((state) => state.questionId),
    completedQuestionIds: completed.map((state) => state.questionId),
    correctQuestionIds: latestCorrect.map((state) => state.questionId),
    reviewQuestionIds: states.filter((state) => state.reviewRecommended).map((state) => state.questionId),
    totalQuestions: states.length,
    attemptedCount: attempted.length,
    correctCount: latestCorrect.length,
    completionPercentage: percent(completed.length, states.length),
    firstAttemptAccuracyPercentage: firstAttempts.length
      ? percent(firstAttempts.filter((attempt) => attempt.isCorrect === true).length, firstAttempts.length)
      : null,
    latestAttemptAccuracyPercentage: attempted.length ? percent(latestCorrect.length, attempted.length) : null,
    accuracyPercentage: attempted.length ? percent(latestCorrect.length, attempted.length) : null,
    masteryScore,
    independentPerformancePercentage,
    status: derivePathStatus({ attemptedCount: attempted.length, allStagesCompleted, masteryScore, independentPerformancePercentage, pastPaperMastery }),
    stageProgress,
    currentVersionCompletedQuestionIds: states.filter((state) => state.currentVersionCompleted).map((state) => state.questionId),
    historicalCompletedQuestionIds: states.filter((state) => state.historicalCompleted).map((state) => state.questionId),
    currentVersionCompletionPercentage: percent(states.filter((state) => state.currentVersionCompleted).length, states.length),
    historicalCompletionPercentage: percent(states.filter((state) => state.historicalCompleted).length, states.length),
    reassessmentRecommendedQuestionIds: states.filter((state) => state.reassessment === "recommended").map((state) => state.questionId),
    reassessmentRequiredQuestionIds: states.filter((state) => state.reassessment === "required").map((state) => state.questionId),
    newPracticeAvailable: states.some((state) => state.historicalAttempted) && states.some((state) => !state.historicalAttempted),
    historicalMasteryScore,
    currentVersionStatus: derivePathStatus({
      attemptedCount: states.filter((state) => state.currentVersionAttempted).length,
      allStagesCompleted: stages.length > 0 && stages.every((stage) => stageProgress[stage.id]?.currentVersionCompletionPercentage === 100),
      masteryScore,
      independentPerformancePercentage,
      pastPaperMastery,
    }),
    historicalStatus: derivePathStatus({
      attemptedCount: states.filter((state) => state.historicalAttempted).length,
      allStagesCompleted: stages.length > 0 && stages.every((stage) => stageProgress[stage.id]?.historicalCompletionPercentage === 100),
      masteryScore: historicalMasteryScore,
      independentPerformancePercentage: percent(
        states.filter((state) => state.historicalMasteryContribution >= MASTERY_CONTRIBUTIONS.correct_with_hint).length,
        states.length,
      ),
      pastPaperMastery: pastPaperStage ? stageProgress[pastPaperStage.id]?.historicalMasteryScore ?? 0 : null,
    }),
  };
}

export function calculateDashboardSummary(skillPath: SkillPath, evidence: ProgressEvidence): DashboardProgressSummary {
  const progress = calculateSkillPathProgress(skillPath, evidence);
  return {
    attemptedCount: progress.attemptedCount,
    completedCount: progress.completedQuestionIds.length,
    correctCount: progress.correctCount,
    totalQuestions: progress.totalQuestions,
    completionPercentage: progress.completionPercentage,
    accuracyPercentage: progress.latestAttemptAccuracyPercentage,
    firstAttemptAccuracyPercentage: progress.firstAttemptAccuracyPercentage,
    masteryScore: progress.masteryScore,
    status: progress.status,
  };
}

export function selectNextQuestionId(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  questionVersions: Readonly<Record<string, number>> = {},
) {
  for (const stage of skillPath.learningStages ?? []) {
    const next = stage.questionIds.find((questionId) =>
      !getQuestionProgressForVersion(questionId, questionVersions[questionId] ?? 1, evidence).completed,
    );
    if (next) return next;
  }
  return null;
}

function deriveVersionEvidenceStatus(hasCurrent: boolean, hasOlder: boolean, hasUnknown: boolean): QuestionProgressState["versionEvidenceStatus"] {
  const categories = Number(hasCurrent) + Number(hasOlder) + Number(hasUnknown);
  if (categories > 1) return "mixed";
  if (hasCurrent) return "current";
  if (hasOlder) return "older";
  if (hasUnknown) return "unknown_legacy";
  return "none";
}

export function calculatePathWeightedMastery(stages: readonly LearningStage[], progress: Record<string, StageProgress>) {
  return calculatePathWeightedMasteryByField(stages, progress, "masteryScore");
}

function calculatePathWeightedMasteryByField(
  stages: readonly LearningStage[],
  progress: Record<string, StageProgress>,
  field: "masteryScore" | "historicalMasteryScore",
) {
  const included = stages.filter((stage) => stage.questionIds.length > 0);
  const weightTotal = included.reduce((sum, stage) => sum + STAGE_MASTERY_WEIGHTS[stage.name], 0);
  if (!weightTotal) return 0;
  const weighted = included.reduce(
    (sum, stage) => sum + (progress[stage.id]?.[field] ?? 0) * STAGE_MASTERY_WEIGHTS[stage.name],
    0,
  );
  return Math.round(weighted / weightTotal);
}

function deriveStageStatus(input: { attemptedCount: number; completedCount: number; total: number; masteryScore: number; independentPerformancePercentage: number }): ProgressStatus {
  if (!input.attemptedCount && !input.completedCount) return "not_started";
  if (input.total === 0 || input.completedCount < input.total) return "in_progress";
  if (input.masteryScore >= 90 && input.independentPerformancePercentage >= 70) return "mastered";
  if (input.masteryScore >= 75) return "secure";
  return "completed";
}

function derivePathStatus(input: { attemptedCount: number; allStagesCompleted: boolean; masteryScore: number; independentPerformancePercentage: number; pastPaperMastery: number | null }): ProgressStatus {
  if (!input.attemptedCount && !input.allStagesCompleted) return "not_started";
  if (!input.allStagesCompleted) return "in_progress";
  if (
    input.masteryScore >= 90 &&
    input.independentPerformancePercentage >= 70 &&
    (input.pastPaperMastery === null || input.pastPaperMastery >= 80)
  ) return "mastered";
  if (input.masteryScore >= 75) return "secure";
  return "completed";
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function percentFromRatio(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
