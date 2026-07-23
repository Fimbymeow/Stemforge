import test from "node:test";
import assert from "node:assert/strict";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { attempt, evidence } from "./progress-fixtures";
import {
  createQuickPracticeSelection,
  getContextualResourceHref,
  getRelatedQuestionsForResource,
  getRelatedResourcesForQuestion,
  QUICK_PRACTICE_QUESTION_COUNT,
} from "../lib/study-context";

test("Quick Practice selects the preferred available path with a short untimed pinned session", () => {
  const source = createTwoPathFixture();
  const quick = createQuickPracticeSelection({
    evidence: evidence(),
    preferredPathId: fixtureIds.path,
    source,
    now: new Date("2026-07-23T10:00:00.000Z"),
  });

  assert.equal(quick.path?.slug, fixtureIds.path);
  assert.equal(quick.result.session?.mode, "targeted");
  assert.equal(quick.result.session?.timing.type, "untimed");
  assert.equal(quick.result.session?.selectionMetadata.requestedCount, QUICK_PRACTICE_QUESTION_COUNT);
  assert(quick.result.session?.questionReferences.every((reference) => reference.pathId === fixtureIds.path));
  assert(quick.result.session?.questionReferences.every((reference) => reference.questionVersion > 0));
});

test("Quick Practice retains deterministic selection priority without creating evidence", () => {
  const source = createTwoPathFixture();
  const progress = evidence([
    attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false }),
  ]);
  const before = structuredClone(progress);
  const first = createQuickPracticeSelection({ evidence: progress, preferredPathId: fixtureIds.path, source, now: new Date("2026-07-23T10:00:00.000Z") });
  const repeat = createQuickPracticeSelection({ evidence: progress, preferredPathId: fixtureIds.path, source, now: new Date("2026-07-23T10:00:00.000Z") });

  assert.deepEqual(first.result.session?.questionReferences, repeat.result.session?.questionReferences);
  assert.deepEqual(progress, before);
});

test("path-owned resources map safely to questions without text inference", () => {
  const resources = getRelatedResourcesForQuestion("hm-calc-diff-basic-f-001");
  assert(resources.some((item) => item.resource.id === "basic-diff-formula-power-rule"));
  assert(resources.every((item) => item.pathId === "basic-differentiation"));

  const questions = getRelatedQuestionsForResource("basic-diff-formula-power-rule");
  assert.equal(questions.length, 8);
  assert(questions.some((question) => question.id === "hm-calc-diff-basic-f-001"));
  assert.deepEqual(getRelatedQuestionsForResource("missing-resource"), []);
});

test("contextual resource links preserve a safe return destination", () => {
  assert.equal(
    getContextualResourceHref("formula-cards", "higher-maths", "power-rule", "/practice/session/practice_1"),
    "/subjects/higher-maths/formula-cards?returnTo=%2Fpractice%2Fsession%2Fpractice_1#power-rule",
  );
});
