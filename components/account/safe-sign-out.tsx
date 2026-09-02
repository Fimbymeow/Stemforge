"use client";

import { useRef, useState } from "react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { clearAssociatedAccountState } from "@/lib/account-state/client-state";
import { DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui";

export function SafeSignOut({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const sync = useProgressSync();
  const nextAction = useLearnerNextAction();
  const formRef = useRef<HTMLFormElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useModalFocusTrap({
    open: confirmRemove,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onClose: () => setConfirmRemove(false),
  });

  async function submit(removeAccountData: boolean) {
    setBusy(true);
    setError(null);
    try {
      await sync.prepareForSignOut(removeAccountData);
      if (removeAccountData && sync.accountFingerprint && !clearAssociatedAccountState(window.localStorage, sync.accountFingerprint)) {
        throw new Error("account_state_clear_failed");
      }
      formRef.current?.requestSubmit();
    } catch {
      setBusy(false);
      setError(removeAccountData
        ? "Account data couldn't be removed and confirmed. You're still signed in — try again, or choose to keep progress on this browser."
        : "Sync couldn't be stopped safely. Please try signing out again.");
    }
  }

  return (
    <section data-testid="safe-sign-out" className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1"><h3 className="m-0 text-sm font-extrabold">Sign out</h3>
        <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">Keep progress on this browser, or remove this account&apos;s local copies first.</p></div>
      <form ref={formRef} action={action}>
        <input type="hidden" name="next" value={nextAction.href ?? "/dashboard"} />
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true">Submit sign out</button>
      </form>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <Button type="button" aria-label="Sign out and keep progress on this browser" disabled={busy} variant="secondary" onClick={() => void submit(false)}>Sign out</Button>
        <button type="button" aria-label="Remove this account's data from this browser, then sign out" disabled={busy} className="min-h-10 text-left text-xs font-bold text-muted underline decoration-line underline-offset-4 hover:text-danger sm:text-right" onClick={() => setConfirmRemove(true)}>Remove local account data first</button>
      </div>
      </div>
      {confirmRemove ? (
        <DialogShell ref={dialogRef} role="alertdialog" labelledBy="sign-out-removal-title" describedBy="sign-out-removal-description" size="sm">
          <h2 id="sign-out-removal-title" className="m-0 text-xl font-extrabold">Remove account data and sign out?</h2>
          <p id="sign-out-removal-description" className="mb-0 mt-3 text-sm leading-relaxed text-muted">This removes progress on this browser that belongs to this account. Progress that might belong to someone else, or whose origin isn&apos;t known, is left alone. It does not delete progress stored in your account or on other devices.</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button ref={cancelRef} type="button" disabled={busy} variant="secondary" onClick={() => setConfirmRemove(false)}>Cancel</Button>
            <Button type="button" disabled={busy} variant="destructive" onClick={() => void submit(true)}>Remove and sign out</Button>
          </div>
        </DialogShell>
      ) : null}
      {error ? <p role="alert" className="mb-0 mt-4 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm">{error}</p> : null}
    </section>
  );
}
