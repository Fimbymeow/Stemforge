import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { getQuestionProgressForVersion, calculateSkillPathProgress } from "../lib/progress/calculations";
import { wasHintViewedBeforeSubmission } from "../lib/progress/hint-evidence";
import { createPracticeSessionSelection } from "../lib/practice/practice-selection";
import { derivePracticeQuestionStatus } from "../lib/practice/practice-question-status";
import { derivePracticeSessionSummary } from "../lib/practice/practice-summary";
import { attempt, evidence, supportEvent } from "./progress-fixtures";

const path = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? [])
  .find((item) => item.slug === "basic-differentiation")!;

function newAttempt(kind: "graded" | "malformed" | "unmarkable" | "guided_pending", isCorrect: boolean | null, sequence = 1) {
  return attempt({
    isCorrect,
    sequence,
    outcomeKind: kind,
    ...(kind === "graded" && isCorrect === false ? { outcomeReason: "value_wrong" as const } : {}),
    ...(kind === "malformed" ? { outcomeReason: "malformed_polynomial" as const } : {}),
    ...(kind === "unmarkable" ? { outcomeReason: "unsupported_mathematical_form" as const } : {}),
    strategy: kind === "guided_pending" ? "guided_self_check" : "polynomial_form",
    strategyVersion: 1,
  });
}

test("malformed and unmarkable interactions do not consume graded accuracy or mastery", () => {
  const malformed = newAttempt("malformed", null);
  const unmarkable = newAttempt("unmarkable", null, 2);
  const progress = getQuestionProgressForVersion(malformed.questionId, 1, evidence([malformed, unmarkable]));
  assert.equal(progress.attempted, true);
  assert.equal(progress.incorrectAttemptCount, 0);
  assert.equal(progress.masteryContribution, 0);
  assert.equal(progress.reviewRecommended, false);
  const pathProgress = calculateSkillPathProgress(path, evidence([malformed, unmarkable]));
  assert.equal(pathProgress.firstAttemptAccuracyPercentage, null);
  assert.equal(pathProgress.latestAttemptAccuracyPercentage, null);
});

test("first and latest accuracy use only graded attempts while legacy false remains compatible", () => {
  const malformed = newAttempt("malformed", null);
  const correct = newAttempt("graded", true, 2);
  const progress = calculateSkillPathProgress(path, evidence([malformed, correct]));
  assert.equal(progress.firstAttemptAccuracyPercentage, 100);
  assert.equal(progress.latestAttemptAccuracyPercentage, 100);
  const legacy = getQuestionProgressForVersion(malformed.questionId, 1, evidence([attempt({ isCorrect: false })]));
  assert.equal(legacy.incorrectAttemptCount, 1);
  assert.equal(legacy.masteryContribution, 0.1);
});

test("hint-before-submission query survives refresh, tabs, retries and version changes", () => {
  const version = { kind: "known", questionVersion: 1 } as const;
  const events = evidence([], [
    supportEvent({ occurredAt: "2026-07-12T10:00:00.000Z", sequence: 1, afterGenuineAttempt: false }),
    supportEvent({ eventId: "later", occurredAt: "2026-07-12T10:05:00.000Z", sequence: 4, afterGenuineAttempt: true }),
    supportEvent({ eventId: "old", occurredAt: "2026-07-12T09:00:00.000Z", sequence: 0, versionEvidence: { kind: "known", questionVersion: 2 } }),
  ]);
  assert.equal(wasHintViewedBeforeSubmission(events, "hm-calc-diff-basic-f-001", version, "2026-07-12T10:01:00.000Z", 2), true);
  assert.equal(wasHintViewedBeforeSubmission(events, "hm-calc-diff-basic-f-001", version, "2026-07-12T09:59:00.000Z", 1), false);
  assert.equal(wasHintViewedBeforeSubmission(events, "hm-calc-diff-basic-f-001", { kind: "known", questionVersion: 3 }, "2026-07-12T11:00:00.000Z", 5), false);
});

test("Practice Session summary and status distinguish non-graded interactions from incorrect work", () => {
  const selection = createPracticeSessionSelection({
    mode: "targeted", courseId: "calculus", selectedPathIds: ["basic-differentiation"],
    requestedCount: 1, seed: "marking", evidence: evidence(), timing: { type: "untimed" },
  });
  assert.ok(selection.session);
  const session = selection.session;
  const reference = session.questionReferences[0];
  const malformed = newAttempt("malformed", null, 1);
  const unmarkable = newAttempt("unmarkable", null, 2);
  malformed.questionId = reference.questionId;
  malformed.skillPathId = reference.pathId;
  malformed.stageId = reference.stageId;
  malformed.versionEvidence = { kind: "known", questionVersion: reference.questionVersion };
  malformed.practiceSessionId = session.sessionId;
  unmarkable.questionId = reference.questionId;
  unmarkable.skillPathId = reference.pathId;
  unmarkable.stageId = reference.stageId;
  unmarkable.versionEvidence = { kind: "known", questionVersion: reference.questionVersion };
  unmarkable.practiceSessionId = session.sessionId;
  const data = evidence([malformed, unmarkable]);
  const status = derivePracticeQuestionStatus(session, reference, data);
  const summary = derivePracticeSessionSummary(session, data);
  assert.equal(status.primary, "attempted");
  assert.equal(status.worthRevisit, false);
  assert.equal(summary.attemptedCount, 1);
  assert.equal(summary.incorrectCount, 0);
  assert.deepEqual(summary.incorrectQuestionIds, []);
});

test("a later non-graded Practice interaction does not erase an earlier graded result", () => {
  const selection = createPracticeSessionSelection({
    mode: "targeted", courseId: "calculus", selectedPathIds: ["basic-differentiation"],
    requestedCount: 1, seed: "marking-result", evidence: evidence(), timing: { type: "untimed" },
  });
  assert.ok(selection.session);
  const session = selection.session;
  const reference = session.questionReferences[0];
  const correct = newAttempt("graded", true, 1);
  const malformed = newAttempt("malformed", null, 2);
  for (const item of [correct, malformed]) {
    item.questionId = reference.questionId;
    item.skillPathId = reference.pathId;
    item.stageId = reference.stageId;
    item.versionEvidence = { kind: "known", questionVersion: reference.questionVersion };
    item.practiceSessionId = session.sessionId;
  }
  const data = evidence([correct, malformed]);
  const status = derivePracticeQuestionStatus(session, reference, data);
  const summary = derivePracticeSessionSummary(session, data);
  assert.equal(status.primary, "complete");
  assert.equal(status.worthRevisit, false);
  assert.equal(summary.correctCount, 1);
  assert.equal(summary.incorrectCount, 0);
});
