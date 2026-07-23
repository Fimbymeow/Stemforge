import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import {
  calculateDashboardSummary,
  calculateSkillPathProgress,
  calculateStageProgress,
  getQuestionProgress,
  isGenuineAnswer,
  recordQuestionSubmission,
  resetPathProgress,
  selectNextQuestionId,
} from "../lib/progress/calculations";
import { createDefaultProgressPayload } from "../lib/progress/payload";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

const skillPath = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
assert.ok(skillPath);
const foundations = skillPath.learningStages?.[0];
assert.ok(foundations);

test("genuine attempt requires non-whitespace submitted input", () => {
  assert.equal(isGenuineAnswer(""), false);
  assert.equal(isGenuineAnswer("  \n"), false);
  assert.equal(isGenuineAnswer("0"), true);
  assert.equal(isGenuineAnswer("wrong"), true);
});

test("incorrect alone is attempted but unresolved and incomplete", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([attempt()]));
  assert.equal(state.attempted, true);
  assert.equal(state.completed, false);
  assert.equal(state.bestOutcome, "attempted_unresolved");
  assert.equal(state.masteryContribution, 0.1);
  assert.equal(state.navigationEligible, false);
});

test("correct first attempt completes with full mastery evidence", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([attempt({ isCorrect: true, answer: "5x^4" })]));
  assert.equal(state.bestOutcome, "independently_correct_first_attempt");
  assert.equal(state.completed, true);
  assert.equal(state.masteryContribution, 1);
});

test("incorrect then independent correct earns 0.85", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([
    attempt(),
    attempt({ sequence: 2, isCorrect: true, answer: "5x^4" }),
  ]));
  assert.equal(state.bestOutcome, "independently_correct_after_error");
  assert.equal(state.masteryContribution, 0.85);
});

test("hint-assisted correct earns 0.70 and review", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([
    attempt({ isCorrect: true, answer: "5x^4", hintViewedBeforeSubmission: true }),
  ], [supportEvent({ type: "hint_viewed", afterGenuineAttempt: false })]));
  assert.equal(state.bestOutcome, "correct_with_hint");
  assert.equal(state.masteryContribution, 0.7);
  assert.equal(state.reviewRecommended, true);
});

test("solution after an attempt completes and recommends review", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([attempt()], [supportEvent({ type: "solution_viewed" })]));
  assert.equal(state.bestOutcome, "completed_with_solution");
  assert.equal(state.completed, true);
  assert.equal(state.masteryContribution, 0.35);
  assert.equal(state.reviewRecommended, true);
});

test("solution before a genuine attempt does not complete", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([], [supportEvent({ type: "solution_viewed", afterGenuineAttempt: false })]));
  assert.equal(state.completed, false);
  assert.equal(state.bestOutcome, "not_attempted");
});

test("a later incorrect result does not erase a stronger outcome", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([
    attempt({ isCorrect: true, answer: "5x^4" }),
    attempt({ sequence: 2, isCorrect: false }),
  ]));
  assert.equal(state.bestOutcome, "independently_correct_first_attempt");
  assert.equal(state.latestResult, false);
  assert.equal(state.reviewRecommended, true);
});

test("solution-assisted work can later improve to independent correct", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([
    attempt(),
    attempt({ sequence: 3, isCorrect: true, answer: "5x^4" }),
  ], [supportEvent({ type: "solution_viewed", sequence: 2 })]));
  assert.equal(state.bestOutcome, "independently_correct_after_error");
  assert.equal(state.masteryContribution, 0.85);
});

test("two incorrect attempts recommend review", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([attempt(), attempt({ sequence: 2 })]));
  assert.equal(state.reviewRecommended, true);
});

test("legacy incorrect completion remains compatibility-complete but not current-version mastered", () => {
  const state = getQuestionProgress(attempt().questionId, evidence([attempt({
    supportKnowledge: "unknown_legacy",
    legacyCompleted: true,
    versionEvidence: { kind: "unknown_legacy", questionVersion: null },
  })]));
  assert.equal(state.completed, true);
  assert.equal(state.currentVersionCompleted, false);
  assert.equal(state.bestOutcome, "not_attempted");
  assert.equal(state.historicalBestOutcome, "legacy_completed");
  assert.equal(state.masteryContribution, 0);
});

