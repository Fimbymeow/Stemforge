"use client";

import { useRef, useState } from "react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";

export function SafeSignOut({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const sync = useProgressSync();
  const nextAction = useLearnerNextAction();
  const formRef = useRef<HTMLFormElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
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
      formRef.current?.requestSubmit();
    } catch {
      setBusy(false);
      setError(removeAccountData
        ? "Account data couldn't be removed and confirmed. You're still signed in — try again, or choose to keep progress on this browser."
        : "Sync couldn't be stopped safely. Please try signing out again.");
    }
  }

  return (
    <section data-testid="safe-sign-out" className="mt-5 rounded-xl border border-line bg-paper p-4">
      <h2 className="m-0 text-lg font-extrabold">Sign out safely</h2>
      <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Choose what should remain visible to the next person using this browser.</p>
      <form ref={formRef} action={action}>
        <input type="hidden" name="next" value={nextAction.href ?? "/dashboard"} />
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true">Submit sign out</button>
      </form>
      <div className="mt-4 grid gap-2">
        <button type="button" disabled={busy} className={primaryButton} onClick={() => void submit(false)}>Sign out and keep progress on this browser</button>
        <button type="button" disabled={busy} className={dangerButton} onClick={() => setConfirmRemove(true)}>{"Remove this account's data from this browser, then sign out"}</button>
      </div>
      {confirmRemove ? (
        <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="sign-out-removal-title" className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-4">
          <h3 id="sign-out-removal-title" className="m-0 text-base font-extrabold">Remove account data and sign out?</h3>
          <p className="mb-0 mt-2 text-sm leading-relaxed">This removes progress on this browser that belongs to this account. Progress that might belong to someone else, or whose origin isn&apos;t known, is left alone. It does not delete progress stored in your account or on other devices.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy} className={dangerSolidButton} onClick={() => void submit(true)}>Remove and sign out</button>
            <button ref={cancelRef} type="button" disabled={busy} className={secondaryButton} onClick={() => setConfirmRemove(false)}>Cancel</button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mb-0 mt-4 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm">{error}</p> : null}
    </section>
  );
}

const primaryButton = "min-h-11 w-full rounded-md bg-forge px-4 text-sm font-extrabold text-white disabled:opacity-60";
const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-4 text-sm font-extrabold text-ink disabled:opacity-60";
const dangerButton = "min-h-11 w-full rounded-md border border-danger/40 bg-white px-4 text-sm font-extrabold text-danger disabled:opacity-60";
const dangerSolidButton = "min-h-11 w-full rounded-md bg-danger px-4 text-sm font-extrabold text-white disabled:opacity-60";
