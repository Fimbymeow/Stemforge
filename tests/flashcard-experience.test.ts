import assert from "node:assert/strict";
import test from "node:test";
import {
  FLASHCARD_MAX_SESSION_REQUEUES,
  FLASHCARD_NEW_CARD_LIMIT,
  buildFlashcardSession,
  flashcardDueCopy,
  markTypedFlashcardAnswer,
  requeueForgottenCard,
} from "../lib/flashcards/session";
import type { Flashcard, FlashcardReviewEvent } from "../lib/flashcards/types";
import { syntheticFlashcards } from "./fixtures/synthetic-flashcards";
import { deriveMistakeLog } from "../lib/mistakes/derivation";
import { calculateSkillPathProgress } from "../lib/progress/calculations";
import { contentResolver } from "../lib/content-resolver";
import type { ProgressEvidence } from "../lib/progress/types";

const NOW = new Date("2026-08-09T12:00:00.000Z");

function event(card: Flashcard, overrides: Partial<FlashcardReviewEvent> = {}): FlashcardReviewEvent {
  return {
    eventId: `event_${card.id}`,
    cardId: card.id,
    cardVersion: card.version,
    outcome: "remembered",
    outcomeSource: "self_rated",
    occurredAt: "2026-08-01T12:00:00.000Z",
    sequence: 1,
    schedulerVersion: 1,
    ...overrides,
  };
}

test("new cards retain authored order and obey the configuration-driven cap", () => {
  const cards = Array.from({ length: FLASHCARD_NEW_CARD_LIMIT + 3 }, (_, index): Flashcard => ({
    id: `new-${index}`, version: 1, skillPathId: "science", type: "basic", front: `${index}`, back: `${index}`,
  }));
  assert.deepEqual(buildFlashcardSession(cards, [], NOW).map((item) => item.card.id), cards.slice(0, FLASHCARD_NEW_CARD_LIMIT).map((card) => card.id));
});

test("due cards precede new cards and ordering is deterministic", () => {
  const dueCard = syntheticFlashcards[1];
  const events = [event(dueCard, { occurredAt: "2026-08-01T12:00:00.000Z" })];
  const first = buildFlashcardSession(syntheticFlashcards, events, NOW).map((item) => item.card.id);
  const second = buildFlashcardSession(syntheticFlashcards, [...events].reverse(), NOW).map((item) => item.card.id);
  assert.equal(first[0], dueCard.id);
  assert.deepEqual(first, second);
});

test("forgotten cards return after two available cards and requeue only once", () => {
  const queue = buildFlashcardSession(syntheticFlashcards, [], NOW);
  const current = queue[0];
  const requeued = requeueForgottenCard(queue.slice(1), current, 0);
  assert.equal(requeued.at(-1)?.card.id, current.card.id);
  assert.equal(requeued.at(-1)?.reappearance, true);
  assert.deepEqual(requeueForgottenCard(requeued.slice(0, -1), current, FLASHCARD_MAX_SESSION_REQUEUES).map((item) => item.card.id), requeued.slice(0, -1).map((item) => item.card.id));
});

test("typed cards reuse deterministic closed-vocabulary marking", () => {
  const card = syntheticFlashcards[1];
  assert.equal(card.type, "typed");
  if (card.type !== "typed") return;
  assert.equal(markTypedFlashcardAnswer(card, " Newton. ").isCorrect, true);
  assert.equal(markTypedFlashcardAnswer(card, "joule").isCorrect, false);
});

test("learner-facing due copy hides scheduler internals", () => {
  const queue = buildFlashcardSession(syntheticFlashcards, [], NOW);
  assert.equal(flashcardDueCopy(queue[0].initialState, NOW), "New card");
  const tomorrow = buildFlashcardSession([syntheticFlashcards[0]], [event(syntheticFlashcards[0], { occurredAt: "2026-08-08T12:00:00.000Z" })], NOW)[0];
  assert.equal(flashcardDueCopy(tomorrow.initialState, NOW), "Due today");
});

test("Flashcard evidence cannot affect Higher Maths mastery or the Mistake Log", () => {
  const context = contentResolver.getAllPathContexts().find((item) => item.skillPath.slug === "basic-differentiation");
  assert.ok(context);
  const empty: ProgressEvidence = { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] };
  const withFlashcard: ProgressEvidence = { ...empty, flashcardReviews: [event(syntheticFlashcards[0])] };
  assert.deepEqual(calculateSkillPathProgress(context.skillPath, withFlashcard), calculateSkillPathProgress(context.skillPath, empty));
  assert.deepEqual(deriveMistakeLog(withFlashcard), deriveMistakeLog(empty));
});
