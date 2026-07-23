import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import {
  appendAchievementTransitions,
  getHistoricalCompletionTimestamp,
  getLatestPathAchievement,
  getStrongestPathAchievement,
  wasStructuralVersionAchieved,
} from "../lib/progress/achievements";
import { resetPathProgress } from "../lib/progress/calculations";
import { createDefaultProgressPayload } from "../lib/progress/payload";
import { attempt, evidence } from "./progress-fixtures";

const path = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((item) => item.slug === "basic-differentiation");
assert.ok(path);
const questions = (path.learningStages ?? []).flatMap((stage) => stage.questionIds.map((questionId) => ({ questionId, stageId: stage.id })));
const context = { subjectId: "higher-maths", courseId: "calculus", skillPath: path,
  questionVersions: Object.fromEntries(questions.map(({ questionId }) => [questionId, 1])) };
let id = 0;
const ids = () => `snapshot_test_${++id}`;

function hintCompleted() {
  return evidence(questions.map((item, index) => attempt({ ...item, eventId: `a${index}`, sequence: index + 1,
    isCorrect: true, answer: "correct", hintViewedBeforeSubmission: true })));
}

test("upward stage and path transitions append immutable snapshots once", () => {
  const empty = evidence();
  const completed = appendAchievementTransitions(empty, hintCompleted(), context, "2026-07-13T10:00:00.000Z", ids);
  assert.equal(completed.achievementSnapshots.filter((item) => item.kind === "path_completed").length, 1);
  assert.equal(completed.achievementSnapshots.filter((item) => item.kind === "stage_completed").length, 3);

  const firstStageQuestion = questions[0];
  const secureEvidence = { ...completed, attempts: [...completed.attempts, attempt({ ...firstStageQuestion, eventId: "upgrade1", sequence: 20,
    isCorrect: true, answer: "correct", hintViewedBeforeSubmission: false })] };
  const secure = appendAchievementTransitions(completed, secureEvidence, context, "2026-07-13T11:00:00.000Z", ids);
  assert.ok(secure.achievementSnapshots.some((item) => item.kind === "stage_secure"));

  const masteredEvidence = { ...secure, attempts: [...secure.attempts, ...questions.slice(1).map((item, index) => attempt({
    ...item, eventId: `upgrade${index + 2}`, sequence: 21 + index, isCorrect: true, answer: "correct", hintViewedBeforeSubmission: false,
  }))] };
  const mastered = appendAchievementTransitions(secure, masteredEvidence, context, "2026-07-13T12:00:00.000Z", ids);
  assert.ok(mastered.achievementSnapshots.some((item) => item.kind === "stage_mastered"));
  assert.ok(mastered.achievementSnapshots.some((item) => item.kind === "path_secure"));
  assert.ok(mastered.achievementSnapshots.some((item) => item.kind === "path_mastered"));
  assert.equal(getStrongestPathAchievement(mastered.achievementSnapshots, path.slug)?.kind, "path_mastered");
  assert.equal(getLatestPathAchievement(mastered.achievementSnapshots, path.slug)?.kind, "path_mastered");
  assert.equal(getHistoricalCompletionTimestamp(mastered.achievementSnapshots, path.slug), "2026-07-13T10:00:00.000Z");
  assert.equal(wasStructuralVersionAchieved(mastered.achievementSnapshots, path.slug, path.pathVersion, "secure"), true);

  const refreshed = appendAchievementTransitions(mastered, mastered, context, "2026-07-13T13:00:00.000Z", ids);
  assert.equal(refreshed.achievementSnapshots.length, mastered.achievementSnapshots.length);
  const weaker = { ...mastered, attempts: [...mastered.attempts, attempt({ eventId: "later_weak", sequence: 99, isCorrect: false })] };
  assert.equal(appendAchievementTransitions(mastered, weaker, context, "2026-07-13T14:00:00.000Z", ids).achievementSnapshots.length,
    mastered.achievementSnapshots.length);
});

test("path reset clears live evidence and preserves snapshots", () => {
  const achieved = appendAchievementTransitions(evidence(), hintCompleted(), context, "2026-07-13T10:00:00.000Z", ids);
  const reset = resetPathProgress({ ...createDefaultProgressPayload(), data: achieved }, path.slug);
  assert.equal(reset.data.attempts.length, 0);
  assert.equal(reset.data.supportEvents.length, 0);
  assert.equal(reset.data.achievementSnapshots.length, achieved.achievementSnapshots.length);
});

test("a new structural version may earn a distinct snapshot while passive revision earns none", () => {
  const completed = appendAchievementTransitions(evidence(), hintCompleted(), context, "2026-07-13T10:00:00.000Z", ids);
  assert.equal(appendAchievementTransitions(completed, completed, context, "2026-07-13T11:00:00.000Z", ids).achievementSnapshots.length,
    completed.achievementSnapshots.length);
  const nextContext = { ...context, skillPath: { ...path, pathVersion: path.pathVersion + 1 } };
  const reearned = appendAchievementTransitions({ ...evidence(), achievementSnapshots: completed.achievementSnapshots },
    { ...hintCompleted(), achievementSnapshots: completed.achievementSnapshots }, nextContext, "2026-07-13T12:00:00.000Z", ids);
  assert.equal(reearned.achievementSnapshots.filter((item) => item.kind === "path_completed").length, 2);
});
