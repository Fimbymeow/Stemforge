import assert from "node:assert/strict";
import test from "node:test";
import { contentResolver } from "../lib/content-resolver";
import type { PracticeSession } from "../lib/practice/practice-types";
import {
  createReviewDerivationCache,
  deriveOrdinaryRecovery,
  deriveSkillFirstCompletedAt,
  deriveSkillReviewState,
} from "../lib/review/derivation";
import { createReviewEventId } from "../lib/review/identity";
import { deriveReviewTargetResolution } from "../lib/review/outcomes";
import { resolveCanonicalReviewTip } from "../lib/review/replay";
import {
  REVIEW_SCHEDULERS,
  getReviewScheduler,
  migrateReviewStage,
  reviewDueAt,
  transitionReviewStage,
} from "../lib/review/scheduler";
import type {
  ReviewEvent,
  ReviewOutcome,
  ReviewStage,
  ReviewTargetAssignment,
} from "../lib/review/types";
import {
  canonicalEvidenceRefs,
  isReviewEvent,
  isReviewTargetAssignment,
} from "../lib/review/validation";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

const target = { targetType: "skill" as const, targetId: "basic-differentiation" };
const path = contentResolver.getPathContext(target.targetId)!.skillPath;
const questionIds = (path.learningStages ?? []).flatMap((stage) => stage.questionIds);

test("Review contracts enforce Alpha discriminators, closed sets, exact keys and bounds", () => {
  const valid = reviewEvent();
  assert.equal(isReviewEvent(valid, true), true);
  assert.equal(isReviewEvent({ ...valid, outcome: "easy" }, true), false);
  assert.equal(isReviewEvent({ ...valid, stageAfter: 6 }, true), false);
  assert.equal(isReviewEvent({ ...valid, source: { sourceType: "question", sourceId: "source" } }, true), false);
  assert.equal(isReviewEvent({ ...valid, target: { targetType: "flashcard", targetId: "target" } }, true), false);
  assert.equal(isReviewEvent({ ...valid, targetVersion: { versionType: "question", version: 1 } }, true), false);
  assert.equal(isReviewEvent({ ...valid, extra: true }, true), false);
  assert.equal(isReviewEvent({ ...valid, evidenceRefs: Array.from({ length: 65 }, (_, index) => ({
    evidenceKind: "attempt" as const,
    eventId: `attempt_${index}`,
  })) }, true), false);
  assert.equal(isReviewEvent({
    ...valid,
    evidenceRefs: [
      { evidenceKind: "attempt", eventId: "attempt_duplicate" },
      { evidenceKind: "attempt", eventId: "attempt_duplicate" },
    ],
  }, true), false);
  assert.equal(isReviewEvent({ ...valid, questionIds: Array.from({ length: 13 }, (_, index) => `q_${index}`) }, true), false);
  assert.equal(isReviewEvent({ ...valid, schedulerVersion: 99 }, true), true);
  assert.equal(getReviewScheduler(99), null);
});

test("evidence references are de-duplicated into one deterministic canonical order", () => {
  const canonical = canonicalEvidenceRefs([
    { evidenceKind: "support_event", eventId: "support_b" },
    { evidenceKind: "attempt", eventId: "attempt_b" },
    { evidenceKind: "attempt", eventId: "attempt_a" },
    { evidenceKind: "attempt", eventId: "attempt_b" },
  ]);
  assert.deepEqual(canonical, [
    { evidenceKind: "attempt", eventId: "attempt_a" },
    { evidenceKind: "attempt", eventId: "attempt_b" },
    { evidenceKind: "support_event", eventId: "support_b" },
  ]);
  assert.equal(isReviewEvent({ ...reviewEvent(), evidenceRefs: canonical }, true), true);
  assert.equal(isReviewEvent({ ...reviewEvent(), evidenceRefs: [...canonical].reverse() }, true), false);
  assert.equal(isReviewTargetAssignment({ target, questionIds: ["q_1", "q_1"] }), false);
});

test("Review event identity is deterministic, distinct, SHA-256 shaped and safe", async () => {
  const source = { sourceType: "practice_session" as const, sourceId: "session_one" };
  const first = await createReviewEventId(source, target);
  assert.equal(await createReviewEventId(source, target), first);
  assert.notEqual(await createReviewEventId({ ...source, sourceId: "session_two" }, target), first);
  assert.match(first, /^review_[a-f0-9]{64}$/);
  assert.equal(first.length, 71);
});

