import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalContent } from "@/data/canonical-content";
import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";
import { contentResolver } from "@/lib/content-resolver";
import { validateContent } from "@/lib/content-validation";
import { deriveMistakeLog } from "@/lib/mistakes/derivation";
import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import { repairPracticeSessionStore } from "@/lib/practice/practice-repair";
import { isPracticeSession } from "@/lib/practice/practice-validation";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import { deriveSkillReviewState } from "@/lib/review/derivation";
import {
  PRACTICE_COMPATIBILITY_NOW,
  basicPracticePath,
  basicPracticeQuestionIds,
  compatibilityAttempt,
  legacyStageBackedPracticeSession,
  legacyStageBackedReviewSession,
  practiceCompatibilityEvidence,
} from "./fixtures/practice-compatibility";

const EXPECTED_BASIC_ORDER = [
  "hm-calc-diff-basic-f-001",
  "hm-calc-diff-basic-f-002",
  "hm-calc-diff-basic-f-003",
  "hm-calc-diff-basic-a-001",
  "hm-calc-diff-basic-a-002",
  "hm-calc-diff-basic-a-003",
  "hm-calc-diff-basic-ppq-001",
  "hm-calc-diff-basic-ppq-002",
];

const EXPECTED_CHAIN_ORDER = [
  ...Array.from({ length: 10 }, (_, index) => `hm-calc-diff-chain-f-${String(index + 1).padStart(3, "0")}`),
  ...Array.from({ length: 9 }, (_, index) => `hm-calc-diff-chain-a-${String(index + 1).padStart(3, "0")}`),
  ...[3, 4, 7, 8, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21]
    .map((number) => `hm-calc-diff-chain-ppq-${String(number).padStart(3, "0")}`),
];

test("Higher Maths exposes explicit deterministic Practice ordering", () => {
  assert.deepEqual(basicPracticeQuestionIds, EXPECTED_BASIC_ORDER);
  assert.deepEqual(
    contentResolver.getPracticeQuestions("chain-rule").map((question) => question.id),
    EXPECTED_CHAIN_ORDER,
  );
  assert.equal(new Set(EXPECTED_BASIC_ORDER).size, 8);
  assert.equal(new Set(EXPECTED_CHAIN_ORDER).size, 34);
});

test("Practice position resolves previous and next without changing legacy path navigation", () => {
  const first = contentResolver.getPracticeQuestionPosition(EXPECTED_BASIC_ORDER[0]);
  const stageBoundary = contentResolver.getPracticeQuestionPosition(EXPECTED_BASIC_ORDER[3]);
  const last = contentResolver.getPracticeQuestionPosition(EXPECTED_BASIC_ORDER.at(-1)!);
  assert.deepEqual({ index: first?.index, position: first?.position, total: first?.total }, { index: 0, position: 1, total: 8 });
  assert.equal(first?.previousQuestion, undefined);
  assert.equal(first?.nextQuestion?.id, EXPECTED_BASIC_ORDER[1]);
  assert.equal(stageBoundary?.previousQuestion?.id, EXPECTED_BASIC_ORDER[2]);
  assert.equal(stageBoundary?.nextQuestion?.id, EXPECTED_BASIC_ORDER[4]);
  assert.equal(last?.previousQuestion?.id, EXPECTED_BASIC_ORDER[6]);
  assert.equal(last?.nextQuestion, undefined);
  assert.deepEqual(contentResolver.getPathQuestions("basic-differentiation").map((question) => question.id), EXPECTED_BASIC_ORDER);
});

test("Practice projection contains each active legacy-stage question exactly once", () => {
  for (const pathId of ["basic-differentiation", "chain-rule"]) {
    const path = contentResolver.getPathContext(pathId)?.skillPath;
    assert(path);
    const legacyIds = (path.learningStages ?? []).filter((stage) => stage.contentStatus === "active").flatMap((stage) => stage.questionIds);
    const practiceIds = contentResolver.getPracticeQuestions(path).map((question) => question.id);
    assert.deepEqual(new Set(practiceIds), new Set(legacyIds));
    assert.equal(practiceIds.length, legacyIds.length);
    for (const questionId of practiceIds) {
      const context = contentResolver.getQuestionContext(questionId);
      assert(context);
      assert.equal(context.question.stageId, context.stage.id);
      assert.equal(context.stage.questionIds.includes(questionId), true);
    }
  }
});

test("content validation enforces exact Practice membership", () => {
  const canonical = validateContent({ subjects: [...canonicalContent.subjects], questions: [...canonicalContent.questions] });
  assert.equal(canonical.errors.some((issue) => issue.code.includes("practice")), false);

  const copy = structuredClone(higherMaths);
  const path = copy.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? [])
    .find((item) => item.slug === "basic-differentiation");
  assert(path?.practiceQuestionIds);
  path.practiceQuestionIds = [path.practiceQuestionIds[0], ...path.practiceQuestionIds.slice(0, -1)];
  const invalid = validateContent({ subjects: [copy, higherPhysics], questions: [...canonicalContent.questions] });
  assert.equal(invalid.errors.some((issue) => issue.code === "duplicate-practice-question"), true);
  assert.equal(invalid.errors.some((issue) => issue.code === "practice-question-missing"), true);
});