test("empty path is not started with null accuracy", () => {
  const progress = calculateSkillPathProgress(skillPath, evidence());
  assert.equal(progress.status, "not_started");
  assert.equal(progress.completionPercentage, 0);
  assert.equal(progress.firstAttemptAccuracyPercentage, null);
});

test("incorrect attempt starts stage without completing it", () => {
  const progress = calculateStageProgress(skillPath, foundations, evidence([attempt()]));
  assert.equal(progress.status, "in_progress");
  assert.equal(progress.attemptedCount, 1);
  assert.equal(progress.completedQuestionIds.length, 0);
  assert.equal(progress.firstAttemptAccuracyPercentage, 0);
});

test("first and latest accuracy remain distinct", () => {
  const data = evidence([attempt(), attempt({ sequence: 2, isCorrect: true, answer: "5x^4" })]);
  const progress = calculateStageProgress(skillPath, foundations, data);
  assert.equal(progress.firstAttemptAccuracyPercentage, 0);
  assert.equal(progress.latestAttemptAccuracyPercentage, 100);
});

test("all independently correct questions master a stage", () => {
  const attempts = foundations.questionIds.map((questionId, index) => attempt({ questionId, sequence: index + 1, isCorrect: true, answer: "correct" }));
  const progress = calculateStageProgress(skillPath, foundations, evidence(attempts));
  assert.equal(progress.status, "mastered");
  assert.equal(progress.completionPercentage, 100);
  assert.equal(progress.masteryScore, 100);
});

test("completed-with-solution stage is completed but not secure", () => {
  const attempts = foundations.questionIds.map((questionId, index) => attempt({ questionId, sequence: index * 2 + 1 }));
  const events = foundations.questionIds.map((questionId, index) => supportEvent({ questionId, type: "solution_viewed", sequence: index * 2 + 2 }));
  const progress = calculateStageProgress(skillPath, foundations, evidence(attempts, events));
  assert.equal(progress.status, "completed");
  assert.equal(progress.masteryScore, 35);
});

test("dashboard completion uses completed questions, not attempts", () => {
  const summary = calculateDashboardSummary(skillPath, evidence([attempt()]));
  assert.equal(summary.attemptedCount, 1);
  assert.equal(summary.completedCount, 0);
  assert.equal(summary.completionPercentage, 0);
});

test("next question remains current until it is completed", () => {
  assert.equal(selectNextQuestionId(skillPath, evidence([attempt()])), attempt().questionId);
  assert.equal(selectNextQuestionId(skillPath, evidence([attempt({ isCorrect: true })])), foundations.questionIds[1]);
});

test("removed questions do not affect current totals and added questions do", () => {
  const removed = attempt({ questionId: "removed-question" });
  assert.equal(calculateSkillPathProgress(skillPath, evidence([removed])).attemptedCount, 0);
  const expanded = { ...skillPath, learningStages: [{ ...foundations, questionIds: [...foundations.questionIds, "new-question"] }] };
  assert.equal(calculateSkillPathProgress(expanded, evidence()).totalQuestions, foundations.questionIds.length + 1);
});

test("recording and path reset are immutable and include events", () => {
  const original = createDefaultProgressPayload();
  const recorded = recordQuestionSubmission(original, attempt({ isCorrect: true }));
  assert.equal(original.data.attempts.length, 0);
  assert.equal(recorded.data.attempts.length, 1);
  const withOther = { ...recorded, data: { ...recorded.data, attempts: [...recorded.data.attempts, attempt({ skillPathId: "other" })], supportEvents: [supportEvent(), supportEvent({ skillPathId: "other" })] } };
  const reset = resetPathProgress(withOther, "basic-differentiation");
  assert.equal(reset.data.attempts.length, 1);
  assert.equal(reset.data.supportEvents.length, 1);
});