test("scheduler version 1 implements every baseline, recovery, relearning and numeric transition", () => {
  const stages: Array<ReviewStage | null> = [null, "recovery", "relearning", 0, 1, 2, 3, 4, 5];
  for (const stage of stages) {
    assert.equal(transitionReviewStage(stage, "incorrect"), "recovery");
    assert.equal(transitionReviewStage(stage, "solution_assisted"), "relearning");
    assert.equal(transitionReviewStage(stage, "hint_assisted"), 0);
  }
  assert.deepEqual(stages.map((stage) => transitionReviewStage(stage, "independent_success")), [0, 0, 0, 1, 2, 3, 4, 5, 5]);
  assert.equal(transitionReviewStage(null, "independent_success", 99), null);
});

test("scheduler uses exact UTC instants, preserves historical versions and exposes a future migration seam", () => {
  assert.equal(reviewDueAt("2026-03-28T23:30:00.000Z", 0, 1), "2026-03-30T23:30:00.000Z");
  assert.equal(reviewDueAt("2026-03-28T23:30:00.000Z", "recovery", 1), "2026-03-28T23:30:00.000Z");
  assert.equal(reviewDueAt("2026-03-28T23:30:00.000Z", "relearning", 1), "2026-03-29T23:30:00.000Z");
  assert.equal(reviewDueAt("2026-03-28T23:30:00.000Z", 5, 1), "2026-06-26T23:30:00.000Z");
  const testRegistry = new Map(REVIEW_SCHEDULERS);
  testRegistry.set(9, {
    version: 9,
    intervals: new Map([[0, 123]]),
    transition: () => 0,
    migrateFrom: { 1: (event) => event.stageAfter },
  });
  assert.equal(migrateReviewStage(reviewEvent({ stageAfter: 3 }), 9, testRegistry), 3);
  assert.equal(REVIEW_SCHEDULERS.has(2), false);
});

test("causal replay resolves ordinary chains, forks and nested descendants deterministically", () => {
  const root = reviewEvent({ eventId: "review_root", occurredAt: "2026-07-01T10:00:00.000Z" });
  const success = reviewEvent({
    eventId: "review_success",
    priorEventId: root.eventId,
    outcome: "independent_success",
    occurredAt: "2026-07-02T10:00:00.000Z",
    stageAfter: 1,
  });
  const wrong = reviewEvent({
    eventId: "review_wrong",
    priorEventId: root.eventId,
    outcome: "incorrect",
    occurredAt: "2026-07-02T09:00:00.000Z",
    stageAfter: "recovery",
  });
  const recovered = reviewEvent({
    eventId: "review_recovered",
    priorEventId: wrong.eventId,
    outcome: "independent_success",
    occurredAt: "2026-07-03T10:00:00.000Z",
    stageAfter: 0,
  });
  assert.equal(resolveCanonicalReviewTip([root, success, wrong], target).canonicalEvent?.eventId, wrong.eventId);
  assert.equal(resolveCanonicalReviewTip([success, recovered, root, wrong], target).canonicalEvent?.eventId, recovered.eventId);
  assert.equal(resolveCanonicalReviewTip([wrong, root, recovered, success], target).canonicalEvent?.eventId, recovered.eventId);
});

test("causal replay handles three-way forks, multiple roots and losing-sibling descendants by complete branches", () => {
  const root = reviewEvent({ eventId: "review_root" });
  const branches = [
    reviewEvent({ eventId: "review_b", priorEventId: root.eventId, occurredAt: "2026-07-02T10:00:00.000Z", stageAfter: 1 }),
    reviewEvent({ eventId: "review_a", priorEventId: root.eventId, occurredAt: "2026-07-02T10:00:00.000Z", stageAfter: 1 }),
    reviewEvent({ eventId: "review_c", priorEventId: root.eventId, occurredAt: "2026-07-01T12:00:00.000Z", stageAfter: 1 }),
  ];
  const descendant = reviewEvent({
    eventId: "review_descendant",
    priorEventId: branches[2].eventId,
    occurredAt: "2026-07-04T10:00:00.000Z",
    stageAfter: 2,
  });
  const otherRoot = reviewEvent({ eventId: "review_other_root", occurredAt: "2026-07-03T10:00:00.000Z" });
  assert.equal(resolveCanonicalReviewTip([root, ...branches], target).canonicalEvent?.eventId, "review_a");
  assert.equal(resolveCanonicalReviewTip([otherRoot, ...branches, descendant, root], target).canonicalEvent?.eventId, descendant.eventId);
});

