"use client";

import { useEffect, useRef, useState } from "react";
import { useProgressSync } from "@/components/progress-sync-provider";

type Confirmation = "association" | "account_progress" | "all_progress" | null;

export function AccountDataControls() {
  const sync = useProgressSync();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const data = sync.diagnostics.browserData;

  useEffect(() => {
    if (confirmation) cancelRef.current?.focus();
  }, [confirmation]);

  async function perform(action: Exclude<Confirmation, null>) {
    setBusy(true);
    setMessage(null);
    try {
      if (action === "association") {
        await sync.removeAssociation();
        setMessage("This browser is no longer associated for synchronization. Browser progress remains here.");
      } else if (action === "account_progress") {
        const removed = await sync.removeCurrentAccountData();
        setMessage(`${removed} safely attributable record${removed === 1 ? " was" : "s were"} removed from this browser. Remote account progress and conservative unknown-origin records were not deleted.`);
      } else {
        await sync.clearAllBrowserProgress();
        setMessage("All STEM Forge progress and account-sync information was cleared from this browser. Synced account progress was not deleted.");
      }
      setConfirmation(null);
    } catch {
      setMessage("The browser data change could not be verified, so completion was not claimed. Please try again or keep the data on this browser.");
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
        <Metric label="Unknown origin" value={data.legacyUnknown} />
      </dl>
      {sync.diagnostics.provenanceStatus === "unsupported_future" ? (
        <p className="mb-0 mt-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm">Browser data uses a newer safety format. Destructive controls are disabled to avoid losing progress.</p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <button type="button" className={secondaryButton} onClick={() => setConfirmation("association")}>{"Remove this account's sync information from this browser"}</button>
        <button type="button" className={dangerButton} onClick={() => setConfirmation("account_progress")}>{"Remove this account's progress from this browser"}</button>
        <button type="button" className={dangerButton} onClick={() => setConfirmation("all_progress")}>Clear all STEM Forge progress from this browser</button>
      </div>

      {confirmation ? (
        <div role="alertdialog" aria-modal="true" aria-labelledby="browser-data-confirmation-title" className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-4">
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
  if (action === "association") return "This removes this account's local sync cursor and acknowledgements. Learning progress remains on this browser and remote account progress is not deleted.";
  if (action === "account_progress") return "This removes locally stored progress safely attributable to this account from this browser. Anonymous, other-account and unknown-origin evidence is preserved. It does not delete progress stored in your account or on other devices.";
  return "This clears STEM Forge progress, sync/import information, provenance and completion acknowledgements from this browser. Synced account progress is not deleted.";
}

const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-4 text-sm font-extrabold text-ink";
const dangerButton = "min-h-11 w-full rounded-md border border-danger/40 bg-white px-4 text-sm font-extrabold text-danger";
const dangerSolidButton = "min-h-11 w-full rounded-md bg-danger px-4 text-sm font-extrabold text-white disabled:opacity-60";
