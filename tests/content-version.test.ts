import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { higherMaths } from "../data/higher-maths";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import type { Question, Subject } from "../data/types";
import {
  createActiveSkillPathView,
  getActiveQuestionById,
  getActiveQuestions,
  getQuestionByIdIncludingArchived,
} from "../lib/content-selectors";
import { validateContent } from "../lib/content-validation";

const cloneSubject = (): Subject => structuredClone(higherMaths);
const cloneQuestions = (): Question[] => structuredClone(higherMathsDifferentiationQuestions);

function reportFor(subject = cloneSubject(), questions = cloneQuestions()) {
  return validateContent({ subjects: [subject], questions });
}

test("canonical content starts at conservative version and revision 1 with active lifecycle", () => {
  for (const question of higherMathsDifferentiationQuestions) {
    assert.equal(question.questionVersion, 1);
    assert.equal(question.contentRevision, 1);
    assert.equal(question.contentStatus, "active");
  }
  const paths = higherMaths.courseAreas.flatMap((course) => course.specAreas.flatMap((area) => area.skillPaths ?? []));
  assert.ok(paths.length > 0);
  assert.ok(paths.every((path) => path.pathVersion === 1 && path.contentStatus === "active"));
  assert.ok(paths.flatMap((path) => path.learningStages ?? []).every((stage) => stage.stageVersion === 1 && stage.contentStatus === "active"));
});

test("active selectors preserve order, exclude archives, and support explicit historical lookup", () => {
  const questions = cloneQuestions();
  const archived = { ...structuredClone(questions[0]), questionVersion: 2, contentStatus: "archived" as const };
  questions.splice(1, 0, archived);
  assert.deepEqual(getActiveQuestions(questions).map((question) => question.id), higherMathsDifferentiationQuestions.map((question) => question.id));
  assert.equal(getActiveQuestionById(questions, archived.id)?.questionVersion, 1);
  assert.equal(getQuestionByIdIncludingArchived(questions, archived.id, 2)?.contentStatus, "archived");
});

test("active path view excludes archived stages/questions and recalculates counts", () => {
  const subject = cloneSubject();
  const path = subject.courseAreas[0].specAreas[0].skillPaths?.[0];
  assert.ok(path?.learningStages);
  const questions = cloneQuestions();
  questions[0].contentStatus = "archived";
  path.learningStages[1].contentStatus = "archived";
  const view = createActiveSkillPathView(path, questions);
  assert.equal(view.learningStages?.length, 2);
  assert.ok(!view.learningStages?.flatMap((stage) => stage.questionIds).includes(questions[0].id));
  assert.equal(view.questions, view.learningStages?.reduce((total, stage) => total + stage.questions, 0));
});

test("current canonical version metadata validates", () => {
  assert.deepEqual(reportFor().errors, []);
});

for (const invalid of [undefined, 0, -1, 1.5, "1"]) {
  test(`invalid questionVersion ${String(invalid)} is rejected`, () => {
    const questions = cloneQuestions();
    (questions[0] as unknown as { questionVersion: unknown }).questionVersion = invalid;
    assert.ok(reportFor(cloneSubject(), questions).errors.some((issue) => issue.code === "invalid-question-version"));
  });
}

test("invalid lifecycle status is rejected", () => {
  const questions = cloneQuestions();
  (questions[0] as unknown as { contentStatus: unknown }).contentStatus = "published";
  assert.ok(reportFor(cloneSubject(), questions).errors.some((issue) => issue.code === "invalid-content-status"));
});

test("duplicate logical ID and question version pair is rejected", () => {
  const questions = cloneQuestions();
  questions.push(structuredClone(questions[0]));
  assert.ok(reportFor(cloneSubject(), questions).errors.some((issue) => issue.code === "duplicate-question-version"));
});

test("two active versions of one logical question are rejected", () => {
  const questions = cloneQuestions();
  questions.push({ ...structuredClone(questions[0]), questionVersion: 2 });
  assert.ok(reportFor(cloneSubject(), questions).errors.some((issue) => issue.code === "multiple-active-question-versions"));
});

test("an archived historical question version is valid beside one active version", () => {
  const questions = cloneQuestions();
  questions.push({ ...structuredClone(questions[0]), questionVersion: 2, contentStatus: "archived" });
  assert.deepEqual(reportFor(cloneSubject(), questions).errors, []);
});

test("active stage cannot reference a question with archived versions only", () => {
  const questions = cloneQuestions();
  questions[0].contentStatus = "archived";
  assert.ok(reportFor(cloneSubject(), questions).errors.some((issue) => issue.code === "active-stage-references-archived-question"));
});

test("active path cannot contain an archived stage", () => {
  const subject = cloneSubject();
  const stage = subject.courseAreas[0].specAreas[0].skillPaths?.[0].learningStages?.[0];
  assert.ok(stage);
  stage.contentStatus = "archived";
  assert.ok(reportFor(subject).errors.some((issue) => issue.code === "active-path-includes-archived-stage"));
});

test("invalid stage and path versions are rejected", () => {
  const subject = cloneSubject();
  const path = subject.courseAreas[0].specAreas[0].skillPaths?.[0];
  const stage = path?.learningStages?.[0];
  assert.ok(path && stage);
  path.pathVersion = 0;
  stage.stageVersion = 1.5;
  const codes = reportFor(subject).errors.map((issue) => issue.code);
  assert.ok(codes.includes("invalid-path-version"));
  assert.ok(codes.includes("invalid-stage-version"));
});

test("resource revisions and lifecycle are validated", () => {
  const subject = cloneSubject();
  const note = subject.courseAreas[0].specAreas[0].skillPaths?.[0].notes?.[0];
  assert.ok(note);
  note.contentRevision = -1;
  (note as unknown as { contentStatus: unknown }).contentStatus = "retired";
  const codes = reportFor(subject).errors.map((issue) => issue.code);
  assert.ok(codes.includes("invalid-content-revision"));
  assert.ok(codes.includes("invalid-content-status"));
});

test("legacy Physics compatibility warning remains expected", () => {
  const report = validateContent({ subjects: [cloneSubject()], questions: cloneQuestions(), legacyQuestions: legacyPhysicsQuestions });
  assert.ok(report.warnings.some((issue) => issue.code === "legacy-question-system"));
});
