import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { deriveFlashcardState, deriveFlashcardStates } from "../lib/flashcards/derivation";
import { FLASHCARD_SCHEDULER_VERSION, flashcardDueAt, transitionFlashcardStage } from "../lib/flashcards/scheduler";
import type { FlashcardReviewEvent } from "../lib/flashcards/types";
import { isFlashcard, isFlashcardReviewEvent } from "../lib/flashcards/validation";
import { createDefaultProgressPayload, migrateProgressPayload } from "../lib/progress/payload";
import { mergeProgressEvidence } from "../lib/progress/merge";
import { LocalStorageProgressStorage, type StorageLike } from "../lib/progress/storage";
import { ProgressRepository } from "../lib/progress/repository";
import { validateRemoteEvidenceBatch } from "../lib/remote-evidence/validation";
import { batchProgressEvidence } from "../lib/progress/import-batching";
import { getStudentResourceCapabilities, subjectSupportsResource } from "../lib/resource-capabilities";
import { contentResolver } from "../lib/content-resolver";
import { buildAccountLearningDataExport } from "../lib/account-data/export";
import { removeAccountProgressFromBrowser } from "../lib/progress/browser-data-controls";
import { assignEvidenceProvenance, createDefaultEvidenceProvenance } from "../lib/progress/evidence-provenance";
import { createDefaultProgressSyncMetadata } from "../lib/progress/sync-metadata";
import { createDefaultProgressImportMetadata, pendingEvidence } from "../lib/progress/import-metadata";
import { syntheticFlashcards } from "./fixtures/synthetic-flashcards";

const now = new Date("2026-08-09T12:00:00.000Z");
const card = syntheticFlashcards[0];

function review(overrides: Partial<FlashcardReviewEvent> = {}): FlashcardReviewEvent {
  return { eventId: "flashcard_review_1", cardId: card.id, cardVersion: card.version, outcome: "remembered",
    outcomeSource: "self_rated", occurredAt: "2026-08-01T12:00:00.000Z", sequence: 1,
    schedulerVersion: FLASHCARD_SCHEDULER_VERSION, ...overrides };
}

test("canonical basic, typed and bounded cloze contracts validate", () => {
  assert.equal(syntheticFlashcards.every(isFlashcard), true);
  assert.equal(isFlashcard({ ...card, version: 0 }), false);
  assert.equal(isFlashcard({ ...syntheticFlashcards[1], acceptedAnswers: [] }), false);
});

test("new, remembered and forgot states are deterministic", () => {
  assert.equal(deriveFlashcardState(card, [], now).status, "unseen");
  const remembered = deriveFlashcardState(card, [review()], new Date("2026-08-01T12:01:00.000Z"));
  assert.equal(remembered.stage, 0);
  assert.equal(remembered.sameSessionRequeue, false);
  const forgot = deriveFlashcardState(card, [review({ outcome: "forgot" })], new Date("2026-08-01T12:01:00.000Z"));
  assert.equal(forgot.stage, "relearning");
  assert.equal(forgot.sameSessionRequeue, true);
});

test("remembered progresses through configured stages and respects the ceiling", () => {
  let stage = null;
  for (const expected of [0, 1, 2, 3, 4, 5, 5] as const) {
    stage = transitionFlashcardStage(stage, "remembered");
    assert.equal(stage, expected);
  }
  assert.equal(transitionFlashcardStage(4, "forgot"), "relearning");
  assert.equal(transitionFlashcardStage("relearning", "remembered"), 0);
});

test("V1 interval calculations are exact and clock-injected", () => {
  assert.equal(flashcardDueAt("2026-03-28T23:30:00.000Z", 0), "2026-03-29T23:30:00.000Z");
  assert.equal(flashcardDueAt("2026-03-28T23:30:00.000Z", 1), "2026-03-31T23:30:00.000Z");
  assert.equal(flashcardDueAt("2026-03-28T23:30:00.000Z", 5), "2026-05-27T23:30:00.000Z");
});

test("version, malformed, future and duplicate evidence fail safely", () => {
  const state = deriveFlashcardState(card, [
    review({ eventId: "old", cardVersion: 2 }),
    review({ eventId: "future", occurredAt: "2027-01-01T00:00:00.000Z" }),
    review({ eventId: "unknown", schedulerVersion: 99 }),
    review({ eventId: "valid" }),
    review(), review({ outcome: "forgot" }),
  ], now);
  assert.deepEqual(state.appliedEventIds, ["valid"]);
  assert.deepEqual(state.ignoredEventIds, ["flashcard_review_1", "future", "old", "unknown"]);
});

test("two-device events replay by timestamp, sequence and event ID", () => {
  const events = [
    review({ eventId: "phone", occurredAt: "2026-08-01T12:00:00.000Z", sequence: 4, outcome: "forgot" }),
    review({ eventId: "laptop", occurredAt: "2026-08-01T12:00:00.000Z", sequence: 4, outcome: "remembered" }),
  ];
  const first = deriveFlashcardState(card, events, now);
  const second = deriveFlashcardState(card, [...events].reverse(), now);
  assert.deepEqual(first, second);
  assert.deepEqual(first.appliedEventIds, ["laptop", "phone"]);
  assert.equal(first.stage, "relearning");
});

