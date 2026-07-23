"use client";

import { useProgressSync } from "@/components/progress-sync-provider";
import type { ProgressSyncStatus as SyncStatus } from "@/lib/progress/sync-metadata";

/**
 * Single source for sync-status display labels, used by both this topbar pill and the
 * account-page sync panel badge, so the same status never reads differently on two surfaces.
 */
export function syncStatusLabel(status: SyncStatus): string {
  switch (status) {
    case "checking": return "Checking sync";
    case "saved_locally": return "Saved on this browser";
    case "syncing": return "Syncing";
    case "caught_up": return "Synced";
    case "pending_upload": return "Waiting to sync";
    case "offline": return "Offline — saved here";
    case "association_required": return "Confirmation needed";
    case "authentication_required": return "Sign in to sync";
    case "cleanup_required": return "Needs review";
    case "paused": return "Sync paused";
    default: return "Couldn’t sync — saved here";
  }
}

export function ProgressSyncStatus() {
  const { status } = useProgressSync();
  if (status === "saved_locally" || status === "checking" || status === "caught_up" || status === "authentication_required") return null;
  return <span data-testid="progress-sync-status" className="hidden rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted sm:inline-flex">{syncStatusLabel(status)}</span>;
}
