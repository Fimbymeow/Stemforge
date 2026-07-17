import assert from "node:assert/strict";
import test from "node:test";
import { attempt, supportEvent } from "./progress-fixtures";
import type { ProgressPayload } from "../lib/progress/types";
import {
  assignEvidenceProvenance,
  createDefaultEvidenceProvenance,
  evidenceProvenanceSummary,
  readEvidenceProvenance,
  referencesForAccount,
} from "../lib/progress/evidence-provenance";

const fingerprintA = "A".repeat(43);
const fingerprintB = "B".repeat(43);

test("missing provenance migrates existing evidence to deterministic unknown origin", () => {
  const source = payload();
  const first = readEvidenceProvenance(null, source);
  const second = readEvidenceProvenance(null, source);
  assert.equal(first.status, "migrated_missing");
  assert.deepEqual(first, second);
  assert.deepEqual(first.metadata.records["attempt:attempt_a"], {
    source: "legacy_unknown",
    accountFingerprint: null,
    firstObservedAt: "2026-07-12T10:00:00.000Z",
  });
});

test("anonymous, associated and pulled provenance remain separately attributable", () => {
  const source = payload();
  let metadata = createDefaultEvidenceProvenance();
  metadata = assignEvidenceProvenance(metadata, source, ["attempt:attempt_a"], "local_anonymous", null);
  metadata = assignEvidenceProvenance(metadata, source, ["support_event:support_a"], "local_associated", fingerprintA);
  metadata = assignEvidenceProvenance(metadata, source, ["attempt:attempt_b"], "remote_pull", fingerprintB);
  assert.deepEqual([...referencesForAccount(metadata, fingerprintA)], ["support_event:support_a"]);
  assert.deepEqual(evidenceProvenanceSummary(metadata, source, fingerprintA), {
    total: 3,
    anonymous: 1,
    legacyUnknown: 0,
    currentAccount: 1,
    otherAccounts: 1,
    remotePulledForCurrentAccount: 0,
  });
});

test("malformed provenance recovers conservatively and future versions fail closed", () => {
  assert.equal(readEvidenceProvenance("broken", payload()).status, "recovered_malformed");
  const future = readEvidenceProvenance(JSON.stringify({ version: 2, records: {} }), payload());
  assert.equal(future.status, "unsupported_future");
  assert.equal(Object.values(future.metadata.records).every((entry) => entry.source === "legacy_unknown"), true);
});

function payload(): ProgressPayload {
  return { version: 4, data: {
    attempts: [attempt({ eventId: "attempt_a" }), attempt({ eventId: "attempt_b", attemptedAt: "2026-07-12T10:02:00.000Z" })],
    supportEvents: [supportEvent({ eventId: "support_a" })],
    achievementSnapshots: [],
  } };
}