test("V6 migrates additively to V7 and local storage persists append-only events", () => {
  const migrated = migrateProgressPayload({ version: 6, data: {
    attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [],
  } });
  assert.equal(migrated.status, "migrated-v6");
  assert.deepEqual(migrated.payload.data.flashcardReviews, []);
  const memory = new MemoryStorage();
  const repository = new ProgressRepository(new LocalStorageProgressStorage(memory), () => "unused");
  assert.equal(repository.recordFlashcardReview(review()), true);
  assert.equal(repository.recordFlashcardReview(review()), true);
  assert.deepEqual(repository.load().payload.data.flashcardReviews, [review()]);
});

test("merge retains separate-device events, deduplicates IDs and reports conflicts", () => {
  const left = createDefaultProgressPayload(); left.data.flashcardReviews.push(review({ eventId: "phone" }));
  const right = createDefaultProgressPayload(); right.data.flashcardReviews.push(review({ eventId: "laptop" }), review({ eventId: "phone", outcome: "forgot" }));
  const merged = mergeProgressEvidence(left, right);
  assert.deepEqual(merged.payload.data.flashcardReviews.map((item) => item.eventId), ["laptop", "phone"]);
  assert.equal(merged.conflicts[0]?.recordType, "flashcard_review");
});

test("remote validation, batching and scheduler-version evidence include Flashcard reviews", () => {
  assert.equal(isFlashcardReviewEvent(review(), true), true);
  const payload = createDefaultProgressPayload(); payload.data.flashcardReviews.push(review());
  const validated = validateRemoteEvidenceBatch(payload);
  assert.equal(validated.fatal, false);
  assert.deepEqual(validated.payload.data.flashcardReviews, [review()]);
  assert.deepEqual(batchProgressEvidence(payload)[0].data.flashcardReviews, [review()]);
});

test("export, guest import and local erasure carry Flashcard evidence through existing authority boundaries", () => {
  const payload = createDefaultProgressPayload(); payload.data.flashcardReviews.push(review());
  const exported = buildAccountLearningDataExport([{
    kind: "flashcard_review", disposition: "accepted", eventId: review().eventId, evidence: review(),
    accountGeneration: "1", receiveCursor: "1", receivedAt: review().occurredAt,
  }], "2026-08-01T00:00:00.000Z", "2026-08-09T00:00:00.000Z");
  assert.equal(exported.categoryCounts.flashcardReviews, 1);
  assert.deepEqual(pendingEvidence(payload, createDefaultProgressImportMetadata(), "A".repeat(43)).data.flashcardReviews, [review()]);
  const fingerprint = "A".repeat(43);
  const provenance = assignEvidenceProvenance(createDefaultEvidenceProvenance(), payload,
    [`flashcard_review:${review().eventId}`], "local_associated", fingerprint);
  const removed = removeAccountProgressFromBrowser({ payload, provenance, sync: createDefaultProgressSyncMetadata(),
    imported: createDefaultProgressImportMetadata() }, fingerprint);
  assert.equal(removed.removedEvidenceCount, 1);
  assert.deepEqual(removed.payload.data.flashcardReviews, []);
});

test("capability gating excludes Mathematics and permits the Science family", () => {
  assert.equal(subjectSupportsResource("mathematics", "flashcards"), false);
  assert.equal(subjectSupportsResource("science", "flashcards"), true);
  assert.deepEqual(getStudentResourceCapabilities("mathematics"), ["notes", "practice"]);
  assert.equal(contentResolver.getSubject("higher-maths")?.subjectName, "Higher Maths");
  assert.equal(JSON.stringify(contentResolver.getSubject("higher-maths")).includes("flashcards"), false);
});

test("synthetic science cards are fixture-only and absent from production registries", () => {
  const production = JSON.stringify(contentResolver.getSubjects());
  for (const fixture of syntheticFlashcards) assert.equal(production.includes(fixture.id), false);
});

test("database migration is append-only, secured and erasure-aware", () => {
  const migration = readFileSync(new URL("../migrations/1753525600000_flashcard-review-evidence.js", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE stemforge_remote\.flashcard_reviews/);
  assert.match(migration, /reject_evidence_mutation/);
  assert.match(migration, /verify_evidence_generation/);
  assert.match(migration, /deleted_flashcard_review_count/);
  assert.doesNotMatch(migration, /next_due|current_stage|stability|difficulty/);
});

test("1k cards and 20k events replay without materialized state", () => {
  const cards = Array.from({ length: 1_000 }, (_, index) => ({ ...card, id: `perf-card-${index}` }));
  const events = Array.from({ length: 20_000 }, (_, index) => review({
    eventId: `perf-event-${index}`, cardId: `perf-card-${index % 1_000}`,
    occurredAt: new Date(Date.UTC(2026, 0, 1 + Math.floor(index / 1000))).toISOString(), sequence: index,
  }));
  const states = deriveFlashcardStates(cards, events, now);
  assert.equal(states.length, 1_000);
  assert.equal(states.every((state) => state.appliedEventIds.length === 20), true);
});

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
