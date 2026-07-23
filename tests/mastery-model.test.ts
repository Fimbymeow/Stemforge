import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { calculateSkillPathProgress, calculateStageProgress } from "../lib/progress/calculations";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

const path = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((item) => item.slug === "basic-differentiation");
assert.ok(path);
const stages = path.learningStages ?? [];

function allQuestionIds() {
  return stages.flatMap((stage) => stage.questionIds.map((questionId) => ({ questionId, stageId: stage.id })));
}

test("a fully independent path is mastered", () => {
  const attempts = allQuestionIds().map((item, index) => attempt({ ...item, sequence: index + 1, isCorrect: true, answer: "correct" }));
  const progress = calculateSkillPathProgress(path, evidence(attempts));
  assert.equal(progress.status, "mastered");
  assert.equal(progress.masteryScore, 100);
  assert.equal(progress.independentPerformancePercentage, 100);
});

test("independent correct after errors produces a secure path", () => {
  const attempts = allQuestionIds().flatMap((item, index) => [
    attempt({ ...item, sequence: index * 2 + 1 }),
    attempt({ ...item, sequence: index * 2 + 2, isCorrect: true, answer: "correct" }),
  ]);
  const progress = calculateSkillPathProgress(path, evidence(attempts));
  assert.equal(progress.status, "secure");
  assert.equal(progress.masteryScore, 85);
});

test("solution-completed path is complete without being secure", () => {
  const attempts = allQuestionIds().map((item, index) => attempt({ ...item, sequence: index * 2 + 1 }));
  const events = allQuestionIds().map((item, index) => supportEvent({ ...item, type: "solution_viewed", sequence: index * 2 + 2 }));
  const progress = calculateSkillPathProgress(path, evidence(attempts, events));
  assert.equal(progress.status, "completed");
  assert.equal(progress.completionPercentage, 100);
  assert.equal(progress.masteryScore, 35);
});

test("hint-correct counts as correct without a worked solution but cannot alone reach secure", () => {
  const stage = stages[0];
  const attempts = stage.questionIds.map((questionId, index) => attempt({
    questionId,
    stageId: stage.id,
    sequence: index + 1,
    isCorrect: true,
    answer: "correct",
    hintViewedBeforeSubmission: true,
  }));
  const progress = calculateStageProgress(path, stage, evidence(attempts));
  assert.equal(progress.independentPerformancePercentage, 100);
  assert.equal(progress.masteryScore, 70);
  assert.equal(progress.status, "completed");
});

test("missing Past Paper-style stage redistributes weights proportionally", () => {
  const reduced = { ...path, learningStages: stages.slice(0, 2) };
  const attempts = reduced.learningStages.flatMap((stage) => stage.questionIds.map((questionId, index) => attempt({
    questionId,
    stageId: stage.id,
    sequence: index + 1,
    isCorrect: true,
    answer: "correct",
  })));
  const progress = calculateSkillPathProgress(reduced, evidence(attempts));
  assert.equal(progress.masteryScore, 100);
  assert.equal(progress.status, "mastered");
});

test("new active questions recalculate current completion without deleting evidence", () => {
  const stage = stages[0];
  const attempts = stage.questionIds.map((questionId, index) => attempt({ questionId, stageId: stage.id, sequence: index + 1, isCorrect: true }));
  const expanded = { ...path, learningStages: [{ ...stage, questionIds: [...stage.questionIds, "new-active-question"] }] };
  const progress = calculateSkillPathProgress(expanded, evidence(attempts));
  assert.equal(progress.completedQuestionIds.length, stage.questionIds.length);
  assert.equal(progress.totalQuestions, stage.questionIds.length + 1);
  assert.ok(progress.completionPercentage < 100);
});
