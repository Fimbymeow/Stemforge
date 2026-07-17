import { PROGRESS_IMPORT_METADATA_KEY } from "@/lib/progress/import-metadata";
import { readProgressImportMetadata } from "@/lib/progress/import-metadata";
import { CELEBRATION_STORAGE_KEY } from "@/lib/completion-tracking";
import { mergeProgressEvidence } from "@/lib/progress/merge";
import { createBrowserProgressStorage, PROGRESS_STORAGE_KEY } from "@/lib/progress/storage";
import {
  EVIDENCE_PROVENANCE_KEY,
  assignEvidenceProvenance,
  evidenceProvenanceSummary,
  evidenceReferences,
  getActiveBrowserAccountFingerprint,
  readEvidenceProvenance,
  reconcileEvidenceProvenance,
} from "@/lib/progress/evidence-provenance";
import {
  clearAllBrowserProgressState,
  commitVerifiedStorageChanges,
  removeAccountAssociation,
  removeAccountProgressFromBrowser,
  type BrowserProgressDataState,
} from "@/lib/progress/browser-data-controls";
import {
  PROGRESS_SYNC_METADATA_KEY,
  mergeProgressSyncPullResponse,
  readProgressSyncMetadata,
  type ProgressSyncMetadata,
} from "@/lib/progress/sync-metadata";
import { progressSyncEventsToPayload, type ProgressSyncPullResponse } from "@/lib/progress/sync-protocol";
import type { ProgressPayload } from "@/lib/progress/types";

const PROGRESS_LOCK_NAME = "stemforge-local-progress-v1";
const LEASE_DATABASE = "stemforge-progress-coordination";
const LEASE_STORE = "locks";
const LEASE_DURATION_MS = 10_000;
let sameTabQueue: Promise<void> = Promise.resolve();

export class ProgressCoordinationUnavailableError extends Error {
  constructor() {
    super("Cross-tab progress coordination is unavailable in this browser.");
  }
}

export function withLocalProgressTransaction<T>(operation: () => Promise<T> | T, requireCrossTab = false): Promise<T> {
  const run = sameTabQueue.then(() => runCoordinated(operation, requireCrossTab));
  sameTabQueue = run.then(() => undefined, () => undefined);
  return run;
}

export function updateProgressSyncMetadata(
  mutate: (metadata: ProgressSyncMetadata) => ProgressSyncMetadata,
  requireCrossTab = true,
) {
  return withLocalProgressTransaction(() => {
    const metadata = readCurrentSyncMetadata();
    const next = mutate(metadata);
    window.localStorage.setItem(PROGRESS_SYNC_METADATA_KEY, JSON.stringify(next));
    notifySyncMetadataUpdated();
    return next;
  }, requireCrossTab);
}

export function applyProgressSyncPullPage(response: ProgressSyncPullResponse) {
  return withLocalProgressTransaction(() => {
    const storage = createBrowserProgressStorage();
    const loaded = storage.load();
    if (loaded.status === "unsupported-version" || loaded.status === "unavailable") {
      throw new Error("Browser progress cannot be safely updated.");
    }
    const beforeReferences = evidenceReferences(loaded.payload);
    const provenanceRead = readEvidenceProvenance(window.localStorage.getItem(EVIDENCE_PROVENANCE_KEY), loaded.payload);
    if (provenanceRead.status === "unsupported_future") throw new Error("Browser evidence provenance uses a newer format.");
    const pulled = progressSyncEventsToPayload(response.events);
    const merged = mergeProgressEvidence(loaded.payload, pulled);
    if (!storage.save(merged.payload)) throw new Error("Browser progress could not be saved.");

    const verified = storage.load();
    if (verified.status === "unsupported-version" || verified.status === "unavailable") {
      throw new Error("Browser progress could not be verified after synchronization.");
    }
    const expected = new Set(response.events.map((event) => `${event.kind}:${event.eventId}`));
    const present = new Set([
      ...verified.payload.data.attempts.map((item) => `attempt:${item.eventId}`),
      ...verified.payload.data.supportEvents.map((item) => `support_event:${item.eventId}`),
      ...verified.payload.data.achievementSnapshots.map((item) => `achievement_snapshot:${item.snapshotId}`),
    ]);
    for (const reference of expected) if (!present.has(reference)) throw new Error("Synchronized evidence was not durably stored.");

    const added = [...expected].filter((reference) => !beforeReferences.has(reference));
    const provenance = assignEvidenceProvenance(
      provenanceRead.metadata,
      verified.payload,
      added,
      "remote_pull",
      response.accountFingerprint,
    );
    writeVerified(EVIDENCE_PROVENANCE_KEY, JSON.stringify(provenance));

    const metadata = mergeProgressSyncPullResponse(readCurrentSyncMetadata(), response);
    writeVerified(PROGRESS_SYNC_METADATA_KEY, JSON.stringify(metadata));
    window.dispatchEvent(new CustomEvent("stemforge:local-progress-updated"));
    notifySyncMetadataUpdated();
    return { metadata, conflicts: merged.conflicts };
  }, true);
}

