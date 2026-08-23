"use client";

import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MAX_FIRST_NAME_LENGTH } from "@/lib/learner-preferences";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";
import { ONBOARDING_UPDATED_EVENT, readOnboardingState } from "@/lib/onboarding";

export function DashboardPersonalisation() {
  const { loaded, preferences, save, error } = useLearnerPreferences();
  const [firstName, setFirstName] = useState("");
  const [busy, setBusy] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  useEffect(() => {
    const read = () => setOnboardingComplete(readOnboardingState(window.localStorage)?.status === "completed");
    read();
    window.addEventListener(ONBOARDING_UPDATED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(ONBOARDING_UPDATED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  const showPrompt = loaded && !error && !onboardingComplete && !preferences.firstName && !preferences.namePromptDismissed;

  async function persistName() {
    setBusy(true);
    await save({ ...preferences, firstName, namePromptDismissed: true });
    setBusy(false);
  }

  async function skip() {
    setBusy(true);
    await save({ ...preferences, firstName: null, namePromptDismissed: true });
    setBusy(false);
  }

  return (
    <>
      <header className="flex items-start justify-between gap-4 max-md:grid">
        <div>
          <p className="text-sm font-bold text-muted">Home</p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight">
            {preferences.firstName ? `Welcome back, ${preferences.firstName}` : "Welcome back"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Your plan, courses and recent learning.</p>
        </div>
        <AppTopbar demo={false} />
      </header>
      {showPrompt ? (
        <section data-testid="learner-name-prompt" aria-labelledby="learner-name-prompt-title" className="rounded-xl border border-forge/25 bg-forge-soft/40 p-4">
          <h2 id="learner-name-prompt-title" className="m-0 text-lg font-extrabold">Make Orthic yours</h2>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-[minmax(0,320px)_auto]">
            <label className="text-sm font-bold">What should we call you?
              <input
                className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3 font-medium outline-none focus:border-forge focus:ring-2 focus:ring-forge/20"
                value={firstName}
                maxLength={MAX_FIRST_NAME_LENGTH}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void persistName()} className="min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-60">Save</button>
              <button type="button" disabled={busy} onClick={() => void skip()} className="min-h-11 rounded-lg px-4 text-sm font-extrabold text-forge disabled:opacity-60">Skip</button>
            </div>
          </div>
          {error ? <p role="status" className="mb-0 mt-2 text-sm text-danger">{error}</p> : null}
        </section>
      ) : null}
    </>
  );
}
