import assert from "node:assert/strict";
import test from "node:test";

import { contentResolver } from "@/lib/content-resolver";
import type { ResolvedSkillPath } from "@/lib/content-resolver";
import type { ProgressEvidence } from "@/lib/progress/types";
import {
  assessmentQualifierFor,
  courseWidePhase,
  effectiveAssessments,
  nearestRelevantAssessment,
  phaseForAssessmentDate,
  PROVISIONAL_COURSE_ASSESSMENTS,
  topicScopeId,
} from "@/lib/study-plan/assessments";
import { buildStudyPlanCandidates } from "@/lib/study-plan/candidate-builder";
import { classifyMonthPhase } from "@/lib/study-plan/dates";
import {
  parseStoredStudyPlanLocalState,
  STUDY_PLAN_LOCAL_STATE_VERSION,
} from "@/lib/study-plan/local-state";
import { getEmptyProgressEvidence } from "@/lib/local-progress";
import { presentStudyPlanAssessmentQualifier } from "@/lib/study-plan/presenter";
import { createInitialWeeklyPlan, rebalanceStudyPlan } from "@/lib/study-plan/weekly-plan";
import type { Assessment, StudyPlanPreferences } from "@/lib/study-plan/types";

const NOW = new Date("2026-07-13T09:00:00.000Z");
const BASIC = context("basic-differentiation");
const CHAIN = context("chain-rule");

test("effectiveAssessments merges the repository provisional default only when the learner has no whole-course final exam", () => {
  const noLearnerAssessments = effectiveAssessments({ courseSlug: "higher-maths", assessments: [] });
  assert.deepEqual(noLearnerAssessments, [PROVISIONAL_COURSE_ASSESSMENTS["higher-maths"]]);

  const ownFinalExam = wholeCourseAssessment("learner:final", "2027-05-15");
  const withOwnFinalExam = effectiveAssessments({ courseSlug: "higher-maths", assessments: [ownFinalExam] });
  assert.deepEqual(withOwnFinalExam, [ownFinalExam]);

  const classTest = { ...wholeCourseAssessment("learner:test", "2026-08-01"), type: "class_test" as const };
  const withClassTestOnly = effectiveAssessments({ courseSlug: "higher-maths", assessments: [classTest] });
  assert.deepEqual(withClassTestOnly, [classTest, PROVISIONAL_COURSE_ASSESSMENTS["higher-maths"]]);

  const otherCourse = effectiveAssessments({ courseSlug: "higher-physics", assessments: [] });
  assert.deepEqual(otherCourse, []);
});

test("nearestRelevantAssessment resolves scope kinds and picks the nearest relevant assessment per skill, never summing", () => {
  const basicTopicId = topicScopeId(BASIC.courseArea.slug, BASIC.routeTopic.slug);
  const chainTopicId = topicScopeId(CHAIN.courseArea.slug, CHAIN.routeTopic.slug);

  const wholeCourse = wholeCourseAssessment("whole", "2026-07-28");
  const skillScoped = {
    ...wholeCourseAssessment("skill", "2026-07-14"),
    scope: { kind: "skills" as const, skillPathIds: [CHAIN.skillPath.slug] },
  };
  const topicScoped = {
    ...wholeCourseAssessment("topic", "2026-07-16"),
    scope: { kind: "topics" as const, topicIds: [basicTopicId] },
  };

  const forChain = nearestRelevantAssessment([wholeCourse, skillScoped], chainTopicId, CHAIN.skillPath.slug, NOW);
  assert.equal(forChain?.assessment.id, "skill", "the nearer, skill-scoped assessment is used for its own skill");

  const forBasic = nearestRelevantAssessment([wholeCourse, topicScoped], basicTopicId, BASIC.skillPath.slug, NOW);
  assert.equal(forBasic?.assessment.id, "topic", "the nearer, topic-scoped assessment is used for a skill inside that topic");

  const irrelevantSkill = {
    ...wholeCourseAssessment("irrelevant", "2026-07-14"),
    scope: { kind: "skills" as const, skillPathIds: ["some-other-skill"] },
  };
  assert.equal(nearestRelevantAssessment([irrelevantSkill], basicTopicId, BASIC.skillPath.slug, NOW), null);

  assert.equal(nearestRelevantAssessment([], basicTopicId, BASIC.skillPath.slug, NOW), null);
});