export function recordLocalEvidenceProvenance(before: ProgressPayload, after: ProgressPayload) {
  const beforeReferences = evidenceReferences(before);
  const added = [...evidenceReferences(after)].filter((reference) => !beforeReferences.has(reference));
  if (added.length === 0) return;
  const read = readEvidenceProvenance(window.localStorage.getItem(EVIDENCE_PROVENANCE_KEY), before);
  if (read.status === "unsupported_future") return;
  const activeFingerprint = getActiveBrowserAccountFingerprint();
  const sync = readCurrentSyncMetadata();
  const associated = activeFingerprint !== null &&
    sync.lastAssociatedAccountFingerprint === activeFingerprint &&
    sync.accounts[activeFingerprint]?.associationConfirmed === true;
  const metadata = assignEvidenceProvenance(
    read.metadata,
    after,
    added,
    associated ? "local_associated" : "local_anonymous",
    associated ? activeFingerprint : null,
  );
  writeVerified(EVIDENCE_PROVENANCE_KEY, JSON.stringify(metadata));
}

export function reconcileLocalEvidenceProvenance(payload: ProgressPayload) {
  const read = readEvidenceProvenance(window.localStorage.getItem(EVIDENCE_PROVENANCE_KEY), payload);
  if (read.status === "unsupported_future") return;
  writeVerified(EVIDENCE_PROVENANCE_KEY, JSON.stringify(reconcileEvidenceProvenance(read.metadata, payload)));
}

export type BrowserDataControlAction = "remove_association" | "remove_account_progress" | "clear_all";

export function runBrowserDataControl(action: BrowserDataControlAction, fingerprint: string | null) {
  return withLocalProgressTransaction(() => {
    const storage = createBrowserProgressStorage();
    const loaded = storage.load();
    if (loaded.status === "unsupported-version" || loaded.status === "unavailable") {
      throw new Error("Browser progress cannot be safely changed.");
    }
    const provenanceRead = readEvidenceProvenance(window.localStorage.getItem(EVIDENCE_PROVENANCE_KEY), loaded.payload);
    if (provenanceRead.status === "unsupported_future") throw new Error("Browser evidence provenance uses a newer format.");
    const state: BrowserProgressDataState = {
      payload: loaded.payload,
      provenance: provenanceRead.metadata,
      sync: readCurrentSyncMetadata(),
      imported: readProgressImportMetadata(window.localStorage.getItem(PROGRESS_IMPORT_METADATA_KEY)),
    };
    if (action !== "clear_all" && !fingerprint) throw new Error("A current account is required for this browser-data action.");
    const result = action === "clear_all"
      ? clearAllBrowserProgressState()
      : action === "remove_association"
        ? removeAccountAssociation(state, fingerprint!)
        : removeAccountProgressFromBrowser(state, fingerprint!);

    const changes = action === "clear_all"
      ? new Map<string, string | null>([
        [PROGRESS_STORAGE_KEY, null],
        [EVIDENCE_PROVENANCE_KEY, null],
        [PROGRESS_SYNC_METADATA_KEY, null],
        [PROGRESS_IMPORT_METADATA_KEY, null],
        [CELEBRATION_STORAGE_KEY, null],
      ])
      : new Map<string, string | null>([
        [PROGRESS_STORAGE_KEY, JSON.stringify(result.payload)],
        [EVIDENCE_PROVENANCE_KEY, JSON.stringify(result.provenance)],
        [PROGRESS_SYNC_METADATA_KEY, JSON.stringify(result.sync)],
        [PROGRESS_IMPORT_METADATA_KEY, JSON.stringify(result.imported)],
      ]);
    commitVerifiedStorageChanges(window.localStorage, changes);
    notifyBrowserDataUpdated();
    return result;
  }, true);
}

