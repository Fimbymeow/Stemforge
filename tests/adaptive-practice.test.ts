import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent, type CanonicalContentSource } from "../data/canonical-content";
import type { LearningStage, Question, SkillPath } from "../data/types";
import {
  createAdaptiveQuickPracticeSelection,
  quickPracticeQuestionCount,
} from "../lib/practice/adaptive-practice";
import { questionRecencyPenalty } from "../lib/practice/practice-selection";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";
import type { Assessment } from "../lib/study-plan/types";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { attempt, evidence } from "./progress-fixtures";

const NOW = new Date("2026-07-13T12:00:00.000Z");

test("baseline and absent confidence preserve the canonical next-action skill", () => {
  const selection = createAdaptiveQuickPracticeSelection({ evidence: evidence(), now: NOW });
  assert.equal(selection.recommendation?.primaryPathId, "basic-differentiation");
  assert.deepEqual(selection.recommendation?.reasons, ["continue_learning"]);
  assert(selection.result.session?.questionReferences.every((item) => item.pathId === "basic-differentiation"));
});

test("an open mistake wins after prerequisites are secure and prefers a different same-skill question", () => {
  const completeBasic = completedPathEvidence(canonicalContent, "basic-differentiation", "2026-06-01T10:00:00.000Z");
  const mistaken = questionForPath(canonicalContent, "chain-rule")[0];
  const progress = appendAttempt(completeBasic, attemptFor(mistaken, false, "2026-07-12T10:00:00.000Z", 500));
  const selection = createAdaptiveQuickPracticeSelection({ evidence: progress, now: NOW, durationMinutes: 10 });

  assert.equal(selection.recommendation?.primaryPathId, "chain-rule");
  assert(selection.recommendation?.reasons.includes("open_mistake"));
  assert.notEqual(selection.result.session?.questionReferences[0]?.questionId, mistaken.id);
  assert(selection.result.session?.questionReferences.every((item) => item.pathId === "chain-rule"));
});

test("multiple open mistakes in one skill are all deferred while alternate questions exist", () => {
  const questions = questionForPath(canonicalContent, "basic-differentiation");
  const mistakenIds = questions.slice(0, 2).map((question) => question.id);
  const progress = evidence(questions.slice(0, 2).map((question, index) =>
    attemptFor(question, false, "2025-01-01T10:00:00.000Z", index + 1)));
  const selection = createAdaptiveQuickPracticeSelection({
    evidence: progress,
    now: NOW,
    durationMinutes: 10,
    seed: "multiple-open-mistakes",
  });
  const selectedIds = selection.result.session?.questionReferences.map((item) => item.questionId) ?? [];

  assert.equal(selection.recommendation?.primaryPathId, "basic-differentiation");
  assert(selection.recommendation?.reasons.includes("open_mistake"));
  assert(selectedIds.every((questionId) => !mistakenIds.includes(questionId)));
});

test("the exact mistaken question is the honest fallback when no alternate exists", () => {
  const source = oneQuestionFixture();
  const mistakenId = fixtureIds.questions[0];
  const progress = evidence([attempt({
    questionId: mistakenId,
    skillPathId: fixtureIds.path,
    stageId: fixtureIds.foundationsStage,
    attemptedAt: "2026-07-12T10:00:00.000Z",
  })]);
  const selection = createAdaptiveQuickPracticeSelection({
    evidence: progress,
    preferredPathId: fixtureIds.path,
    source,
    now: NOW,
    durationMinutes: 10,
  });
  assert.deepEqual(selection.result.session?.questionReferences.map((item) => item.questionId), [mistakenId]);
  assert.match(selection.result.shortageReason ?? "", /1 question is currently available/);
});

test("due Review is offered separately and never becomes ordinary Quick Practice content", () => {
  const progress = completedPathEvidence(canonicalContent, "basic-differentiation", "2026-06-01T10:00:00.000Z");
  const selection = createAdaptiveQuickPracticeSelection({ evidence: progress, now: NOW });
  assert.equal(selection.reviewOffer?.pathId, "basic-differentiation");
  assert.equal(selection.reviewOffer?.href, "/practice?review=1&path=basic-differentiation");
  assert.equal(selection.result.session?.mode, "targeted");
  assert.equal(selection.result.session?.origin, "quick_practice");
  assert(!selection.recommendation?.reasons.includes("review" as never));
});

