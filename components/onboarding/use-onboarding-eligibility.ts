"use client";

import { useCallback, useEffect, useState } from "react";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";
import { useProgressSync } from "@/components/progress-sync-provider";
import { normalizeAccountLearnerState, type AccountLearnerState } from "@/lib/account-state/types";
import { getProgressEvidence } from "@/lib/local-progress";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_UPDATED_EVENT,
  readOnboardingState,
  resolveOnboardingDestination,
  type OnboardingState,
} from "@/lib/onboarding";
import { readStudyPlanLocalState, STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT } from "@/lib/study-plan/local-state";

type RemoteState = { status: "loading" | "ready" | "unavailable"; account: AccountLearnerState | null };

export function useOnboardingEligibility() {
  const learner = useLearnerPreferences();
  const progressSync = useProgressSync();
  const [localRevision, setLocalRevision] = useState(0);
  const [remote, setRemote] = useState<RemoteState>({ status: "loading", account: null });
  const [stateWaitExpired, setStateWaitExpired] = useState(false);

  useEffect(() => {
    if (progressSync.status !== "checking" && remote.status !== "loading") return;
    const timeout = window.setTimeout(() => setStateWaitExpired(true), 1_500);
    return () => window.clearTimeout(timeout);
  }, [progressSync.status, remote.status]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/account-state", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.ok && body && typeof body === "object") {
          const candidate = body as { authenticated?: unknown; state?: unknown };
          setRemote({
            status: "ready",
            account: candidate.authenticated === true ? normalizeAccountLearnerState(candidate.state) : null,
          });
          return;
        }
        setRemote({ status: "unavailable", account: null });
      })
      .catch(() => { if (!cancelled) setRemote({ status: "unavailable", account: null }); });
    return () => { cancelled = true; };
  }, []);

  const refreshLocal = useCallback(() => setLocalRevision((value) => value + 1), []);
  useEffect(() => {
    const storage = (event: StorageEvent) => {
      if (!event.key || [ONBOARDING_STORAGE_KEY, "stemforge.localProgress.v1", "orthic.studyPlan.v1"].includes(event.key)) refreshLocal();
    };
    window.addEventListener("storage", storage);
    window.addEventListener(ONBOARDING_UPDATED_EVENT, refreshLocal);
    window.addEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, refreshLocal);
    window.addEventListener("stemforge:local-progress-updated", refreshLocal);
    window.addEventListener("stemforge:progress-sync-updated", refreshLocal);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener(ONBOARDING_UPDATED_EVENT, refreshLocal);
      window.removeEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, refreshLocal);
      window.removeEventListener("stemforge:local-progress-updated", refreshLocal);
      window.removeEventListener("stemforge:progress-sync-updated", refreshLocal);
    };
  }, [refreshLocal]);

  let onboarding: OnboardingState | null = null;
  let destination: "onboarding" | "dashboard" | null = null;
  const progressReady = progressSync.status !== "checking" || stateWaitExpired;
  const accountStateReady = remote.status !== "loading" || stateWaitExpired;
  if (typeof window !== "undefined" && stateWaitExpired && !learner.loaded) {
    destination = "dashboard";
  } else if (typeof window !== "undefined" && learner.loaded && progressReady && accountStateReady) {
    onboarding = readOnboardingState(window.localStorage);
    destination = resolveOnboardingDestination({
      onboarding,
      preferences: learner.preferences,
      evidence: getProgressEvidence(),
      studyPlan: readStudyPlanLocalState(window.localStorage),
      remoteAccountState: remote.account,
      stateUnavailable: learner.source === "unavailable"
        || (learner.authenticated && (remote.status !== "ready" || progressSync.status === "checking")),
    });
  }
  void localRevision;

  return { loaded: destination !== null, destination, onboarding, learner };
}
