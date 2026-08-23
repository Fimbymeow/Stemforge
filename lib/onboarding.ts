import type { AccountLearnerState } from "@/lib/account-state/types";
import { hasMeaningfulAccountState } from "@/lib/account-state/client-state";
import type { LearnerPreferences } from "@/lib/learner-preferences";
import type { ProgressEvidence } from "@/lib/progress/types";
import type { StudyPlanLocalState } from "@/lib/study-plan/local-state";

export const ONBOARDING_STORAGE_KEY = "orthic.onboarding.v1";
export const ONBOARDING_UPDATED_EVENT = "orthic:onboarding-updated";

export type OnboardingStep = 1 | 2 | 3;
export type OnboardingState = {
  version: 1;
  status: "in_progress" | "completed";
  step: OnboardingStep;
};

export function parseOnboardingState(raw: string | null): OnboardingState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<OnboardingState>;
    if (value.version !== 1 || (value.status !== "in_progress" && value.status !== "completed")) return null;
    const step = value.step === 2 || value.step === 3 ? value.step : 1;
    return { version: 1, status: value.status, step };
  } catch {
    return null;
  }
}

export function readOnboardingState(storage: Pick<Storage, "getItem">): OnboardingState | null {
  try {
    return parseOnboardingState(storage.getItem(ONBOARDING_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeOnboardingState(storage: Pick<Storage, "setItem">, state: OnboardingState) {
  try {
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearOnboardingState(storage: Pick<Storage, "removeItem">) {
  try {
    storage.removeItem(ONBOARDING_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasMeaningfulProgress(evidence: ProgressEvidence) {
  return evidence.attempts.length > 0
    || evidence.supportEvents.length > 0
    || evidence.guidedSelfAssessments.length > 0
    || evidence.achievementSnapshots.length > 0
    || evidence.reviewEvents.length > 0
    || evidence.flashcardReviews.length > 0;
}

export function hasMeaningfulStudyPlan(state: StudyPlanLocalState) {
  return state.setup !== null
    || state.plan !== null
    || state.previousWeek !== null
    || Object.keys(state.preservation.itemStates).length > 0
    || Object.keys(state.preservation.movedDates).length > 0
    || state.preservation.excludedItemKeys.length > 0
    || Boolean(state.preservation.unscheduledItemKeys?.length);
}

export function hasMeaningfulPreferences(preferences: LearnerPreferences) {
  return preferences.firstName !== null
    || preferences.namePromptDismissed
    || preferences.selectedCourseSlugs.length > 0;
}

export function resolveOnboardingDestination(input: {
  onboarding: OnboardingState | null;
  preferences: LearnerPreferences;
  evidence: ProgressEvidence;
  studyPlan: StudyPlanLocalState;
  remoteAccountState?: AccountLearnerState | null;
  stateUnavailable?: boolean;
}): "onboarding" | "dashboard" {
  if (input.onboarding?.status === "completed") return "dashboard";
  if (input.onboarding?.status === "in_progress") return "onboarding";
  if (input.stateUnavailable) return "dashboard";
  if (hasMeaningfulPreferences(input.preferences)) return "dashboard";
  if (hasMeaningfulProgress(input.evidence)) return "dashboard";
  if (hasMeaningfulStudyPlan(input.studyPlan)) return "dashboard";
  if (input.remoteAccountState && hasMeaningfulAccountState(input.remoteAccountState)) return "dashboard";
  return "onboarding";
}