test("legacy mastery and completion remain frozen while Practice progress is count-only", () => {
  const snapshots = Object.fromEntries(Object.entries(practiceCompatibilityEvidence).slice(0, 4).map(([name, evidence]) => {
    const progress = calculateSkillPathProgress(basicPracticePath, evidence, contentResolver.getQuestionVersions());
    return [name, {
      status: progress.status,
      completionPercentage: progress.completionPercentage,
      masteryScore: progress.masteryScore,
      completed: progress.completedQuestionIds.length,
      practiceTotal: basicPracticeQuestionIds.length,
    }];
  }));
  assert.deepEqual(snapshots, {
    fresh: { status: "not_started", completionPercentage: 0, masteryScore: 0, completed: 0, practiceTotal: 8 },
    partial: { status: "in_progress", completionPercentage: 38, masteryScore: 40, completed: 3, practiceTotal: 8 },
    completed: { status: "mastered", completionPercentage: 100, masteryScore: 100, completed: 8, practiceTotal: 8 },
    reviewDue: { status: "mastered", completionPercentage: 100, masteryScore: 100, completed: 8, practiceTotal: 8 },
  });
});

test("Review eligibility and due state remain stage-backed and unchanged", () => {
  const fresh = deriveSkillReviewState(basicPracticePath, practiceCompatibilityEvidence.fresh, PRACTICE_COMPATIBILITY_NOW);
  const partial = deriveSkillReviewState(basicPracticePath, practiceCompatibilityEvidence.partial, PRACTICE_COMPATIBILITY_NOW);
  const due = deriveSkillReviewState(basicPracticePath, practiceCompatibilityEvidence.reviewDue, PRACTICE_COMPATIBILITY_NOW);
  assert.deepEqual({ eligible: fresh.eligible, due: fresh.due, reason: fresh.reason }, { eligible: false, due: false, reason: "not_learned" });
  assert.deepEqual({ eligible: partial.eligible, due: partial.due, reason: partial.reason }, { eligible: false, due: false, reason: "not_learned" });
  assert.deepEqual({ eligible: due.eligible, due: due.due, reason: due.reason }, { eligible: true, due: true, reason: "due_after_time" });
});

test("existing Review history remains canonical without a grouping-induced content change", () => {
  const reviewEvent = {
    eventId: "practice_compat_review_event",
    source: { sourceType: "practice_session" as const, sourceId: "review_session_practice_compat" },
    target: { targetType: "skill" as const, targetId: basicPracticePath.slug },
    targetVersion: { versionType: "skill_path" as const, version: basicPracticePath.pathVersion },
    outcome: "independent_success" as const,
    occurredAt: "2026-07-03T10:00:00.000Z",
    sequence: 20,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 1 as const,
    evidenceRefs: [],
    questionIds: [EXPECTED_BASIC_ORDER[0]],
  };
  const state = deriveSkillReviewState(basicPracticePath, {
    ...practiceCompatibilityEvidence.completed,
    reviewEvents: [reviewEvent],
  }, PRACTICE_COMPATIBILITY_NOW);
  assert.equal(state.canonicalEvent?.eventId, reviewEvent.eventId);
  assert.deepEqual({ eligible: state.eligible, due: state.due, reason: state.reason }, {
    eligible: true,
    due: false,
    reason: "not_due",
  });
});

test("historical stage provenance no longer hides or prevents resolution of a current mistake", () => {
  const questionId = EXPECTED_BASIC_ORDER[0];
  const historicalWrong = compatibilityAttempt(questionId, 1, false, { stageId: "legacy-stage-provenance" });
  const open = deriveMistakeLog({ ...practiceCompatibilityEvidence.openMistake, attempts: [historicalWrong] });
  assert.equal(open.openCount, 1);
  assert.equal(open.openGroups[0].items[0].questionId, questionId);

  const currentRight = compatibilityAttempt(questionId, 2, true);
  const resolved = deriveMistakeLog({ ...practiceCompatibilityEvidence.openMistake, attempts: [historicalWrong, currentRight] });
  assert.equal(resolved.openCount, 0);
  assert.equal(resolved.resolvedCount, 1);
});

test("legacy stage-backed Practice and Review sessions still validate, repair and resolve", () => {
  for (const session of [legacyStageBackedPracticeSession, legacyStageBackedReviewSession]) {
    assert.equal(isPracticeSession(session), true);
    const repaired = repairPracticeSessionStore({ schemaVersion: 3, activeSessionId: session.sessionId, sessions: [session] });
    assert.equal(repaired.store.activeSessionId, session.sessionId);
    assert.equal(repaired.store.sessions[0].status, "active");
    for (const reference of session.questionReferences) {
      assert.equal(resolvePracticeReference(reference).status, "resolved");
    }
  }
});

test("Higher Physics remains outside the Higher Maths Practice projection", () => {
  assert.equal(JSON.stringify(higherPhysics).includes("practiceQuestionIds"), false);
  assert.deepEqual(higherPhysics.learningStages.map((stage) => stage.name), [
    "Foundations",
    "Applications",
    "Past Paper-style Questions",
  ]);
  const validation = validateContent({ subjects: [...canonicalContent.subjects], questions: [...canonicalContent.questions] });
  assert.equal(validation.errors.length, 0);
});

test("immutable Chain Rule import receipts retain the original 34-question application history", () => {
  const receiptPaths = [
    "content-import/receipts/004bfc34f21bcd4c7e0f428fd54446c2813cd206a8fc350d1843bd3de905a81f.json",
    "content-import/receipts/d7dc37ee2bb450342b72a85b82fdfc09af82cce05728186c9128a4a32a9d1305.json",
  ];
  for (const receiptPath of receiptPaths) {
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as {
      receiptVersion: number;
      appliedQuestionIds: string[];
      outputPaths: string[];
    };
    assert.equal(receipt.receiptVersion, 1);
    assert.deepEqual(receipt.appliedQuestionIds, EXPECTED_CHAIN_ORDER);
    assert.deepEqual(receipt.outputPaths, ["content/questions/higher-maths/chain-rule.ts"]);
  }
});
