import assert from "node:assert/strict";
import test from "node:test";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { evidence } from "./progress-fixtures";
import { createPracticeSessionSelection } from "../lib/practice/practice-selection";
import { decodePracticeSessionStore } from "../lib/practice/practice-migration";
import { repairPracticeSessionStore } from "../lib/practice/practice-repair";
import {
  loadPracticeSessionStore,
  savePracticeSessionStore,
} from "../lib/practice/practice-storage";
import {
  PRACTICE_SESSIONS_STORAGE_KEY,
  type PracticeSession,
} from "../lib/practice/practice-types";
import { isPracticeSession, isPracticeSessionStore } from "../lib/practice/practice-validation";

test("fresh v3 sessions and stores validate strictly", () => {
  const session = sessionFixture();
  assert.equal(isPracticeSession(session), true);
  assert.equal(isPracticeSessionStore(storeFixture([session], session.sessionId)), true);

  assert.equal(isPracticeSession({ ...session, origin: "unknown_origin" }), false);
  assert.equal(isPracticeSession({ ...session, subjectId: "another-subject" }), false);
  assert.equal(isPracticeSession({ ...session, skippedQuestionIds: [questionId(session), questionId(session)] }), false);
  assert.equal(isPracticeSession({ ...session, skippedQuestionIds: ["not-in-session"] }), false);
  assert.equal(isPracticeSession({ ...session, finalSkippedQuestionIds: ["not-in-session"] }), false);
  assert.equal(isPracticeSession({ ...session, parentSessionId: "" }), false);
  assert.equal(isPracticeSession({
    ...session,
    skippedQuestionIds: [questionId(session)],
    finalSkippedQuestionIds: [questionId(session)],
  }), true);
});

test("v1 migration preserves legacy fields and derives only defensible current foundations", () => {
  const current = sessionFixture({ origin: "configured_practice" });
  const legacy = legacySession(current);
  const decoded = decodePracticeSessionStore({ schemaVersion: 1, activeSessionId: legacy.sessionId, sessions: [legacy] });
  assert(decoded);
  assert.equal(decoded.changed, true);
  assert(decoded.issues.some((issue) => issue.code === "legacy_store_migrated"));
  const migrated = decoded.store.sessions[0];
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.subjectId, current.questionReferences[0].subjectId);
  assert.equal(migrated.origin, "configured_practice");
  assert.deepEqual(migrated.skippedQuestionIds, []);
  assert.equal("finalSkippedQuestionIds" in migrated, false);
  assert.equal("parentSessionId" in migrated, false);
  assert.equal(migrated.sessionId, current.sessionId);
  assert.deepEqual(migrated.questionReferences, current.questionReferences);
  assert.deepEqual(migrated.selectionMetadata, current.selectionMetadata);
  assert.equal(isPracticeSession(migrated), true);

  const completedLegacy = legacySession({
    ...current,
    status: "completed",
    completedAt: "2026-07-24T10:30:00.000Z",
  });
  const completed = decodePracticeSessionStore(storeFixture([completedLegacy], null, 1));
  assert(completed);
  assert.equal("finalSkippedQuestionIds" in completed.store.sessions[0], false);

  const secondPass = decodePracticeSessionStore(decoded.store);
  assert(secondPass);
  assert.equal(secondPass.changed, false);
  assert.deepEqual(secondPass.store, decoded.store);
});

test("legacy origin inference is narrow and does not fabricate review or ancestry", () => {
  const base = sessionFixture();
  const knownQuestionBank = decodePracticeSessionStore(storeFixture(
    [legacySession({ ...base, selectionMetadata: { ...base.selectionMetadata, seed: "question-bank:custom" } })],
    base.sessionId,
    1,
  ));
  assert.equal(knownQuestionBank?.store.sessions[0].origin, "question_bank_custom");

  const quick = decodePracticeSessionStore(storeFixture(
    [legacySession({ ...base, selectionMetadata: { ...base.selectionMetadata, seed: "quick-practice:path" } })],
    base.sessionId,
    1,
  ));
  assert.equal(quick?.store.sessions[0].origin, "quick_practice");

  const retry = decodePracticeSessionStore(storeFixture(
    [legacySession({ ...base, mode: "retry_incorrect" })],
    base.sessionId,
    1,
  ));
  assert.equal(retry?.store.sessions[0].origin, "retry_incorrect");
  assert.equal(retry?.store.sessions[0].parentSessionId, undefined);

  const ambiguous = decodePracticeSessionStore(storeFixture(
    [legacySession({ ...base, selectionMetadata: { ...base.selectionMetadata, seed: "review-due:ambiguous" } })],
    base.sessionId,
    1,
  ));
  assert.equal(ambiguous?.store.sessions[0].origin, "configured_practice");
});

