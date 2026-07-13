import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { higherMaths } from "../data/higher-maths";
import type { Question, Subject } from "../data/types";
import { validateContent } from "../lib/content-validation";

function cloneSubject(): Subject {
  return structuredClone(higherMaths);
}

function cloneQuestions(): Question[] {
  return structuredClone(higherMathsDifferentiationQuestions);
}

test("current Higher Maths content has no validation errors", () => {
  const report = validateContent({ subjects: [cloneSubject()], questions: cloneQuestions() });
  assert.deepEqual(report.errors, []);
});

test("duplicate question IDs fail validation", () => {
  const questions = cloneQuestions();
  questions.push(structuredClone(questions[0]));
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-question-id"));
});

test("missing stage question references fail validation", () => {
  const subject = cloneSubject();
  const stage = subject.courseAreas[0].specAreas[0].skillPaths?.[0].learningStages?.[0];
  assert.ok(stage);
  stage.questionIds.push("hm-calc-diff-basic-f-999");
  stage.questions = stage.questionIds.length;
  const report = validateContent({ subjects: [subject], questions: cloneQuestions() });
  assert.ok(report.errors.some((issue) => issue.code === "missing-question-reference"));
});

test("invalid auto-marked answer structures fail validation", () => {
  const questions = cloneQuestions();
  questions[0].acceptedAnswers = [];
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "empty-accepted-answers"));
});

test("mismatched question relationships fail validation", () => {
  const questions = cloneQuestions();
  questions[0].stageId = "missing-stage";
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-stage-reference"));
});