test("phaseForAssessmentDate dispatches exact dates through day-distance logic and month-precision dates through classifyMonthPhase", () => {
  assert.equal(phaseForAssessmentDate({ precision: "exact", date: "2026-07-14" }, NOW), "close");
  assert.equal(phaseForAssessmentDate({ precision: "exact", date: "2026-08-10" }, NOW), "medium");
  assert.equal(phaseForAssessmentDate({ precision: "month", year: 2026, month: 7 }, NOW), "close");
  assert.equal(phaseForAssessmentDate({ precision: "month", year: 2026, month: 8 }, NOW), "medium");
  assert.equal(phaseForAssessmentDate({ precision: "month", year: 2026, month: 9 }, NOW), "far");
});

test("month-precision phase never fabricates an exact date and only moves at month boundaries", () => {
  assert.equal(classifyMonthPhase(new Date("2027-04-30T23:59:59.999Z"), 2027, 5), "medium");
  assert.equal(classifyMonthPhase(new Date("2027-05-01T00:00:00.000Z"), 2027, 5), "close");
  assert.equal(classifyMonthPhase(new Date("2027-05-31T23:59:59.999Z"), 2027, 5), "close");
  assert.equal(classifyMonthPhase(new Date("2027-06-01T00:00:00.000Z"), 2027, 5), "close");
});

test("assessmentQualifierFor only carries daysUntil for exact-precision assessments", () => {
  const exact = assessmentQualifierFor(wholeCourseAssessment("exact", "2026-07-20"), "medium", NOW);
  assert.equal(exact.daysUntil, 7);
  assert.equal(exact.title, "Test assessment");
  assert.equal(exact.type, "final_exam");

  const provisional = PROVISIONAL_COURSE_ASSESSMENTS["higher-maths"];
  const month = assessmentQualifierFor(provisional, "far", NOW);
  assert.equal(month.daysUntil, null);
});

test("courseWidePhase reflects the single most urgent assessment across the whole course, used only for the review-time budget", () => {
  const far = wholeCourseAssessment("far", "2026-12-01");
  const close = wholeCourseAssessment("close", "2026-07-14");
  assert.equal(courseWidePhase([far, close], NOW), "close");
  assert.equal(courseWidePhase([far], NOW), "far");
  assert.equal(courseWidePhase([], NOW), "no_date");
});

test("close-assessment suppression is per-skill, not global: a class test on one skill leaves unrelated new-skill starts alone", () => {
  const scopedAssessment = {
    ...wholeCourseAssessment("scoped", "2026-07-14"),
    type: "class_test" as const,
    scope: { kind: "skills" as const, skillPathIds: [CHAIN.skillPath.slug] },
  };
  const built = buildStudyPlanCandidates({
    now: NOW,
    courseSlug: "higher-maths",
    evidence: emptyEvidence(),
    assessments: [scopedAssessment],
  });
  // basic-differentiation is the first prerequisite-safe unstarted skill and is NOT covered by the
  // Chain Rule-scoped class test, so it must still surface as a next_skill candidate.
  assert.equal(built.candidates.some((item) => item.skillPathId === "basic-differentiation" && item.reasonCode === "next_skill"), true);
  assert.equal(built.diagnostics.some((item) => item.skillPathId === "basic-differentiation" && item.code === "new_start_suppressed_close_exam"), false);
});

test("close-assessment suppression does apply to the specific unstarted skill it covers", () => {
  const scopedAssessment = {
    ...wholeCourseAssessment("scoped", "2026-07-14"),
    type: "class_test" as const,
    scope: { kind: "skills" as const, skillPathIds: [BASIC.skillPath.slug] },
  };
  const built = buildStudyPlanCandidates({
    now: NOW,
    courseSlug: "higher-maths",
    evidence: emptyEvidence(),
    assessments: [scopedAssessment],
  });
  assert.equal(built.candidates.some((item) => item.skillPathId === "basic-differentiation" && item.reasonCode === "next_skill"), false);
  assert.equal(built.diagnostics.some((item) => item.skillPathId === "basic-differentiation" && item.code === "new_start_suppressed_close_exam"), true);
});

test("assessment qualifier text augments the reason rather than replacing it, and stays quiet for a far-off assessment", () => {
  const closeQualifier = assessmentQualifierFor(wholeCourseAssessment("close", "2026-07-13"), "close", NOW);
  assert.equal(presentStudyPlanAssessmentQualifier(closeQualifier), "On your final exam today");

  const soonQualifier = assessmentQualifierFor(wholeCourseAssessment("soon", "2026-07-17"), "close", NOW);
  assert.equal(presentStudyPlanAssessmentQualifier(soonQualifier), "On your final exam in 4 days");

  const provisionalQualifier = assessmentQualifierFor(PROVISIONAL_COURSE_ASSESSMENTS["higher-maths"], "medium", NOW);
  assert.equal(presentStudyPlanAssessmentQualifier(provisionalQualifier), "On your final exam next month");

  const farQualifier = assessmentQualifierFor(wholeCourseAssessment("far", "2026-12-01"), "far", NOW);
  assert.equal(presentStudyPlanAssessmentQualifier(farQualifier), null);
  assert.equal(presentStudyPlanAssessmentQualifier(null), null);
});

