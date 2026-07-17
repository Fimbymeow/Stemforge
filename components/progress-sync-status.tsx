"use client";

import { useProgressSync } from "@/components/progress-sync-provider";

export function ProgressSyncStatus() {
  const { status, pendingCount } = useProgressSync();
  if (status === "saved_locally" || status === "checking" || status === "caught_up") return null;
  const copy = status === "syncing" ? "Syncing"
    : status === "offline" ? "Offline — saved here"
      : status === "pending_upload" ? `${pendingCount} waiting to sync`
        : status === "association_required" ? "Sync confirmation needed"
          : status === "authentication_required" ? "Sign in to sync"
            : status === "paused" ? "Sync paused"
              : "Couldn’t sync — saved here";
  return <span data-testid="progress-sync-status" className="hidden rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted sm:inline-flex">{copy}</span>;
}