test("legacy subject migration uses stored references and rejects disagreement without live content", () => {
  const base = sessionFixture();
  const unavailableButSelfDescribing = legacySession(base);
  unavailableButSelfDescribing.questionReferences = unavailableButSelfDescribing.questionReferences.map((reference) => ({
    ...reference,
    questionId: `archived-${reference.questionId}`,
  }));
  const available = decodePracticeSessionStore(storeFixture([unavailableButSelfDescribing], base.sessionId, 1));
  assert.equal(available?.store.sessions[0].subjectId, fixtureIds.subjectSlug);

  const mixed = legacySession(base);
  mixed.questionReferences[1] = { ...mixed.questionReferences[1], subjectId: "another-subject" };
  const rejected = decodePracticeSessionStore(storeFixture([mixed], base.sessionId, 1));
  assert(rejected);
  assert.equal(rejected.store.sessions.length, 0);
  assert(rejected.issues.some((issue) => issue.code === "invalid_session_dropped"));
});

test("decoding fails closed by version and isolates malformed sibling sessions", () => {
  const valid = sessionFixture();
  assert.equal(decodePracticeSessionStore({ schemaVersion: 99, activeSessionId: null, sessions: [] }), null);

  const canonicalWithInvalidSibling = decodePracticeSessionStore({
    schemaVersion: 3,
    activeSessionId: valid.sessionId,
    sessions: [valid, { ...valid, sessionId: "invalid-origin", origin: "future_origin" }],
  });
  assert(canonicalWithInvalidSibling);
  assert.deepEqual(canonicalWithInvalidSibling.store.sessions.map((session) => session.sessionId), [valid.sessionId]);
  assert(canonicalWithInvalidSibling.issues.some((issue) =>
    issue.code === "invalid_session_dropped" && issue.sessionId === "invalid-origin"));

  const validLegacy = legacySession(valid);
  const legacyWithInvalidSibling = decodePracticeSessionStore({
    schemaVersion: 1,
    activeSessionId: validLegacy.sessionId,
    sessions: [validLegacy, { ...validLegacy, sessionId: "broken-legacy", questionReferences: [] }],
  });
  assert(legacyWithInvalidSibling);
  assert.deepEqual(legacyWithInvalidSibling.store.sessions.map((session) => session.sessionId), [valid.sessionId]);
});

test("loads are read-only while explicit saves persist canonical migration and preserve other evidence", () => {
  const storage = new MemoryStorage();
  const session = sessionFixture();
  storage.setItem("stemforge.progress.v4", "evidence-marker");
  const rawLegacy = JSON.stringify(storeFixture([legacySession(session)], session.sessionId, 1));
  storage.setItem(PRACTICE_SESSIONS_STORAGE_KEY, rawLegacy);
  storage.resetWriteCount();

  const loaded = loadPracticeSessionStore(storage);
  assert.equal(loaded.status, "current");
  assert.equal(loaded.changed, true);
  assert.equal(storage.writeCount, 0);
  assert.equal(storage.getItem(PRACTICE_SESSIONS_STORAGE_KEY), rawLegacy);
  assert.equal(storage.getItem("stemforge.progress.v4"), "evidence-marker");

  assert.equal(savePracticeSessionStore(loaded.store, storage), true);
  assert.equal(storage.writeCount, 1);
  assert.equal(JSON.parse(storage.getItem(PRACTICE_SESSIONS_STORAGE_KEY)!).schemaVersion, 3);
  assert.equal(storage.getItem("stemforge.progress.v4"), "evidence-marker");
});

test("storage returns safe results for corrupt JSON and unsupported future stores", () => {
  const storage = new MemoryStorage();
  storage.setItem(PRACTICE_SESSIONS_STORAGE_KEY, "{");
  assert.equal(loadPracticeSessionStore(storage).status, "malformed-json");
  storage.setItem(PRACTICE_SESSIONS_STORAGE_KEY, JSON.stringify({ schemaVersion: 99, activeSessionId: null, sessions: [] }));
  const future = loadPracticeSessionStore(storage);
  assert.equal(future.status, "invalid-structure");
  assert.deepEqual(future.store.sessions, []);
});