test("a scoped upcoming test boosts its weak skill while unrelated and whole-course assessments preserve a sensible baseline", () => {
  const source = createTwoPathFixture();
  const scoped = assessment("scoped", { kind: "skills", skillPathIds: [fixtureIds.path] }, "2026-07-17");
  const selected = createAdaptiveQuickPracticeSelection({ evidence: evidence(), source, assessments: [scoped], now: NOW });
  assert.equal(selected.recommendation?.primaryPathId, fixtureIds.path);
  assert.deepEqual(selected.recommendation?.reasons, ["on_your_test"]);

  const unrelated = assessment("unrelated", { kind: "skills", skillPathIds: ["not-a-live-skill"] }, "2026-07-17");
  assert.equal(createAdaptiveQuickPracticeSelection({ evidence: evidence(), source, assessments: [unrelated], now: NOW }).recommendation?.primaryPathId, "basic-differentiation");

  const final = assessment("final", { kind: "whole_course" }, "2026-07-17", "final_exam");
  assert.equal(createAdaptiveQuickPracticeSelection({ evidence: evidence(), source, assessments: [final], now: NOW }).recommendation?.primaryPathId, "basic-differentiation");
});

test("a requirements-scoped assessment biases Quick Practice through the same shared resolver Study Plan uses — no separate spec-point logic inside Practice", () => {
  const completeBasic = completedPathEvidence(canonicalContent, "basic-differentiation", "2026-06-01T10:00:00.000Z");
  const scoped = assessment("chain-rule-test", { kind: "requirements", specPointIds: ["hm-calc-diff-chain-rule"] }, "2026-07-17");
  const selection = createAdaptiveQuickPracticeSelection({ evidence: completeBasic, assessments: [scoped], now: NOW, durationMinutes: 10 });
  assert.equal(selection.recommendation?.primaryPathId, "chain-rule");
  assert(selection.recommendation?.reasons.includes("on_your_test"));
  assert(selection.result.session?.questionReferences.every((item) => item.pathId === "chain-rule"));
});

test("multiple assessments use the nearest relevant assessment without summing them", () => {
  const source = createTwoPathFixture();
  const later = assessment("later", { kind: "skills", skillPathIds: [fixtureIds.path] }, "2026-07-25");
  const nearer = assessment("nearer", { kind: "skills", skillPathIds: [fixtureIds.path] }, "2026-07-16");
  const selection = createAdaptiveQuickPracticeSelection({ evidence: evidence(), source, assessments: [later, nearer], now: NOW });
  assert.equal(selection.recommendation?.assessment?.assessmentId, "nearer");
});

test("Needs work is soft, while Confident cannot suppress a genuine mistake", () => {
  const source = createTwoPathFixture();
  const needsWork = new Map([[fixtureIds.path, "needs_work" as const]]);
  const sparsePrimary = sparseBasicFixture(source);
  const selection = createAdaptiveQuickPracticeSelection({ evidence: evidence(), source: sparsePrimary, learnerConfidence: needsWork, now: NOW, durationMinutes: 10 });
  assert(selection.recommendation?.includedPathIds.includes(fixtureIds.path));

  const progress = appendAttempt(
    completedPathEvidence(canonicalContent, "basic-differentiation", "2026-06-01T10:00:00.000Z"),
    attemptFor(questionForPath(canonicalContent, "chain-rule")[0], false, "2026-07-12T10:00:00.000Z", 600),
  );
  const confident = new Map([["chain-rule", "confident" as const]]);
  assert.equal(createAdaptiveQuickPracticeSelection({ evidence: progress, learnerConfidence: confident, now: NOW }).recommendation?.primaryPathId, "chain-rule");
});