test("causal replay handles deep chains iteratively and fails closed on duplicate IDs", () => {
  const chain = Array.from({ length: 12_000 }, (_, index) => reviewEvent({
    eventId: `review_deep_${String(index).padStart(5, "0")}`,
    priorEventId: index === 0 ? null : `review_deep_${String(index - 1).padStart(5, "0")}`,
    sequence: index,
  }));
  assert.equal(resolveCanonicalReviewTip(chain, target).canonicalEvent?.eventId, chain.at(-1)?.eventId);
  const duplicate = resolveCanonicalReviewTip([
    reviewEvent({ eventId: "review_duplicate" }),
    reviewEvent({ eventId: "review_duplicate", outcome: "incorrect", stageAfter: "recovery" }),
  ], target);
  assert.equal(duplicate.canonicalEvent, null);
  assert.deepEqual(duplicate.diagnostics, ["duplicate_event_id"]);
});

test("causal replay safely excludes cycles, self references, cross-target priors and unknown schedulers", () => {
  const other = reviewEvent({ eventId: "review_other", target: { targetType: "skill", targetId: "another-skill" } });
  const cross = reviewEvent({ eventId: "review_cross", priorEventId: other.eventId });
  const self = reviewEvent({ eventId: "review_self", priorEventId: "review_self" });
  const cycleA = reviewEvent({ eventId: "review_cycle_a", priorEventId: "review_cycle_b" });
  const cycleB = reviewEvent({ eventId: "review_cycle_b", priorEventId: "review_cycle_a" });
  const unknown = reviewEvent({ eventId: "review_unknown", schedulerVersion: 99 });
  const result = resolveCanonicalReviewTip([other, cross, self, cycleA, cycleB, unknown], target);
  assert.equal(result.canonicalEvent, null);
  assert.deepEqual(result.diagnostics, ["cross_target_prior", "cycle", "self_reference", "unknown_scheduler"]);
});

test("missing-prior events are provisional roots and later parent arrival recomputes the same canonical DAG", () => {
  const child = reviewEvent({ eventId: "review_child", priorEventId: "review_missing", occurredAt: "2026-07-02T10:00:00.000Z" });
  assert.equal(resolveCanonicalReviewTip([child], target).canonicalEvent?.eventId, child.eventId);
  const parent = reviewEvent({ eventId: "review_missing", occurredAt: "2026-07-01T10:00:00.000Z" });
  assert.equal(resolveCanonicalReviewTip([child, parent], target).canonicalEvent?.eventId, child.eventId);
});

test("Review outcome derives exact evidence and honest assisted, malformed and wrong-then-right semantics", () => {
  const assignment = assignmentFor(questionIds[0]);
  const session = reviewSession(assignment);
  const correct = sessionAttempt(session, questionIds[0], 3, true);
  const hint = sessionSupport(session, questionIds[0], 2, "hint_viewed");
  const independent = deriveReviewTargetResolution(session, assignment, evidence([correct]));
  assert.equal(independent.resolved && independent.outcome, "independent_success");
  const hinted = deriveReviewTargetResolution(session, assignment, evidence([correct], [hint]));
  assert.equal(hinted.resolved && hinted.outcome, "hint_assisted");
  const solution = sessionSupport(session, questionIds[0], 2, "solution_viewed");
  const solutionAssisted = deriveReviewTargetResolution(session, assignment, evidence([correct], [solution]));
  assert.equal(solutionAssisted.resolved && solutionAssisted.outcome, "solution_assisted");
  const malformed = sessionAttempt(session, questionIds[0], 1, null, { outcomeKind: "malformed" });
  const malformedThenCorrect = deriveReviewTargetResolution(session, assignment, evidence([malformed, correct]));
  assert.equal(malformedThenCorrect.resolved && malformedThenCorrect.outcome, "independent_success");
  assert.deepEqual(malformedThenCorrect.resolved && malformedThenCorrect.evidenceRefs, [
    { evidenceKind: "attempt", eventId: malformed.eventId },
    { evidenceKind: "attempt", eventId: correct.eventId },
  ]);
  const wrong = sessionAttempt(session, questionIds[0], 1, false);
  const wrongThenRight = deriveReviewTargetResolution(session, assignment, evidence([wrong, correct]));
  assert.equal(wrongThenRight.resolved && wrongThenRight.outcome, "incorrect");
});

