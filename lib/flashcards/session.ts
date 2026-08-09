import { deriveFlashcardStates } from "@/lib/flashcards/derivation";
import { FLASHCARD_SCHEDULER_VERSION } from "@/lib/flashcards/scheduler";
import type { Flashcard, FlashcardDueState, FlashcardReviewEvent } from "@/lib/flashcards/types";
import { markClosedVocabularyTextAnswer } from "@/lib/marking/closed-vocabulary-text";

export const FLASHCARD_NEW_CARD_LIMIT = 5;
export const FLASHCARD_RELEARNING_GAP = 2;
export const FLASHCARD_MAX_SESSION_REQUEUES = 1;

export type FlashcardQueueItem = { card: Flashcard; initialState: FlashcardDueState; reappearance: boolean };

export function buildFlashcardSession(
  cards: readonly Flashcard[], events: readonly FlashcardReviewEvent[], now: Date,
  newCardLimit = FLASHCARD_NEW_CARD_LIMIT,
): FlashcardQueueItem[] {
  const states = deriveFlashcardStates(cards, events, now);
  const paired = cards.map((card, index) => ({ card, state: states[index] }));
  const due = paired
    .filter(({ state }) => state.status !== "unseen" && state.due)
    .sort((left, right) => dueSortKey(left.state).localeCompare(dueSortKey(right.state)) || left.card.id.localeCompare(right.card.id));
  const unseen = paired.filter(({ state }) => state.status === "unseen");
  return [...due, ...unseen.slice(0, Math.max(0, newCardLimit))]
    .map(({ card, state }) => ({ card, initialState: state, reappearance: false }));
}

export function requeueForgottenCard(
  remaining: readonly FlashcardQueueItem[], item: FlashcardQueueItem, priorRequeues: number,
): FlashcardQueueItem[] {
  if (priorRequeues >= FLASHCARD_MAX_SESSION_REQUEUES) return [...remaining];
  const next = [...remaining];
  next.splice(Math.min(FLASHCARD_RELEARNING_GAP, next.length), 0, { ...item, reappearance: true });
  return next;
}

export function markTypedFlashcardAnswer(card: Extract<Flashcard, { type: "typed" }>, answer: string) {
  return markClosedVocabularyTextAnswer({
    strategy: "closed_vocabulary_text_answer",
    strategyVersion: 1,
    target: card.acceptedAnswers[0],
    acceptedAnswers: [...card.acceptedAnswers],
  }, answer);
}

export function createFlashcardReviewInput(card: Flashcard, outcome: "remembered" | "forgot", source: "self_rated" | "graded", occurredAt: string) {
  return { cardId: card.id, cardVersion: card.version, outcome, outcomeSource: source, occurredAt, schedulerVersion: FLASHCARD_SCHEDULER_VERSION } as const;
}

export function flashcardDueCopy(state: FlashcardDueState, now: Date) {
  if (state.status === "unseen") return "New card";
  if (!state.nextDueAt) return "Due today";
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const due = new Date(state.nextDueAt);
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const days = Math.ceil((dueDay - today) / 86_400_000);
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Next review in ${days} days`;
}

function dueSortKey(state: FlashcardDueState) {
  return `${state.status === "relearning" ? "0" : "1"}:${state.nextDueAt ?? ""}`;
}
