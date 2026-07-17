import { CELEBRATION_STORAGE_KEY } from "@/lib/completion-tracking";
import { PROGRESS_IMPORT_METADATA_KEY, readProgressImportMetadata } from "@/lib/progress/import-metadata";
import { LocalStorageProgressStorage } from "@/lib/progress/storage";
import { EVIDENCE_PROVENANCE_KEY, readEvidenceProvenance } from "@/lib/progress/evidence-provenance";
import { PROGRESS_SYNC_METADATA_KEY, readProgressSyncMetadata } from "@/lib/progress/sync-metadata";

export function buildCurrentBrowserExport(storage: Storage, generatedAt = new Date().toISOString()) {
  const progress = new LocalStorageProgressStorage(storage).load();
  if (progress.status === "unsupported-version" || progress.status === "unavailable") throw new Error("Browser progress cannot be safely exported.");
  const provenance = readEvidenceProvenance(storage.getItem(EVIDENCE_PROVENANCE_KEY), progress.payload);
  if (provenance.status === "unsupported_future") throw new Error("Browser provenance uses a newer format.");
  return {
    schemaVersion: 1,
    generatedAt,
    scope: "current_browser_only",
    scopeDescription: "This file contains only progress and account-related information stored by STEM Forge in this browser.",
    progress: progress.payload,
    provenance: provenance.metadata,
    importMetadata: readProgressImportMetadata(storage.getItem(PROGRESS_IMPORT_METADATA_KEY)),
    syncMetadata: readProgressSyncMetadata(storage.getItem(PROGRESS_SYNC_METADATA_KEY), storage.getItem(PROGRESS_IMPORT_METADATA_KEY)),
    celebrationState: safeJson(storage.getItem(CELEBRATION_STORAGE_KEY)),
  };
}

export function downloadCurrentBrowserExport(storage: Storage, now = new Date()) {
  const contents = JSON.stringify(buildCurrentBrowserExport(storage, now.toISOString()), null, 2);
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `stem-forge-browser-data-${now.toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeJson(raw: string | null) {
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}
