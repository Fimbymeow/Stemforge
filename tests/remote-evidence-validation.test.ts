import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJson, classifyEvidenceArrival } from "../lib/remote-evidence/canonical-json";
import {
  MAX_REMOTE_EVIDENCE_BATCH_BYTES,
  MAX_REMOTE_EVIDENCE_BATCH_ITEMS,
  validateOwnerId,
  validateRemoteEvidenceBatch,
} from "../lib/remote-evidence/validation";
import { assertSafeTestDatabaseUrl } from "../scripts/database/safety";
import { attempt, selfAssessment, supportEvent } from "./progress-fixtures";

const payload = (overrides: Record<string, unknown> = {}) => ({
  version: 5,
  data: { attempts: [attempt()], supportEvents: [supportEvent()], guidedSelfAssessments: [], achievementSnapshots: [], ...overrides },
});

test("remote validation accepts canonical V5 and unknown legacy version evidence", () => {
  const unknown = attempt({ eventId: "migrated_attempt_0_deadbeef", versionEvidence: { kind: "unknown_legacy", questionVersion: null }, legacyCompleted: true });
  const result = validateRemoteEvidenceBatch(payload({ attempts: [unknown] }));
  assert.equal(result.fatal, false);
  assert.deepEqual(result.rejected, []);
  assert.deepEqual(result.payload.data.attempts, [unknown]);
});

test("remote validation accepts legal new outcomes alongside legacy attempts", () => {
  const graded = attempt({ eventId: "new_graded", isCorrect: true, outcomeKind: "graded", strategy: "numeric", strategyVersion: 1 });
  const malformed = attempt({ eventId: "new_malformed", isCorrect: null, outcomeKind: "malformed", outcomeReason: "malformed_numeric", strategy: "numeric", strategyVersion: 1 });
  const unmarkable = attempt({ eventId: "new_unmarkable", isCorrect: null, outcomeKind: "unmarkable", outcomeReason: "expression_not_permitted", strategy: "numeric", strategyVersion: 1 });
  const guided = attempt({ eventId: "new_guided", isCorrect: null, outcomeKind: "guided_pending", strategy: "guided_self_check", strategyVersion: 1 });
  const legacy = attempt({ eventId: "legacy" });
  const result = validateRemoteEvidenceBatch(payload({ attempts: [graded, malformed, unmarkable, guided, legacy], supportEvents: [] }));
  assert.deepEqual(result.rejected, []);
  assert.deepEqual(result.payload.data.attempts, [graded, malformed, unmarkable, guided, legacy]);
});

test("remote validation rejects incomplete metadata, illegal reasons and unknown keys", () => {
  const missing = attempt({ eventId: "missing", outcomeKind: "graded", isCorrect: true });
  const illegal = attempt({ eventId: "illegal", outcomeKind: "graded", isCorrect: true, outcomeReason: "value_wrong", strategy: "numeric", strategyVersion: 1 });
  const futureStrategy = attempt({ eventId: "future_strategy", outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_numeric", strategy: "numeric", strategyVersion: 2 });
  const mismatchedReason = attempt({ eventId: "mismatched_reason", outcomeKind: "malformed", isCorrect: null, outcomeReason: "malformed_numeric", strategy: "polynomial_form", strategyVersion: 1 });
  const unknown = { ...attempt({ eventId: "unknown" }), surprise: true };
  const result = validateRemoteEvidenceBatch(payload({ attempts: [missing, illegal, futureStrategy, mismatchedReason, unknown], supportEvents: [] }));
  assert.equal(result.payload.data.attempts.length, 0);
  assert.equal(result.rejected.length, 5);
});

test("remote validation rejects malformed evidence item-by-item without discarding valid siblings", () => {
  const valid = attempt({ eventId: "attempt_valid" });
  const invalid = attempt({ eventId: "bad event id" });
  const result = validateRemoteEvidenceBatch(payload({ attempts: [valid, invalid], supportEvents: [] }));
  assert.deepEqual(result.payload.data.attempts, [valid]);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].eventId, "bad event id");
});

