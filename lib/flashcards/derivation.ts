import { FLASHCARD_SCHEDULER_VERSION, flashcardDueAt, getFlashcardScheduler, transitionFlashcardStage } from "@/lib/flashcards/scheduler";
import type { Flashcard, FlashcardDueState, FlashcardReviewEvent, FlashcardStage } from "@/lib/flashcards/types";
import { isFlashcardReviewEvent } from "@/lib/flashcards/validation";

export function deriveFlashcardState(
  card: Flashcard,
  events: readonly FlashcardReviewEvent[],
  now: Date,
): FlashcardDueState {
  const nowMs = now.getTime();
  const applicable: FlashcardReviewEvent[] = [];
  const ignoredEventIds: string[] = [];
  const idCounts = new Map<string, number>();
  for (const event of events) if (typeof event?.eventId === "string") idCounts.set(event.eventId, (idCounts.get(event.eventId) ?? 0) + 1);
  for (const event of events) {
    const valid = isFlashcardReviewEvent(event) && event.cardId === card.id && event.cardVersion === card.version &&
      Date.parse(event.occurredAt) <= nowMs && getFlashcardScheduler(event.schedulerVersion) !== null && idCounts.get(event.eventId) === 1;
    if (!valid) { if (typeof event?.eventId === "string") ignoredEventIds.push(event.eventId); continue; }
    applicable.push(event);
  }
  applicable.sort(compareEvents);
  let stage: FlashcardStage | null = null;
  let schedulerVersion = FLASHCARD_SCHEDULER_VERSION;
  for (const event of applicable) {
    const next = transitionFlashcardStage(stage, event.outcome, event.schedulerVersion);
    if (next === null) { ignoredEventIds.push(event.eventId); continue; }
    stage = next;
    schedulerVersion = event.schedulerVersion;
  }
  const last = applicable.at(-1) ?? null;
  if (!last || stage === null) return {
    cardId: card.id, cardVersion: card.version, status: "unseen", stage: null, lastReviewedAt: null,
    nextDueAt: null, due: true, sameSessionRequeue: false, schedulerVersion,
    appliedEventIds: [], ignoredEventIds: [...new Set(ignoredEventIds)].sort(),
  };
  const nextDueAt = flashcardDueAt(last.occurredAt, stage, schedulerVersion);
  return {
    cardId: card.id,
    cardVersion: card.version,
    status: stage === "relearning" ? "relearning" : "review",
    stage,
    lastReviewedAt: last.occurredAt,
    nextDueAt,
    due: nextDueAt === null || Date.parse(nextDueAt) <= nowMs,
    sameSessionRequeue: last.outcome === "forgot",
    schedulerVersion,
    appliedEventIds: applicable.map((event) => event.eventId),
    ignoredEventIds: [...new Set(ignoredEventIds)].sort(),
  };
}

export function deriveFlashcardStates(
  cards: readonly Flashcard[],
  events: readonly FlashcardReviewEvent[],
  now: Date,
) {
  const byCardVersion = new Map<string, FlashcardReviewEvent[]>();
  for (const event of events) {
    const key = `${event.cardId}\0${event.cardVersion}`;
    const bucket = byCardVersion.get(key) ?? [];
    bucket.push(event);
    byCardVersion.set(key, bucket);
  }
  return cards.map((card) => deriveFlashcardState(card, byCardVersion.get(`${card.id}\0${card.version}`) ?? [], now));
}

function compareEvents(left: FlashcardReviewEvent, right: FlashcardReviewEvent) {
  return left.occurredAt.localeCompare(right.occurredAt) || left.sequence - right.sequence || left.eventId.localeCompare(right.eventId);
}
