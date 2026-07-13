import assert from "node:assert/strict";
import test from "node:test";
import { mergeProgressEvidence, mergeSupportedProgressPayloads } from "../lib/progress/merge";
import { getQuestionProgressForVersion } from "../lib/progress/calculations";
import { createDefaultProgressPayload, migrateProgressPayload } from "../lib/progress/payload";
import type { AchievementSnapshot, ProgressPayload } from "../lib/progress/types";
import { attempt, supportEvent } from "./progress-fixtures";

const payload = (attempts = [attempt()], supportEvents = [supportEvent()], achievementSnapshots: AchievementSnapshot[] = []): ProgressPayload =>
  ({ version: 4, data: { attempts, supportEvents, achievementSnapshots } });
const snapshot = (overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot => ({
  snapshotId: "snapshot_1", kind: "path_completed", subjectId: "higher-maths", courseId: "calculus",
  pathId: "basic-differentiation", pathVersion: 1, achievedAt: "2026-07-13T12:00:00.000Z", masteryScore: 70,
  independentPerformancePercentage: 100, completionCount: 8, totalRequiredCount: 8, source: "derived_current", ...overrides,
});

test("merge is idempotent, commutative, associative, deterministic, and immutable", () => {
  const a = payload([attempt({ eventId: "a", attemptedAt: "2026-07-13T12:00:00.000Z" })], [], [snapshot()]);
  const b = payload([attempt({ eventId: "b", attemptedAt: "2026-07-13T12:00:00.000Z", isCorrect: true })],
    [supportEvent({ eventId: "s1" })]);
  const c = payload([attempt({ eventId: "c", attemptedAt: "2026-07-12T12:00:00.000Z" })], [], [snapshot({ snapshotId: "snapshot_2", kind: "path_mastered" })]);
  const original = JSON.stringify([a, b, c]);
  assert.deepEqual(mergeProgressEvidence(a, a).payload, mergeProgressEvidence(a, createDefaultProgressPayload()).payload);
  assert.deepEqual(mergeProgressEvidence(a, b).payload, mergeProgressEvidence(b, a).payload);
  assert.deepEqual(mergeProgressEvidence(mergeProgressEvidence(a, b).payload, c).payload,
    mergeProgressEvidence(a, mergeProgressEvidence(b, c).payload).payload);
  assert.deepEqual(mergeProgressEvidence(a, b).payload.data.attempts.map((item) => item.eventId), ["a", "b"]);
  assert.equal(JSON.stringify([a, b, c]), original);
});

test("duplicates use IDs only and same-ID conflicts are surfaced canonically", () => {
  const same = attempt({ eventId: "same" });
  assert.equal(mergeProgressEvidence(payload([same], []), payload([same], [])).payload.data.attempts.length, 1);
  assert.equal(mergeProgressEvidence(payload([attempt({ eventId: "one" })], []), payload([attempt({ eventId: "two" })], [])).payload.data.attempts.length, 2);
  const left = payload([attempt({ eventId: "conflict", isCorrect: false })], []);
  const right = payload([attempt({ eventId: "conflict", isCorrect: true })], []);
  const lr = mergeProgressEvidence(left, right);
  const rl = mergeProgressEvidence(right, left);
  assert.equal(lr.conflicts[0]?.type, "same_id_conflict");
  assert.deepEqual(lr.payload, rl.payload);
});

test("support events and snapshots retain distinct IDs and deduplicate exact IDs", () => {
  const merged = mergeProgressEvidence(payload([], [supportEvent({ eventId: "s1" })], [snapshot()]),
    payload([], [supportEvent({ eventId: "s2" })], [snapshot(), snapshot({ snapshotId: "snapshot_2" })]));
  assert.equal(merged.payload.data.supportEvents.length, 2);
  assert.equal(merged.payload.data.achievementSnapshots.length, 2);
});

test("merged stronger evidence survives and equal timestamps use IDs for latest ordering", () => {
  const time = "2026-07-13T12:00:00.000Z";
  const left = payload([attempt({ eventId: "a", attemptedAt: time, isCorrect: true, answer: "correct" })], []);
  const right = payload([attempt({ eventId: "z", attemptedAt: time, sequence: 2, isCorrect: false })], []);
  const merged = mergeProgressEvidence(left, right).payload;
  const state = getQuestionProgressForVersion(merged.data.attempts[0].questionId, 1, merged.data);
  assert.equal(state.bestOutcome, "independently_correct_first_attempt");
  assert.equal(state.latestResult, false);
});

test("snapshot same-ID conflicts and malformed supported records are reported", () => {
  const conflict = mergeProgressEvidence(payload([], [], [snapshot()]), payload([], [], [snapshot({ kind: "path_mastered" })]));
  assert.equal(conflict.conflicts[0]?.recordType, "achievement_snapshot");
  const malformed = mergeSupportedProgressPayloads(payload(), {
    version: 4, data: { attempts: [{ invalid: true }], supportEvents: [], achievementSnapshots: [] },
  });
  assert.equal(malformed.conflicts.some((item) => item.type === "malformed_evidence_dropped"), true);
});

test("supported legacy merge uses stable migration IDs and refuses future versions", () => {
  const legacy = { version: 3, data: { attempts: [{ ...attempt(), eventId: undefined }].map(({ eventId: _id, ...item }) => item), supportEvents: [] } };
  const migrated = migrateProgressPayload(legacy).payload;
  assert.deepEqual(migrateProgressPayload(legacy).payload, migrated);
  assert.equal(mergeSupportedProgressPayloads(legacy, legacy).payload?.data.attempts.length, 1);
  const future = mergeSupportedProgressPayloads(legacy, { version: 99, data: {} });
  assert.equal(future.payload, null);
  assert.equal(future.conflicts[0]?.type, "unsupported_payload_version");
});
