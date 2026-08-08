import assert from "node:assert/strict";
import test from "node:test";
import { contentResolver } from "@/lib/content-resolver";
import { deriveMistakeLog, type MistakeItem } from "@/lib/mistakes/derivation";
import type { ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import type { ReviewEvent, ReviewOutcome } from "@/lib/review/types";

const BASIC_1 = "hm-calc-diff-basic-f-001";
const BASIC_2 = "hm-calc-diff-basic-f-002";
const CHAIN_1 = contentResolver.getPathQuestions("chain-rule")[0].id;

test("no attempts produces no mistake", () => {
  assert.equal(model(empty()).openCount, 0);
});

test("a correct first attempt produces no mistake", () => {
  assert.equal(model(withAttempts(attempt(BASIC_1, 1, true))).openCount, 0);
});

test("malformed and unmarkable attempts do not produce mistakes", () => {
  const evidence = withAttempts(
    attempt(BASIC_1, 1, false, { outcomeKind: "malformed" }),
    attempt(BASIC_2, 2, false, { outcomeKind: "unmarkable" }),
  );
  assert.equal(model(evidence).openCount, 0);
});

test("guided-pending attempts do not produce mistakes", () => {
  assert.equal(model(withAttempts(attempt(BASIC_1, 1, null, { outcomeKind: "guided_pending" }))).openCount, 0);
});

test("one genuine graded incorrect attempt opens one mistake", () => {
  const item = onlyItem(model(withAttempts(attempt(BASIC_1, 1, false))));
  assert.equal(item.state, "open");
  assert.equal(item.incorrectAttemptCount, 1);
});

test("repeated incorrect attempts at one version form one counted group", () => {
  const item = onlyItem(model(withAttempts(attempt(BASIC_1, 1, false), attempt(BASIC_1, 2, false))));
  assert.equal(item.incorrectAttemptCount, 2);
  assert.equal(item.latestIncorrectAt, iso(2));
});

test("assisted correctness does not resolve a mistake", () => {
  const item = onlyItem(model(withAttempts(
    attempt(BASIC_1, 1, false),
    attempt(BASIC_1, 2, true, { hintViewedBeforeSubmission: true }),
  )));
  assert.equal(item.state, "open");
});

test("solution-viewed correctness does not resolve a mistake", () => {
  const evidence = withAttempts(attempt(BASIC_1, 1, false), attempt(BASIC_1, 3, true));
  evidence.supportEvents.push(support(BASIC_1, 2, "solution_viewed"));
  assert.equal(onlyItem(model(evidence)).state, "open");
});

test("later independent correctness resolves a mistake", () => {
  const item = onlyItem(model(withAttempts(attempt(BASIC_1, 1, false), attempt(BASIC_1, 2, true))));
  assert.equal(item.state, "resolved");
  assert.equal(item.resolutionSource, "ordinary_independent_success");
  assert.equal(item.resolvedAt, iso(2));
});

test("a later incorrect attempt reopens a resolved mistake", () => {
  const item = onlyItem(model(withAttempts(
    attempt(BASIC_1, 1, false),
    attempt(BASIC_1, 2, true),
    attempt(BASIC_1, 3, false),
  )));
  assert.equal(item.state, "open");
  assert.equal(item.wasReopened, true);
  assert.equal(item.resolvedAt, null);
});

test("correct-first evidence followed by an error opens without claiming a reopening", () => {
  const item = onlyItem(model(withAttempts(
    attempt(BASIC_1, 1, true),
    attempt(BASIC_1, 2, false),
  )));
  assert.equal(item.state, "open");
  assert.equal(item.wasReopened, false);
});

test("an old-version mistake remains history after the current version changes", () => {
  const item = onlyItem(model(withAttempts(attempt(BASIC_2, 1, false, { versionEvidence: known(1) }))));
  assert.equal(item.questionVersion, 1);
  assert.equal(item.state, "historical");
  assert.equal(item.isCurrentVersion, false);
});

test("a current-version error after a version change opens a separate group", () => {
  const result = model(withAttempts(
    attempt(BASIC_2, 1, false, { versionEvidence: known(1) }),
    attempt(BASIC_2, 2, false, { versionEvidence: known(2) }),
  ));
  assert.equal(result.openCount, 1);
  assert.equal(result.historicalCount, 1);
  assert.deepEqual(allItems(result).map((item) => item.questionVersion).sort(), [1, 2]);
});

test("Review independent success resolves only its exactly linked question/version", () => {
  const wrong = attempt(BASIC_1, 1, false);
  const correct = attempt(BASIC_1, 2, true, { practiceSessionId: "review_session_exact" });
  const evidence = withAttempts(wrong, correct);
  evidence.reviewEvents.push(review(correct, "independent_success"));
  const item = onlyItem(model(evidence));
  assert.equal(item.state, "resolved");
  assert.equal(item.resolutionSource, "review_independent_success");
});

test("an assisted Review outcome does not resolve", () => {
  const wrong = attempt(BASIC_1, 1, false);
  const correct = attempt(BASIC_1, 2, true, { practiceSessionId: "review_session_assisted" });
  const evidence = withAttempts(wrong, correct);
  evidence.reviewEvents.push(review(correct, "hint_assisted"));
  assert.equal(onlyItem(model(evidence)).state, "open");
});

test("Review success linked to another question does not resolve", () => {
  const wrong = attempt(BASIC_1, 1, false);
  const otherCorrect = attempt(BASIC_2, 2, true, { practiceSessionId: "review_session_other" });
  const evidence = withAttempts(wrong, otherCorrect);
  evidence.reviewEvents.push(review(otherCorrect, "independent_success"));
  assert.equal(onlyItem(model(evidence)).state, "open");
});

test("two questions in one skill remain separate mistake groups", () => {
  const result = model(withAttempts(attempt(BASIC_1, 1, false), attempt(BASIC_2, 2, false)));
  assert.equal(result.openCount, 2);
  assert.equal(result.openGroups.length, 1);
  assert.equal(result.openGroups[0].items.length, 2);
});

test("mistakes across Basic Differentiation and Chain Rule remain isolated", () => {
  const result = model(withAttempts(attempt(BASIC_1, 1, false), attempt(CHAIN_1, 2, false)));
  assert.equal(result.openCount, 2);
  assert.deepEqual(result.openGroups.map((group) => group.skillPathId).sort(), ["basic-differentiation", "chain-rule"]);
});

test("mismatched skill and stage evidence is ignored safely", () => {
  const evidence = withAttempts(
    attempt(BASIC_1, 1, false, { skillPathId: "chain-rule" }),
    attempt(BASIC_1, 2, false, { stageId: "chain-rule-stage-foundations" }),
  );
  assert.equal(model(evidence).openCount, 0);
});

test("open ordering is deterministic by latest occurrence then question order", () => {
  const result = model(withAttempts(
    attempt(BASIC_1, 1, false),
    attempt(BASIC_2, 3, false),
    attempt(CHAIN_1, 2, false),
  ));
  assert.deepEqual(result.openGroups.flatMap((group) => group.items.map((item) => item.questionId)), [
    BASIC_2,
    BASIC_1,
    CHAIN_1,
  ]);
  assert.deepEqual(model(withAttempts(
    attempt(CHAIN_1, 2, false),
    attempt(BASIC_2, 3, false),
    attempt(BASIC_1, 1, false),
  )).openGroups, result.openGroups);
});

test("resolved history ordering is deterministic", () => {
  const evidence = withAttempts(
    attempt(BASIC_1, 1, false),
    attempt(BASIC_1, 2, true),
    attempt(BASIC_2, 3, false),
    attempt(BASIC_2, 4, true),
  );
  assert.deepEqual(model(evidence).historyGroups[0].items.map((item) => item.questionId), [BASIC_2, BASIC_1]);
  assert.deepEqual(model(withAttempts(...evidence.attempts.toReversed())).historyGroups, model(evidence).historyGroups);
});

function model(evidence: ProgressEvidence) {
  return deriveMistakeLog(evidence, "higher-maths");
}

function onlyItem(result: ReturnType<typeof model>): MistakeItem {
  const items = allItems(result);
  assert.equal(items.length, 1);
  return items[0];
}

function allItems(result: ReturnType<typeof model>) {
  return [...result.openGroups, ...result.historyGroups].flatMap((group) => group.items);
}

function empty(): ProgressEvidence {
  return { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] };
}