test("unmet hard prerequisites exclude a tempting mistake skill", () => {
  const chainQuestion = questionForPath(canonicalContent, "chain-rule")[0];
  const progress = evidence([attemptFor(chainQuestion, false, "2026-07-12T10:00:00.000Z", 1)]);
  const selection = createAdaptiveQuickPracticeSelection({ evidence: progress, preferredPathId: "chain-rule", now: NOW });
  assert.equal(selection.recommendation?.primaryPathId, "basic-differentiation");
  assert(!selection.result.session?.questionReferences.some((item) => item.pathId === "chain-rule"));
});

test("recency is monotonic, injected and has no 300-day modulo cycle", () => {
  assert(questionRecencyPenalty("2026-07-12T12:00:00.000Z", NOW) > questionRecencyPenalty("2026-06-13T12:00:00.000Z", NOW));
  assert(questionRecencyPenalty("2025-10-01T12:00:00.000Z", NOW) > questionRecencyPenalty("2025-09-30T12:00:00.000Z", NOW));
  assert.equal(questionRecencyPenalty("2025-07-13T12:00:00.000Z", NOW), 0);
  assert.equal(questionRecencyPenalty("2025-07-13T12:00:00.000Z", NOW), questionRecencyPenalty("2024-07-13T12:00:00.000Z", NOW));
});

test("10/20/30 minute presets are deterministic, bounded and duplicate-free", () => {
  assert.deepEqual([10, 20, 30].map((minutes) => quickPracticeQuestionCount(minutes as 10 | 20 | 30)), [2, 4, 6]);
  for (const durationMinutes of [10, 20, 30] as const) {
    const first = createAdaptiveQuickPracticeSelection({ evidence: evidence(), durationMinutes, now: NOW, seed: "stable" });
    const second = createAdaptiveQuickPracticeSelection({ evidence: evidence(), durationMinutes, now: NOW, seed: "stable" });
    const ids = first.result.session?.questionReferences.map((item) => item.questionId) ?? [];
    assert.deepEqual(ids, second.result.session?.questionReferences.map((item) => item.questionId));
    assert.equal(new Set(ids).size, ids.length);
    assert(ids.length <= quickPracticeQuestionCount(durationMinutes));
  }
});

test("acceptance scenario keeps Review separate and makes Tangents the deterministic 20-minute focus", () => {
  const source = acceptanceFixture();
  let progress = completedPathEvidence(source, "basic-differentiation", "2026-07-12T10:00:00.000Z");
  progress = mergeEvidence(progress, completedPathEvidence(source, "chain-rule", "2026-05-02T10:00:00.000Z", 100));
  const tangentsQuestions = questionForPath(source, "tangents-and-normals");
  progress = appendAttempt(progress, attemptFor(tangentsQuestions[0], false, "2026-07-12T11:00:00.000Z", 1_000));
  const testOnFriday = assessment("friday-test", { kind: "skills", skillPathIds: ["tangents-and-normals"] }, "2026-07-17");
  const confidence = new Map([["tangents-and-normals", "needs_work" as const]]);

  const first = createAdaptiveQuickPracticeSelection({ evidence: progress, source, assessments: [testOnFriday], learnerConfidence: confidence, durationMinutes: 20, now: NOW, seed: "acceptance" });
  const repeat = createAdaptiveQuickPracticeSelection({ evidence: progress, source, assessments: [testOnFriday], learnerConfidence: confidence, durationMinutes: 20, now: NOW, seed: "acceptance" });
  const ids = first.result.session?.questionReferences.map((item) => item.questionId) ?? [];
  assert.equal(first.reviewOffer?.pathId, "chain-rule");
  assert.equal(first.recommendation?.primaryPathId, "tangents-and-normals");
  assert.deepEqual(first.recommendation?.reasons, ["open_mistake", "on_your_test"]);
  assert.equal(ids[0], tangentsQuestions[1].id);
  assert(!first.recommendation?.includedPathIds.includes("basic-differentiation"));
  assert(!first.recommendation?.includedPathIds.includes("basic-integration"));
  assert.deepEqual(ids, repeat.result.session?.questionReferences.map((item) => item.questionId));
  assert(!("score" in (first.recommendation ?? {})));
});

