import type { LearningStage } from "@/data/types";
import {
  DEFAULT_NOTES_MINUTES,
  DEFAULT_REVIEW_MINUTES,
  DEFAULT_TARGETED_PRACTICE_MINUTES,
  DURATION_GRANULARITY_MINUTES,
  MAX_ITEM_MINUTES,
  MIN_ITEM_MINUTES,
  MINUTES_PER_PRACTICE_QUESTION,
} from "@/lib/study-plan/constants";

export function estimateStageMinutes(stage: LearningStage | undefined): number {
  return normalizeStudyMinutes(stage?.estimatedMinutes ?? DEFAULT_NOTES_MINUTES);
}

export function estimateReviewMinutes(): number {
  return DEFAULT_REVIEW_MINUTES;
}

export function estimateTargetedPracticeMinutes(questionCount?: number): number {
  return normalizeStudyMinutes(
    questionCount && questionCount > 0
      ? questionCount * MINUTES_PER_PRACTICE_QUESTION
      : DEFAULT_TARGETED_PRACTICE_MINUTES,
  );
}

export function normalizeStudyMinutes(value: number): number {
  if (!Number.isFinite(value)) return MIN_ITEM_MINUTES;
  const rounded = Math.round(value / DURATION_GRANULARITY_MINUTES) * DURATION_GRANULARITY_MINUTES;
  return Math.min(MAX_ITEM_MINUTES, Math.max(MIN_ITEM_MINUTES, rounded));
}