test("future and malformed payload shapes are rejected without migration", () => {
  assert.equal(validateRemoteEvidenceBatch({ version: 6, data: {} }).fatal, true);
  assert.equal(validateRemoteEvidenceBatch({ version: 4, data: { attempts: [] } }).fatal, true);
  assert.equal(validateRemoteEvidenceBatch({ ...payload(), unexpected: true }).fatal, true);
  assert.equal(validateRemoteEvidenceBatch(null).fatal, true);
});

test("known versions must be positive and timestamps must be canonical ISO strings", () => {
  const badVersion = attempt({ eventId: "attempt_bad_version", versionEvidence: { kind: "known", questionVersion: 0 } });
  const badTime = supportEvent({ eventId: "support_bad_time", occurredAt: "14 July 2026" });
  const result = validateRemoteEvidenceBatch(payload({ attempts: [badVersion], supportEvents: [badTime] }));
  assert.equal(result.payload.data.attempts.length, 0);
  assert.equal(result.payload.data.supportEvents.length, 0);
  assert.equal(result.rejected.length, 2);
});

test("guided self-assessment requires canonical session identity and accepts every outcome", () => {
  for (const outcome of ["confident", "unsure", "needs_review"] as const) {
    const result = validateRemoteEvidenceBatch(payload({ guidedSelfAssessments: [selfAssessment({ outcome })] }));
    assert.equal(result.fatal, false);
    assert.equal(result.rejected.length, 0);
  }
  const invalid = validateRemoteEvidenceBatch(payload({
    guidedSelfAssessments: [selfAssessment({ practiceSessionId: "" })],
  }));
  assert.equal(invalid.rejected[0]?.kind, "guided_self_assessment");
});

test("batch count and byte limits reject the complete unsafe batch", () => {
  const tooMany = Array.from({ length: MAX_REMOTE_EVIDENCE_BATCH_ITEMS + 1 }, (_, index) => attempt({ eventId: `attempt_${index}` }));
  assert.equal(validateRemoteEvidenceBatch(payload({ attempts: tooMany, supportEvents: [] })).fatal, true);
  const oversized = attempt({ eventId: "attempt_large", answer: "x".repeat(MAX_REMOTE_EVIDENCE_BATCH_BYTES) });
  assert.equal(validateRemoteEvidenceBatch(payload({ attempts: [oversized], supportEvents: [] })).fatal, true);
});

test("canonical JSON equality ignores object key order but detects semantic conflict", () => {
  assert.equal(canonicalJson({ b: 2, a: { d: 4, c: 3 } }), canonicalJson({ a: { c: 3, d: 4 }, b: 2 }));
  assert.equal(classifyEvidenceArrival({ eventId: "same", value: 1 }, { value: 1, eventId: "same" }), "duplicate");
  assert.equal(classifyEvidenceArrival({ eventId: "same", value: 1 }, { value: 2, eventId: "same" }), "conflict");
});

test("owner IDs are opaque, bounded and safe", () => {
  assert.equal(validateOwnerId("owner_opaque-123"), true);
  assert.equal(validateOwnerId(""), false);
  assert.equal(validateOwnerId("owner with spaces"), false);
  assert.equal(validateOwnerId("x".repeat(201)), false);
});

test("test database safety refuses development, production-like and non-test targets", () => {
  const safe = "postgresql://test:test@127.0.0.1:5432/stemforge_remote_test";
  assert.equal(assertSafeTestDatabaseUrl(safe, "postgresql://dev:dev@127.0.0.1:5432/stemforge_development"), safe);
  assert.throws(() => assertSafeTestDatabaseUrl(undefined));
  assert.throws(() => assertSafeTestDatabaseUrl(safe, safe));
  assert.throws(() => assertSafeTestDatabaseUrl("postgresql://x:x@127.0.0.1:5432/stemforge_development"));
  assert.throws(() => assertSafeTestDatabaseUrl("postgresql://x:x@database.example.com:5432/stemforge_test"));
});
