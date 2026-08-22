import test from "node:test";
import assert from "node:assert/strict";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { higherMathsCalculusStrandIds } from "../data/higher-maths";
import { discoverEligiblePracticeQuestions } from "../lib/practice/practice-eligibility";
import { createCompletedSessionRetry, createPracticeSessionSelection, selectRetryIncorrectPractice } from "../lib/practice/practice-selection";
import { derivePracticeSetupVisibility, deriveVisiblePracticeModes } from "../lib/practice/practice-setup";
import { isPracticeSession } from "../lib/practice/practice-validation";
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
  assert.equal(result.session?.schemaVersion, 3);
  assert.equal(result.session?.origin, "configured_practice");
  assert.equal(result.session?.subjectId, fixtureIds.subjectSlug);
  assert.equal(isPracticeSession(result.session), true);
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

test("retry-incorrect includes only currently open mistake groups", () => {
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

test("retry-incorrect counts grouped questions, keeps assisted success open and excludes malformed evidence", () => {
  const source = createTwoPathFixture();
  const firstQuestion = fixtureIds.questions[0];
  const secondQuestion = fixtureIds.questions[1];
  const result = selectRetryIncorrectPractice({
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 10,
    seed: "grouped-open-mistakes",
    evidence: evidence([
      attempt({ questionId: firstQuestion, skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 1, eventId: "grouped-wrong-1" }),
      attempt({ questionId: firstQuestion, skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 2, eventId: "grouped-wrong-2", attemptedAt: "2026-07-12T10:02:00.000Z" }),
      attempt({ questionId: firstQuestion, skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: true, sequence: 3, eventId: "grouped-assisted-correct", attemptedAt: "2026-07-12T10:03:00.000Z", hintViewedBeforeSubmission: true }),
      attempt({ questionId: secondQuestion, skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 4, eventId: "malformed-wrong", attemptedAt: "2026-07-12T10:04:00.000Z", outcomeKind: "malformed" }),
    ]),
    source,
  });

  assert.equal(result.eligibleQuestions.length, 1);
  assert.deepEqual(result.session?.questionReferences.map((reference) => reference.questionId), [firstQuestion]);
});

test("retry-incorrect excludes resolved and previous-version mistakes, then includes reopened and current-version mistakes", () => {
  const source = createTwoPathFixture();
  const questionId = fixtureIds.questions[0];
  const base = {
    questionId,
    skillPathId: fixtureIds.path,
    stageId: fixtureIds.foundationsStage,
  };
  const select = (attempts: ReturnType<typeof attempt>[]) => selectRetryIncorrectPractice({
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 10,
    seed: "state-transitions",
    evidence: evidence(attempts),
    source,
  });

  assert.equal(select([
    attempt({ ...base, isCorrect: false, sequence: 1, eventId: "resolved-wrong" }),
    attempt({ ...base, isCorrect: true, sequence: 2, eventId: "resolved-correct", attemptedAt: "2026-07-12T10:02:00.000Z" }),
  ]).session, null);
  assert.equal(select([
    attempt({ ...base, isCorrect: false, sequence: 1, eventId: "reopen-wrong-1" }),
    attempt({ ...base, isCorrect: true, sequence: 2, eventId: "reopen-correct", attemptedAt: "2026-07-12T10:02:00.000Z" }),
    attempt({ ...base, isCorrect: false, sequence: 3, eventId: "reopen-wrong-2", attemptedAt: "2026-07-12T10:03:00.000Z" }),
  ]).eligibleQuestions.length, 1);
  const versionedSource = structuredClone(source);
  versionedSource.questions.find((question) => question.id === questionId)!.questionVersion = 2;
  const selectVersioned = (attempts: ReturnType<typeof attempt>[]) => selectRetryIncorrectPractice({
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 10,
    seed: "version-safety",
    evidence: evidence(attempts),
    source: versionedSource,
  });
  assert.equal(selectVersioned([
    attempt({ ...base, isCorrect: false, sequence: 1, eventId: "old-version-wrong" }),
  ]).session, null);
  assert.equal(selectVersioned([
    attempt({ ...base, isCorrect: false, sequence: 1, eventId: "old-version-wrong-2" }),
    attempt({ ...base, isCorrect: false, sequence: 2, eventId: "current-version-wrong", attemptedAt: "2026-07-12T10:02:00.000Z", versionEvidence: { kind: "known", questionVersion: 2 } }),
  ]).eligibleQuestions.length, 1);
});

test("retry-incorrect preserves deterministic ordering and strict skill scoping", () => {
  const source = createTwoPathFixture();
  const attempts = [
    attempt({ questionId: fixtureIds.questions[0], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 1, eventId: "scope-fixture-1" }),
    attempt({ questionId: fixtureIds.questions[1], skillPathId: fixtureIds.path, stageId: fixtureIds.foundationsStage, isCorrect: false, sequence: 2, eventId: "scope-fixture-2", attemptedAt: "2026-07-12T10:02:00.000Z" }),
    attempt({ isCorrect: false, sequence: 3, eventId: "scope-basic", attemptedAt: "2026-07-12T10:03:00.000Z" }),
  ];
  const select = (selectedPathIds: string[]) => selectRetryIncorrectPractice({
    courseId: "calculus",
    selectedPathIds,
    requestedCount: 10,
    seed: "deterministic-scope",
    evidence: evidence(attempts),
    source,
  });
  const fixtureOnly = select([fixtureIds.path]);
  const repeated = select([fixtureIds.path]);
  const basicOnly = select(["basic-differentiation"]);
  const subjectWide = select([]);

  assert.deepEqual(fixtureOnly.session?.questionReferences, repeated.session?.questionReferences);
  assert(fixtureOnly.session?.questionReferences.every((reference) => reference.pathId === fixtureIds.path));
  assert.deepEqual(basicOnly.session?.questionReferences.map((reference) => reference.pathId), ["basic-differentiation"]);
  assert.deepEqual(new Set(subjectWide.session?.questionReferences.map((reference) => reference.pathId)), new Set([fixtureIds.path, "basic-differentiation"]));
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
  assert.equal(retry?.origin, "retry_incorrect");
  assert.equal(retry?.parentSessionId, completed.sessionId);
  assert.equal(retry?.subjectId, completed.subjectId);
  assert.deepEqual(retry?.skippedQuestionIds, []);
  assert.equal(isPracticeSession(retry), true);
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
  assert.deepEqual(deriveVisiblePracticeModes({ pathCount: 1, hasNeedsWork: false, hasRetryIncorrect: false }), ["targeted"]);
  assert.deepEqual(deriveVisiblePracticeModes({ pathCount: 1, hasNeedsWork: true, hasRetryIncorrect: false }), ["targeted", "needs_work"]);
  assert.deepEqual(deriveVisiblePracticeModes({ pathCount: 2, hasNeedsWork: true, hasRetryIncorrect: true }), ["targeted", "needs_work", "retry_incorrect", "mixed"]);
});

test("archived questions are excluded and supported graph questions are adopted generically", () => {
  const source = withArchivedAndGraphQuestion(createTwoPathFixture());
  const discovered = discoverEligiblePracticeQuestions(source);
  assert(!discovered.eligible.some((item) => item.reference.questionId === "fixture-int-f-002"));
  assert(discovered.eligible.some((item) => item.reference.questionId === "fixture-graph-001"));
});

test("conditional curriculum requirements exclude questions until every required skill path is available", () => {
  const source = createTwoPathFixture();
  const question = source.questions.find((candidate) => candidate.id === fixtureIds.questions[0])!;
  question.curriculum = {
    primarySkillId: fixtureIds.path,
    requiredSkillIds: ["chain-rule"],
  };

  const unavailable = discoverEligiblePracticeQuestions(source);
  assert(!unavailable.eligible.some((entry) => entry.question.id === question.id));
  assert.equal(unavailable.excludedByReason.unavailable_required_skill, 1);

  const chainRulePath = source.subjects[0].courseAreas
    .flatMap((area) => area.specAreas)
    .flatMap((area) => area.skillPaths ?? [])
    .find((path) => path.slug === "chain-rule")!;
  chainRulePath.isAvailable = true;
  chainRulePath.status = "available";

  const available = discoverEligiblePracticeQuestions(source);
  assert(available.eligible.some((entry) => entry.question.id === question.id));
});

function withArchivedAndGraphQuestion(source: CanonicalContentSource): CanonicalContentSource {
  const cloned = structuredClone(source);
  const subject = cloned.subjects[0];
  const topic = subject.courseAreas.find((area) => area.slug === "calculus")!.specAreas.find((item) => item.slug === "integration")!;
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
