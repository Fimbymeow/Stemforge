import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LEARNER_PREFERENCES_STORAGE_KEY,
  clearGuestLearnerPreferences,
  emptyLearnerPreferences,
  mergeGuestLearnerPreferences,
  normalizeLearnerPreferences,
  parseStoredLearnerPreferences,
  resolveEffectiveCourseSlugs,
  writeGuestLearnerPreferences,
} from "../lib/learner-preferences";
import { createDefaultProgressPayload } from "../lib/progress/payload";

test("first-name and guest persistence stay optional, trimmed, bounded and versioned", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const preferences = normalizeLearnerPreferences({ version: 1, firstName: `  ${"A".repeat(50)}  `, namePromptDismissed: false, selectedCourseSlugs: ["higher-maths", "higher-physics"] });
  assert.equal(preferences.firstName, "A".repeat(40));
  assert.deepEqual(preferences.selectedCourseSlugs, ["higher-maths"]);
  writeGuestLearnerPreferences(storage, preferences);
  assert.deepEqual(parseStoredLearnerPreferences(values.get(LEARNER_PREFERENCES_STORAGE_KEY)!), preferences);
  assert.equal(clearGuestLearnerPreferences({ removeItem: (key) => values.delete(key) }), true);
  assert.equal(values.has(LEARNER_PREFERENCES_STORAGE_KEY), false);
  assert.deepEqual(parseStoredLearnerPreferences(JSON.stringify({ version: 99, firstName: "Unsafe" })), emptyLearnerPreferences());
});

test("effective courses use explicit preferences, real progress and the one-course new-learner default", () => {
  const evidence = createDefaultProgressPayload().data;
  assert.deepEqual(resolveEffectiveCourseSlugs({ preferences: emptyLearnerPreferences(), evidence }), ["higher-maths"]);
  evidence.attempts.push({
    questionId: "hm-calc-diff-basic-f-001", skillPathId: "basic-differentiation", stageId: "basic-diff-stage-foundations",
    isCorrect: true, answer: "5x^4", attemptedAt: "2026-08-13T12:00:00.000Z", sequence: 1, isGenuine: true,
    hintViewedBeforeSubmission: false, supportKnowledge: "known", versionEvidence: { kind: "known", questionVersion: 1 }, eventId: "attempt_preferences_1",
  });
  assert.deepEqual(resolveEffectiveCourseSlugs({ preferences: emptyLearnerPreferences(), evidence }), ["higher-maths"]);
  assert.deepEqual(resolveEffectiveCourseSlugs({ preferences: emptyLearnerPreferences(), evidence: createDefaultProgressPayload().data,
    availableCourses: [{ slug: "course-a", name: "A", href: "/a" }, { slug: "course-b", name: "B", href: "/b" }] }), []);
});

test("guest to account merge preserves remote conflicts and conservatively unions courses", () => {
  const remote = normalizeLearnerPreferences({ version: 1, firstName: "Remote", namePromptDismissed: false, selectedCourseSlugs: ["higher-maths"] });
  const guest = normalizeLearnerPreferences({ version: 1, firstName: "Guest", namePromptDismissed: true, selectedCourseSlugs: ["higher-maths"] });
  assert.deepEqual(mergeGuestLearnerPreferences(remote, guest), remote);
  assert.equal(mergeGuestLearnerPreferences(null, guest).firstName, "Guest");
  assert.equal(mergeGuestLearnerPreferences(normalizeLearnerPreferences({ version: 1 }), guest).firstName, "Guest");
});

test("learner-preference migration is dedicated, mutable, exportable and erasure-aware", () => {
  const migration = readFileSync(new URL("../migrations/1753612000000_learner-preferences.js", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE stemforge_account_data\.learner_preferences/);
  assert.match(migration, /first_name text/);
  assert.match(migration, /selected_course_slugs text\[\]/);
  assert.match(migration, /DELETE FROM stemforge_account_data\.learner_preferences/);
  assert.doesNotMatch(migration, /school|surname|date_of_birth|location/i);
});
