"use client";

import { useEffect, useState } from "react";
import {
  hasMeaningfulGuestPreferences,
  normalizeLearnerPreferences,
  readGuestLearnerPreferences,
  type LearnerPreferences,
} from "@/lib/learner-preferences";

export function GuestPreferencesImport() {
  const [guest, setGuest] = useState<LearnerPreferences | null>(null);
  const [needed, setNeeded] = useState(false);
  const [state, setState] = useState<"checking" | "ready" | "importing" | "success" | "failure">("checking");

  useEffect(() => {
    const local = readGuestLearnerPreferences(window.localStorage);
    setGuest(local);
    if (!hasMeaningfulGuestPreferences(local)) {
      setState("success");
      return;
    }
    void fetch("/api/learner-preferences", { cache: "no-store" }).then(async (response) => {
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !body || typeof body !== "object" || (body as { authenticated?: unknown }).authenticated !== true) throw new Error("unavailable");
      const remote = normalizeLearnerPreferences((body as { preferences?: unknown }).preferences);
      const missingName = Boolean(local.firstName && !remote.firstName);
      const missingCourse = local.selectedCourseSlugs.some((slug) => !remote.selectedCourseSlugs.includes(slug));
      const missingDismissal = local.namePromptDismissed && !remote.namePromptDismissed && !remote.firstName;
      setNeeded(missingName || missingCourse || missingDismissal);
      setState("ready");
    }).catch(() => setState("failure"));
  }, []);

  async function importPreferences() {
    if (!guest) return;
    setState("importing");
    try {
      const response = await fetch("/api/learner-preferences/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: guest }),
      });
      if (!response.ok) throw new Error("import_failed");
      setNeeded(false);
      setState("success");
    } catch {
      setState("failure");
    }
  }

  if (state === "checking" || state === "success" || (state === "ready" && !needed)) return null;
  return (
    <section data-testid="guest-preferences-import" className="mt-5 rounded-xl border border-line bg-paper p-4" aria-live="polite">
      <h2 className="m-0 text-lg font-extrabold">Add this browser&apos;s preferences</h2>
      <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Keep the name and course choices already saved on this browser. Existing account preferences take priority where they conflict.</p>
      {state === "failure" ? <p className="mb-0 mt-2 text-sm text-danger">Preferences could not be checked or added just now.</p> : null}
      <button type="button" disabled={state === "importing"} onClick={() => void importPreferences()} className="mt-4 min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-60">{state === "importing" ? "Adding…" : "Add preferences"}</button>
    </section>
  );
}
