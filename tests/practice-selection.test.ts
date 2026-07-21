import test from "node:test";
import assert from "node:assert/strict";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { higherMathsCalculusStrandIds } from "../data/higher-maths";
import { discoverEligiblePracticeQuestions } from "../lib/practice/practice-eligibility";
import { createCompletedSessionRetry, createPracticeSessionSelection, selectRetryIncorrectPractice } from "../lib/practice/practice-selection";
import { derivePracticeSetupVisibility } from "../lib/practice/practice-setup";
import { attempt, evidence } from "./progress-fixtures";
import type { CanonicalContentSource } from "../data/canonical-content";
import type { Question } from "../data/types";

test("targeted practice discovers synthetic future paths without engine changes and reduces sparse counts truthfully", () => {
  const source = createTwoPathFixture();
  const result = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 10,
    seed: "same",
    evidence: evidence(),
    source,
    now: new Date("2026-07-17T10:00:00.000Z"),
  });
  assert.equal(result.session?.questionReferences.length, 3);
  assert.equal(result.session?.selectionMetadata.fullySatisfied, false);
  assert.match(result.session?.selectionMetadata.shortageReason ?? "", /3 questions are currently available/);
});

test("selection is deterministic, duplicate-free and seed-sensitive", () => {
  const source = createTwoPathFixture();
  const input = { mode: "targeted" as const, courseId: "calculus", selectedPathIds: [fixtureIds.path], requestedCount: 2, evidence: evidence(), source, now: new Date("2026-07-17T10:00:00.000Z") };
  const first = createPracticeSessionSelection({ ...input, seed: "alpha" }).session!;
  const repeat = createPracticeSessionSelection({ ...input, seed: "alpha" }).session!;
  const second = createPracticeSessionSelection({ ...input, seed: "beta" }).session!;
  assert.deepEqual(first.questionReferences, repeat.questionReferences);
  assert.equal(new Set(first.questionReferences.map((reference) => reference.questionId)).size, first.questionReferences.length);
  assert.notDeepEqual(first.selectionMetadata.seed, second.selectionMetadata.seed);
});

test("mixed practice balances across available paths and includes synthetic content", () => {
  const source = createTwoPathFixture();
  const result = createPracticeSessionSelection({
    mode: "mixed",
    courseId: "calculus",
    selectedPathIds: [],
    requestedCount: 6,
    seed: "mixed",
    evidence: evidence(),
    source,
    now: new Date("2026-07-17T10:00:00.000Z"),
  }).session!;
  assert(result.selectionMetadata.includedPathIds.includes(fixtureIds.path));
  assert(result.selectionMetadata.includedPathIds.includes("basic-differentiation"));
});

test("needs-work uses canonical review/completion evidence and has a useful empty state", () => {
  const source = createTwoPathFixture();
  const empty = createPracticeSessionSelection({ mode: "needs_work", courseId: "calculus", selectedPathIds: [fixtureIds.path], requestedCount: 3, seed: "need", evidence: evidence(), source });
  assert.equal(empty.session, null);
  assert.match(empty.shortageReason ?? "", /Complete a few questions first/);
  const needsWork = createPracticeSessionSelection({
    mode: "needs_work",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 3,
    seed: "need",
    evidence: evidence([
      attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 1, eventId: "nw1" }),
      attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 2, eventId: "nw2" }),
    ]),
    source,
  });
  assert.equal(needsWork.session?.questionReferences[0]?.questionId, fixtureIds.questions[0]);
});

test("retry-incorrect uses latest current-version genuine attempt only", () => {
  const source = createTwoPathFixture();
  const incorrect = selectRetryIncorrectPractice({
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed: "retry",
    evidence: evidence([attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false })]),
    source,
  });
  assert.equal(incorrect.session?.questionReferences[0]?.questionId, fixtureIds.questions[0]);
  const laterCorrect = selectRetryIncorrectPractice({
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed: "retry",
    evidence: evidence([
      attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 1, eventId: "r1" }),
      attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: true, sequence: 2, eventId: "r2", attemptedAt: "2026-07-12T11:00:00.000Z" }),
    ]),
    source,
  });
  assert.equal(laterCorrect.session, null);
});

test("completed-session retry preserves only the supplied failures in original session order", () => {
  const session = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 3,
    seed: "completed-retry",
    evidence: evidence(),
    source: createTwoPathFixture(),
    now: new Date("2026-07-17T10:00:00.000Z"),
  }).session!;
  const completed = { ...session, status: "completed" as const, completedAt: "2026-07-17T10:15:00.000Z" };
  const expected = [session.questionReferences[0], session.questionReferences[2]];
  const retry = createCompletedSessionRetry(
    completed,
    [session.questionReferences[2].questionId, session.questionReferences[0].questionId],
    new Date("2026-07-17T10:16:00.000Z"),
  );

  assert.deepEqual(retry?.questionReferences, expected);
  assert.equal(retry?.mode, "retry_incorrect");
  assert.equal(retry?.status, "active");
  assert.equal(retry?.timing.type, "untimed");
  assert.equal(createCompletedSessionRetry(completed, []), null);
  assert.equal(createCompletedSessionRetry(session, [session.questionReferences[0].questionId]), null);
});

test("practice setup hides choices over one while preserving future multi-option controls", () => {
  assert.deepEqual(derivePracticeSetupVisibility(1, 1), {
    showCourseChoice: false,
    showPathChoice: false,
    showMixedMode: false,
  });
  assert.deepEqual(derivePracticeSetupVisibility(2, 2), {
    showCourseChoice: true,
    showPathChoice: true,
    showMixedMode: true,
  });
});

test("archived questions are excluded and supported graph questions are adopted generically", () => {
  const source = withArchivedAndGraphQuestion(createTwoPathFixture());
  const discovered = discoverEligiblePracticeQuestions(source);
  assert(!discovered.eligible.some((item) => item.reference.questionId === "fixture-int-f-002"));
  assert(discovered.eligible.some((item) => item.reference.questionId === "fixture-graph-001"));
});

function withArchivedAndGraphQuestion(source: CanonicalContentSource): CanonicalContentSource {
  const cloned = structuredClone(source);
  const subject = cloned.subjects[0];
  const topic = subject.courseAreas[0].specAreas.find((item) => item.slug === "integration")!;
  const path = topic.skillPaths!.find((item) => item.slug === fixtureIds.path)!;
  path.learningStages![0].questionIds = ["fixture-int-f-001", "fixture-graph-001"];
  const archived = cloned.questions.find((question) => question.id === "fixture-int-f-002")!;
  archived.contentStatus = "archived";
  const graphQuestion: Question = {
    ...structuredClone(cloned.questions[0]),
    id: "fixture-graph-001",
    questionVersion: 1,
    contentRevision: 1,
    contentStatus: "active",
    specificationStrandId: higherMathsCalculusStrandIds.integratingFunctions,
    skillPathId: fixtureIds.path,
    stageId: fixtureIds.foundationsStage,
    answerType: "graph_structured",
    acceptedAnswers: ["structured-answer"],
    graphConfig: structuredClone(cloned.questions[0].graphConfig) ?? {
      version: 1,
      title: "Synthetic graph",
      description: "Synthetic graph question.",
      viewport: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
      functions: [],
    },
    structuredAnswer: { type: "candidate-match", expectedId: "a" },
  };
  return { ...cloned, questions: [...cloned.questions, graphQuestion] };
}
