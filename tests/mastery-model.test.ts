import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { calculateSkillPathProgress, calculateStageProgress } from "../lib/progress/calculations";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

const path = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((item) => item.slug === "basic-differentiation");
assert.ok(path);
const stages = path.learningStages ?? [];
const questionVersions = Object.fromEntries(higherMathsDifferentiationQuestions.map((question) => [question.id, question.questionVersion]));

function allQuestionIds() {
  return stages.flatMap((stage) => stage.questionIds.map((questionId) => ({ questionId, stageId: stage.id })));
}

function currentAttempt(item: { questionId: string; stageId: string }, overrides: Parameters<typeof attempt>[0] = {}) {
  return attempt({ ...item, versionEvidence: { kind: "known", questionVersion: questionVersions[item.questionId] ?? 1 }, ...overrides });
}

test("a fully independent path is mastered", () => {
  const attempts = allQuestionIds().map((item, index) => currentAttempt(item, { sequence: index + 1, isCorrect: true, answer: "correct" }));
  const progress = calculateSkillPathProgress(path, evidence(attempts), questionVersions);
  assert.equal(progress.status, "mastered");
  assert.equal(progress.masteryScore, 100);
  assert.equal(progress.independentPerformancePercentage, 100);
});

test("independent correct after errors produces a secure path", () => {
  const attempts = allQuestionIds().flatMap((item, index) => [
    currentAttempt(item, { sequence: index * 2 + 1 }),
    currentAttempt(item, { sequence: index * 2 + 2, isCorrect: true, answer: "correct" }),
  ]);
  const progress = calculateSkillPathProgress(path, evidence(attempts), questionVersions);
  assert.equal(progress.status, "secure");
  assert.equal(progress.masteryScore, 85);
});

test("solution-completed path is complete without being secure", () => {
  const attempts = allQuestionIds().map((item, index) => currentAttempt(item, { sequence: index * 2 + 1 }));
  const events = allQuestionIds().map((item, index) => supportEvent({ ...item, versionEvidence: { kind: "known", questionVersion: questionVersions[item.questionId] ?? 1 }, type: "solution_viewed", sequence: index * 2 + 2 }));
  const progress = calculateSkillPathProgress(path, evidence(attempts, events), questionVersions);
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
  const currentAttempts = attempts.map((item) => ({ ...item, versionEvidence: { kind: "known" as const, questionVersion: questionVersions[item.questionId] ?? 1 } }));
  const progress = calculateStageProgress(path, stage, evidence(currentAttempts), questionVersions);
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
  const currentAttempts = attempts.map((item) => ({ ...item, versionEvidence: { kind: "known" as const, questionVersion: questionVersions[item.questionId] ?? 1 } }));
  const progress = calculateSkillPathProgress(reduced, evidence(currentAttempts), questionVersions);
  assert.equal(progress.masteryScore, 100);
  assert.equal(progress.status, "mastered");
});

test("new active questions recalculate current completion without deleting evidence", () => {
  const stage = stages[0];
  const attempts = stage.questionIds.map((questionId, index) => attempt({ questionId, stageId: stage.id, sequence: index + 1, isCorrect: true }));
  const expanded = { ...path, learningStages: [{ ...stage, questionIds: [...stage.questionIds, "new-active-question"] }] };
  const currentAttempts = attempts.map((item) => ({ ...item, versionEvidence: { kind: "known" as const, questionVersion: questionVersions[item.questionId] ?? 1 } }));
  const progress = calculateSkillPathProgress(expanded, evidence(currentAttempts), questionVersions);
  assert.equal(progress.completedQuestionIds.length, stage.questionIds.length);
  assert.equal(progress.totalQuestions, stage.questionIds.length + 1);
  assert.ok(progress.completionPercentage < 100);
});
