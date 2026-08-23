import assert from "node:assert/strict";
import test from "node:test";
import { emptyAccountLearnerState } from "../lib/account-state/types";
import { emptyLearnerPreferences } from "../lib/learner-preferences";
import {
  ONBOARDING_STORAGE_KEY,
  clearOnboardingState,
  parseOnboardingState,
  resolveOnboardingDestination,
  writeOnboardingState,
} from "../lib/onboarding";
import { createDefaultProgressPayload } from "../lib/progress/payload";
import { emptyStudyPlanLocalState } from "../lib/study-plan/local-state";

function input() {
  return {
    onboarding: null,
    preferences: emptyLearnerPreferences(),
    evidence: createDefaultProgressPayload().data,
    studyPlan: emptyStudyPlanLocalState(),
    remoteAccountState: emptyAccountLearnerState(),
  };
}

test("only a genuinely empty learner is sent to onboarding", () => {
  assert.equal(resolveOnboardingDestination(input()), "onboarding");
  assert.equal(resolveOnboardingDestination({ ...input(), preferences: {
    ...emptyLearnerPreferences(), selectedCourseSlugs: ["higher-maths"],
  } }), "dashboard");
  assert.equal(resolveOnboardingDestination({ ...input(), preferences: {
    ...emptyLearnerPreferences(), namePromptDismissed: true,
  } }), "dashboard");
});

test("progress, Study Plan and synced account state protect established learners", () => {
  const evidence = createDefaultProgressPayload().data;
  evidence.flashcardReviews.push({
    eventId: "flashcard:onboarding-existing", cardId: "card", cardVersion: 1,
    outcome: "remembered", outcomeSource: "self_rated", occurredAt: "2026-08-23T12:00:00.000Z",
    sequence: 1, schedulerVersion: 1,
  });
  assert.equal(resolveOnboardingDestination({ ...input(), evidence }), "dashboard");
  assert.equal(resolveOnboardingDestination({ ...input(), studyPlan: {
    ...emptyStudyPlanLocalState(), setup: { weeklyMinutes: 90, availableDays: ["mon"], assessments: [] },
  } }), "dashboard");
  assert.equal(resolveOnboardingDestination({ ...input(), remoteAccountState: {
    ...emptyAccountLearnerState(), settings: { weeklyMinutes: 90, availableDays: ["mon"], changedAt: "2026-08-23T12:00:00.000Z" },
  } }), "dashboard");
});

test("the explicit flow state persists, resumes and completes deterministically", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => values.delete(key),
  };
  assert.equal(writeOnboardingState(storage, { version: 1, status: "in_progress", step: 2 }), true);
  const inProgress = parseOnboardingState(values.get(ONBOARDING_STORAGE_KEY) ?? null);
  assert.deepEqual(inProgress, { version: 1, status: "in_progress", step: 2 });
  assert.equal(resolveOnboardingDestination({ ...input(), onboarding: inProgress, preferences: {
    ...emptyLearnerPreferences(), selectedCourseSlugs: ["higher-maths"],
  } }), "onboarding");
  assert.equal(resolveOnboardingDestination({ ...input(), onboarding: { version: 1, status: "completed", step: 3 } }), "dashboard");
  assert.equal(clearOnboardingState(storage), true);
  assert.equal(values.has(ONBOARDING_STORAGE_KEY), false);
  assert.equal(parseOnboardingState("not-json"), null);
});

test("state-service uncertainty fails open instead of trapping a learner", () => {
  assert.equal(resolveOnboardingDestination({ ...input(), stateUnavailable: true }), "dashboard");
  assert.equal(resolveOnboardingDestination({
    ...input(), stateUnavailable: true, onboarding: { version: 1, status: "in_progress", step: 3 },
  }), "onboarding");
});
