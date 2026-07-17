"use client";

import { useProgressSync } from "@/components/progress-sync-provider";

export function ProgressSyncPanel({ accountFingerprint }: { accountFingerprint: string }) {
  const sync = useProgressSync();
  const ready = sync.accountFingerprint === accountFingerprint;
  const associationRequired = sync.status === "association_required";
  const statusCopy = copyForStatus(sync.status, sync.pendingCount);

  return (
    <section data-testid="progress-sync-panel" className="mt-5 rounded-xl border border-line bg-paper p-4" aria-live="polite">
      <strong>Cross-device progress</strong>
      <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">
        {!ready ? "Checking synchronization availability…" : statusCopy}
      </p>
      {sync.differentAccount ? (
        <p className="mb-0 mt-2 text-xs leading-relaxed text-muted">
          This browser was last associated with a different account. Continue only if its saved progress should also be synchronized with this account.
        </p>
      ) : null}
      {associationRequired && ready ? (
        <p className="mb-0 mt-2 text-xs leading-relaxed text-muted">
          Enabling sync adds browser evidence to this account and stores account evidence on this browser. It remains here after sign-out.
        </p>
      ) : null}
      {sync.lastSuccessfulSyncAt ? <p className="mb-0 mt-2 text-xs text-muted">Last synchronized {new Date(sync.lastSuccessfulSyncAt).toLocaleString()}.</p> : null}
      {ready ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {associationRequired ? (
            <button className={primaryButton} onClick={() => void sync.confirmAssociation()}>Enable synchronization</button>
          ) : (
            <button className={primaryButton} onClick={() => void sync.syncNow()} disabled={sync.status === "syncing"}>Sync now</button>
          )}
          {!associationRequired ? <button className={secondaryButton} onClick={() => void sync.pause()}>Pause sync</button> : null}
        </div>
      ) : null}
    </section>
  );
}

function copyForStatus(status: ReturnType<typeof useProgressSync>["status"], pending: number) {
  if (status === "syncing") return "Synchronizing progress… Learning remains available.";
  if (status === "caught_up") return "Progress on this browser is synchronized with the account.";
  if (status === "pending_upload") return `${pending} saved evidence record${pending === 1 ? " is" : "s are"} waiting to synchronize.`;
  if (status === "offline") return "Offline — progress remains saved on this browser and will retry later.";
  if (status === "temporary_error") return "Progress could not synchronize just now. Your browser copy is safe.";
  if (status === "authentication_required") return "Sign in again to continue synchronization. Browser progress is still safe.";
  if (status === "paused") return "Synchronization is paused. Learning remains saved on this browser.";
  if (status === "association_required") return "Confirm before this browser sends or receives account progress.";
  return "Progress is saved on this browser.";
}

const primaryButton = "min-h-11 w-full rounded-md bg-forge px-5 text-sm font-extrabold uppercase text-white disabled:opacity-60";
const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-5 text-sm font-extrabold uppercase text-ink";
