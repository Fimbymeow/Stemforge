import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import {
  calculateSkillPathProgress,
  getQuestionProgressForVersion,
  selectNextQuestionId,
} from "../lib/progress/calculations";
import { getVersionEvidenceForQuestion } from "../lib/local-progress";
import { attempt, evidence, QUESTION_ID, supportEvent } from "./progress-fixtures";

const skillPath = structuredClone(higherMaths.courseAreas[0].specAreas[0].skillPaths?.[0]);
assert.ok(skillPath);
const versionsV1 = Object.fromEntries(skillPath.learningStages?.flatMap((stage) => stage.questionIds.map((id) => [id, 1])) ?? []);

test("canonical submission boundary resolves the active version without hard-coding it in components", () => {
  assert.deepEqual(getVersionEvidenceForQuestion(QUESTION_ID), { kind: "known", questionVersion: 1 });
  assert.deepEqual(getVersionEvidenceForQuestion("unknown-or-legacy-question"), { kind: "unknown_legacy", questionVersion: null });
});

test("current-version correct evidence completes and masters the current question", () => {
  const state = getQuestionProgressForVersion(QUESTION_ID, 1, evidence([attempt({ isCorrect: true })]));
  assert.equal(state.currentVersionCompleted, true);
  assert.equal(state.historicalCompleted, true);
  assert.equal(state.masteryContribution, 1);
  assert.equal(state.reassessment, "none");
});

test("current-version solution evidence completes with the existing supported contribution", () => {
  const state = getQuestionProgressForVersion(QUESTION_ID, 1, evidence(
    [attempt()],
    [supportEvent({ type: "solution_viewed", afterGenuineAttempt: true })],
  ));
  assert.equal(state.currentVersionCompleted, true);
  assert.equal(state.bestOutcome, "completed_with_solution");
  assert.equal(state.masteryContribution, 0.35);
});

test("current-version incorrect-only evidence remains unresolved", () => {
  const state = getQuestionProgressForVersion(QUESTION_ID, 1, evidence([attempt()]));
  assert.equal(state.currentVersionAttempted, true);
  assert.equal(state.currentVersionCompleted, false);
  assert.equal(state.bestOutcome, "attempted_unresolved");
});

test("older known completion and mastery remain historical while reassessment is required", () => {
  const old = attempt({ isCorrect: true, versionEvidence: { kind: "known", questionVersion: 1 } });
  const state = getQuestionProgressForVersion(QUESTION_ID, 2, evidence([old]));
  assert.equal(state.historicalCompleted, true);
  assert.equal(state.historicalBestOutcome, "independently_correct_first_attempt");
  assert.equal(state.historicalMasteryContribution, 1);
  assert.equal(state.currentVersionCompleted, false);
  assert.equal(state.masteryContribution, 0);
  assert.equal(state.reassessment, "required");
});

test("a new version creates a fresh first-attempt opportunity and can regain current readiness", () => {
  const oldWrong = attempt({ sequence: 1, versionEvidence: { kind: "known", questionVersion: 1 } });
  const currentCorrect = attempt({ sequence: 2, isCorrect: true, versionEvidence: { kind: "known", questionVersion: 2 } });
  const state = getQuestionProgressForVersion(QUESTION_ID, 2, evidence([oldWrong, currentCorrect]));
  assert.equal(state.bestOutcome, "independently_correct_first_attempt");
  assert.equal(state.currentVersionCompleted, true);
  assert.equal(state.reassessment, "none");
});

test("unknown legacy completion is preserved but does not prove current-version mastery", () => {
  const unknown = attempt({
    isCorrect: true,
    supportKnowledge: "unknown_legacy",
    versionEvidence: { kind: "unknown_legacy", questionVersion: null },
  });
  const unchanged = getQuestionProgressForVersion(QUESTION_ID, 1, evidence([unknown]));
  assert.equal(unchanged.completed, true);
  assert.equal(unchanged.currentVersionCompleted, false);
  assert.equal(unchanged.historicalCompleted, true);
  assert.equal(unchanged.reassessment, "recommended");
  assert.equal(unchanged.masteryContribution, 0);

  const materiallyUpdated = getQuestionProgressForVersion(QUESTION_ID, 2, evidence([unknown]));
  assert.equal(materiallyUpdated.completed, false);
  assert.equal(materiallyUpdated.reassessment, "required");
});

test("content revision changes alone do not affect evidence scoped to the same assessment version", () => {
  const stateBefore = getQuestionProgressForVersion(QUESTION_ID, 1, evidence([attempt({ isCorrect: true })]));
  const stateAfterRevision = getQuestionProgressForVersion(QUESTION_ID, 1, evidence([attempt({ isCorrect: true })]));
  assert.deepEqual(stateAfterRevision, stateBefore);
});

test("stage and path current mastery use current-version evidence only", () => {
  const records = skillPath.learningStages?.flatMap((stage) => stage.questionIds.map((questionId, index) =>
    attempt({
      questionId,
      stageId: stage.id,
      sequence: index + 1,
      isCorrect: true,
      versionEvidence: { kind: "known", questionVersion: 1 },
    }),
  )) ?? [];
  const currentVersions = { ...versionsV1, [QUESTION_ID]: 2 };
  const progress = calculateSkillPathProgress(skillPath, evidence(records), currentVersions);
  assert.equal(progress.historicalCompletionPercentage, 100);
  assert.equal(progress.currentVersionCompletionPercentage, 88);
  assert.equal(progress.historicalStatus, "mastered");
  assert.equal(progress.currentVersionStatus, "in_progress");
  assert.ok(progress.reassessmentRequiredQuestionIds.includes(QUESTION_ID));
  assert.equal(selectNextQuestionId(skillPath, evidence(records), currentVersions), QUESTION_ID);
});

test("new active questions enter current totals while prior evidence remains intact", () => {
  const path = structuredClone(skillPath);
  const stage = path.learningStages?.[0];
  assert.ok(stage);
  stage.questionIds.push("new-active-question");
  stage.questions = stage.questionIds.length;
  const prior = stage.questionIds.slice(0, -1).map((questionId, index) => attempt({
    questionId,
    stageId: stage.id,
    sequence: index + 1,
    isCorrect: true,
  }));
  const progress = calculateSkillPathProgress(path, evidence(prior), { ...versionsV1, "new-active-question": 1 });
  assert.equal(progress.totalQuestions, 9);
  assert.equal(progress.completedQuestionIds.length, 3);
  assert.equal(progress.newPracticeAvailable, true);
});

test("archived or removed questions leave active totals but retain queryable history", () => {
  const path = structuredClone(skillPath);
  const removedId = path.learningStages?.[0].questionIds.shift();
  assert.ok(removedId);
  const oldEvidence = evidence([attempt({ questionId: removedId, isCorrect: true })]);
  const progress = calculateSkillPathProgress(path, oldEvidence, versionsV1);
  assert.equal(progress.totalQuestions, 7);
  assert.ok(!progress.completedQuestionIds.includes(removedId));
  assert.equal(getQuestionProgressForVersion(removedId, 1, oldEvidence).historicalCompleted, true);
});
