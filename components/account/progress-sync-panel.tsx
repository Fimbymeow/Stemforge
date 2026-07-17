"use client";

import { useProgressSync } from "@/components/progress-sync-provider";

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
          <h2 className="m-0 text-lg font-extrabold">Synchronization</h2>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">
            {!ready ? "Checking synchronization availability..." : copyForStatus(sync.status, sync.pendingCount)}
          </p>
        </div>
        {ready ? <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-muted">{statusLabel(sync.status)}</span> : null}
      </div>

      {sync.differentAccount ? (
        <p className="mb-0 mt-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm leading-relaxed text-ink">
          This browser contains progress associated with another account. Review the browser data before enabling sync.
        </p>
      ) : null}
      {associationRequired && ready ? (
        <p className="mb-0 mt-3 text-sm leading-relaxed text-muted">
          Enabling sync adds browser evidence to this account and stores account evidence on this browser. Anyone using this browser may be able to see progress stored here.
        </p>
      ) : null}

      {ready ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Waiting to upload" value={String(sync.pendingCount)} />
          <Metric label="Needs attention" value={String(details.permanentlyRejectedCount)} />
          <Metric label="Last upload" value={formatTimestamp(details.lastSuccessfulPushAt)} />
          <Metric label="Last download" value={formatTimestamp(details.lastSuccessfulPullAt)} />
          <Metric label="Last fully caught up" value={formatTimestamp(details.lastFullyCaughtUpAt)} />
          <Metric label="Browser coordination" value={details.coordination === "web_locks" ? "Available" : details.coordination === "indexeddb" ? "Compatibility mode" : "Unavailable"} />
        </dl>
      ) : null}

      {details.permanentlyRejectedCount > 0 ? (
        <p className="mb-0 mt-3 text-xs leading-relaxed text-muted">
          {details.permanentlyRejectedCount} saved record{details.permanentlyRejectedCount === 1 ? " needs" : "s need"} attention and will not retry unless its content changes. Nothing has been deleted.
        </p>
      ) : null}
      {details.nextRetryAt ? <p className="mb-0 mt-2 text-xs text-muted">Next automatic retry {formatTimestamp(details.nextRetryAt)}.</p> : null}

      {ready ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {associationRequired ? (
            <button className={primaryButton} onClick={() => void sync.confirmAssociation()}>Enable synchronization</button>
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

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-line bg-white p-3"><dt className="text-xs font-bold text-muted">{label}</dt><dd className="m-0 mt-1 font-bold text-ink">{value}</dd></div>;
}

function copyForStatus(status: ReturnType<typeof useProgressSync>["status"], pending: number) {
  if (status === "syncing") return "Synchronizing progress... Learning remains available.";
  if (status === "caught_up") return "Progress on this browser can sync with your account.";
  if (status === "pending_upload") return `${pending} saved evidence record${pending === 1 ? " is" : "s are"} waiting to sync.`;
  if (status === "offline") return "Offline - progress is still being saved on this browser.";
  if (status === "temporary_error") return "Progress could not sync just now. Your browser progress is safe.";
  if (status === "authentication_required") return "Sign in again to continue syncing. Your browser progress is safe.";
  if (status === "cleanup_required") return "This browser has older account progress to review before synchronization can continue.";
  if (status === "paused") return "Sync is paused. Progress is still being saved on this browser.";
  if (status === "association_required") return "Confirm before this browser sends or receives account progress.";
  return "Progress is saved on this browser.";
}

function statusLabel(status: ReturnType<typeof useProgressSync>["status"]) {
  return status.replaceAll("_", " ").replace(/^./, (value) => value.toUpperCase());
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not yet";
}

const primaryButton = "min-h-11 w-full rounded-md bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-60";
const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-5 text-sm font-extrabold text-ink";