test("bounded Review evidence always retains the events required to justify its outcome", () => {
  const assignment = assignmentFor(questionIds[0]);
  const session = reviewSession(assignment);
  const malformed = Array.from({ length: 70 }, (_, index) => sessionAttempt(
    session,
    questionIds[0],
    index + 1,
    null,
    {
      eventId: `attempt_review_noise_${String(index).padStart(2, "0")}`,
      attemptedAt: new Date(Date.parse(session.startedAt) + (index + 1) * 1_000).toISOString(),
      outcomeKind: "malformed",
    },
  ));
  const context = contentResolver.getQuestionContext(questionIds[0])!;
  const solution = supportEvent({
    eventId: "support_review_required_solution",
    practiceSessionId: session.sessionId,
    questionId: questionIds[0],
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    occurredAt: new Date(Date.parse(session.startedAt) + 71_000).toISOString(),
    sequence: 71,
    type: "solution_viewed",
    afterGenuineAttempt: true,
  });
  const correct = sessionAttempt(session, questionIds[0], 72, true, {
    eventId: "attempt_review_required_correct",
    attemptedAt: new Date(Date.parse(session.startedAt) + 72_000).toISOString(),
  });
  const result = deriveReviewTargetResolution(session, assignment, evidence([...malformed, correct], [solution]));
  assert.equal(result.resolved && result.outcome, "solution_assisted");
  assert.equal(result.resolved && result.evidenceRefs.length, 64);
  assert.equal(result.resolved && result.evidenceRefs.some((item) => item.eventId === solution.eventId), true);
  assert.equal(result.resolved && result.evidenceRefs.some((item) => item.eventId === correct.eventId), true);
});

test("target aggregation waits for every assigned question and applies incorrect/solution/hint precedence", () => {
  const assignment = assignmentFor(questionIds[0], questionIds[1]);
  const session = reviewSession(assignment);
  const first = sessionAttempt(session, questionIds[0], 1, true);
  assert.equal(deriveReviewTargetResolution(session, assignment, evidence([first])).resolved, false);
  const second = sessionAttempt(session, questionIds[1], 3, true);
  const hint = sessionSupport(session, questionIds[0], 0, "hint_viewed");
  const hinted = deriveReviewTargetResolution(session, assignment, evidence([first, second], [hint]));
  assert.equal(hinted.resolved && hinted.outcome, "hint_assisted");
  const wrong = sessionAttempt(session, questionIds[1], 2, false);
  const incorrect = deriveReviewTargetResolution(session, assignment, evidence([first, wrong, second], [hint]));
  assert.equal(incorrect.resolved && incorrect.outcome, "incorrect");
});

test("baseline is mechanically derived at earliest canonical completion and starts due two days later", () => {
  const completed = completedSkillEvidence("2026-07-01T10:00:00.000Z");
  const baseline = deriveSkillFirstCompletedAt(path, completed, contentResolver.getQuestionVersions(), createReviewDerivationCache());
  assert.equal(baseline.status, "eligible");
  assert.equal(baseline.firstCompletedAt, completed.attempts.at(-1)?.attemptedAt);
  const before = deriveSkillReviewState(path, completed, new Date("2026-07-03T10:06:59.999Z"));
  const boundary = deriveSkillReviewState(path, completed, new Date("2026-07-03T10:07:00.000Z"));
  assert.equal(before.due, false);
  assert.equal(before.dueSoon, true);
  assert.equal(boundary.due, true);
  assert.equal(boundary.reason, "due_after_time");
  assert.equal(deriveSkillFirstCompletedAt(path, evidence()).status, "not_eligible");
});

