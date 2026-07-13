import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultProgressPayload, migrateProgressPayload } from "../lib/progress/payload";
import type { AchievementSnapshot, QuestionAttemptV2, QuestionSupportEventV2 } from "../lib/progress/types";
import { attempt, supportEvent } from "./progress-fixtures";

const legacyAttempt = {
  questionId: "hm-calc-diff-basic-f-001",
  skillPathId: "basic-differentiation",
  stageId: "basic-diff-stage-foundations",
  isCorrect: false,
  answer: "wrong",
  attemptedAt: "2026-07-11T12:00:00.000Z",
};

function v2Attempt(overrides: Partial<QuestionAttemptV2> = {}): QuestionAttemptV2 {
  const { versionEvidence: _versionEvidence, eventId: _eventId, ...record } = attempt(overrides);
  return record;
}

function v2Event(overrides: Partial<QuestionSupportEventV2> = {}): QuestionSupportEventV2 {
  const { versionEvidence: _versionEvidence, eventId: _eventId, ...record } = supportEvent(overrides);
  return record;
}

test("creates an empty version 4 payload", () => {
  assert.deepEqual(createDefaultProgressPayload(), { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } });
});

test("loads valid V3 known and unknown evidence without semantic mutation", () => {
  const attempts = [attempt(), attempt({ sequence: 2, versionEvidence: { kind: "unknown_legacy", questionVersion: null } })]
    .map(({ eventId: _id, ...item }) => item);
  const supportEvents = [supportEvent()].map(({ eventId: _id, ...item }) => item);
  const payload = {
    version: 3 as const,
    data: {
      attempts,
      supportEvents,
    },
  };
  const result = migrateProgressPayload(payload);
  assert.equal(result.status, "migrated-v3");
  assert.equal(result.payload.version, 4);
  assert.deepEqual(result.payload.data.attempts.map(({ eventId: _id, ...item }) => item), payload.data.attempts);
  assert.deepEqual(result.payload.data.supportEvents.map(({ eventId: _id, ...item }) => item), payload.data.supportEvents);
  assert.deepEqual(result.payload.data.achievementSnapshots, []);
});

test("migrates V2 attempts and support events to explicit unknown evidence", () => {
  const source = { version: 2, data: { attempts: [v2Attempt()], supportEvents: [v2Event()] } };
  const result = migrateProgressPayload(source);
  assert.equal(result.status, "migrated-v2");
  assert.equal(result.payload.version, 4);
  const { eventId: _attemptId, ...migratedAttempt } = result.payload.data.attempts[0];
  const { eventId: _supportId, ...migratedSupport } = result.payload.data.supportEvents[0];
  assert.deepEqual(migratedAttempt, {
    ...source.data.attempts[0],
    versionEvidence: { kind: "unknown_legacy", questionVersion: null },
  });
  assert.deepEqual(migratedSupport, {
    ...source.data.supportEvents[0],
    versionEvidence: { kind: "unknown_legacy", questionVersion: null },
  });
});

test("V2 repeated attempts remain repeated and never receive invented version 1", () => {
  const record = v2Attempt();
  const result = migrateProgressPayload({ version: 2, data: { attempts: [record, record], supportEvents: [] } });
  assert.equal(result.payload.data.attempts.length, 2);
  assert.ok(result.payload.data.attempts.every((item) => item.versionEvidence.kind === "unknown_legacy"));
});

test("migrates V1 without deleting historical completion or inventing version evidence", () => {
  const result = migrateProgressPayload({ version: 1, data: { attempts: [legacyAttempt] } });
  assert.equal(result.status, "migrated-v1");
  assert.equal(result.payload.version, 4);
  assert.equal(result.payload.data.attempts[0].legacyCompleted, true);
  assert.equal(result.payload.data.attempts[0].supportKnowledge, "unknown_legacy");
  assert.deepEqual(result.payload.data.attempts[0].versionEvidence, { kind: "unknown_legacy", questionVersion: null });
});

