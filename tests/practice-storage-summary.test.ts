import test from "node:test";
import assert from "node:assert/strict";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { createPracticeSessionSelection } from "../lib/practice/practice-selection";
import { createEmptyPracticeSessionStore, loadPracticeSessionStore, savePracticeSessionStore, updatePracticeSession } from "../lib/practice/practice-storage";
import { isPracticeSession, serializePracticeSession } from "../lib/practice/practice-validation";
import { derivePracticeSessionSummary } from "../lib/practice/practice-summary";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

test("practice sessions validate, serialize deterministically and reject duplicate references", () => {
  const session = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed: "serialize",
    evidence: evidence(),
    source: createTwoPathFixture(),
    now: new Date("2026-07-17T10:00:00.000Z"),
  }).session!;
  assert(isPracticeSession(session));
  assert.equal(serializePracticeSession(session), serializePracticeSession(structuredClone(session)));
  const invalid = structuredClone(session);
  invalid.questionReferences[1] = invalid.questionReferences[0];
  assert.equal(isPracticeSession(invalid), false);
});

test("practice storage handles empty, malformed, future and completed sessions safely", () => {
  const storage = new MemoryStorage();
  assert.equal(loadPracticeSessionStore(storage).status, "empty");
  storage.setItem("stemforge.practiceSessions.v1", "{");
  assert.equal(loadPracticeSessionStore(storage).status, "malformed-json");
  storage.setItem("stemforge.practiceSessions.v1", JSON.stringify({ schemaVersion: 99 }));
  assert.equal(loadPracticeSessionStore(storage).status, "invalid-structure");

  const session = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 1,
    seed: "store",
    evidence: evidence(),
    source: createTwoPathFixture(),
  }).session!;
  savePracticeSessionStore({ schemaVersion: 1, activeSessionId: session.sessionId, sessions: [session] }, storage);
  assert.equal(loadPracticeSessionStore(storage).store.activeSessionId, session.sessionId);
  const updated = updatePracticeSession(session.sessionId, (current) => ({ ...current, status: "completed", completedAt: "2026-07-17T11:00:00.000Z" }), storage);
  assert.equal(updated?.status, "completed");
});

test("practice summary derives counts from canonical attempts without mutating mastery", () => {
  const source = createTwoPathFixture();
  const session = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed: "summary",
    evidence: evidence(),
    source,
    now: new Date("2026-07-12T09:00:00.000Z"),
  }).session!;
  session.status = "completed";
  session.completedAt = "2026-07-12T11:00:00.000Z";
  const first = session.questionReferences[0];
  const progress = evidence([
    attempt({ questionId: first.questionId, skillPathId: first.pathId, stageId: first.stageId, isCorrect: true }),
  ], [
    supportEvent({ questionId: first.questionId, skillPathId: first.pathId, stageId: first.stageId }),
  ]);
  const summary = derivePracticeSessionSummary(session, progress, source);
  assert.equal(summary.questionCount, 2);
  assert.equal(summary.attemptedCount, 1);
  assert.equal(summary.correctCount, 1);
  assert.deepEqual(summary.incorrectQuestionIds, []);
  assert.equal(summary.unansweredCount, 1);
  assert.equal(summary.supportUsedCount, 1);
});

test("practice summary isolates failures to the completed session time boundary", () => {
  const source = createTwoPathFixture();
  const session = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed: "bounded-summary",
    evidence: evidence(),
    source,
    now: new Date("2026-07-12T09:00:00.000Z"),
  }).session!;
  session.status = "completed";
  session.completedAt = "2026-07-12T11:00:00.000Z";
  const first = session.questionReferences[0];
  const second = session.questionReferences[1];
  const progress = evidence([
    attempt({ questionId: first.questionId, skillPathId: first.pathId, stageId: first.stageId, isCorrect: true, attemptedAt: "2026-07-12T08:55:00.000Z", eventId: "before-session" }),
    attempt({ questionId: first.questionId, skillPathId: first.pathId, stageId: first.stageId, isCorrect: false, attemptedAt: "2026-07-12T10:00:00.000Z", eventId: "during-first" }),
    attempt({ questionId: second.questionId, skillPathId: second.pathId, stageId: second.stageId, isCorrect: true, attemptedAt: "2026-07-12T10:05:00.000Z", eventId: "during-second" }),
    attempt({ questionId: first.questionId, skillPathId: first.pathId, stageId: first.stageId, isCorrect: true, attemptedAt: "2026-07-12T11:05:00.000Z", eventId: "after-session" }),
  ]);

  const summary = derivePracticeSessionSummary(session, progress, source);
  assert.equal(summary.incorrectCount, 1);
  assert.deepEqual(summary.incorrectQuestionIds, [first.questionId]);
  assert.equal(summary.correctCount, 1);
});

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}
