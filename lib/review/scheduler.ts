import type { ReviewEvent, ReviewOutcome, ReviewStage } from "@/lib/review/types";
import { dueAtFromInterval, transitionStage, type StageTransitionConfiguration } from "@/lib/scheduling/stage-transition";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewSchedulerDefinition = {
} & StageTransitionConfiguration<ReviewStage, ReviewOutcome> & {
  migrateFrom?: Readonly<Record<number, (event: ReviewEvent) => ReviewStage | null>>;
};

export type ReviewSchedulerRegistry = ReadonlyMap<number, ReviewSchedulerDefinition>;

const V1_INTERVALS: Readonly<Record<string, number>> = {
  recovery: 0,
  relearning: DAY_MS,
  "0": 2 * DAY_MS,
  "1": 7 * DAY_MS,
  "2": 14 * DAY_MS,
  "3": 28 * DAY_MS,
  "4": 56 * DAY_MS,
  "5": 90 * DAY_MS,
};

export const REVIEW_SCHEDULER_VERSION = 1;

export const REVIEW_SCHEDULERS: ReviewSchedulerRegistry = new Map([
  [REVIEW_SCHEDULER_VERSION, {
    version: REVIEW_SCHEDULER_VERSION,
    intervals: new Map(Object.entries(V1_INTERVALS).map(([stage, interval]) => [parseStage(stage), interval])),
    transition(previous: ReviewStage | null, outcome: ReviewOutcome): ReviewStage {
      if (outcome === "incorrect") return "recovery";
      if (outcome === "solution_assisted") return "relearning";
      if (outcome === "hint_assisted") return 0;
      if (previous === null || previous === "recovery" || previous === "relearning") return 0;
      return previous === 5 ? 5 : (previous + 1) as ReviewStage;
    },
  }],
]);

export function getReviewScheduler(
  version: number,
  registry: ReviewSchedulerRegistry = REVIEW_SCHEDULERS,
) {
  return registry.get(version) ?? null;
}

export function transitionReviewStage(
  previous: ReviewStage | null,
  outcome: ReviewOutcome,
  version = REVIEW_SCHEDULER_VERSION,
  registry: ReviewSchedulerRegistry = REVIEW_SCHEDULERS,
) {
  const scheduler = getReviewScheduler(version, registry);
  return scheduler ? transitionStage(scheduler, previous, outcome) : null;
}

export function reviewDueAt(
  anchor: string,
  stage: ReviewStage,
  version: number,
  registry: ReviewSchedulerRegistry = REVIEW_SCHEDULERS,
) {
  const scheduler = getReviewScheduler(version, registry);
  if (!scheduler) return null;
  return dueAtFromInterval(scheduler, anchor, stage);
}

function parseStage(value: string): ReviewStage {
  if (value === "recovery" || value === "relearning") return value;
  return Number(value) as ReviewStage;
}

export function migrateReviewStage(
  event: ReviewEvent,
  targetVersion: number,
  registry: ReviewSchedulerRegistry,
) {
  if (event.schedulerVersion === targetVersion) return event.stageAfter;
  return registry.get(targetVersion)?.migrateFrom?.[event.schedulerVersion]?.(event) ?? null;
}