test("repair clears missing and non-active pointers while preserving history", () => {
  const completed = sessionFixture({ sessionId: "completed", status: "completed", completedAt: "2026-07-24T11:00:00.000Z" });
  const abandoned = sessionFixture({ sessionId: "abandoned", status: "abandoned" });

  const missing = repairPracticeSessionStore(storeFixture([completed, abandoned], "missing"));
  assert.equal(missing.store.activeSessionId, null);
  assert.deepEqual(missing.store.sessions.map((session) => session.sessionId), ["completed", "abandoned"]);
  assert(missing.issues.some((issue) => issue.code === "active_pointer_cleared" && issue.reason === "missing"));

  const completedPointer = repairPracticeSessionStore(storeFixture([completed, abandoned], "completed"));
  assert.equal(completedPointer.store.activeSessionId, null);
  assert(completedPointer.issues.some((issue) => issue.code === "active_pointer_cleared" && issue.reason === "not_active"));

  const abandonedPointer = repairPracticeSessionStore(storeFixture([completed, abandoned], "abandoned"));
  assert.equal(abandonedPointer.store.activeSessionId, null);
  assert.equal(abandonedPointer.store.sessions.length, 2);
});

test("repair keeps a valid pointer winner and abandons every other active session", () => {
  const pointed = sessionFixture({ sessionId: "pointed", updatedAt: "2026-07-24T09:00:00.000Z" });
  const newer = sessionFixture({ sessionId: "newer", updatedAt: "2026-07-24T12:00:00.000Z" });
  const repaired = repairPracticeSessionStore(storeFixture([newer, pointed], pointed.sessionId));
  assert.equal(repaired.store.activeSessionId, pointed.sessionId);
  assert.equal(repaired.store.sessions.find((session) => session.sessionId === "newer")?.status, "abandoned");
  assert.equal(repaired.store.sessions.find((session) => session.sessionId === "newer")?.completedAt, null);
});

test("repair chooses newest active session then uses ascending session ID for exact ties", () => {
  const old = sessionFixture({ sessionId: "old", updatedAt: "2026-07-24T09:00:00.000Z" });
  const newest = sessionFixture({ sessionId: "newest", updatedAt: "2026-07-24T12:00:00.000Z" });
  const byTime = repairPracticeSessionStore(storeFixture([old, newest], null));
  assert.equal(byTime.store.activeSessionId, "newest");
  assert.equal(byTime.store.sessions.find((session) => session.sessionId === "old")?.status, "abandoned");

  const tieB = sessionFixture({ sessionId: "b-session", updatedAt: "2026-07-24T12:00:00.000Z" });
  const tieA = sessionFixture({ sessionId: "a-session", updatedAt: "2026-07-24T12:00:00.000Z" });
  const byId = repairPracticeSessionStore(storeFixture([tieB, tieA], null));
  assert.equal(byId.store.activeSessionId, "a-session");

  const secondPass = repairPracticeSessionStore(byId.store);
  assert.equal(secondPass.changed, false);
  assert.deepEqual(secondPass.store, byId.store);
});

function sessionFixture(overrides: Partial<PracticeSession> = {}): PracticeSession {
  const session = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed: "migration-fixture",
    evidence: evidence(),
    source: createTwoPathFixture(),
    now: new Date("2026-07-24T10:00:00.000Z"),
  }).session!;
  return { ...session, ...overrides };
}

function legacySession(session: PracticeSession) {
  const {
    origin: _origin,
    subjectId: _subjectId,
    parentSessionId: _parentSessionId,
    skippedQuestionIds: _skippedQuestionIds,
    finalSkippedQuestionIds: _finalSkippedQuestionIds,
    ...legacy
  } = session;
  return { ...legacy, schemaVersion: 1 as const };
}

function storeFixture(
  sessions: unknown[],
  activeSessionId: string | null,
): { schemaVersion: 3; activeSessionId: string | null; sessions: unknown[] };
function storeFixture(
  sessions: unknown[],
  activeSessionId: string | null,
  schemaVersion: 2,
): { schemaVersion: 2; activeSessionId: string | null; sessions: unknown[] };
function storeFixture(
  sessions: unknown[],
  activeSessionId: string | null,
  schemaVersion: 1,
): { schemaVersion: 1; activeSessionId: string | null; sessions: unknown[] };
function storeFixture(
  sessions: unknown[],
  activeSessionId: string | null,
  schemaVersion: 1 | 2 | 3 = 3,
) {
  return { schemaVersion, activeSessionId, sessions };
}

function questionId(session: PracticeSession) {
  return session.questionReferences[0].questionId;
}

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  writeCount = 0;
  get length() { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void {
    this.writeCount += 1;
    this.values.set(key, value);
  }
  resetWriteCount() { this.writeCount = 0; }
}
