import assert from "node:assert/strict";
import test from "node:test";
import { createContentResolver } from "../lib/content-resolver";
import { deriveQuestionBankFilterOptions, queryAvailableQuestionBankQuestions } from "../lib/question-bank-query";
import {
  normalizeQuestionBankFilters,
  paginateQuestionIds,
  setQuestionGroupSelection,
  toggleQuestionSelection,
} from "../lib/question-bank-selection";
import { createCustomPracticeSession } from "../lib/practice/custom-practice";
import { evidence } from "./progress-fixtures";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";

test("active filter nodes derive only from published questions and compose across the full hierarchy", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const entries = queryAvailableQuestionBankQuestions(resolver, evidence());
  const options = deriveQuestionBankFilterOptions(entries);
  assert(options.skillPaths.some((item) => item.id === fixtureIds.path));
  assert(!options.skillPaths.some((item) => item.id === "chain-rule"));
  assert.equal(queryAvailableQuestionBankQuestions(resolver, evidence(), {
    courseAreaId: "calculus",
    specAreaId: "integration",
    skillPathId: fixtureIds.path,
    stageId: fixtureIds.foundationsStage,
  }).length, 2);
});

test("invalid child filters clear while valid parent-compatible values remain", () => {
  const options = deriveQuestionBankFilterOptions(queryAvailableQuestionBankQuestions(createContentResolver(createTwoPathFixture()), evidence()));
  assert.deepEqual(normalizeQuestionBankFilters({
    courseAreaId: "calculus",
    specAreaId: "differentiation",
    skillPathId: fixtureIds.path,
    stageId: fixtureIds.foundationsStage,
  }, options), {
    courseAreaId: "calculus",
    specAreaId: "differentiation",
    skillPathId: "",
    stageId: "",
  });
});

test("canonical selection persists across filters and group operations are deterministic and deduplicated", () => {
  let selected = new Set<string>();
  selected = toggleQuestionSelection(selected, "q-1", true);
  selected = setQuestionGroupSelection(selected, ["q-1", "q-2", "q-2"], true);
  assert.deepEqual([...selected], ["q-1", "q-2"]);
  selected = setQuestionGroupSelection(selected, ["q-2"], false);
  assert.deepEqual([...selected], ["q-1"]);
});

test("pagination preserves the complete selection and exposes stable ranges", () => {
  const ids = Array.from({ length: 55 }, (_, index) => `q-${index + 1}`);
  const selected = setQuestionGroupSelection(new Set<string>(), ids, true);
  assert.equal(selected.size, 55);
  assert.deepEqual(paginateQuestionIds(ids, 2), {
    page: 2, pageCount: 3, total: 55, start: 25, end: 48, questionIds: ids.slice(24, 48),
  });
});

test("custom sessions remove invalid and duplicate IDs, refuse empty sets and retain canonical order", () => {
  const source = createTwoPathFixture();
  const selected = [fixtureIds.questions[2], "missing", fixtureIds.questions[0], fixtureIds.questions[2]];
  const result = createCustomPracticeSession(selected, { source, now: new Date("2026-07-23T12:00:00.000Z") });
  assert(result.session);
  assert.deepEqual(result.validQuestionIds, [fixtureIds.questions[0], fixtureIds.questions[2]]);
  assert.equal(result.removedCount, 1);
  assert.equal(new Set(result.session.questionReferences.map((item) => item.questionId)).size, 2);
  assert.equal(createCustomPracticeSession(["missing"], { source }).session, null);
});

test("a deterministic 500-question fixture filters, selects and paginates without production content", () => {
  const source = createTwoPathFixture();
  const subject = source.subjects[0];
  const path = subject.courseAreas.find((area) => area.slug === "calculus")?.specAreas
    .find((area) => area.slug === "integration")?.skillPaths?.find((item) => item.slug === fixtureIds.path);
  assert(path?.learningStages);
  const base = source.questions.find((question) => question.id === fixtureIds.questions[0]);
  assert(base);
  const questions = Array.from({ length: 500 }, (_, index) => ({
    ...structuredClone(base),
    id: `perf-question-${String(index + 1).padStart(3, "0")}`,
    title: `Performance question ${index + 1}`,
    displayOrder: index + 1,
  }));
  path.learningStages[0].questionIds = questions.map((question) => question.id);
  path.learningStages[0].questions = 500;
  path.learningStages[1].questionIds = [];
  path.learningStages[1].questions = 0;
  path.questions = 500;
  const fixture = { subjects: source.subjects, questions: [...source.questions.filter((question) => question.skillPathId !== fixtureIds.path), ...questions] };
  const started = performance.now();
  const results = queryAvailableQuestionBankQuestions(createContentResolver(fixture), evidence(), { skillPathId: fixtureIds.path });
  const selected = setQuestionGroupSelection(new Set<string>(), results.map((entry) => entry.question.id), true);
  const firstPage = paginateQuestionIds(results.map((entry) => entry.question.id), 1);
  assert.equal(results.length, 500);
  assert.equal(selected.size, 500);
  assert.equal(firstPage.questionIds.length, 24);
  assert(performance.now() - started < 1_000);
});
