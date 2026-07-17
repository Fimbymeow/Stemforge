import { createDefaultProgressImportMetadata, type ProgressImportMetadata } from "@/lib/progress/import-metadata";
import { createDefaultProgressPayload } from "@/lib/progress/payload";
import {
  createDefaultEvidenceProvenance,
  reconcileEvidenceProvenance,
  referencesForAccount,
  referencesAcknowledgedInGeneration,
  type EvidenceProvenanceMetadata,
} from "@/lib/progress/evidence-provenance";
import { createDefaultProgressSyncMetadata, type ProgressSyncMetadata } from "@/lib/progress/sync-metadata";
import type { ProgressPayload } from "@/lib/progress/types";

export type BrowserDataStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type BrowserProgressDataState = {
  payload: ProgressPayload;
  provenance: EvidenceProvenanceMetadata;
  sync: ProgressSyncMetadata;
  imported: ProgressImportMetadata;
};

export type BrowserDataRemovalResult = BrowserProgressDataState & {
  removedEvidenceCount: number;
};

export type BrowserErasureReconciliationResult = BrowserDataRemovalResult & {
  preservedAnonymousCount: number;
  preservedUnknownCount: number;
};

export function removeAccountAssociation(
  state: BrowserProgressDataState,
  fingerprint: string,
): BrowserDataRemovalResult {
  return {
    ...state,
    sync: removeSyncAccount(state.sync, fingerprint),
    imported: removeImportAccount(state.imported, fingerprint),
    removedEvidenceCount: 0,
  };
}

export function removeAccountProgressFromBrowser(
  state: BrowserProgressDataState,
  fingerprint: string,
): BrowserDataRemovalResult {
  const attributable = referencesForAccount(state.provenance, fingerprint);
  const payload = filterPayload(state.payload, (reference) => !attributable.has(reference));
  return {
    payload,
    provenance: reconcileEvidenceProvenance(state.provenance, payload),
    sync: removeSyncAccount(state.sync, fingerprint),
    imported: removeImportAccount(state.imported, fingerprint),
    removedEvidenceCount: attributable.size,
  };
}

export function clearAllBrowserProgressState(): BrowserDataRemovalResult {
  return {
    payload: createDefaultProgressPayload(),
    provenance: createDefaultEvidenceProvenance(),
    sync: createDefaultProgressSyncMetadata(),
    imported: createDefaultProgressImportMetadata(),
    removedEvidenceCount: 0,
  };
}

export function reconcileBrowserAfterRemoteErasure(
  state: BrowserProgressDataState,
  fingerprint: string,
  erasedGeneration: string,
): BrowserErasureReconciliationResult {
  const removable = referencesAcknowledgedInGeneration(state.provenance, fingerprint, erasedGeneration);
  const payload = filterPayload(state.payload, (reference) => !removable.has(reference));
  const provenance = reconcileEvidenceProvenance(state.provenance, payload);
  const preserved = Object.values(provenance.records);
  return {
    payload,
    provenance,
    sync: removeSyncAccount(state.sync, fingerprint),
    imported: removeImportAccount(state.imported, fingerprint),
    removedEvidenceCount: removable.size,
    preservedAnonymousCount: preserved.filter((entry) => entry.source === "local_anonymous" && !entry.acknowledgedAccountFingerprint).length,
    preservedUnknownCount: preserved.filter((entry) => entry.source === "legacy_unknown").length,
  };
}

export function commitVerifiedStorageChanges(storage: BrowserDataStorage, changes: Map<string, string | null>) {
  const originals = new Map<string, string | null>();
  for (const key of changes.keys()) originals.set(key, storage.getItem(key));
  try {
    for (const [key, value] of changes) {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
      if (storage.getItem(key) !== value) throw new Error(`Browser storage verification failed for ${key}.`);
    }
  } catch (error) {
    for (const [key, value] of originals) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // The original failure remains authoritative; recovery is best-effort.
      }
    }
    throw error;
  }
}

function removeSyncAccount(metadata: ProgressSyncMetadata, fingerprint: string) {
  const next = structuredClone(metadata);
  delete next.accounts[fingerprint];
  if (next.lastAssociatedAccountFingerprint === fingerprint) next.lastAssociatedAccountFingerprint = null;
  return next;
}

function removeImportAccount(metadata: ProgressImportMetadata, fingerprint: string) {
  const next = structuredClone(metadata);
  delete next.accounts[fingerprint];
  if (next.lastAccountFingerprint === fingerprint) next.lastAccountFingerprint = null;
  return next;
}

function filterPayload(payload: ProgressPayload, keep: (reference: string) => boolean): ProgressPayload {
  return {
    version: 4,
    data: {
      attempts: payload.data.attempts.filter((item) => keep(`attempt:${item.eventId}`)),
      supportEvents: payload.data.supportEvents.filter((item) => keep(`support_event:${item.eventId}`)),
      achievementSnapshots: payload.data.achievementSnapshots.filter((item) => keep(`achievement_snapshot:${item.snapshotId}`)),
    },
  };
}
