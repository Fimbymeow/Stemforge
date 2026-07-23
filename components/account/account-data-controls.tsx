"use client";

import { useRef, useState } from "react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";

type Confirmation = "association" | "account_progress" | "all_progress" | null;

export function AccountDataControls() {
  const sync = useProgressSync();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const data = sync.diagnostics.browserData;

  useModalFocusTrap({
    open: confirmation !== null,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onClose: () => setConfirmation(null),
  });

  async function perform(action: Exclude<Confirmation, null>) {
    setBusy(true);
    setMessage(null);
    try {
      if (action === "association") {
        await sync.removeAssociation();
        setMessage("This browser is no longer linked for sync. Your progress on this browser is unchanged.");
      } else if (action === "account_progress") {
        const removed = await sync.removeCurrentAccountData();
        setMessage(`${removed} item${removed === 1 ? " was" : "s were"} removed from this browser. Progress that might belong to another account, or whose origin isn't known, was left alone to avoid deleting anything by mistake.`);
      } else {
        await sync.clearAllBrowserProgress();
        setMessage("All STEM Forge progress and account information was cleared from this browser. Your account's progress, already kept in sync, was not deleted.");
      }
      setConfirmation(null);
    } catch {
      setMessage("This browser change couldn't be confirmed, so we're not claiming it worked. Please try again, or leave the data on this browser for now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section data-testid="account-data-controls" className="mt-5 rounded-xl border border-line bg-white p-4">
      <h2 className="m-0 text-lg font-extrabold">This browser</h2>
      <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Anyone using this browser may be able to see progress stored here.</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Anonymous progress" value={data.anonymous} />
        <Metric label="Current account" value={data.currentAccount} />
        <Metric label="Other accounts" value={data.otherAccounts} />
        <Metric label="Not linked to an account" value={data.legacyUnknown} />
      </dl>
      {sync.diagnostics.provenanceStatus === "unsupported_future" ? (
        <p className="mb-0 mt-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm">This browser&apos;s data is in a newer format than this version supports. Removal buttons are turned off to avoid losing progress.</p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <button type="button" className={secondaryButton} onClick={() => setConfirmation("association")}>{"Remove this account's sync information from this browser"}</button>
        <button type="button" className={dangerButton} onClick={() => setConfirmation("account_progress")}>{"Remove this account's progress from this browser"}</button>
        <button type="button" className={dangerButton} onClick={() => setConfirmation("all_progress")}>Clear all STEM Forge progress from this browser</button>
      </div>

      {confirmation ? (
        <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="browser-data-confirmation-title" className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-4">
          <h3 id="browser-data-confirmation-title" className="m-0 text-base font-extrabold">Confirm browser-only removal</h3>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-ink">{confirmationCopy(confirmation)}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className={dangerSolidButton} disabled={busy} onClick={() => void perform(confirmation)}>Confirm removal</button>
            <button ref={cancelRef} type="button" className={secondaryButton} disabled={busy} onClick={() => setConfirmation(null)}>Cancel</button>
          </div>
        </div>
      ) : null}
      {message ? <p role="status" className="mb-0 mt-4 rounded-lg border border-line bg-paper p-3 text-sm leading-relaxed">{message}</p> : null}

      <p className="mb-0 mt-4 text-xs leading-relaxed text-muted">Removing browser data does not remove account data stored by STEM Forge or progress on other devices.</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-line bg-paper p-3"><dt className="text-xs font-bold text-muted">{label}</dt><dd className="m-0 mt-1 text-lg font-extrabold">{value}</dd></div>;
}

function confirmationCopy(action: Exclude<Confirmation, null>) {
  if (action === "association") return "This turns off sync for this account on this browser. Your progress stays on this browser, and nothing is deleted from your account.";
  if (action === "account_progress") return "This removes progress on this browser that belongs to this account. Progress that might belong to someone else, or whose origin isn't known, is left alone. It does not delete progress stored in your account or on other devices.";
  return "This clears all STEM Forge progress and account information from this browser, including anything already added to or kept in sync with your account. Your account's own progress is not deleted.";
}

const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-4 text-sm font-extrabold text-ink";
const dangerButton = "min-h-11 w-full rounded-md border border-danger/40 bg-white px-4 text-sm font-extrabold text-danger";
const dangerSolidButton = "min-h-11 w-full rounded-md bg-danger px-4 text-sm font-extrabold text-white disabled:opacity-60";
