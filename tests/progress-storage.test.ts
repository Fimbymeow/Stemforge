import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultProgressPayload } from "../lib/progress/payload";
import { ProgressRepository } from "../lib/progress/repository";
import { createBrowserProgressStorage, LocalStorageProgressStorage, PROGRESS_STORAGE_KEY, type StorageLike } from "../lib/progress/storage";
import type { ProgressPayload } from "../lib/progress/types";
import { attempt, supportEvent } from "./progress-fixtures";

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  throwOnRead = false;
  throwOnWrite = false;
  throwOnClear = false;
  getItem(key: string) { if (this.throwOnRead) throw new Error("read blocked"); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.throwOnWrite) throw new Error("write blocked"); this.values.set(key, value); }
  removeItem(key: string) { if (this.throwOnClear) throw new Error("clear blocked"); this.values.delete(key); }
}

const payload: ProgressPayload = { version: 6, data: { attempts: [attempt()], supportEvents: [supportEvent()], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] } };
const legacyAttempt = {
  questionId: attempt().questionId,
  skillPathId: attempt().skillPathId,
  stageId: attempt().stageId,
  isCorrect: true,
  answer: "5x^4",
  attemptedAt: "2026-07-11T12:00:00.000Z",
};

test("save then load preserves V6", () => {
  const memory = new MemoryStorage();
  const storage = new LocalStorageProgressStorage(memory);
  assert.equal(storage.save(payload), true);
  assert.deepEqual(storage.load().payload, payload);
});

test("storage round-trip preserves new marker metadata and legacy attempts together", () => {
  const memory = new MemoryStorage();
  const storage = new LocalStorageProgressStorage(memory);
  const marked = attempt({
    eventId: "attempt_marked",
    isCorrect: false,
    outcomeKind: "graded",
    outcomeReason: "value_wrong",
    strategy: "numeric",
    strategyVersion: 1,
  });
  const mixed: ProgressPayload = {
    version: 6,
    data: { attempts: [attempt({ eventId: "attempt_legacy" }), marked], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] },
  };
  assert.equal(storage.save(mixed), true);
  assert.deepEqual(storage.load().payload.data.attempts, mixed.data.attempts);
});

test("storage key remains unchanged", () => {
  assert.equal(PROGRESS_STORAGE_KEY, "stemforge.localProgress.v1");
});

test("V1 load then save writes V6 without duplicate attempts", () => {
  const memory = new MemoryStorage();
  memory.values.set(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, data: { attempts: [legacyAttempt] } }));
  const repository = new ProgressRepository(new LocalStorageProgressStorage(memory));
  assert.equal(repository.recordAttempt(attempt({ questionId: "hm-calc-diff-basic-f-002", sequence: 2 })), true);
  const saved = JSON.parse(memory.values.get(PROGRESS_STORAGE_KEY) ?? "null") as ProgressPayload;
  assert.equal(saved.version, 6);
  assert.equal(saved.data.attempts.length, 2);
  assert.equal(saved.data.attempts[0].legacyCompleted, true);
});

test("unversioned load remains readable and next event saves V6", () => {
  const memory = new MemoryStorage();
  memory.values.set(PROGRESS_STORAGE_KEY, JSON.stringify([legacyAttempt]));
  const repository = new ProgressRepository(new LocalStorageProgressStorage(memory));
  assert.equal(repository.load().status, "migrated-legacy");
  assert.equal(repository.recordSupportEvent(supportEvent({ sequence: 2 })), true);
  const saved = JSON.parse(memory.values.get(PROGRESS_STORAGE_KEY) ?? "null") as ProgressPayload;
  assert.equal(saved.version, 6);
  assert.equal(saved.data.attempts.length, 1);
});

test("malformed JSON falls back without overwriting on read", () => {
  const memory = new MemoryStorage();
  memory.values.set(PROGRESS_STORAGE_KEY, "{broken");
  const storage = new LocalStorageProgressStorage(memory);
  assert.equal(storage.load().status, "malformed-json");
  assert.equal(memory.values.get(PROGRESS_STORAGE_KEY), "{broken");
});

test("clear resets storage", () => {
  const memory = new MemoryStorage();
  const storage = new LocalStorageProgressStorage(memory);
  storage.save(payload);
  assert.equal(storage.clear(), true);
  assert.deepEqual(storage.load().payload, createDefaultProgressPayload());
});

test("unavailable and throwing storage fail safely", () => {
  const unavailable = new LocalStorageProgressStorage(null);
  assert.equal(unavailable.load().status, "unavailable");
  assert.equal(unavailable.save(payload), false);
  const memory = new MemoryStorage();
  const storage = new LocalStorageProgressStorage(memory);
  memory.throwOnRead = true;
  assert.equal(storage.load().status, "unavailable");
  memory.throwOnRead = false;
  memory.throwOnWrite = true;
  assert.equal(storage.save(payload), false);
  memory.throwOnWrite = false;
  memory.throwOnClear = true;
  assert.equal(storage.clear(), false);
});

test("SSR factory is safe", () => {
  assert.equal(createBrowserProgressStorage().load().status, "unavailable");
});

test("invalid payloads cannot be saved", () => {
  const memory = new MemoryStorage();
  const storage = new LocalStorageProgressStorage(memory);
  assert.equal(storage.save({ version: 6, data: { attempts: [{ ...attempt(), sequence: -1 }], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] } }), false);
});

test("unsupported future data is preserved", () => {
  const memory = new MemoryStorage();
  const future = JSON.stringify({ version: 7, data: { attempts: [] } });
  memory.values.set(PROGRESS_STORAGE_KEY, future);
  const repository = new ProgressRepository(new LocalStorageProgressStorage(memory));
  assert.equal(repository.recordAttempt(attempt()), false);
  assert.equal(repository.resetPath(attempt().skillPathId), false);
  assert.equal(memory.values.get(PROGRESS_STORAGE_KEY), future);
});