function assessment(id: string, scope: Assessment["scope"], date: string, type: Assessment["type"] = "class_test"): Assessment {
  return { id, courseSlug: "higher-maths", type, title: id === "friday-test" ? "your test Friday" : `${id} assessment`, date: { precision: "exact", date }, scope, source: "learner" };
}

function completedPathEvidence(source: CanonicalContentSource, pathId: string, attemptedAt: string, sequenceOffset = 0): ProgressEvidence {
  return evidence(questionForPath(source, pathId).map((question, index) => attemptFor(question, true, attemptedAt, sequenceOffset + index + 1)));
}

function attemptFor(question: Question, isCorrect: boolean, attemptedAt: string, sequence: number): QuestionAttempt {
  return attempt({
    eventId: `adaptive_${question.id}_${sequence}`,
    questionId: question.id,
    skillPathId: question.skillPathId,
    stageId: question.stageId,
    versionEvidence: { kind: "known", questionVersion: question.questionVersion },
    attemptedAt,
    sequence,
    isCorrect,
  });
}

function questionForPath(source: CanonicalContentSource, pathId: string) {
  return source.questions.filter((question) => question.skillPathId === pathId && question.contentStatus === "active");
}

function appendAttempt(progress: ProgressEvidence, next: QuestionAttempt): ProgressEvidence {
  return { ...progress, attempts: [...progress.attempts, next] };
}

function mergeEvidence(left: ProgressEvidence, right: ProgressEvidence): ProgressEvidence {
  return { ...left, attempts: [...left.attempts, ...right.attempts] };
}

function oneQuestionFixture(): CanonicalContentSource {
  const source = createTwoPathFixture();
  const subject = structuredClone(source.subjects[0]);
  const path = findPath(subject, fixtureIds.path);
  path.learningStages = [stage(fixtureIds.foundationsStage, [fixtureIds.questions[0]])];
  path.questions = 1;
  return { subjects: [subject], questions: source.questions.filter((question) => question.id === fixtureIds.questions[0]) };
}

function sparseBasicFixture(source: CanonicalContentSource): CanonicalContentSource {
  const copy = structuredClone(source);
  const basic = findPath(copy.subjects[0], "basic-differentiation");
  const first = questionForPath(copy, "basic-differentiation")[0];
  basic.learningStages = [stage(first.stageId!, [first.id])];
  basic.questions = 1;
  copy.questions = copy.questions.filter((question) => question.skillPathId !== "basic-differentiation" || question.id === first.id);
  return copy;
}

function acceptanceFixture(): CanonicalContentSource {
  const copy = structuredClone(canonicalContent);
  const tangents = findPath(copy.subjects[0], "tangents-and-normals");
  const template = questionForPath(copy, "basic-differentiation")[0];
  const stageId = "tangents-stage-foundations";
  const questions = [1, 2].map((number) => ({
    ...structuredClone(template),
    id: `adaptive-tangents-${number}`,
    title: `Tangents question ${number}`,
    questionText: `Find the tangent in fixture ${number}.`,
    skillPath: "Tangents",
    skillPathId: "tangents-and-normals",
    stageId,
    stage: "Foundations" as const,
    displayOrder: number,
  }));
  tangents.isAvailable = true;
  tangents.status = "available";
  tangents.questions = questions.length;
  tangents.learningStages = [stage(stageId, questions.map((question) => question.id))];
  return { ...copy, questions: [...copy.questions, ...questions] };
}

function findPath(subject: CanonicalContentSource["subjects"][number], pathId: string): SkillPath {
  for (const course of subject.courseAreas) for (const topic of course.specAreas) {
    const path = topic.skillPaths?.find((candidate) => candidate.slug === pathId);
    if (path) return path;
  }
  throw new Error(`Missing fixture path ${pathId}`);
}

function stage(id: string, questionIds: string[]): LearningStage {
  return {
    id,
    stageVersion: 1,
    contentStatus: "active",
    title: "Foundations",
    label: "Foundations",
    name: "Foundations",
    description: "Adaptive Practice test stage.",
    questionIds,
    questions: questionIds.length,
    completed: 0,
    button: "Start Foundations",
    accent: "green",
    status: "available",
    estimatedMinutes: 5,
    href: `/question/${questionIds[0]}`,
  };
}
