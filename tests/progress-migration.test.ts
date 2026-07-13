import assert from "node:assert/strict";
import test from "node:test";
import { getQuestionProgress } from "../lib/progress/calculations";
import { migrateProgressPayload } from "../lib/progress/payload";

const base = {
  questionId: "hm-calc-diff-basic-f-001",
  skillPathId: "basic-differentiation",
  stageId: "basic-diff-stage-foundations",
  answer: "answer",
  attemptedAt: "2026-07-11T10:00:00.000Z",
};

test("V1 correct history remains complete without false independent evidence", () => {
  const migrated = migrateProgressPayload({ version: 1, data: { attempts: [{ ...base, isCorrect: true }] } }).payload;
  const state = getQuestionProgress(base.questionId, migrated.data);
  assert.equal(state.completed, true);
  assert.equal(state.historicalBestOutcome, "legacy_correct_unknown_support");
  assert.equal(state.currentVersionCompleted, false);
  assert.equal(state.correctWithoutSolution, false);
});

test("V1 incorrect-only history keeps legacy completion and review", () => {
  const migrated = migrateProgressPayload({ version: 1, data: { attempts: [{ ...base, isCorrect: false }] } }).payload;
  const state = getQuestionProgress(base.questionId, migrated.data);
  assert.equal(state.completed, true);
  assert.equal(state.reviewRecommended, true);
  assert.equal(state.historicalBestOutcome, "legacy_completed");
});

test("V1 incorrect then correct preserves sequence and historical ambiguity", () => {
  const migrated = migrateProgressPayload({ version: 1, data: { attempts: [
    { ...base, isCorrect: false },
    { ...base, isCorrect: true, attemptedAt: "2026-07-11T10:01:00.000Z" },
  ] } }).payload;
  assert.deepEqual(migrated.data.attempts.map((item) => item.sequence), [1, 2]);
  assert.equal(getQuestionProgress(base.questionId, migrated.data).historicalBestOutcome, "legacy_correct_unknown_support");
});

test("empty V1 and unversioned payloads migrate to empty V4", () => {
  const empty = { attempts: [], supportEvents: [], achievementSnapshots: [] };
  assert.deepEqual(migrateProgressPayload({ version: 1, data: { attempts: [] } }).payload.data, empty);
  assert.deepEqual(migrateProgressPayload([]).payload.data, empty);
});
