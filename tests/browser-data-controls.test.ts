import assert from "node:assert/strict";
import test from "node:test";
import { attempt, supportEvent } from "./progress-fixtures";
import {
  clearAllBrowserProgressState,
  commitVerifiedStorageChanges,
  removeAccountAssociation,
  removeAccountProgressFromBrowser,
  type BrowserProgressDataState,
} from "../lib/progress/browser-data-controls";
import { assignEvidenceProvenance, createDefaultEvidenceProvenance } from "../lib/progress/evidence-provenance";
import { confirmProgressSyncAssociation, createDefaultProgressSyncMetadata } from "../lib/progress/sync-metadata";
import { createDefaultProgressImportMetadata } from "../lib/progress/import-metadata";

const fingerprintA = "A".repeat(43);
const fingerprintB = "B".repeat(43);

test("current-account removal preserves anonymous, unknown and other-account evidence", () => {
  const state = browserState();
  const result = removeAccountProgressFromBrowser(state, fingerprintA);
  assert.equal(result.removedEvidenceCount, 2);
  assert.deepEqual(result.payload.data.attempts.map((item) => item.eventId), ["anonymous", "other", "unknown"]);
  assert.equal(result.payload.data.supportEvents.length, 0);
  assert.equal(result.sync.accounts[fingerprintA], undefined);
  assert.ok(result.sync.accounts[fingerprintB]);
  assert.equal(result.imported.accounts[fingerprintA], undefined);
  assert.ok(result.imported.accounts[fingerprintB]);
});

test("removing association metadata never removes canonical evidence or provenance", () => {
  const state = browserState();
  const result = removeAccountAssociation(state, fingerprintA);
  assert.deepEqual(result.payload, state.payload);
  assert.deepEqual(result.provenance, state.provenance);
  assert.equal(result.sync.lastAssociatedAccountFingerprint, null);
  assert.equal(result.removedEvidenceCount, 0);
});

test("clear-all state has an exact empty progress and metadata scope", () => {
  const result = clearAllBrowserProgressState();
  assert.deepEqual(result.payload.data, { attempts: [], supportEvents: [], achievementSnapshots: [] });
  assert.deepEqual(result.provenance.records, {});
  assert.deepEqual(result.sync.accounts, {});
  assert.deepEqual(result.imported.accounts, {});
});

test("verified multi-key writes roll back earlier changes after a later failure", () => {
  const values = new Map<string, string | null>([["progress", "before"], ["sync", "before"]]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === "sync" && value === "after") throw new Error("simulated failure");
      values.set(key, value);
    },
    removeItem: (key: string) => { values.delete(key); },
  };
  assert.throws(() => commitVerifiedStorageChanges(storage, new Map([["progress", "after"], ["sync", "after"]])));
  assert.equal(values.get("progress"), "before");
  assert.equal(values.get("sync"), "before");
});

test("verified clear detects a lying storage implementation", () => {
  const storage = {
    getItem: () => "still-present",
    setItem: () => undefined,
    removeItem: () => undefined,
  };
  assert.throws(() => commitVerifiedStorageChanges(storage, new Map([["progress", null]])), /verification failed/);
});

function browserState(): BrowserProgressDataState {
  const payload = { version: 4 as const, data: {
    attempts: [
      attempt({ eventId: "anonymous" }),
      attempt({ eventId: "associated", attemptedAt: "2026-07-12T10:02:00.000Z" }),
      attempt({ eventId: "other", attemptedAt: "2026-07-12T10:03:00.000Z" }),
      attempt({ eventId: "unknown", attemptedAt: "2026-07-12T10:04:00.000Z" }),
    ],
    supportEvents: [supportEvent({ eventId: "pulled" })],
    achievementSnapshots: [],
  } };
  let provenance = createDefaultEvidenceProvenance();
  provenance = assignEvidenceProvenance(provenance, payload, ["attempt:anonymous"], "local_anonymous", null);
  provenance = assignEvidenceProvenance(provenance, payload, ["attempt:associated"], "local_associated", fingerprintA);
  provenance = assignEvidenceProvenance(provenance, payload, ["support_event:pulled"], "remote_pull", fingerprintA);
  provenance = assignEvidenceProvenance(provenance, payload, ["attempt:other"], "remote_pull", fingerprintB);
  let sync = confirmProgressSyncAssociation(createDefaultProgressSyncMetadata(), fingerprintA);
  sync.accounts[fingerprintB] = structuredClone(sync.accounts[fingerprintA]);
  const imported = createDefaultProgressImportMetadata();
  imported.lastAccountFingerprint = fingerprintA;
  imported.accounts[fingerprintA] = { acknowledged: {}, lastImportAt: null };
  imported.accounts[fingerprintB] = { acknowledged: {}, lastImportAt: null };
  return { payload, provenance, sync, imported };
}
