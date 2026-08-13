import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatProgressStatusLabel } from "../components/learning/mastery-badge";
import { getReviewPresentationState } from "../components/learning/review-status";

test("mastery presentation uses the approved learner-facing progression", () => {
  assert.deepEqual(["not_started", "in_progress", "completed", "secure", "mastered"].map(formatProgressStatusLabel), ["Not started", "In progress", "Learned", "Secure", "Mastered"]);
});

test("Review presentation distinguishes base, available, recommended and due without changing scheduling", () => {
  assert.equal(getReviewPresentationState({ eligible: false, due: false, dueSoon: false }), "base");
  assert.equal(getReviewPresentationState({ eligible: true, due: false, dueSoon: false }), "available");
  assert.equal(getReviewPresentationState({ eligible: true, due: false, dueSoon: true }), "recommended");
  assert.equal(getReviewPresentationState({ eligible: true, due: true, dueSoon: false }), "due");
});

test("core redesigned surfaces retain the intended information hierarchy", () => {
  const skill = readFileSync("components/working-context/working-context-overview.tsx", "utf8");
  const dashboard = readFileSync("components/dashboard-local-progress.tsx", "utf8");
  const hub = readFileSync("components/higher-maths-hub.tsx", "utf8");
  const tracker = readFileSync("components/learning/course-tracker.tsx", "utf8");
  assert.equal((skill.match(/title="Notes"/g) ?? []).length, 1);
  assert.doesNotMatch(skill, /Next:/);
  assert.doesNotMatch(dashboard, /PracticeEntryCard|dashboard-practice|dashboard-review-summary|dashboard-mistakes-link|Needs attention|Secure and mastered|Needs work/);
  assert.match(dashboard, /Your courses/);
  assert.match(dashboard, /skills learned/);
  assert.match(hub, /SubjectRoadmapNavigator/);
  assert.doesNotMatch(hub, /PracticeEntryCard/);
  assert.doesNotMatch(hub, /View full course/);
  assert.match(hub, />Courses</);
  assert.match(tracker, /<details className="mt-1/);
  assert.match(tracker, /Open \$\{skill\.name\} skill overview/);
});