test("migrates an unversioned array through the same conservative policy", () => {
  const result = migrateProgressPayload([legacyAttempt]);
  assert.equal(result.status, "migrated-legacy");
  assert.equal(result.payload.data.attempts[0].legacyCompleted, true);
  assert.deepEqual(result.payload.data.attempts[0].versionEvidence, { kind: "unknown_legacy", questionVersion: null });
});

test("V3 migration is idempotent", () => {
  const first = migrateProgressPayload({ version: 2, data: { attempts: [v2Attempt()], supportEvents: [v2Event()] } }).payload;
  assert.deepEqual(migrateProgressPayload(first).payload, first);
});

test("drops malformed legacy records without losing valid records", () => {
  const result = migrateProgressPayload({ version: 1, data: { attempts: [legacyAttempt, { nope: true }] } });
  assert.equal(result.droppedAttempts, 1);
  assert.equal(result.payload.data.attempts.length, 1);
});

test("repairs malformed V3 evidence records individually", () => {
  const result = migrateProgressPayload({
    version: 3,
    data: {
      attempts: [attempt(), { ...attempt({ sequence: 2 }), versionEvidence: { kind: "known", questionVersion: 0 } }],
      supportEvents: [supportEvent(), { ...supportEvent({ sequence: 3 }), versionEvidence: { kind: "unknown_legacy", questionVersion: 1 } }],
    },
  });
  assert.equal(result.status, "migrated-v3");
  assert.equal(result.droppedAttempts, 1);
  assert.equal(result.droppedEvents, 1);
});

test("malformed V2 subrecords are dropped during migration", () => {
  const result = migrateProgressPayload({
    version: 2,
    data: { attempts: [v2Attempt(), { invalid: true }], supportEvents: [v2Event(), null] },
  });
  assert.equal(result.status, "migrated-v2");
  assert.equal(result.droppedAttempts, 1);
  assert.equal(result.droppedEvents, 1);
});

test("future, null and invalid payloads fail safely", () => {
  assert.equal(migrateProgressPayload({ version: 5, data: {} }).status, "unsupported-version");
  assert.equal(migrateProgressPayload(null).status, "invalid-structure");
  assert.equal(migrateProgressPayload({ version: 3, data: { attempts: [] } }).status, "invalid-structure");
});

test("migration retains unknown content IDs", () => {
  const removed = { ...legacyAttempt, questionId: "removed-question" };
  const result = migrateProgressPayload({ version: 1, data: { attempts: [removed] } });
  assert.equal(result.payload.data.attempts[0].questionId, "removed-question");
});

test("V3 migration IDs are deterministic, preserve repeats, and invent no snapshots", () => {
  const sourceAttempt = { ...attempt(), eventId: undefined };
  const { eventId: _id, ...v3Attempt } = sourceAttempt;
  const source = { version: 3, data: { attempts: [v3Attempt, v3Attempt], supportEvents: [] } };
  const first = migrateProgressPayload(source).payload;
  const second = migrateProgressPayload(source).payload;
  assert.deepEqual(first, second);
  assert.equal(first.data.attempts.length, 2);
  assert.notEqual(first.data.attempts[0].eventId, first.data.attempts[1].eventId);
  assert.deepEqual(first.data.achievementSnapshots, []);
});

test("V4 validates snapshots individually and preserves structurally valid orphan references", () => {
  const valid: AchievementSnapshot = {
    snapshotId: "snapshot_valid", kind: "stage_completed", subjectId: "removed-subject", courseId: "removed-course",
    pathId: "removed-path", pathVersion: 2, stageId: "removed-stage", stageVersion: 3,
    achievedAt: "2026-07-13T12:00:00.000Z", masteryScore: 80, independentPerformancePercentage: 75,
    completionCount: 3, totalRequiredCount: 3, source: "derived_current",
  };
  const result = migrateProgressPayload({ version: 4, data: { attempts: [], supportEvents: [],
    achievementSnapshots: [valid, { ...valid, snapshotId: "bad", completionCount: 4 }] } });
  assert.equal(result.status, "current-repaired");
  assert.equal(result.droppedSnapshots, 1);
  assert.deepEqual(result.payload.data.achievementSnapshots, [valid]);
});
