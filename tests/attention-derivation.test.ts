import assert from "node:assert/strict";
import test from "node:test";
import { deriveSkillAttention, formatReviewDueReason } from "@/lib/attention/derivation";
import { contentResolver } from "@/lib/content-resolver";
import { deriveSkillPathNextAction } from "@/lib/learning/next-action";
import type { ProgressEvidence, QuestionAttempt } from "@/lib/progress/types";
import type { ReviewEvent } from "@/lib/review/types";

const context = contentResolver.getPathContext("basic-differentiation")!;
const skillPath = context.skillPath;
const questionIds = skillPath.learningStages!.flatMap((stage) => stage.questionIds);
const VERSION_TWO_ID = "hm-calc-diff-basic-f-002";

test("untouched skill returns no attention judgement", () => {
  const model = derive(empty());
  assert.equal(model.primaryReason.code, "not_started");
  assert.equal(model.needsAttention, false);
  assert.doesNotMatch(model.primaryReason.detail, /weak|risk|score/i);
});

test("an incomplete current stage gets a concrete structural reason", () => {
  const model = derive(withAttempts(attempt(questionIds[0], 1, true)));
  assert.equal(model.primaryReason.code, "incomplete_stage");
  assert.match(model.primaryReason.detail, /^Foundations: 1 of 3 complete$/);
});

test("one open current-version mistake takes precedence and is counted", () => {
  const model = derive(withAttempts(attempt(questionIds[0], 1, false)));
  assert.equal(model.primaryReason.code, "open_mistakes");
  assert.equal(model.primaryReason.detail, "1 unresolved question");
});

test("multiple open mistakes use the grouped question count", () => {
  const model = derive(withAttempts(attempt(questionIds[0], 1, false), attempt(questionIds[1], 2, false)));
  assert.equal(model.primaryReason.detail, "2 unresolved questions");
});

test("assisted correctness leaves the mistake reason open", () => {
  const model = derive(withAttempts(
    attempt(questionIds[0], 1, false),
    attempt(questionIds[0], 2, true, { hintViewedBeforeSubmission: true }),
  ));
  assert.equal(model.primaryReason.code, "open_mistakes");
});

test("independent correctness removes the mistake reason", () => {
  const model = derive(withAttempts(attempt(questionIds[0], 1, false), attempt(questionIds[0], 2, true)));
  assert.equal(model.reasons.some((item) => item.code === "open_mistakes"), false);
  assert.equal(model.primaryReason.code, "incomplete_stage");
});

test("Review due after time stays a Review-specific explanation", () => {
  const model = derive(completedEvidence(), new Date("2027-01-01T00:00:00.000Z"));
  assert.equal(model.primaryReason.code, "review_due_after_time");
  assert.match(model.primaryReason.detail, /Review is due/i);
  assert.doesNotMatch(model.primaryReason.detail, /weak/i);
});

test("recently incorrect Review remains distinct from time-based Review", () => {
  const evidence = completedEvidence();
  evidence.attempts.push(attempt(questionIds[0], 20, false, { attemptedAt: "2026-01-02T01:00:00.000Z" }));
  const model = derive(evidence, new Date("2026-01-02T01:01:00.000Z"));
  assert.ok(model.reasons.some((item) => item.code === "review_recently_incorrect"));
  assert.notEqual(formatReviewDueReason("recently_incorrect"), formatReviewDueReason("due_after_time"));
});

test("known older-version evidence explains updated content without deleting earlier progress", () => {
  const model = derive(withAttempts(attempt(VERSION_TWO_ID, 1, true, { versionEvidence: { kind: "known", questionVersion: 1 } })));
  assert.equal(model.primaryReason.code, "content_updated");
  assert.match(model.primaryReason.detail, /earlier progress is saved/i);
});