test("v2 local state migrates a legacy examDate into a single learner-owned exact final exam Assessment", () => {
  const migrated = parseStoredStudyPlanLocalState(JSON.stringify({
    version: 2,
    setup: { weeklyMinutes: 60, availableDays: ["mon", "fri"], examDate: "2027-01-10" },
  }));
  assert.equal(migrated.version, STUDY_PLAN_LOCAL_STATE_VERSION);
  assert.deepEqual(migrated.setup?.assessments, [{
    id: "legacy:final-exam",
    courseSlug: "higher-maths",
    type: "final_exam",
    title: "Higher Maths final exam",
    date: { precision: "exact", date: "2027-01-10" },
    scope: { kind: "whole_course" },
    source: "learner",
  }]);
});

test("v2 migration with no legacy examDate produces no assessments and no fabricated default", () => {
  const migrated = parseStoredStudyPlanLocalState(JSON.stringify({
    version: 2,
    setup: { weeklyMinutes: 60, availableDays: ["mon"], examDate: null },
  }));
  assert.deepEqual(migrated.setup?.assessments, []);
});

test("migrating an examDate never produces a duplicate provisional entry once resolved through effectiveAssessments", () => {
  const migrated = parseStoredStudyPlanLocalState(JSON.stringify({
    version: 2,
    setup: { weeklyMinutes: 60, availableDays: ["mon"], examDate: "2027-01-10" },
  }));
  const preferences: StudyPlanPreferences = { courseSlug: "higher-maths", weeklyMinutes: 60, availableDays: ["mon"], assessments: migrated.setup!.assessments };
  const resolved = effectiveAssessments(preferences);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].source, "learner");
});

test("adding, changing or removing an assessment triggers the existing hard-regeneration path, not a second plan lifecycle", () => {
  const now = NOW;
  const calendarDate = new Date("2026-07-13T00:00:00.000Z");
  const basePreferences: StudyPlanPreferences = { courseSlug: "higher-maths", weeklyMinutes: 90, availableDays: ["mon", "wed", "sat"], assessments: [] };
  const initial = createInitialWeeklyPlan({ evidence: getEmptyProgressEvidence(), preferences: basePreferences, now, calendarDate });
  assert.equal(initial.rebalanceDiagnostics.reason, "initial_generation");

  const withAssessment: StudyPlanPreferences = { ...basePreferences, assessments: [wholeCourseAssessment("added", "2026-07-14")] };
  const afterAdd = rebalanceStudyPlan({ currentPlan: initial, evidence: getEmptyProgressEvidence(), preferences: withAssessment, now, calendarDate, reason: "evidence_changed" });
  assert.equal(afterAdd.rebalanceDiagnostics.reason, "preferences_changed", "adding an assessment must force the same hard-regeneration path used for weeklyMinutes/availableDays changes");

  const sameAssessmentAgain = rebalanceStudyPlan({ currentPlan: afterAdd, evidence: getEmptyProgressEvidence(), preferences: { ...withAssessment, assessments: [wholeCourseAssessment("added", "2026-07-14")] }, now, calendarDate, reason: "evidence_changed" });
  assert.notEqual(sameAssessmentAgain.rebalanceDiagnostics.reason, "preferences_changed", "an unchanged (order-independent, structurally equal) assessments array must not force a hard reconcile");
});

function wholeCourseAssessment(id: string, date: string): Assessment {
  return {
    id,
    courseSlug: "higher-maths",
    type: "final_exam",
    title: "Test assessment",
    date: { precision: "exact", date },
    scope: { kind: "whole_course" },
    source: "learner",
  };
}

function emptyEvidence(): ProgressEvidence {
  return {
    attempts: [],
    supportEvents: [],
    guidedSelfAssessments: [],
    achievementSnapshots: [],
    reviewEvents: [],
    flashcardReviews: [],
  };
}

function context(pathId: string): ResolvedSkillPath {
  const result = contentResolver.getPathContext(pathId);
  assert.ok(result);
  return result;
}
