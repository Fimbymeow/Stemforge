import assert from "node:assert/strict";
import test from "node:test";
import { batchProgressEvidence } from "../lib/progress/import-batching";
import {
  PROGRESS_IMPORT_METADATA_KEY,
  createDefaultProgressImportMetadata,
  evidenceSummary,
  inspectLocalProgress,
  mergeImportResponse,
  pendingEvidence,
  readProgressImportMetadata,
  wasAcknowledgedForDifferentAccount,
} from "../lib/progress/import-metadata";
import { isProgressImportResponse, type ProgressImportResponse } from "../lib/progress/import-protocol";
import { CELEBRATION_STORAGE_KEY } from "../lib/completion-tracking";
import { attempt, supportEvent } from "./progress-fixtures";
import type { AchievementSnapshot, ProgressPayload } from "../lib/progress/types";

const fingerprintA = "A".repeat(43);
const fingerprintB = "B".repeat(43);

test("empty and exact-category importability are derived only from canonical progress", () => {
  assert.equal(inspectLocalProgress(null).status, "empty");
  const inspected = inspectLocalProgress(JSON.stringify(payload()));
  assert.equal(inspected.status, "importable");
  assert.deepEqual(evidenceSummary(inspected.payload), { attempts: 1, supportEvents: 1, achievements: 1, total: 3 });
  assert.notEqual(PROGRESS_IMPORT_METADATA_KEY, CELEBRATION_STORAGE_KEY);
});

test("supported legacy evidence migrates in memory with deterministic IDs", () => {
  const legacy = { version: 1, data: { attempts: [{
    questionId: "q", skillPathId: "p", stageId: "s", isCorrect: true, answer: "1", attemptedAt: "2026-07-12T10:00:00.000Z",
  }] } };
  const first = inspectLocalProgress(JSON.stringify(legacy));
  const second = inspectLocalProgress(JSON.stringify(legacy));
  assert.equal(first.status, "importable");
  assert.equal(first.loadStatus, "migrated-v1");
  assert.deepEqual(first.payload, second.payload);
});

test("repaired V4 keeps valid siblings and reports dropped records", () => {
  const value = payload();
  const inspected = inspectLocalProgress(JSON.stringify({
    ...value,
    data: { ...value.data, attempts: [...value.data.attempts, { invalid: true }] },
  }));
  assert.equal(inspected.status, "importable");
  assert.equal(inspected.loadStatus, "current-repaired");
  assert.match(inspected.status === "importable" ? inspected.warning ?? "" : "", /1 invalid saved record/);
});

test("malformed and unsupported future progress are preserved as non-importable states", () => {
  assert.equal(inspectLocalProgress("{broken").status, "invalid");
  assert.equal(inspectLocalProgress(JSON.stringify({ version: 5, data: {} })).status, "unsupported");
});

test("event count batching retains every category and stable ID", () => {
  const source: ProgressPayload = {
    version: 4,
    data: {
      attempts: Array.from({ length: 501 }, (_, index) => attempt({ eventId: `attempt_${index}` })),
      supportEvents: [supportEvent({ eventId: "support_tail" })],
      achievementSnapshots: [snapshot()],
    },
  };
  const batches = batchProgressEvidence(source);
  assert.deepEqual(batches.map((item) => evidenceSummary(item).total), [500, 3]);
  assert.equal(batches[1].data.achievementSnapshots[0].snapshotId, "snapshot_import_1");
});

test("byte batching splits records and rejects a single oversized record", () => {
  const source: ProgressPayload = { version: 4, data: {
    attempts: [attempt({ eventId: "attempt_a", answer: "x".repeat(200) }), attempt({ eventId: "attempt_b", answer: "y".repeat(200) })],
    supportEvents: [], achievementSnapshots: [],
  } };
  const oneBytes = new TextEncoder().encode(JSON.stringify({ version: 4, data: { attempts: [source.data.attempts[0]], supportEvents: [], achievementSnapshots: [] } })).length;
  assert.deepEqual(batchProgressEvidence(source, 500, oneBytes + 5).map((item) => item.data.attempts.length), [1, 1]);
  assert.throws(() => batchProgressEvidence(source, 500, 100), /exceeds/);
});

