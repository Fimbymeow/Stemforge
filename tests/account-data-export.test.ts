import assert from "node:assert/strict";
import test from "node:test";
import {
  AccountExportBoundsError,
  MAX_ACCOUNT_EXPORT_RECORDS,
  buildAccountLearningDataExport,
  safeAccountExportFilename,
  type AccountExportRecord,
} from "../lib/account-data/export";
import { buildCurrentBrowserExport } from "../lib/account-data/browser-export";
import { PROGRESS_STORAGE_KEY } from "../lib/progress/storage";
import { EVIDENCE_PROVENANCE_KEY } from "../lib/progress/evidence-provenance";
import { PROGRESS_SYNC_METADATA_KEY } from "../lib/progress/sync-protocol";
import { attempt, supportEvent } from "./progress-fixtures";

test("remote account export is bounded, counted and digest-verifiable", () => {
  const records: AccountExportRecord[] = [
    { kind: "attempt", disposition: "accepted", eventId: "attempt_export", evidence: attempt({ eventId: "attempt_export" }), accountGeneration: "1", receiveCursor: "1", receivedAt: "2026-07-17T10:00:00.000Z" },
    { kind: "support_event", disposition: "accepted", eventId: "support_export", evidence: supportEvent({ eventId: "support_export" }), accountGeneration: "1", receiveCursor: "2", receivedAt: "2026-07-17T10:00:01.000Z" },
    { kind: "attempt", disposition: "conflict_retained", eventId: "attempt_export", evidence: attempt({ eventId: "attempt_export", answer: "retained" }), accountGeneration: "1", receiveCursor: "3", receivedAt: "2026-07-17T10:00:02.000Z" },
  ];
  const exported = buildAccountLearningDataExport(records, "2026-07-17T09:00:00.000Z", "2026-07-17T11:00:00.000Z");
  assert.deepEqual(exported.categoryCounts, { attempts: 1, supportEvents: 1, achievementSnapshots: 0, retainedConflicts: 1 });
  assert.equal(exported.integrity.algorithm, "SHA-256");
  assert.match(exported.integrity.canonicalDataDigest, /^[a-f0-9]{64}$/);
  assert.equal(buildAccountLearningDataExport(records, "2026-07-17T09:00:00.000Z", "2026-07-17T11:00:00.000Z").integrity.canonicalDataDigest, exported.integrity.canonicalDataDigest);
  assert.equal(safeAccountExportFilename(new Date("2026-07-17T12:34:56.000Z")), "stem-forge-account-data-2026-07-17.json");
  assert.throws(() => buildAccountLearningDataExport(Array.from({ length: MAX_ACCOUNT_EXPORT_RECORDS + 1 }, () => records[0]), "2026-07-17T09:00:00.000Z"), AccountExportBoundsError);
});

test("current browser export includes only local browser state and tolerates empty metadata", () => {
  const storage = memoryStorage(new Map([
    [PROGRESS_STORAGE_KEY, JSON.stringify({ version: 4, data: { attempts: [attempt({ eventId: "attempt_browser_export" })], supportEvents: [], achievementSnapshots: [] } })],
    [EVIDENCE_PROVENANCE_KEY, JSON.stringify({ version: 1, records: {} })],
    [PROGRESS_SYNC_METADATA_KEY, JSON.stringify({ version: 1, lastAssociatedAccountFingerprint: null, accounts: {} })],
  ]));
  const exported = buildCurrentBrowserExport(storage, "2026-07-17T12:00:00.000Z");
  assert.equal(exported.scope, "current_browser_only");
  assert.equal(exported.progress.data.attempts[0].eventId, "attempt_browser_export");
  assert.equal(exported.provenance.records["attempt:attempt_browser_export"].source, "legacy_unknown");
});

function memoryStorage(values: Map<string, string>): Storage {
  return {
    length: values.size,
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}
