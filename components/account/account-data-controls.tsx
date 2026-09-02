"use client";

import { useRef, useState } from "react";
import { DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui";
import { useProgressSync } from "@/components/progress-sync-provider";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { clearGuestLearnerPreferences } from "@/lib/learner-preferences";
import { clearStudyPlanLocalState } from "@/lib/study-plan/local-state";
import { ACCOUNT_STATE_SYNC_STORAGE_KEY, clearAssociatedAccountState } from "@/lib/account-state/client-state";
import { clearOnboardingState } from "@/lib/onboarding";

type Confirmation = "association" | "account_progress" | "all_progress" | null;

export function AccountDataControls({ mode }: { mode: "management" | "danger" }) {
  const sync = useProgressSync();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const data = sync.diagnostics.browserData;

  useModalFocusTrap({ open: confirmation !== null, containerRef: dialogRef, initialFocusRef: cancelRef, onClose: () => setConfirmation(null) });

  async function perform(action: Exclude<Confirmation, null>) {
    setBusy(true);
    setMessage(null);
    try {
      if (action === "association") {
        await sync.removeAssociation();
        setMessage("This browser is no longer linked for sync. Your progress on this browser is unchanged.");
      } else if (action === "account_progress") {
        const removed = await sync.removeCurrentAccountData();
        if (sync.accountFingerprint && !clearAssociatedAccountState(window.localStorage, sync.accountFingerprint)) throw new Error("account_state_clear_failed");
        setMessage(`${removed} item${removed === 1 ? " was" : "s were"} removed from this browser. Progress that might belong to another account, or whose origin isn't known, was left alone to avoid deleting anything by mistake.`);
      } else {
        await sync.clearAllBrowserProgress();
        if (!clearGuestLearnerPreferences(window.localStorage)) throw new Error("preference_clear_failed");
        if (!clearStudyPlanLocalState(window.localStorage)) throw new Error("study_plan_clear_failed");
        if (!clearOnboardingState(window.localStorage)) throw new Error("onboarding_clear_failed");
        window.localStorage.removeItem("orthic.confidence.v1");
        window.localStorage.removeItem(ACCOUNT_STATE_SYNC_STORAGE_KEY);
        setMessage("All Orthic progress and account information was cleared from this browser. Your account's progress, already kept in sync, was not deleted.");
      }
      setConfirmation(null);
    } catch {
      setMessage("This browser change couldn't be confirmed, so we're not claiming it worked. Please try again, or leave the data on this browser for now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section data-testid={mode === "management" ? "account-data-controls" : "account-data-danger-controls"} className="p-4 sm:p-5">
      {mode === "management" ? <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-sm font-extrabold">This browser</h3>
            <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">Anyone using this browser may be able to see progress stored here.</p>
          </div>
          <Button variant="secondary" className="shrink-0" onClick={() => setConfirmation("association")}>Remove sync information</Button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <Metric label="Guest learning" value={data.anonymous} />
          <Metric label="This account" value={data.currentAccount} />
          <Metric label="Another account" value={data.otherAccounts} />
          <Metric label="Older learning" value={data.legacyUnknown} />
        </dl>
        {sync.diagnostics.provenanceStatus === "unsupported_future" ? <p className="mb-0 mt-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm">This browser&apos;s data is in a newer format than this version supports. Removal buttons are turned off to avoid losing progress.</p> : null}
      </> : <>
        <h3 className="m-0 text-sm font-extrabold text-danger">Browser learning data</h3>
        <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">Remove this account&apos;s local copies, or clear every Orthic record from this browser. Account data stored by Orthic is not deleted.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" className="border-danger/40 text-danger" onClick={() => setConfirmation("account_progress")}>Remove this account&apos;s progress</Button>
          <Button variant="destructive" onClick={() => setConfirmation("all_progress")}>Clear all Orthic progress from this browser</Button>
        </div>
      </>}

      {message ? <p role="status" className="mb-0 mt-4 rounded-lg bg-paper p-3 text-sm leading-relaxed">{message}</p> : null}
      {confirmation ? <DialogShell ref={dialogRef} role="alertdialog" labelledBy="browser-data-confirmation-title" describedBy="browser-data-confirmation-description" size="sm">
        <h2 id="browser-data-confirmation-title" className="m-0 text-xl font-extrabold">Confirm browser-only removal</h2>
        <p id="browser-data-confirmation-description" className="mb-0 mt-3 text-sm leading-relaxed text-muted">{confirmationCopy(confirmation)}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void perform(confirmation)}>Confirm removal</Button>
        </div>
      </DialogShell> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="min-w-0"><dt className="text-xs font-bold text-muted">{label}</dt><dd className="m-0 mt-1 text-base font-extrabold">{value}</dd></div>;
}

function confirmationCopy(action: Exclude<Confirmation, null>) {
  if (action === "association") return "This turns off sync for this account on this browser. Your progress stays on this browser, and nothing is deleted from your account.";
  if (action === "account_progress") return "This removes progress on this browser that belongs to this account. Progress that might belong to someone else, or whose origin isn't known, is left alone. It does not delete progress stored in your account or on other devices.";
  return "This clears all Orthic progress and account information from this browser, including anything already added to or kept in sync with your account. Your account's own progress is not deleted.";
}
