import { PROGRESS_IMPORT_METADATA_KEY } from "@/lib/progress/import-metadata";
import { mergeProgressEvidence } from "@/lib/progress/merge";
import { createBrowserProgressStorage, PROGRESS_STORAGE_KEY } from "@/lib/progress/storage";
import {
  PROGRESS_SYNC_METADATA_KEY,
  mergeProgressSyncPullResponse,
  readProgressSyncMetadata,
  type ProgressSyncMetadata,
} from "@/lib/progress/sync-metadata";
import { progressSyncEventsToPayload, type ProgressSyncPullResponse } from "@/lib/progress/sync-protocol";

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

    const metadata = mergeProgressSyncPullResponse(readCurrentSyncMetadata(), response);
    window.localStorage.setItem(PROGRESS_SYNC_METADATA_KEY, JSON.stringify(metadata));
    window.dispatchEvent(new CustomEvent("stemforge:local-progress-updated"));
    notifySyncMetadataUpdated();
    return { metadata, conflicts: merged.conflicts };
  }, true);
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

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
