import assert from "node:assert/strict";
import test from "node:test";
import { attempt, supportEvent } from "./progress-fixtures";
import type { ProgressPayload } from "../lib/progress/types";
import {
  canRunProgressSync,
  confirmProgressSyncAssociation,
  createDefaultProgressSyncMetadata,
  mergeProgressSyncPullResponse,
  mergeProgressSyncPushResponse,
  pauseProgressSync,
  pendingProgressSyncEvidence,
  progressSyncRequiresAssociation,
  readProgressSyncMetadata,
} from "../lib/progress/sync-metadata";
import {
  decodeProgressSyncCursor,
  encodeProgressSyncCursor,
  isProgressSyncPullResponse,
  progressSyncEventsToPayload,
  type ProgressSyncPullResponse,
} from "../lib/progress/sync-protocol";
import { progressSyncRetryDelay } from "../lib/progress/sync-retry";

const fingerprintA = "A".repeat(43);
const fingerprintB = "B".repeat(43);
const time = "2026-07-16T12:00:00.000Z";

test("sync cursors are exclusive-position tokens bound to one account fingerprint", () => {
  const cursor = encodeProgressSyncCursor(fingerprintA, "42");
  assert.deepEqual(decodeProgressSyncCursor(cursor, fingerprintA), { ok: true, receiveCursor: "42" });
  assert.deepEqual(decodeProgressSyncCursor(cursor, fingerprintB), { ok: false });
  assert.deepEqual(decodeProgressSyncCursor(null, fingerprintA), { ok: true, receiveCursor: undefined });
  assert.throws(() => encodeProgressSyncCursor("unsafe", "42"));
});

test("Sprint 14 acknowledgements migrate without silently enabling synchronization", () => {
  const imported = JSON.stringify({ version: 1, lastAccountFingerprint: fingerprintA, accounts: {
    [fingerprintA]: { acknowledged: { "attempt:attempt_one": { disposition: "accepted", receiveCursor: "1", acknowledgedAt: time } }, lastImportAt: time },
  } });
  const metadata = readProgressSyncMetadata(null, imported);
  assert.equal(metadata.accounts[fingerprintA].acknowledged["attempt:attempt_one"].receiveCursor, "1");
  assert.equal(metadata.accounts[fingerprintA].syncEnabled, false);
  assert.equal(metadata.accounts[fingerprintA].associationConfirmed, false);
});

test("import acknowledgements continue to union after sync metadata already exists", () => {
  const initial = confirmProgressSyncAssociation(createDefaultProgressSyncMetadata(), fingerprintA);
  const imported = JSON.stringify({ version: 1, accounts: {
    [fingerprintA]: { acknowledged: { "support_event:support_one": { disposition: "already_present", receiveCursor: "2", acknowledgedAt: time } }, lastImportAt: time },
  } });
  const metadata = readProgressSyncMetadata(JSON.stringify(initial), imported);
  assert.equal(metadata.accounts[fingerprintA].acknowledged["support_event:support_one"].disposition, "already_present");
  assert.equal(metadata.accounts[fingerprintA].syncEnabled, true);
});

test("account association is explicit and changing accounts pauses synchronization", () => {
  let metadata = createDefaultProgressSyncMetadata();
  assert.equal(progressSyncRequiresAssociation(metadata, fingerprintA), true);
  metadata = confirmProgressSyncAssociation(metadata, fingerprintA);
  assert.equal(canRunProgressSync(metadata, fingerprintA), true);
  assert.equal(progressSyncRequiresAssociation(metadata, fingerprintB), true);
  metadata = pauseProgressSync(metadata, fingerprintA, true);
  assert.equal(canRunProgressSync(metadata, fingerprintA), false);
});

test("pending push excludes durable and permanently rejected event references", () => {
  const source = payload();
  let metadata = confirmProgressSyncAssociation(createDefaultProgressSyncMetadata(), fingerprintA);
  metadata = mergeProgressSyncPushResponse(metadata, {
    protocolVersion: 1, accountFingerprint: fingerprintA, committedAt: time, batchStatus: "partly_committed",
    accepted: [{ kind: "attempt", eventId: "attempt_sync", receiveCursor: "1", receivedAt: time }],
    alreadyPresent: [], conflictRetained: [],
    rejected: [{ kind: "support_event", eventId: "support_sync", reason: "invalid" }], notProcessed: [],
  });
  const pending = pendingProgressSyncEvidence(source, metadata, fingerprintA);
  assert.equal(pending.data.attempts.length, 0);
  assert.equal(pending.data.supportEvents.length, 0);
});

test("pull acknowledgements advance only the current account cursor", () => {
  const metadata = mergeProgressSyncPullResponse(confirmProgressSyncAssociation(createDefaultProgressSyncMetadata(), fingerprintA), pullResponse());
  assert.equal(metadata.accounts[fingerprintA].lastPulledCursor, `v1.${fingerprintA}.3`);
  assert.equal(metadata.accounts[fingerprintA].acknowledged["attempt:attempt_sync"].disposition, "accepted");
  assert.equal(metadata.accounts[fingerprintB], undefined);
});

test("pull response validation accepts retained conflicts and rejects mismatched IDs", () => {
  const response = pullResponse();
  assert.equal(isProgressSyncPullResponse(response), true);
  assert.equal(isProgressSyncPullResponse({ ...response, events: [{ ...response.events[0], eventId: "other" }] }), false);
  const payload = progressSyncEventsToPayload(response.events);
  assert.equal(payload.data.attempts.length, 1);
});

test("retry delays are bounded and jittered without exceeding the fifteen-minute cap", () => {
  assert.equal(progressSyncRetryDelay(1, 0), 4_000);
  assert.equal(progressSyncRetryDelay(1, 1), 6_000);
  assert.equal(progressSyncRetryDelay(99, 0.5), 15 * 60_000);
});

test("malformed and future sync metadata fail closed", () => {
  assert.deepEqual(readProgressSyncMetadata("broken"), createDefaultProgressSyncMetadata());
  assert.deepEqual(readProgressSyncMetadata(JSON.stringify({ version: 2, accounts: {} })), createDefaultProgressSyncMetadata());
});

function payload(): ProgressPayload {
  return { version: 4, data: {
    attempts: [attempt({ eventId: "attempt_sync" })],
    supportEvents: [supportEvent({ eventId: "support_sync" })],
    achievementSnapshots: [],
  } };
}

function pullResponse(): ProgressSyncPullResponse {
  const evidence = attempt({ eventId: "attempt_sync" });
  return {
    protocolVersion: 1, accountFingerprint: fingerprintA,
    events: [{ kind: "attempt", eventId: evidence.eventId, disposition: "accepted", receiveCursor: "3", receivedAt: time, evidence }],
    skipped: [], nextCursor: `v1.${fingerprintA}.3`, hasMore: false, caughtUpAt: time,
  };
}
