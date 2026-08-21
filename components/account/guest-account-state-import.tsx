"use client";

import { useCallback, useEffect, useState } from "react";
import { hasMeaningfulGuestPreferences, readGuestLearnerPreferences } from "@/lib/learner-preferences";
import {
  ACCOUNT_STATE_IMPORT_COMPLETED_EVENT, ACCOUNT_STATE_SYNCED_EVENT, hasMeaningfulAccountState,
  readAccountStateSyncMetadata, writeAccountStateSyncMetadata,
} from "@/lib/account-state/client-state";

export function GuestAccountStateImport({ accountFingerprint }: { accountFingerprint: string }) {
  const [needed, setNeeded] = useState(false);
  const [state, setState] = useState<"checking" | "ready" | "importing" | "success" | "failure">("checking");

  const inspect = useCallback(() => {
    const metadata = readAccountStateSyncMetadata(window.localStorage);
    const candidate = metadata.guestCandidate;
    const accountStateNeeded = Boolean(candidate && candidate.associatedFingerprint === null && hasMeaningfulAccountState(candidate.state));
    const preferencesNeeded = hasMeaningfulGuestPreferences(readGuestLearnerPreferences(window.localStorage));
    setNeeded(accountStateNeeded || preferencesNeeded);
    setState("ready");
  }, []);

  useEffect(() => {
    inspect();
    window.addEventListener(ACCOUNT_STATE_SYNCED_EVENT, inspect);
    return () => window.removeEventListener(ACCOUNT_STATE_SYNCED_EVENT, inspect);
  }, [inspect]);

  async function importState() {
    setState("importing");
    const metadata = readAccountStateSyncMetadata(window.localStorage);
    if (metadata.guestCandidate && (metadata.accountFingerprint !== accountFingerprint || metadata.guestCandidate.associatedFingerprint !== null)) {
      setState("failure");
      return;
    }
    try {
      const preferences = readGuestLearnerPreferences(window.localStorage);
      if (hasMeaningfulGuestPreferences(preferences)) {
        const response = await fetch("/api/learner-preferences/import", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences }) });
        if (!response.ok) throw new Error("preference_import_failed");
      }
      if (metadata.guestCandidate && hasMeaningfulAccountState(metadata.guestCandidate.state)) {
        const response = await fetch("/api/account-state/import", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: metadata.guestCandidate.state }) });
        if (!response.ok) throw new Error("state_import_failed");
      }
      metadata.guestCandidate = null;
      writeAccountStateSyncMetadata(window.localStorage, metadata);
      setNeeded(false);
      setState("success");
      window.dispatchEvent(new Event(ACCOUNT_STATE_IMPORT_COMPLETED_EVENT));
    } catch { setState("failure"); }
  }

  if (state === "checking" || state === "success" || (state === "ready" && !needed)) return null;
  return (
    <section data-testid="guest-account-state-import" className="mt-5 rounded-xl border border-line bg-paper p-4" aria-live="polite">
      <h2 className="m-0 text-lg font-extrabold">Add this browser&apos;s learning setup</h2>
      <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Bring in this browser&apos;s preferences, Study Plan, assessments and confidence. Existing account choices take priority where they conflict.</p>
      {state === "failure" ? <p className="mb-0 mt-2 text-sm text-danger">This browser&apos;s setup could not be added just now. Nothing was removed.</p> : null}
      <button type="button" disabled={state === "importing"} onClick={() => void importState()}
        className="mt-4 min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-60">
        {state === "importing" ? "Adding…" : "Add browser setup"}
      </button>
    </section>
  );
}
