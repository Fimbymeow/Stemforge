"use client";

import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MAX_FIRST_NAME_LENGTH } from "@/lib/learner-preferences";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";
import { ONBOARDING_UPDATED_EVENT, readOnboardingState } from "@/lib/onboarding";
import { getActiveSubject } from "@/lib/learning-paths";

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
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-navy">{getActiveSubject().subjectName}</p>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-navy max-sm:text-[28px]">
            {preferences.firstName ? `Welcome back, ${preferences.firstName}` : "Welcome back"}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-secondary">Your plan, courses and recent learning.</p>
        </div>
      </header>
      {showPrompt ? (
        <section data-testid="learner-name-prompt" aria-labelledby="learner-name-prompt-title" className="border-t border-rule pt-4">
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

export function DashboardContextBar() {
  const { preferences } = useLearnerPreferences();
  return <>
    <p className="font-mono text-xs uppercase tracking-[0.12em]">Orthic <span aria-hidden="true" className="mx-2 text-rule">/</span> Dashboard</p>
    <div className="flex items-center gap-4">
      {preferences.firstName ? <span className="flex items-center gap-3 text-sm">{preferences.firstName}<span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-rule bg-academic-blue text-xs">{preferences.firstName.charAt(0)}</span></span> : null}
      <AppTopbar demo={false} />
    </div>
  </>;
}
