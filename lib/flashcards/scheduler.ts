import { dueAtFromInterval, transitionStage, type StageTransitionConfiguration } from "@/lib/scheduling/stage-transition";
import type { FlashcardOutcome, FlashcardStage } from "@/lib/flashcards/types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const FLASHCARD_SCHEDULER_VERSION = 1;

export type FlashcardSchedulerDefinition = StageTransitionConfiguration<FlashcardStage, FlashcardOutcome>;
export type FlashcardSchedulerRegistry = ReadonlyMap<number, FlashcardSchedulerDefinition>;

const V1: FlashcardSchedulerDefinition = {
  version: FLASHCARD_SCHEDULER_VERSION,
  intervals: new Map<FlashcardStage, number>([
    ["relearning", DAY_MS], [0, DAY_MS], [1, 3 * DAY_MS], [2, 7 * DAY_MS],
    [3, 14 * DAY_MS], [4, 30 * DAY_MS], [5, 60 * DAY_MS],
  ]),
  transition(previous, outcome) {
    if (outcome === "forgot") return "relearning";
    if (previous === null || previous === "relearning") return 0;
    return previous === 5 ? 5 : (previous + 1) as FlashcardStage;
  },
};

export const FLASHCARD_SCHEDULERS: FlashcardSchedulerRegistry = new Map([[FLASHCARD_SCHEDULER_VERSION, V1]]);

export function getFlashcardScheduler(version: number, registry: FlashcardSchedulerRegistry = FLASHCARD_SCHEDULERS) {
  return registry.get(version) ?? null;
}

export function transitionFlashcardStage(previous: FlashcardStage | null, outcome: FlashcardOutcome, version = FLASHCARD_SCHEDULER_VERSION) {
  const scheduler = getFlashcardScheduler(version);
  return scheduler ? transitionStage(scheduler, previous, outcome) : null;
}

export function flashcardDueAt(anchor: string, stage: FlashcardStage, version = FLASHCARD_SCHEDULER_VERSION) {
  const scheduler = getFlashcardScheduler(version);
  return scheduler ? dueAtFromInterval(scheduler, anchor, stage) : null;
}