test("unknown-version evidence uses a qualified required-recheck reason", () => {
  const model = derive(withAttempts(attempt(VERSION_TWO_ID, 1, true, {
    legacyCompleted: true,
    versionEvidence: { kind: "unknown_legacy", questionVersion: null },
  })));
  assert.equal(model.primaryReason.code, "reassessment_required");
  assert.match(model.primaryReason.detail, /earlier progress is saved/i);
});

test("an existing Review content-changed reason maps to the same learner terminology", () => {
  const evidence = completedEvidence();
  evidence.reviewEvents.push(reviewEvent({
    targetVersion: { versionType: "skill_path", version: skillPath.pathVersion - 1 },
  }));
  const model = derive(evidence);
  assert.equal(model.primaryReason.code, "content_updated");
  assert.match(model.primaryReason.detail, /updated content/i);
});

test("completed and mastered skills due for Review are not labelled weak", () => {
  const model = derive(completedEvidence(), new Date("2027-01-01T00:00:00.000Z"));
  assert.equal(model.primaryReason.code, "review_due_after_time");
  assert.doesNotMatch(JSON.stringify(model), /weak|weakness/i);
});

test("reassessment deterministically precedes a current open mistake", () => {
  const model = derive(withAttempts(
    attempt(VERSION_TWO_ID, 1, true, { versionEvidence: { kind: "known", questionVersion: 1 } }),
    attempt(VERSION_TWO_ID, 2, false),
  ));
  assert.deepEqual(model.reasons.slice(0, 2).map((item) => item.code), ["content_updated", "open_mistakes"]);
});

test("an open mistake deterministically precedes stage incompleteness", () => {
  const model = derive(withAttempts(attempt(questionIds[0], 1, false)));
  assert.deepEqual(model.reasons.slice(0, 2).map((item) => item.code), ["open_mistakes", "incomplete_stage"]);
});

test("attention output contains no opaque score", () => {
  const serialized = JSON.stringify(derive(withAttempts(attempt(questionIds[0], 1, false))));
  assert.doesNotMatch(serialized, /score|percentage|confidence|risk/i);
});

test("attention derivation does not change existing next-action selection", () => {
  const evidence = withAttempts(attempt(questionIds[0], 1, false));
  const before = deriveSkillPathNextAction({ pathId: skillPath.slug, evidence });
  derive(evidence);
  const after = deriveSkillPathNextAction({ pathId: skillPath.slug, evidence });
  assert.deepEqual(after, before);
});

function derive(evidence: ProgressEvidence, now = new Date("2026-01-02T00:08:00.000Z")) {
  return deriveSkillAttention({ skillPath, evidence, now });
}

function completedEvidence() {
  return withAttempts(...questionIds.map((id, index) => attempt(id, index + 1, true)));
}

function empty(): ProgressEvidence {
  return { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] };
}

function withAttempts(...attempts: QuestionAttempt[]): ProgressEvidence {
  return { ...empty(), attempts };
}

function attempt(questionId: string, sequence: number, isCorrect: boolean, overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  const questionContext = contentResolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: questionContext.skillPath.slug,
    stageId: questionContext.stage.id,
    isCorrect,
    answer: isCorrect ? "correct" : "incorrect",
    attemptedAt: `2026-01-02T00:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: questionContext.question.questionVersion },
    eventId: `attention_attempt_${questionId}_${sequence}`,
    outcomeKind: "graded",
    strategy: questionContext.question.marking.strategy,
    strategyVersion: questionContext.question.marking.strategyVersion,
    ...overrides,
  };
}

function reviewEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    eventId: "attention_review_event",
    source: { sourceType: "practice_session", sourceId: "attention_review_session" },
    target: { targetType: "skill", targetId: skillPath.slug },
    targetVersion: { versionType: "skill_path", version: skillPath.pathVersion },
    outcome: "independent_success",
    occurredAt: "2026-01-02T00:07:30.000Z",
    sequence: 50,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 1,
    evidenceRefs: [],
    questionIds: [],
    ...overrides,
  };
}