test("baseline includes solution completion and chooses the earliest durable completion evidence", () => {
  const completed = completedSkillEvidence("2026-07-01T10:00:00.000Z");
  const finalQuestionId = questionIds.at(-1)!;
  const finalAttempt = completed.attempts.at(-1)!;
  const withoutFinalCorrect = {
    ...completed,
    attempts: [
      ...completed.attempts.slice(0, -1),
      { ...finalAttempt, isCorrect: false, outcomeKind: "graded" as const },
    ],
    supportEvents: [supportEvent({
      eventId: "support_baseline_solution",
      questionId: finalQuestionId,
      skillPathId: path.slug,
      stageId: finalAttempt.stageId,
      type: "solution_viewed",
      occurredAt: "2026-07-01T10:08:00.000Z",
      sequence: 20,
      afterGenuineAttempt: true,
      versionEvidence: finalAttempt.versionEvidence,
    })],
  };
  assert.deepEqual(deriveSkillFirstCompletedAt(path, withoutFinalCorrect), {
    status: "eligible",
    firstCompletedAt: "2026-07-01T10:08:00.000Z",
  });
  const withEarlierSnapshot = {
    ...withoutFinalCorrect,
    achievementSnapshots: [{
      snapshotId: "snapshot_earlier_completion",
      kind: "path_completed" as const,
      subjectId: "higher-maths",
      courseId: "calculus",
      pathId: path.slug,
      pathVersion: path.pathVersion,
      achievedAt: "2026-07-01T10:07:30.000Z",
      masteryScore: 70,
      independentPerformancePercentage: 75,
      completionCount: questionIds.length,
      totalRequiredCount: questionIds.length,
      source: "derived_current" as const,
    }],
  };
  assert.equal(
    deriveSkillFirstCompletedAt(path, withEarlierSnapshot).firstCompletedAt,
    "2026-07-01T10:07:30.000Z",
  );
});

test("historical unknown-version completion remains eligible while current versions require reassessment", () => {
  const completed = completedSkillEvidence("2026-07-01T10:00:00.000Z");
  const legacy = {
    ...completed,
    attempts: completed.attempts.map((item) => ({
      ...item,
      versionEvidence: { kind: "unknown_legacy" as const, questionVersion: null },
    })),
  };
  const baseline = deriveSkillFirstCompletedAt(path, legacy);
  assert.equal(baseline.status, "eligible");
  const state = deriveSkillReviewState(path, legacy, new Date("2026-07-01T12:00:00.000Z"));
  assert.equal(state.eligible, true);
  assert.equal(state.due, true);
  assert.equal(state.reason, "content_changed");
  assert.equal(state.reassessmentQuestionIds.length > 0, true);
});

test("ordinary recovery opens per question, requires independent same-question recovery and respects Review boundary", () => {
  const base = completedSkillEvidence("2026-07-01T10:00:00.000Z");
  const questionId = questionIds[0];
  const wrong = ordinaryAttempt(questionId, 20, false, "2026-07-05T10:00:00.000Z");
  const assistedRight = ordinaryAttempt(questionId, 21, true, "2026-07-05T10:01:00.000Z", { hintViewedBeforeSubmission: true });
  const otherRight = ordinaryAttempt(questionIds[1], 22, true, "2026-07-05T10:02:00.000Z");
  assert.deepEqual(deriveOrdinaryRecovery(path, { ...base, attempts: [...base.attempts, wrong] }, null), [questionId]);
  assert.deepEqual(deriveOrdinaryRecovery(path, { ...base, attempts: [...base.attempts, wrong, assistedRight, otherRight] }, null), [questionId]);
  const independentRight = ordinaryAttempt(questionId, 23, true, "2026-07-05T10:03:00.000Z");
  assert.deepEqual(deriveOrdinaryRecovery(path, { ...base, attempts: [...base.attempts, wrong, independentRight] }, null), []);
  const review = reviewEvent({ occurredAt: "2026-07-06T10:00:00.000Z", sequence: 30 });
  const withReview = { ...base, attempts: [...base.attempts, wrong], reviewEvents: [review] };
  assert.deepEqual(deriveOrdinaryRecovery(path, withReview, {
    occurredAt: review.occurredAt,
    sequence: review.sequence,
    eventId: review.eventId,
  }), []);
  const unresolvedReviewAttempt = ordinaryAttempt(
    questionId,
    31,
    false,
    "2026-07-07T10:00:00.000Z",
    { practiceSessionId: "review_session_trimmed_before_emission" },
  );
  assert.deepEqual(deriveOrdinaryRecovery(path, {
    ...base,
    attempts: [...base.attempts, unresolvedReviewAttempt],
  }, null), []);
});

test("Review-session attempts are excluded from ordinary recovery and ordinary correctness never advances a stage", () => {
  const base = completedSkillEvidence("2026-07-01T10:00:00.000Z");
  const review = reviewEvent();
  const wrongInReview = ordinaryAttempt(questionIds[0], 20, false, "2026-07-05T10:00:00.000Z", {
    practiceSessionId: review.source.sourceId,
  });
  const source = { ...base, attempts: [...base.attempts, wrongInReview], reviewEvents: [review] };
  assert.deepEqual(deriveOrdinaryRecovery(path, source, null), []);
  assert.equal(deriveSkillReviewState(path, source, new Date("2026-07-02T00:00:00.000Z")).canonicalEvent?.stageAfter, review.stageAfter);
});

function reviewEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    eventId: "review_event_1",
    source: { sourceType: "practice_session", sourceId: "review_session_1" },
    target,
    targetVersion: { versionType: "skill_path", version: path.pathVersion },
    outcome: "independent_success",
    occurredAt: "2026-07-01T10:00:00.000Z",
    sequence: 10,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 0,
    evidenceRefs: [{ evidenceKind: "attempt", eventId: "attempt_review_1" }],
    questionIds: [questionIds[0]],
    ...overrides,
  };
}

function assignmentFor(...ids: string[]): ReviewTargetAssignment {
  return { target, questionIds: ids };
}

function reviewSession(assignment: ReviewTargetAssignment): PracticeSession {
  const references = assignment.questionIds.map((questionId) => {
    const context = contentResolver.getQuestionContext(questionId)!;
    return {
      subjectId: context.subject.subjectSlug,
      courseId: context.courseArea.slug,
      pathId: context.skillPath.slug,
      stageId: context.stage.id,
      questionId,
      questionVersion: context.question.questionVersion,
      contentRevision: context.question.contentRevision,
    };
  });
  return {
    schemaVersion: 3,
    sessionId: "review_session_outcome",
    origin: "scheduled_review",
    subjectId: references[0].subjectId,
    mode: "review",
    courseId: references[0].courseId,
    selectedPathIds: [target.targetId],
    questionReferences: references,
    currentQuestionIndex: 0,
    startedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-10T10:00:00.000Z",
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed: "review-test",
      requestedCount: references.length,
      availableCount: references.length,
      selectedCount: references.length,
      fullySatisfied: true,
      shortageReason: null,
      excludedByReason: {},
      includedPathIds: [target.targetId],
      createdAt: "2026-07-10T10:00:00.000Z",
    },
    skippedQuestionIds: [],
    reviewTargets: [assignment],
  };
}

function sessionAttempt(
  session: PracticeSession,
  questionId: string,
  sequence: number,
  isCorrect: boolean | null,
  overrides: Partial<QuestionAttempt> = {},
) {
  const context = contentResolver.getQuestionContext(questionId)!;
  return attempt({
    eventId: `attempt_review_${questionId}_${sequence}`,
    practiceSessionId: session.sessionId,
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    attemptedAt: `2026-07-10T10:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    isCorrect,
    answer: isCorrect === null ? "?" : isCorrect ? "correct" : "wrong",
    ...(isCorrect === null ? {} : { outcomeKind: "graded" as const }),
    ...overrides,
  });
}

function sessionSupport(
  session: PracticeSession,
  questionId: string,
  sequence: number,
  type: "hint_viewed" | "solution_viewed",
) {
  const context = contentResolver.getQuestionContext(questionId)!;
  return supportEvent({
    eventId: `support_review_${questionId}_${sequence}`,
    practiceSessionId: session.sessionId,
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    occurredAt: `2026-07-10T10:${String(sequence).padStart(2, "0")}:30.000Z`,
    sequence,
    type,
  });
}

function completedSkillEvidence(start: string): ProgressEvidence {
  const startTime = Date.parse(start);
  return evidence(questionIds.map((questionId, index) => {
    const context = contentResolver.getQuestionContext(questionId)!;
    return attempt({
      eventId: `attempt_complete_${index}`,
      questionId,
      skillPathId: path.slug,
      stageId: context.stage.id,
      versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
      attemptedAt: new Date(startTime + index * 60_000).toISOString(),
      sequence: index + 1,
      isCorrect: true,
      answer: "correct",
      outcomeKind: "graded",
    });
  }));
}

function ordinaryAttempt(
  questionId: string,
  sequence: number,
  isCorrect: boolean,
  attemptedAt: string,
  overrides: Partial<QuestionAttempt> = {},
) {
  const context = contentResolver.getQuestionContext(questionId)!;
  return attempt({
    eventId: `attempt_ordinary_${questionId}_${sequence}`,
    questionId,
    skillPathId: path.slug,
    stageId: context.stage.id,
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    sequence,
    attemptedAt,
    isCorrect,
    answer: isCorrect ? "correct" : "wrong",
    outcomeKind: "graded",
    ...overrides,
  });
}
