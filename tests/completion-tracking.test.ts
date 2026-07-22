import assert from "node:assert/strict";
import test from "node:test";
import {
  CELEBRATION_STORAGE_KEY,
  CURRENT_CELEBRATION_VERSION,
  STAGE_CELEBRATION_STORAGE_KEY,
  LocalStorageCelebrationStorage,
  createBrowserCelebrationStorage,
  isAcknowledgedStatusUpgrade,
  getStageCelebration,
  recordStageCelebrated,
  acknowledgeStageStatus,
  clearStageCelebration,
  type CelebrationPayload,
  type CelebrationStorageLike,
} from "../lib/completion-tracking";

class MemoryStorage implements CelebrationStorageLike {
  values = new Map<string, string>();
  throwOnRead = false;
  throwOnWrite = false;
  throwOnClear = false;
  getItem(key: string) { if (this.throwOnRead) throw new Error("read blocked"); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.throwOnWrite) throw new Error("write blocked"); this.values.set(key, value); }
  removeItem(key: string) { if (this.throwOnClear) throw new Error("clear blocked"); this.values.delete(key); }
}

const firstEntry = {
  celebratedAt: "2026-07-13T10:00:00.000Z",
  lastAcknowledgedStatus: "completed" as const,
};

function currentPayload(paths: CelebrationPayload["data"]["paths"]): CelebrationPayload {
  return { version: CURRENT_CELEBRATION_VERSION, data: { paths } };
}

function stored(memory: MemoryStorage) {
  return JSON.parse(memory.values.get(CELEBRATION_STORAGE_KEY) ?? "null") as unknown;
}

test("empty and unavailable acknowledgement storage fail safely", () => {
  const empty = new LocalStorageCelebrationStorage(new MemoryStorage()).load();
  assert.equal(empty.status, "empty");
  assert.deepEqual(empty.payload, currentPayload({}));
  assert.equal(createBrowserCelebrationStorage().load().status, "unavailable");
});

test("valid versioned state supports multiple and unknown path IDs", () => {
  const memory = new MemoryStorage();
  const payload = currentPayload({
    "basic-differentiation": firstEntry,
    "future-or-renamed-path": { ...firstEntry, lastAcknowledgedStatus: "secure" },
  });
  memory.values.set(CELEBRATION_STORAGE_KEY, JSON.stringify(payload));
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(storage.load().status, "current");
  assert.deepEqual(storage.load().payload, payload);
  assert.equal(storage.getPath("future-or-renamed-path")?.lastAcknowledgedStatus, "secure");
});

test("legacy direct path map remains readable and migrates on mutation", () => {
  const memory = new MemoryStorage();
  memory.values.set(CELEBRATION_STORAGE_KEY, JSON.stringify({ "basic-differentiation": firstEntry }));
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(storage.load().status, "migrated-legacy");
  assert.equal(storage.recordCompletion("other-path", "completed"), "recorded");
  assert.deepEqual(Object.keys((stored(memory) as CelebrationPayload).data.paths), ["basic-differentiation", "other-path"]);
});

test("malformed JSON and invalid shapes return a safe default and can repair on a new record", () => {
  const memory = new MemoryStorage();
  memory.values.set(CELEBRATION_STORAGE_KEY, "{broken");
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(storage.load().status, "malformed-json");
  assert.equal(memory.values.get(CELEBRATION_STORAGE_KEY), "{broken");
  assert.equal(storage.recordCompletion("basic-differentiation", "completed"), "recorded");
  assert.equal((stored(memory) as CelebrationPayload).version, CURRENT_CELEBRATION_VERSION);

  memory.values.set(CELEBRATION_STORAGE_KEY, JSON.stringify({ version: 1, data: { paths: [] } }));
  assert.equal(storage.load().status, "invalid-structure");
});

test("invalid path records are dropped without losing valid unrelated records", () => {
  const memory = new MemoryStorage();
  memory.values.set(CELEBRATION_STORAGE_KEY, JSON.stringify(currentPayload({
    "basic-differentiation": firstEntry,
    broken: { celebratedAt: "not-a-date", lastAcknowledgedStatus: "mastered" },
  } as CelebrationPayload["data"]["paths"])));
  const loaded = new LocalStorageCelebrationStorage(memory).load();
  assert.equal(loaded.status, "current-repaired");
  assert.deepEqual(loaded.payload.data.paths, { "basic-differentiation": firstEntry });
});

test("completion acknowledgement is idempotent and path-specific", () => {
  const memory = new MemoryStorage();
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(storage.recordCompletion("basic-differentiation", "completed"), "recorded");
  const afterFirst = memory.values.get(CELEBRATION_STORAGE_KEY);
  assert.equal(storage.recordCompletion("basic-differentiation", "mastered"), "unchanged");
  assert.equal(memory.values.get(CELEBRATION_STORAGE_KEY), afterFirst);
  assert.equal(storage.recordCompletion("other-path", "secure"), "recorded");
  assert.equal(Object.keys((stored(memory) as CelebrationPayload).data.paths).length, 2);
});

test("only upward mastery changes are acknowledged", () => {
  const memory = new MemoryStorage();
  memory.values.set(CELEBRATION_STORAGE_KEY, JSON.stringify(currentPayload({ "basic-differentiation": firstEntry })));
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(isAcknowledgedStatusUpgrade("completed", "secure"), true);
  assert.equal(isAcknowledgedStatusUpgrade("secure", "completed"), false);
  assert.equal(storage.acknowledgeStatus("basic-differentiation", "secure"), "updated");
  assert.deepEqual(storage.getPath("basic-differentiation"), { ...firstEntry, lastAcknowledgedStatus: "secure" });
  assert.equal(storage.acknowledgeStatus("basic-differentiation", "completed"), "unchanged");
  assert.equal(storage.acknowledgeStatus("basic-differentiation", "mastered"), "updated");
  assert.equal(storage.getPath("basic-differentiation")?.celebratedAt, firstEntry.celebratedAt);
});

