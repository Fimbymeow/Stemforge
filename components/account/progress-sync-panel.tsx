"use client";

import { useProgressSync } from "@/components/progress-sync-provider";
import { syncStatusLabel } from "@/components/progress-sync-status";

export function ProgressSyncPanel({ accountFingerprint }: { accountFingerprint: string }) {
  const sync = useProgressSync();
  const ready = sync.accountFingerprint === accountFingerprint;
  const associationRequired = sync.status === "association_required";
  const paused = sync.status === "paused";
  const details = sync.diagnostics;

  return (
    <section data-testid="progress-sync-panel" className="mt-5 rounded-xl border border-line bg-paper p-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold">Keep progress updated across devices</h2>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">
            {!ready ? "Checking sync status..." : copyForStatus(sync.status, sync.pendingCount)}
          </p>
        </div>
        {ready ? <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-muted">{syncStatusLabel(sync.status)}</span> : null}
      </div>

      {sync.differentAccount ? (
        <p className="mb-0 mt-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm leading-relaxed text-ink">
          This browser has progress from a different account. Review your browser data below before turning on sync.
        </p>
      ) : null}
      {associationRequired && ready ? (
        <p className="mb-0 mt-3 text-sm leading-relaxed text-muted">
          This is a separate choice from importing. Turning it on sends eligible progress from this browser to your account and brings supported account progress to this browser. Existing progress is retained.
        </p>
      ) : null}

      {ready && (sync.pendingCount > 0 || details.lastFullyCaughtUpAt) ? (
        <div className="mt-4 grid gap-2 text-sm">
          {sync.pendingCount > 0 ? <p className="m-0 font-semibold">{sync.pendingCount} local change{sync.pendingCount === 1 ? "" : "s"} waiting to be protected.</p> : null}
          {details.lastFullyCaughtUpAt ? <p className="m-0 text-muted">Last fully updated {formatTimestamp(details.lastFullyCaughtUpAt)}.</p> : null}
        </div>
      ) : null}

      {details.permanentlyRejectedCount > 0 ? (
        <p className="mb-0 mt-3 text-xs leading-relaxed text-muted">
          Some saved progress needs attention and will remain on this browser. Nothing has been deleted.
        </p>
      ) : null}

      {ready ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {associationRequired ? (
            <button className={primaryButton} onClick={() => void sync.confirmAssociation()}>Turn on cross-device sync</button>
          ) : paused ? (
            <button className={primaryButton} onClick={() => void sync.resume()}>Resume sync</button>
          ) : (
            <button className={primaryButton} onClick={() => void sync.syncNow()} disabled={sync.status === "syncing"}>Sync now</button>
          )}
          {!associationRequired && !paused ? <button className={secondaryButton} onClick={() => void sync.pause()}>Pause sync</button> : null}
        </div>
      ) : null}
    </section>
  );
}

function copyForStatus(status: ReturnType<typeof useProgressSync>["status"], pending: number) {
  if (status === "syncing") return "Syncing your progress... You can keep learning while this happens.";
  if (status === "caught_up") return "Supported progress on this browser and your account is up to date.";
  if (status === "pending_upload") return `${pending} change${pending === 1 ? "" : "s"} waiting to sync.`;
  if (status === "offline") return "Offline - progress is still being saved on this browser.";
  if (status === "temporary_error") return "Progress could not sync just now. Your browser progress is safe.";
  if (status === "authentication_required") return "Sign in again to continue syncing. Your browser progress is safe.";
  if (status === "cleanup_required") return "This browser has older account progress to review before sync can continue.";
  if (status === "paused") return "Sync is paused. Progress is still being saved on this browser.";
  if (status === "association_required") return "Confirm before this browser sends or receives account progress.";
  return "Progress is saved on this browser.";
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not yet";
}

const primaryButton = "min-h-11 w-full rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-60";
const secondaryButton = "min-h-11 w-full rounded-lg border border-ink bg-white px-5 text-sm font-extrabold text-ink";