export function inspectBrowserProgressData(fingerprint: string | null) {
  const storage = createBrowserProgressStorage();
  const loaded = storage.load();
  const provenance = readEvidenceProvenance(window.localStorage.getItem(EVIDENCE_PROVENANCE_KEY), loaded.payload);
  return {
    loadStatus: loaded.status,
    provenanceStatus: provenance.status,
    summary: evidenceProvenanceSummary(provenance.metadata, loaded.payload, fingerprint),
  };
}

async function runCoordinated<T>(operation: () => Promise<T> | T, requireCrossTab: boolean): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(PROGRESS_LOCK_NAME, { mode: "exclusive" }, operation);
  }
  if (typeof indexedDB !== "undefined") return withIndexedDbLease(operation);
  if (requireCrossTab) throw new ProgressCoordinationUnavailableError();
  return operation();
}

async function withIndexedDbLease<T>(operation: () => Promise<T> | T) {
  const database = await openLeaseDatabase();
  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  try {
    let acquired = false;
    for (let attempt = 0; attempt < 40 && !acquired; attempt += 1) {
      acquired = await tryAcquireLease(database, token);
      if (!acquired) await delay(20 + Math.floor(Math.random() * 30));
    }
    if (!acquired) throw new ProgressCoordinationUnavailableError();
    return await operation();
  } finally {
    await releaseLease(database, token).catch(() => undefined);
    database.close();
  }
}

function openLeaseDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(LEASE_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LEASE_STORE)) request.result.createObjectStore(LEASE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new ProgressCoordinationUnavailableError());
    request.onblocked = () => reject(new ProgressCoordinationUnavailableError());
  });
}

function tryAcquireLease(database: IDBDatabase, token: string) {
  return new Promise<boolean>((resolve, reject) => {
    const transaction = database.transaction(LEASE_STORE, "readwrite");
    const store = transaction.objectStore(LEASE_STORE);
    let acquired = false;
    const request = store.get(PROGRESS_LOCK_NAME);
    request.onsuccess = () => {
      const current = request.result as { token?: string; expiresAt?: number } | undefined;
      if (!current || typeof current.expiresAt !== "number" || current.expiresAt <= Date.now()) {
        store.put({ token, expiresAt: Date.now() + LEASE_DURATION_MS }, PROGRESS_LOCK_NAME);
        acquired = true;
      }
    };
    transaction.oncomplete = () => resolve(acquired);
    transaction.onerror = () => reject(transaction.error ?? new ProgressCoordinationUnavailableError());
    transaction.onabort = () => reject(transaction.error ?? new ProgressCoordinationUnavailableError());
  });
}

function releaseLease(database: IDBDatabase, token: string) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(LEASE_STORE, "readwrite");
    const store = transaction.objectStore(LEASE_STORE);
    const request = store.get(PROGRESS_LOCK_NAME);
    request.onsuccess = () => {
      if ((request.result as { token?: string } | undefined)?.token === token) store.delete(PROGRESS_LOCK_NAME);
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function readCurrentSyncMetadata() {
  return readProgressSyncMetadata(
    window.localStorage.getItem(PROGRESS_SYNC_METADATA_KEY),
    window.localStorage.getItem(PROGRESS_IMPORT_METADATA_KEY),
  );
}

function notifySyncMetadataUpdated() {
  window.dispatchEvent(new CustomEvent("stemforge:progress-sync-updated"));
}

function notifyBrowserDataUpdated() {
  window.dispatchEvent(new CustomEvent("stemforge:local-progress-updated"));
  window.dispatchEvent(new CustomEvent("stemforge:progress-import-updated"));
  notifySyncMetadataUpdated();
}

function writeVerified(key: string, value: string) {
  window.localStorage.setItem(key, value);
  if (window.localStorage.getItem(key) !== value) throw new Error(`Browser storage verification failed for ${key}.`);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