test("clearing one path preserves unrelated acknowledgements and allows a new cycle", () => {
  const memory = new MemoryStorage();
  memory.values.set(CELEBRATION_STORAGE_KEY, JSON.stringify(currentPayload({
    "basic-differentiation": firstEntry,
    "other-path": { ...firstEntry, lastAcknowledgedStatus: "mastered" },
  })));
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(storage.clearPath("basic-differentiation"), true);
  assert.equal(storage.getPath("basic-differentiation"), undefined);
  assert.equal(storage.getPath("other-path")?.lastAcknowledgedStatus, "mastered");
  assert.equal(storage.recordCompletion("basic-differentiation", "secure"), "recorded");
});

test("unsupported future acknowledgement data is never overwritten", () => {
  const memory = new MemoryStorage();
  const future = JSON.stringify({ version: 99, data: { paths: { future: true } } });
  memory.values.set(CELEBRATION_STORAGE_KEY, future);
  const storage = new LocalStorageCelebrationStorage(memory);
  assert.equal(storage.load().status, "unsupported-version");
  assert.equal(storage.recordCompletion("basic-differentiation", "completed"), "unsupported-version");
  assert.equal(storage.acknowledgeStatus("basic-differentiation", "secure"), "unsupported-version");
  assert.equal(storage.clearPath("basic-differentiation"), false);
  assert.equal(storage.clearAll(), false);
  assert.equal(memory.values.get(CELEBRATION_STORAGE_KEY), future);
});

test("storage failures never throw or claim a persisted acknowledgement", () => {
  const memory = new MemoryStorage();
  const storage = new LocalStorageCelebrationStorage(memory);
  memory.throwOnRead = true;
  assert.equal(storage.recordCompletion("basic-differentiation", "completed"), "unavailable");
  memory.throwOnRead = false;
  memory.throwOnWrite = true;
  assert.equal(storage.recordCompletion("basic-differentiation", "completed"), "write-failed");
  memory.throwOnWrite = false;
  memory.throwOnClear = true;
  assert.equal(storage.clearAll(), false);
});

test("stage celebration uses a storage key fully separate from path celebration", () => {
  const memory = new MemoryStorage();
  const pathStorage = new LocalStorageCelebrationStorage(memory);
  const stageStorage = new LocalStorageCelebrationStorage(memory, STAGE_CELEBRATION_STORAGE_KEY);

  assert.equal(pathStorage.recordCompletion("basic-differentiation", "completed"), "recorded");
  assert.equal(stageStorage.getPath("basic-differentiation"), undefined);

  assert.equal(stageStorage.recordCompletion("basic-differentiation:foundations", "completed"), "recorded");
  assert.equal(pathStorage.getPath("basic-differentiation:foundations"), undefined);

  assert.notEqual(memory.values.get(CELEBRATION_STORAGE_KEY), memory.values.get(STAGE_CELEBRATION_STORAGE_KEY));
  assert.equal((JSON.parse(memory.values.get(STAGE_CELEBRATION_STORAGE_KEY)!) as CelebrationPayload).version, CURRENT_CELEBRATION_VERSION);
});

test("stage celebration composite ids keep the same stage id distinct across paths", () => {
  const memory = new MemoryStorage();
  const stageStorage = new LocalStorageCelebrationStorage(memory, STAGE_CELEBRATION_STORAGE_KEY);
  assert.equal(stageStorage.recordCompletion("basic-differentiation:foundations", "secure"), "recorded");
  assert.equal(stageStorage.recordCompletion("integration-basics:foundations", "completed"), "recorded");
  assert.equal(stageStorage.getPath("basic-differentiation:foundations")?.lastAcknowledgedStatus, "secure");
  assert.equal(stageStorage.getPath("integration-basics:foundations")?.lastAcknowledgedStatus, "completed");
});

test("stage celebration upgrade and idempotency rules mirror path celebration", () => {
  const memory = new MemoryStorage();
  const stageStorage = new LocalStorageCelebrationStorage(memory, STAGE_CELEBRATION_STORAGE_KEY);
  assert.equal(stageStorage.recordCompletion("basic-differentiation:foundations", "completed"), "recorded");
  assert.equal(stageStorage.recordCompletion("basic-differentiation:foundations", "mastered"), "unchanged");
  assert.equal(stageStorage.acknowledgeStatus("basic-differentiation:foundations", "secure"), "updated");
  assert.equal(stageStorage.acknowledgeStatus("basic-differentiation:foundations", "completed"), "unchanged");
  assert.equal(stageStorage.acknowledgeStatus("basic-differentiation:foundations", "mastered"), "updated");
  assert.equal(stageStorage.clearPath("basic-differentiation:foundations"), true);
  assert.equal(stageStorage.getPath("basic-differentiation:foundations"), undefined);
});

test("stage celebration wrapper functions report unavailable without a browser environment", () => {
  assert.equal(createBrowserCelebrationStorage(STAGE_CELEBRATION_STORAGE_KEY).load().status, "unavailable");
  assert.equal(getStageCelebration("basic-differentiation", "foundations"), undefined);
  assert.equal(recordStageCelebrated("basic-differentiation", "foundations", "completed"), "unavailable");
  assert.equal(acknowledgeStageStatus("basic-differentiation", "foundations", "secure"), "unavailable");
  assert.equal(clearStageCelebration("basic-differentiation", "foundations"), false);
});
