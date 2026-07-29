import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMaths } from "../data/higher-maths";
import { questions as legacyPhysicsQuestions } from "../data/questions";
import type { Question, Subject } from "../data/types";
import { markQuestionAnswer } from "../lib/answer-engine";
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

function basicDifferentiation(subject: Subject) {
  return subject.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
}

test("canonical content carries audited marking versions and revision 2 with active lifecycle", () => {
  for (const question of higherMathsDifferentiationQuestions) {
    const restricted = ["hm-calc-diff-basic-f-002", "hm-calc-diff-basic-f-003", "hm-calc-diff-basic-a-002"].includes(question.id);
    assert.equal(question.questionVersion, restricted ? 2 : 1);
    assert.equal(question.contentRevision, 2);
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
  const path = basicDifferentiation(subject);
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

test("active content rejects deferred strategies and units", () => {
  const deferred = cloneQuestions();
  (deferred[0] as unknown as { marking: unknown }).marking = { strategy: "lexical_alias", strategyVersion: 1 };
  assert.ok(reportFor(cloneSubject(), deferred).errors.some((issue) => issue.code === "invalid-marking-strategy"));
  const units = cloneQuestions();
  units[2].unit = "m";
  assert.ok(reportFor(cloneSubject(), units).errors.some((issue) => issue.code === "alpha-units-deferred"));
});

test("active content rejects unsupported marker versions and invalid presentation precision", () => {
  const unsupportedVersion = cloneQuestions();
  const versionQuestion = unsupportedVersion[0];
  (versionQuestion.marking as { strategyVersion: number }).strategyVersion = 2;
  assert.ok(reportFor(cloneSubject(), unsupportedVersion).errors.some((issue) => issue.code === "invalid-marking-strategy-version"));

  const invalidPresentation = cloneQuestions();
  const numericQuestion = invalidPresentation[2];
  if (numericQuestion.marking.strategy !== "numeric") throw new Error("Expected numeric fixture");
  numericQuestion.marking.presentation = { type: "decimal_places", places: -1 };
  assert.ok(reportFor(cloneSubject(), invalidPresentation).errors.some((issue) => issue.code === "invalid-numeric-presentation"));
});

test("relative tolerance with a zero target is rejected", () => {
  const questions = cloneQuestions();
  const numericQuestion = questions[2];
  if (numericQuestion.marking.strategy !== "numeric") throw new Error("Expected numeric fixture");
  numericQuestion.marking.target = "0";
  numericQuestion.marking.comparison = { type: "relative_tolerance", amount: "0.01" };
  assert.ok(reportFor(cloneSubject(), questions).errors.some((issue) => issue.code === "relative-tolerance-zero-target"));
});

test("multiple-choice contract authority must agree with legacy compatibility fields", () => {
  const coherent = cloneQuestions();
  coherent[0] = {
    ...coherent[0],
    answerType: "multiple_choice",
    correctAnswer: "a",
    acceptedAnswers: ["a"],
    options: [{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }],
    marking: { strategy: "multiple_choice", strategyVersion: 1, correctOptionId: "a" },
  };
  assert.deepEqual(reportFor(cloneSubject(), coherent).errors, []);
  assert.equal(markQuestionAnswer(coherent[0], "a").isCorrect, true);
  assert.equal(markQuestionAnswer(coherent[0], "b").isCorrect, false);

  const contradictory = structuredClone(coherent);
  if (contradictory[0].marking.strategy !== "multiple_choice") throw new Error("Expected multiple-choice fixture");
  contradictory[0].marking.correctOptionId = "b";
  assert.ok(reportFor(cloneSubject(), contradictory).errors.some((issue) =>
    issue.code === "contradictory-multiple-choice-authority"));

  const multipleAccepted = structuredClone(coherent);
  multipleAccepted[0].acceptedAnswers = ["a", "b"];
  assert.ok(reportFor(cloneSubject(), multipleAccepted).errors.some((issue) =>
    issue.code === "contradictory-multiple-choice-authority"));

  const missing = structuredClone(coherent);
  (missing[0].marking as { correctOptionId?: string }).correctOptionId = "";
  assert.ok(reportFor(cloneSubject(), missing).errors.some((issue) =>
    issue.code === "invalid-multiple-choice-contract"));

  const unknown = structuredClone(coherent);
  if (unknown[0].marking.strategy !== "multiple_choice") throw new Error("Expected multiple-choice fixture");
  unknown[0].marking.correctOptionId = "missing";
  assert.ok(reportFor(cloneSubject(), unknown).errors.some((issue) =>
    issue.code === "invalid-multiple-choice-contract"));
});

test("all eight production marking contracts execute their outcome-specific fixtures", () => {
  const report = reportFor();
  assert.ok(!report.errors.some((issue) => issue.code === "marking-fixture-mismatch"));
  assert.equal(higherMathsDifferentiationQuestions.length, 8);
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
  const stage = basicDifferentiation(subject)?.learningStages?.[0];
  assert.ok(stage);
  stage.contentStatus = "archived";
  assert.ok(reportFor(subject).errors.some((issue) => issue.code === "active-path-includes-archived-stage"));
});

test("invalid stage and path versions are rejected", () => {
  const subject = cloneSubject();
  const path = basicDifferentiation(subject);
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
  const note = basicDifferentiation(subject)?.notes?.[0];
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
