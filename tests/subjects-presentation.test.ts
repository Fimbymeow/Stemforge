import assert from "node:assert/strict";
import test from "node:test";
import { presentSubjectCourses } from "../lib/subjects-presentation";
import { emptyLearnerPreferences } from "../lib/learner-preferences";
import { getEmptyProgressEvidence } from "../lib/local-progress";
import { deriveCourseDashboardSummary } from "../lib/dashboard-derivations";
import { getAllSkillPathContexts, getActiveSubject } from "../lib/learning-paths";
import { contentResolver } from "../lib/content-resolver";
import { readFileSync } from "node:fs";

test("Courses respects the existing single-course guest default and omits empty Explore", () => {
  const view = presentSubjectCourses(emptyLearnerPreferences(), getEmptyProgressEvidence());
  assert.deepEqual(view.yourCourses.map((course) => course.slug), ["higher-maths"]);
  assert.deepEqual(view.exploreCourses, []);
  assert.equal(view.yourCourses[0].selected, false);
  assert.equal(view.yourCourses[0].dueSkillCount, 0);
});

test("explicit enrolment stays real and unavailable courses remain absent", () => {
  const preferences = { ...emptyLearnerPreferences(), selectedCourseSlugs: ["higher-maths", "higher-physics"] };
  const view = presentSubjectCourses(preferences, getEmptyProgressEvidence());
  assert.equal(view.yourCourses.length, 1);
  assert.equal(view.yourCourses[0].selected, true);
  assert.equal(view.exploreCourses.length, 0);
});

test("course progress is identical to the existing version-aware derivation", () => {
  const evidence = getEmptyProgressEvidence();
  const subject = getActiveSubject();
  const expected = deriveCourseDashboardSummary(getAllSkillPathContexts(subject).map((context) => context.skillPath), evidence, contentResolver.getQuestionVersions(), subject);
  const view = presentSubjectCourses(emptyLearnerPreferences(), evidence);
  assert.deepEqual(view.yourCourses[0].progress, expected);
  assert.equal(view.yourCourses[0].progress?.completedPathCount, 0);
  assert.equal(view.yourCourses[0].progress?.availablePathCount, 2);
  assert.deepEqual(evidence, getEmptyProgressEvidence());
});

test("Courses uses Design V2 hierarchy and shared motion rather than focus recommendations", () => {
  const source = readFileSync("components/subjects-page.tsx", "utf8");
  assert.match(source, />Courses<\/h1>/);
  assert.match(source, /orthic-course-row/);
  assert.match(source, /orthic-primary-action/);
  assert.doesNotMatch(source, /PageHeaderIconChip|useLearnerNextAction|Current focus|rounded-xl|shadow-|animate-/);
});
