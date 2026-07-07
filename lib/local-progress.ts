import type { LearningStage, SkillPath } from "@/data/types";

export type QuestionAttempt = {
  questionId: string;
  skillPathId: string;
  stageId: string;
  isCorrect: boolean | null;
  answer: string;
  attemptedAt: string;
};

export type StageProgress = {
  stageId: string;
  attemptedQuestionIds: string[];
  correctQuestionIds: string[];
  completedQuestionIds: string[];
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  completionPercentage: number;
  accuracyPercentage: number | null;
};

export type SkillPathProgress = {
  skillPathId: string;
  attemptedQuestionIds: string[];
  correctQuestionIds: string[];
  completedQuestionIds: string[];
  totalQuestions: number;
  correctCount: number;
  attemptedCount: number;
  completionPercentage: number;
  accuracyPercentage: number | null;
  stageProgress: Record<string, StageProgress>;
};

const STORAGE_KEY = "stemforge.localProgress.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAttempts(): QuestionAttempt[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isQuestionAttempt) : [];
  } catch {
    return [];
  }
}

function writeAttempts(attempts: QuestionAttempt[]) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    window.dispatchEvent(new CustomEvent("stemforge:local-progress-updated"));
  } catch {
    // Local progress is a browser enhancement. If storage fails, keep the app usable.
  }
}

function isQuestionAttempt(value: unknown): value is QuestionAttempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as QuestionAttempt;
  return (
    typeof attempt.questionId === "string" &&
    typeof attempt.skillPathId === "string" &&
    typeof attempt.stageId === "string" &&
    (typeof attempt.isCorrect === "boolean" || attempt.isCorrect === null) &&
    typeof attempt.answer === "string" &&
    typeof attempt.attemptedAt === "string"
  );
}

function getLatestAttempts(attempts: QuestionAttempt[]) {
  const latest = new Map<string, QuestionAttempt>();
  for (const attempt of attempts) {
    latest.set(attempt.questionId, attempt);
  }
  return [...latest.values()];
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function getAllAttempts() {
  return readAttempts();
}

export function getAttemptsForSkillPath(skillPathId: string) {
  return readAttempts().filter((attempt) => attempt.skillPathId === skillPathId);
}

export function saveQuestionAttempt(attempt: QuestionAttempt) {
  writeAttempts([...readAttempts(), attempt]);
}

export function getStageProgress(skillPath: SkillPath, stage: LearningStage): StageProgress {
  const latestAttempts = getLatestAttempts(getAttemptsForSkillPath(skillPath.slug)).filter((attempt) => attempt.stageId === stage.id);
  const stageQuestionIds = new Set(stage.questionIds);
  const completedQuestionIds = latestAttempts.map((attempt) => attempt.questionId).filter((questionId) => stageQuestionIds.has(questionId));
  const correctQuestionIds = latestAttempts
    .filter((attempt) => attempt.isCorrect === true && stageQuestionIds.has(attempt.questionId))
    .map((attempt) => attempt.questionId);

  return {
    stageId: stage.id,
    attemptedQuestionIds: completedQuestionIds,
    completedQuestionIds,
    correctQuestionIds,
    totalQuestions: stage.questionIds.length,
    attemptedCount: completedQuestionIds.length,
    correctCount: correctQuestionIds.length,
    completionPercentage: percent(completedQuestionIds.length, stage.questionIds.length),
    accuracyPercentage: completedQuestionIds.length > 0 ? percent(correctQuestionIds.length, completedQuestionIds.length) : null,
  };
}

export function getSkillPathProgress(skillPath: SkillPath): SkillPathProgress {
  const stages = skillPath.learningStages ?? [];
  const totalQuestionIds = stages.flatMap((stage) => stage.questionIds);
  const knownQuestionIds = new Set(totalQuestionIds);
  const latestAttempts = getLatestAttempts(getAttemptsForSkillPath(skillPath.slug)).filter((attempt) => knownQuestionIds.has(attempt.questionId));
  const completedQuestionIds = latestAttempts.map((attempt) => attempt.questionId);
  const correctQuestionIds = latestAttempts.filter((attempt) => attempt.isCorrect === true).map((attempt) => attempt.questionId);
  const stageProgress = Object.fromEntries(stages.map((stage) => [stage.id, getStageProgress(skillPath, stage)]));

  return {
    skillPathId: skillPath.slug,
    attemptedQuestionIds: completedQuestionIds,
    completedQuestionIds,
    correctQuestionIds,
    totalQuestions: totalQuestionIds.length,
    attemptedCount: completedQuestionIds.length,
    correctCount: correctQuestionIds.length,
    completionPercentage: percent(completedQuestionIds.length, totalQuestionIds.length),
    accuracyPercentage: completedQuestionIds.length > 0 ? percent(correctQuestionIds.length, completedQuestionIds.length) : null,
    stageProgress,
  };
}

export function getNextQuestionId(skillPath: SkillPath) {
  const completed = new Set(getSkillPathProgress(skillPath).completedQuestionIds);
  for (const stage of skillPath.learningStages ?? []) {
    const nextQuestionId = stage.questionIds.find((questionId) => !completed.has(questionId));
    if (nextQuestionId) return nextQuestionId;
  }
  return null;
}

export function resetSkillPathProgress(skillPathId: string) {
  writeAttempts(readAttempts().filter((attempt) => attempt.skillPathId !== skillPathId));
}
