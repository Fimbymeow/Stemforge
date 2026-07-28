import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountLearningDataExport } from "../lib/account-data/export";
import { resetPathProgress } from "../lib/progress/calculations";
import {
  assignEvidenceProvenance,
  createDefaultEvidenceProvenance,
  evidenceReferences,
} from "../lib/progress/evidence-provenance";
import { batchProgressEvidence, countEvidence } from "../lib/progress/import-batching";
import {
  createDefaultProgressImportMetadata,
  evidenceSummary,
  mergeImportResponse,
  pendingEvidence,
} from "../lib/progress/import-metadata";
import { mergeProgressEvidence } from "../lib/progress/merge";
import { createDefaultProgressPayload } from "../lib/progress/payload";
import {
  isProgressSyncPullResponse,
  progressSyncEventsToPayload,
  type ProgressSyncPullResponse,
} from "../lib/progress/sync-protocol";
import type { ProgressPayload } from "../lib/progress/types";
import { validateRemoteEvidenceBatch } from "../lib/remote-evidence/validation";
import type { ReviewEvent } from "../lib/review/types";

const fingerprint = "A".repeat(43);

test("Review events merge generically, de-duplicate and retain deterministic same-ID conflicts", () => {
  const left = payload(reviewEvent());
  const duplicate = mergeProgressEvidence(left, payload(reviewEvent()));
  assert.equal(duplicate.payload.data.reviewEvents.length, 1);
  assert.deepEqual(duplicate.conflicts, []);
  const conflict = mergeProgressEvidence(left, payload(reviewEvent({ outcome: "incorrect", stageAfter: "recovery" })));
  assert.equal(conflict.payload.data.reviewEvents.length, 1);
  assert.equal(conflict.conflicts.length, 1);
  assert.equal(conflict.conflicts[0].recordType, "review_event");
});

test("path reset removes only matching Review targets and provenance treats Review as first-class evidence", () => {
  const matching = reviewEvent();
  const other = reviewEvent({
    eventId: "review_other",
    target: { targetType: "skill", targetId: "another-skill" },
  });
  const source = payload(matching, other);
  const reset = resetPathProgress(source, matching.target.targetId);
  assert.deepEqual(reset.data.reviewEvents, [other]);
  assert.deepEqual([...evidenceReferences(source)].sort(), ["review_event:review_event_1", "review_event:review_other"]);
  const provenance = assignEvidenceProvenance(
    createDefaultEvidenceProvenance(),
    source,
    ["review_event:review_event_1"],
    "local_anonymous",
    null,
  );
  assert.equal(provenance.records["review_event:review_event_1"].source, "local_anonymous");
});

test("import batching, summaries and acknowledgements preserve Review events", () => {
  const source = payload(reviewEvent());
  assert.equal(countEvidence(source), 1);
  assert.deepEqual(evidenceSummary(source), {
    attempts: 0,
    supportEvents: 0,
    selfAssessments: 0,
    achievements: 0,
    reviewEvents: 1,
    total: 1,
  });
  assert.deepEqual(batchProgressEvidence(source)[0].data.reviewEvents, source.data.reviewEvents);
  const metadata = mergeImportResponse(createDefaultProgressImportMetadata(), {
    protocolVersion: 1,
    accountFingerprint: fingerprint,
    committedAt: "2026-07-20T10:00:00.000Z",
    batchStatus: "committed",
    accepted: [{
      kind: "review_event",
      eventId: "review_event_1",
      receiveCursor: "1",
      receivedAt: "2026-07-20T10:00:00.000Z",
    }],
    alreadyPresent: [],
    conflictRetained: [],
    rejected: [],
    notProcessed: [],
  });
  assert.deepEqual(pendingEvidence(source, metadata, fingerprint).data.reviewEvents, []);
});

test("remote validation accepts exact Review keys, rejects unknown keys and permits references to arrive later", () => {
  const source = payload(reviewEvent());
  const valid = validateRemoteEvidenceBatch(source);
  assert.equal(valid.fatal, false);
  assert.equal(valid.rejected.length, 0);
  assert.equal(valid.payload.data.reviewEvents.length, 1);
  const extra = {
    ...source,
    data: {
      ...source.data,
      reviewEvents: [{ ...source.data.reviewEvents[0], secretExtra: "not accepted" }],
    },
  };
  const rejected = validateRemoteEvidenceBatch(extra);
  assert.equal(rejected.fatal, false);
  assert.equal(rejected.rejected[0].kind, "review_event");
  assert.equal(rejected.payload.data.reviewEvents.length, 0);
});

test("sync accepts and reconstructs Review evidence before referenced attempts without dereferencing it", () => {
  const event = reviewEvent();
  const response: ProgressSyncPullResponse = {
    protocolVersion: 1,
    accountFingerprint: fingerprint,
    accountGeneration: "1",
    events: [{
      kind: "review_event",
      eventId: event.eventId,
      disposition: "accepted",
      receiveCursor: "1",
      receivedAt: "2026-07-20T10:00:00.000Z",
      evidence: event,
    }],
    skipped: [],
    nextCursor: null,
    hasMore: false,
    caughtUpAt: "2026-07-20T10:00:00.000Z",
  };
  assert.equal(isProgressSyncPullResponse(response), true);
  const reconstructed = progressSyncEventsToPayload(response.events);
  assert.deepEqual(reconstructed.data.reviewEvents, [event]);
  assert.deepEqual(reconstructed.data.attempts, []);
});

test("account export counts and preserves accepted Review evidence", () => {
  const event = reviewEvent();
  const exported = buildAccountLearningDataExport([{
    kind: "review_event",
    disposition: "accepted",
    eventId: event.eventId,
    evidence: event,
    accountGeneration: "1",
    receiveCursor: "1",
    receivedAt: "2026-07-20T10:00:00.000Z",
  }], "2026-07-01T10:00:00.000Z", "2026-07-20T10:00:00.000Z");
  assert.equal(exported.schemaVersion, 3);
  assert.equal(exported.categoryCounts.reviewEvents, 1);
  assert.equal(exported.records[0].kind, "review_event");
});

function payload(...events: ReviewEvent[]): ProgressPayload {
  const payload = createDefaultProgressPayload();
  payload.data.reviewEvents = events;
  return payload;
}

function reviewEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    eventId: "review_event_1",
    source: { sourceType: "practice_session", sourceId: "review_session_1" },
    target: { targetType: "skill", targetId: "basic-differentiation" },
    targetVersion: { versionType: "skill_path", version: 1 },
    outcome: "independent_success",
    occurredAt: "2026-07-20T10:00:00.000Z",
    sequence: 2,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 0,
    evidenceRefs: [{ evidenceKind: "attempt", eventId: "attempt_not_yet_arrived" }],
    questionIds: ["hm-calc-diff-basic-f-001"],
    ...overrides,
  };
}
