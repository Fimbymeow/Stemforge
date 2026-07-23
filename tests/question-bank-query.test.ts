import assert from "node:assert/strict";
import test from "node:test";
import { createContentResolver } from "../lib/content-resolver";
import { deriveCourseDashboardSummary } from "../lib/dashboard-derivations";
import { queryAvailableQuestionBankQuestions, queryQuestionBank } from "../lib/question-bank-query";
import { attempt, evidence } from "./progress-fixtures";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";

test("question-bank search is case-insensitive, whitespace-tolerant and matches question fields", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const results = queryQuestionBank(resolver, evidence(), { search: "  INTEGRATION   QUESTION 2 " });
  assert.deepEqual(results.map((entry) => entry.id), [fixtureIds.path]);
  assert.ok(results[0].questions.some((question) => question.id === fixtureIds.questions[1]));
});

test("combined stage and progress filters use existing progress semantics", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const activity = evidence([
    attempt({
      questionId: fixtureIds.questions[0],
      skillPathId: fixtureIds.path,
      stageId: fixtureIds.foundationsStage,
      eventId: "attempt_fixture_review",
      isCorrect: true,
      answer: "5x^4",
      hintViewedBeforeSubmission: true,
    }),
  ]);
  assert.deepEqual(
    queryQuestionBank(resolver, activity, { progressFilter: "in-progress", stageFilter: "Foundations" }).map((entry) => entry.id),
    [fixtureIds.path],
  );
  assert.deepEqual(
    queryQuestionBank(resolver, activity, { progressFilter: "review-recommended" }).map((entry) => entry.id),
    [fixtureIds.path],
  );
  assert.deepEqual(queryQuestionBank(resolver, activity, { progressFilter: "completed" }), []);
});

test("default, recent, review and completion sorts are deterministic", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const activity = evidence([
    attempt({ eventId: "attempt_basic_older", attemptedAt: "2026-07-14T09:00:00.000Z", isCorrect: true, answer: "5x^4" }),
    attempt({
      questionId: fixtureIds.questions[0],
      skillPathId: fixtureIds.path,
      stageId: fixtureIds.foundationsStage,
      eventId: "attempt_fixture_newer",
      attemptedAt: "2026-07-14T10:00:00.000Z",
      isCorrect: true,
      answer: "5x^4",
      hintViewedBeforeSubmission: true,
    }),
  ]);
  const defaults = queryQuestionBank(resolver, activity);
  assert.equal(defaults[0].id, "basic-differentiation");
  assert.equal(queryQuestionBank(resolver, activity, { sort: "recently-practised" })[0].id, fixtureIds.path);
  assert.equal(queryQuestionBank(resolver, activity, { sort: "review-priority" })[0].id, fixtureIds.path);
  assert.equal(queryQuestionBank(resolver, activity, { sort: "completion-status" })[0].id, "basic-differentiation");
});

test("two paths keep progress totals isolated and expose path-agnostic dashboard inputs", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const activity = evidence([
    attempt({
      questionId: fixtureIds.questions[0],
      skillPathId: fixtureIds.path,
      stageId: fixtureIds.foundationsStage,
      eventId: "attempt_fixture_only",
      isCorrect: true,
      answer: "5x^4",
    }),
  ]);
  const availablePaths = resolver.getAllPathContexts().map((context) => context.skillPath).filter((path) => path.isAvailable);
  const summary = deriveCourseDashboardSummary(availablePaths, activity, resolver.getQuestionVersions());
  const basic = summary.paths.find((path) => path.skillPathId === "basic-differentiation");
  const fixture = summary.paths.find((path) => path.skillPathId === fixtureIds.path);
  assert.ok(basic && fixture);
  assert.equal(basic.completedQuestions, 0);
  assert.equal(basic.totalQuestions, 8);
  assert.equal(fixture.completedQuestions, 1);
  assert.equal(fixture.totalQuestions, 3);
  assert.equal(fixture.currentStageId, fixtureIds.foundationsStage);
  assert.equal(summary.completedQuestions, 1);
  assert.equal(summary.totalQuestions, 11);
});

test("empty filters are safe and unavailable zero-question paths do not masquerade as progress states", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  assert.equal(queryQuestionBank(resolver, evidence()).length, 2);
  assert.deepEqual(queryQuestionBank(resolver, evidence(), { search: "no such curriculum item" }), []);
  const notStarted = queryQuestionBank(resolver, evidence(), { progressFilter: "not-started" });
  assert.deepEqual(notStarted.map((entry) => entry.id), ["basic-differentiation", fixtureIds.path]);
});

test("available-question query exposes real questions before unavailable catalogue inventory", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const questions = queryAvailableQuestionBankQuestions(resolver, evidence());
  assert.equal(questions.length, 11);
  assert(questions.every((entry) => entry.context.skillPath.isAvailable));
  assert.equal(new Set(questions.map((entry) => entry.question.id)).size, questions.length);
});

test("available-question filters operate on question progress rather than whole-path status", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const activity = evidence([
    attempt({
      questionId: fixtureIds.questions[0],
      skillPathId: fixtureIds.path,
      stageId: fixtureIds.foundationsStage,
      eventId: "question-level-review",
      isCorrect: true,
      hintViewedBeforeSubmission: true,
    }),
  ]);
  assert.deepEqual(
    queryAvailableQuestionBankQuestions(resolver, activity, { progressFilter: "review-recommended" }).map((entry) => entry.question.id),
    [fixtureIds.questions[0]],
  );
  assert(!queryAvailableQuestionBankQuestions(resolver, activity, { progressFilter: "not-started" }).some((entry) => entry.question.id === fixtureIds.questions[0]));
});
