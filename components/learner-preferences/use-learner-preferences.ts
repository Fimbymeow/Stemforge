"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LEARNER_PREFERENCES_STORAGE_KEY,
  LEARNER_PREFERENCES_UPDATED_EVENT,
  emptyLearnerPreferences,
  normalizeLearnerPreferences,
  readGuestLearnerPreferences,
  writeGuestLearnerPreferences,
  type LearnerPreferences,
} from "@/lib/learner-preferences";

type PreferenceState = {
  loaded: boolean;
  authenticated: boolean;
  source: "guest" | "account" | "unavailable";
  preferences: LearnerPreferences;
  error: string | null;
};

export function useLearnerPreferences() {
  const [state, setState] = useState<PreferenceState>({
    loaded: false,
    authenticated: false,
    source: "unavailable",
    preferences: emptyLearnerPreferences(),
    error: null,
  });

  const refresh = useCallback(async () => {
    const guest = readGuestLearnerPreferences(window.localStorage);
    try {
      const response = await fetch("/api/learner-preferences", { cache: "no-store" });
      const body: unknown = await response.json().catch(() => null);
      if (response.ok && body && typeof body === "object" && (body as { authenticated?: unknown }).authenticated === true) {
        setState({ loaded: true, authenticated: true, source: "account", preferences: normalizeLearnerPreferences((body as { preferences?: unknown }).preferences), error: null });
        return;
      }
      if (response.ok && body && typeof body === "object" && (body as { authenticated?: unknown }).authenticated === false) {
        setState({ loaded: true, authenticated: false, source: "guest", preferences: guest, error: null });
        return;
      }
      setState({ loaded: true, authenticated: false, source: "unavailable", preferences: guest, error: "Learner preferences are temporarily unavailable." });
    } catch {
      setState({ loaded: true, authenticated: false, source: "unavailable", preferences: guest, error: "Learner preferences are temporarily unavailable." });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const update = (event?: StorageEvent) => {
      if (event && event.key !== LEARNER_PREFERENCES_STORAGE_KEY) return;
      void refresh();
    };
    window.addEventListener("storage", update);
    window.addEventListener(LEARNER_PREFERENCES_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(LEARNER_PREFERENCES_UPDATED_EVENT, refresh);
    };
  }, [refresh]);

  const save = useCallback(async (preferences: LearnerPreferences) => {
    const normalized = normalizeLearnerPreferences(preferences);
    if (state.source === "unavailable") return false;
    if (state.source === "guest") {
      if (!writeGuestLearnerPreferences(window.localStorage, normalized)) {
        setState((current) => ({ ...current, error: "Your preferences could not be saved in this browser." }));
        return false;
      }
      setState((current) => ({ ...current, preferences: normalized, error: null }));
      window.dispatchEvent(new CustomEvent(LEARNER_PREFERENCES_UPDATED_EVENT));
      return true;
    }
    try {
      const response = await fetch("/api/learner-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: normalized }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !body || typeof body !== "object") throw new Error("save_failed");
      const saved = normalizeLearnerPreferences((body as { preferences?: unknown }).preferences);
      setState((current) => ({ ...current, preferences: saved, error: null }));
      window.dispatchEvent(new CustomEvent(LEARNER_PREFERENCES_UPDATED_EVENT));
      return true;
    } catch {
      setState((current) => ({ ...current, error: "Your preferences could not be saved just now." }));
      return false;
    }
  }, [state.source]);

  return { ...state, save, refresh };
}