test("acknowledgements reduce pending evidence per account without touching canonical payload", () => {
  const source = payload();
  const original = structuredClone(source);
  const metadata = mergeImportResponse(createDefaultProgressImportMetadata(), response({
    accepted: [{ kind: "attempt", eventId: source.data.attempts[0].eventId, receiveCursor: "1", receivedAt: time }],
  }));
  const pending = pendingEvidence(source, metadata, fingerprintA);
  assert.equal(pending.data.attempts.length, 0);
  assert.equal(pending.data.supportEvents.length, 1);
  assert.deepEqual(source, original);
  assert.equal(pendingEvidence(source, metadata, fingerprintB).data.attempts.length, 1);
});

test("duplicate and partial acknowledgements union with another tab's latest metadata", () => {
  const first = mergeImportResponse(createDefaultProgressImportMetadata(), response({
    accepted: [{ kind: "attempt", eventId: "attempt_one", receiveCursor: "1", receivedAt: time }],
  }));
  const latestFromStorage = readProgressImportMetadata(JSON.stringify(first));
  const second = mergeImportResponse(latestFromStorage, response({
    alreadyPresent: [{ kind: "support_event", eventId: "support_two", receiveCursor: "2", receivedAt: time }],
    rejected: [{ kind: "attempt", eventId: "attempt_bad", reason: "invalid" }],
    batchStatus: "partly_committed",
  }));
  assert.deepEqual(Object.keys(second.accounts[fingerprintA].acknowledged).sort(), ["attempt:attempt_one", "support_event:support_two"]);
  assert.equal(second.accounts[fingerprintA].acknowledged["support_event:support_two"].disposition, "already_present");
  assert.equal(second.accounts[fingerprintA].acknowledged["attempt:attempt_bad"], undefined);
});

test("different-account history is explicit and malformed metadata fails safely", () => {
  const imported = mergeImportResponse(createDefaultProgressImportMetadata(), response({
    accepted: [{ kind: "attempt", eventId: "attempt_one", receiveCursor: "1", receivedAt: time }],
  }));
  assert.equal(wasAcknowledgedForDifferentAccount(imported, fingerprintA), false);
  assert.equal(wasAcknowledgedForDifferentAccount(imported, fingerprintB), true);
  assert.deepEqual(readProgressImportMetadata("not json"), createDefaultProgressImportMetadata());
});

test("invalid acknowledgement responses are never trusted", () => {
  assert.equal(isProgressImportResponse(response()), true);
  assert.equal(isProgressImportResponse({ ...response(), accountFingerprint: 42 }), false);
  assert.equal(isProgressImportResponse({ ...response(), accepted: [{ kind: "attempt", eventId: "x", receiveCursor: "bad", receivedAt: time }] }), false);
});

const time = "2026-07-16T12:00:00.000Z";

function response(overrides: Partial<ProgressImportResponse> = {}): ProgressImportResponse {
  return {
    protocolVersion: 1,
    accountFingerprint: fingerprintA,
    committedAt: time,
    batchStatus: "committed",
    accepted: [], alreadyPresent: [], conflictRetained: [], rejected: [], notProcessed: [],
    ...overrides,
  };
}

function payload(): ProgressPayload {
  return { version: 4, data: {
    attempts: [attempt({ eventId: "attempt_import_1" })],
    supportEvents: [supportEvent({ eventId: "support_import_1" })],
    achievementSnapshots: [snapshot()],
  } };
}

function snapshot(): AchievementSnapshot {
  return {
    snapshotId: "snapshot_import_1", kind: "stage_completed", subjectId: "higher-maths", courseId: "calculus",
    pathId: "basic-differentiation", pathVersion: 1, stageId: "stage-one", stageVersion: 1, achievedAt: time,
    masteryScore: 80, independentPerformancePercentage: 75, completionCount: 3, totalRequiredCount: 3, source: "derived_current",
  };
}
