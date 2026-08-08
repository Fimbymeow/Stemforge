import assert from "node:assert/strict";
import test from "node:test";
import { contentResolver } from "@/lib/content-resolver";
import { didCurrentSubmissionResolveMistake } from "@/lib/mistakes/resolution-feedback";
import type { ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import type { ReviewEvent } from "@/lib/review/types";

const QUESTION_ID = "hm-calc-diff-basic-f-001";
const VERSION_TWO_ID = "hm-calc-diff-basic-f-002";

test("wrong then independent correct announces the exact resolution", () => {
  const before = withAttempts(attempt(QUESTION_ID, 1, false));
  const after = withAttempts(...before.attempts, attempt(QUESTION_ID, 2, true));
  assert.equal(resolved(before, after, QUESTION_ID), true);
});

test("hint-assisted correctness does not announce resolution", () => {
  const before = withAttempts(attempt(QUESTION_ID, 1, false));
  const after = withAttempts(...before.attempts, attempt(QUESTION_ID, 2, true, { hintViewedBeforeSubmission: true }));
  assert.equal(resolved(before, after, QUESTION_ID), false);
});

test("solution-assisted correctness does not announce resolution", () => {
  const before = withAttempts(attempt(QUESTION_ID, 1, false));
  const after = withAttempts(...before.attempts, attempt(QUESTION_ID, 3, true));
  after.supportEvents.push(support(QUESTION_ID, 2));
  assert.equal(resolved(before, after, QUESTION_ID), false);
});

test("correct-first evidence receives ordinary correct feedback only", () => {
  assert.equal(resolved(empty(), withAttempts(attempt(QUESTION_ID, 1, true)), QUESTION_ID), false);
});

test("each real reopen-and-resolve transition is independently detectable", () => {
  const firstOpen = withAttempts(attempt(QUESTION_ID, 1, false));
  const firstResolved = withAttempts(...firstOpen.attempts, attempt(QUESTION_ID, 2, true));
  const reopened = withAttempts(...firstResolved.attempts, attempt(QUESTION_ID, 3, false));
  const resolvedAgain = withAttempts(...reopened.attempts, attempt(QUESTION_ID, 4, true));
  assert.equal(resolved(firstOpen, firstResolved, QUESTION_ID), true);
  assert.equal(resolved(firstResolved, reopened, QUESTION_ID), false);
  assert.equal(resolved(reopened, resolvedAgain, QUESTION_ID), true);
});

test("an archived old-version mistake is not cleared by a current-version correct answer", () => {
  const before = withAttempts(attempt(VERSION_TWO_ID, 1, false, { versionEvidence: { kind: "known", questionVersion: 1 } }));
  const after = withAttempts(...before.attempts, attempt(VERSION_TWO_ID, 2, true));
  assert.equal(resolved(before, after, VERSION_TWO_ID), false);
});

test("Review-linked success can resolve history without claiming this ordinary-submission feedback", () => {
  const wrong = attempt(QUESTION_ID, 1, false);
  const correct = attempt(QUESTION_ID, 2, true, { practiceSessionId: "review_session_feedback" });
  const before = withAttempts(wrong);
  const after = withAttempts(wrong, correct);
  after.reviewEvents.push(review(correct));
  assert.equal(resolved(before, after, QUESTION_ID), false);
});

function resolved(before: ProgressEvidence, after: ProgressEvidence, questionId: string) {
  const context = contentResolver.getQuestionContext(questionId)!;
  return didCurrentSubmissionResolveMistake({
    before,
    after,
    questionId,
    questionVersion: context.question.questionVersion,
    skillPathId: context.skillPath.slug,
  });
}

function empty(): ProgressEvidence {
  return { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] };
}

function withAttempts(...attempts: QuestionAttempt[]): ProgressEvidence {
  return { ...empty(), attempts };
}

function attempt(questionId: string, sequence: number, isCorrect: boolean, overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  const context = contentResolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    isCorrect,
    answer: isCorrect ? "correct" : "incorrect",
    attemptedAt: `2026-02-01T00:0${sequence}:00.000Z`,
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    eventId: `resolution_attempt_${sequence}`,
    outcomeKind: "graded",
    strategy: context.question.marking.strategy,
    strategyVersion: context.question.marking.strategyVersion,
    ...overrides,
  };
}

function support(questionId: string, sequence: number): QuestionSupportEvent {
  const context = contentResolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    type: "solution_viewed",
    occurredAt: `2026-02-01T00:0${sequence}:00.000Z`,
    sequence,
    afterGenuineAttempt: true,
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    eventId: `resolution_support_${sequence}`,
  };
}

function review(correct: QuestionAttempt): ReviewEvent {
  return {
    eventId: "review_resolution_feedback",
    source: { sourceType: "practice_session", sourceId: correct.practiceSessionId! },
    target: { targetType: "skill", targetId: correct.skillPathId },
    targetVersion: { versionType: "skill_path", version: 1 },
    outcome: "independent_success",
    occurredAt: "2026-02-01T00:03:00.000Z",
    sequence: 3,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 1,
    evidenceRefs: [{ evidenceKind: "attempt", eventId: correct.eventId }],
    questionIds: [correct.questionId],
  };
}