function withAttempts(...attempts: QuestionAttempt[]): ProgressEvidence {
  return { ...empty(), attempts };
}

function attempt(
  questionId: string,
  sequence: number,
  isCorrect: boolean | null,
  overrides: Partial<QuestionAttempt> = {},
): QuestionAttempt {
  const context = contentResolver.getQuestionContext(questionId);
  if (!context) throw new Error(`Missing fixture question ${questionId}`);
  return {
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    isCorrect,
    answer: isCorrect ? "correct" : "incorrect",
    attemptedAt: iso(sequence),
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: known(context.question.questionVersion),
    eventId: `attempt_mistakes_${questionId}_${sequence}`,
    outcomeKind: "graded",
    strategy: context.question.marking.strategy,
    strategyVersion: context.question.marking.strategyVersion,
    ...overrides,
  };
}

function support(questionId: string, sequence: number, type: QuestionSupportEvent["type"]): QuestionSupportEvent {
  const context = contentResolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    type,
    occurredAt: iso(sequence),
    sequence,
    afterGenuineAttempt: true,
    versionEvidence: known(context.question.questionVersion),
    eventId: `support_mistakes_${questionId}_${sequence}`,
  };
}

function review(linkedAttempt: QuestionAttempt, outcome: ReviewOutcome): ReviewEvent {
  const context = contentResolver.getQuestionContext(linkedAttempt.questionId)!;
  return {
    eventId: `review_${linkedAttempt.eventId}`,
    source: { sourceType: "practice_session", sourceId: linkedAttempt.practiceSessionId! },
    target: { targetType: "skill", targetId: linkedAttempt.skillPathId },
    targetVersion: { versionType: "skill_path", version: context.skillPath.pathVersion },
    outcome,
    occurredAt: linkedAttempt.attemptedAt,
    sequence: linkedAttempt.sequence,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: outcome === "independent_success" ? 1 : "recovery",
    evidenceRefs: [{ evidenceKind: "attempt", eventId: linkedAttempt.eventId }],
    questionIds: [linkedAttempt.questionId],
  };
}

function known(questionVersion: number) {
  return { kind: "known" as const, questionVersion };
}

function iso(sequence: number) {
  return `2026-08-01T10:${String(sequence).padStart(2, "0")}:00.000Z`;
}
