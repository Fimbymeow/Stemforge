import assert from "node:assert/strict";
import test from "node:test";
import { canonicalQuestionModuleRegistry } from "../data/canonical-content";
import { higherPhysics } from "../data/higher-physics";
import { contentResolver } from "../lib/content-resolver";
import { derivePracticeDependencies, isPracticeCompatibleSkill, isPracticeOnlySkill } from "../lib/practice-model";
import { calculateSkillPathProgress, selectNextQuestionId } from "../lib/progress/calculations";
import type { ProgressEvidence } from "../lib/progress/types";
import type { ReviewEvent } from "../lib/review/types";
import { deriveSkillFirstCompletedAt, deriveSkillReviewState } from "../lib/review/derivation";
import { deriveCourseDashboardSummary } from "../lib/dashboard-derivations";
import { compatibilityAttempt } from "./fixtures/practice-compatibility";

const emptyEvidence = (): ProgressEvidence => ({
  attempts: [],
  supportEvents: [],
  guidedSelfAssessments: [],
  achievementSnapshots: [],
  reviewEvents: [],
  flashcardReviews: [],
});

test("live Higher Maths skills expose the approved continuous Practice projections", () => {
  const basic = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const chain = contentResolver.getPathContext("chain-rule")!.skillPath;

  assert.equal(isPracticeCompatibleSkill(basic), true);
  assert.equal(isPracticeCompatibleSkill(chain), true);
  assert.equal(basic.practiceQuestionIds?.length, 8);
  assert.equal(chain.practiceQuestionIds?.length, 34);
  assert.deepEqual(basic.practiceQuestionIds, basic.learningStages?.flatMap((stage) => stage.questionIds));
  assert.deepEqual(chain.practiceQuestionIds, chain.learningStages?.flatMap((stage) => stage.questionIds));
});

test("next-question selection obeys Practice order rather than historical stage order", () => {
  const source = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const reversed = { ...source, practiceQuestionIds: [...source.practiceQuestionIds!].reverse() };
  assert.equal(selectNextQuestionId(reversed, emptyEvidence()), reversed.practiceQuestionIds[0]);
});

test("skill dependencies distinguish universal prerequisites from question-level conditions", () => {
  const basic = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const chain = contentResolver.getPathContext("chain-rule")!.skillPath;
  const tangents = contentResolver.getPathContext("tangents-and-normals")!.skillPath;

  assert.deepEqual(derivePracticeDependencies(basic), { prerequisites: [], conditional: [] });
  assert.deepEqual(derivePracticeDependencies(chain), {
    prerequisites: [{
      skillPathId: "basic-differentiation",
      name: "Basic differentiation",
      href: "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
    }],
    conditional: [],
  });
  assert.deepEqual(derivePracticeDependencies(tangents), {
    prerequisites: [{
      skillPathId: "basic-differentiation",
      name: "Basic differentiation",
      href: "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
    }],
    conditional: [{
      skillPathId: "chain-rule",
      name: "Chain rule",
      href: "/subjects/higher-maths/calculus/differentiation/chain-rule",
    }],
  });
});

test("Practice-only Tangents derives structural completion and Review eligibility without inventing legacy mastery", () => {
  const tangents = contentResolver.getPathContext("tangents-and-normals")!.skillPath;
  const ids = tangents.practiceQuestionIds!;
  const versions = contentResolver.getQuestionVersions();
  const at = (count: number): ProgressEvidence => ({
    ...emptyEvidence(),
    attempts: ids.slice(0, count).map((questionId, index) => compatibilityAttempt(questionId, index + 1, true)),
  });

  assert.equal(isPracticeOnlySkill(tangents), true);
  const fresh = calculateSkillPathProgress(tangents, at(0), versions);
  const partial = calculateSkillPathProgress(tangents, at(29), versions);
  const complete = calculateSkillPathProgress(tangents, at(30), versions);
  assert.deepEqual({ completed: fresh.completedQuestionIds.length, status: fresh.status }, { completed: 0, status: "not_started" });
  assert.deepEqual({ completed: partial.completedQuestionIds.length, status: partial.status }, { completed: 29, status: "in_progress" });
  assert.deepEqual({ completed: complete.completedQuestionIds.length, total: complete.totalQuestions, percentage: complete.completionPercentage, status: complete.status }, {
    completed: 30, total: 30, percentage: 100, status: "completed",
  });
  assert.equal(complete.masteryScore, 0);
  assert.deepEqual(complete.stageProgress, {});
  assert.equal(tangents.learningStages?.length ?? 0, 0);

  assert.equal(deriveSkillReviewState(tangents, at(0)).eligible, false);
  assert.equal(deriveSkillReviewState(tangents, at(29)).eligible, false);
  const baseline = deriveSkillFirstCompletedAt(tangents, at(30), versions);
  assert.equal(baseline.status, "eligible");
  assert.equal(baseline.firstCompletedAt, at(30).attempts.at(-1)?.attemptedAt);
  const review = deriveSkillReviewState(tangents, at(30), new Date("2026-07-03T10:31:00.000Z"));
  assert.equal(review.eligible, true);
  assert.equal(review.due, true);
  assert.equal(review.reason, "due_after_time");

  const completedReview: ReviewEvent = {
    eventId: "tangents-review-success",
    source: { sourceType: "practice_session", sourceId: "review_session_tangents" },
    target: { targetType: "skill", targetId: tangents.slug },
    targetVersion: { versionType: "skill_path", version: tangents.pathVersion },
    outcome: "independent_success",
    occurredAt: "2026-07-03T11:00:00.000Z",
    sequence: 31,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 1,
    evidenceRefs: [],
    questionIds: ids.slice(0, 5),
  };
  const spaced = deriveSkillReviewState(
    tangents,
    { ...at(30), reviewEvents: [completedReview] },
    new Date("2026-07-04T11:00:00.000Z"),
  );
  assert.equal(spaced.eligible, true);
  assert.equal(spaced.due, false);
  assert.equal(spaced.dueAt, "2026-07-10T11:00:00.000Z");
  const ordinaryError = compatibilityAttempt(ids[0], 32, false, {
    eventId: "tangents-ordinary-error",
    attemptedAt: "2026-07-04T10:00:00.000Z",
  });
  const recovery = deriveSkillReviewState(
    tangents,
    { ...at(30), attempts: [...at(30).attempts, ordinaryError], reviewEvents: [completedReview] },
    new Date("2026-07-04T11:00:00.000Z"),
  );
  assert.equal(recovery.due, true);
  assert.equal(recovery.reason, "recently_incorrect");
  assert.deepEqual(recovery.ordinaryRecoveryQuestionIds, [ids[0]]);

  const course = deriveCourseDashboardSummary([tangents], at(30), versions);
  assert.equal(course.completedPathCount, 1);
});

test("published Tangents uses its 30-question Practice projection while Higher Physics retains its legacy stage model", () => {
  const tangents = contentResolver.getPathContext("tangents-and-normals")!.skillPath;
  const registration = canonicalQuestionModuleRegistry.find((item) => item.skillPathId === tangents.slug);

  assert.equal(registration?.runtimeStatus, "wired");
  assert.equal(tangents.isAvailable, true);
  assert.equal(tangents.status, "available");
  assert.equal(tangents.practiceQuestionIds?.length, 30);
  assert.deepEqual(
    tangents.practiceQuestionIds,
    Array.from({ length: 30 }, (_, index) => `hm-calc-tangent-q-${String(index + 1).padStart(3, "0")}`),
  );
  assert.equal(contentResolver.getPracticeQuestions(tangents).length, 30);
  const first = contentResolver.getQuestionContext(tangents.practiceQuestionIds![0]);
  const last = contentResolver.getQuestionContext(tangents.practiceQuestionIds!.at(-1)!);
  assert.deepEqual({ stage: first?.stage.name, position: first?.questionIndexInPath, previous: first?.previousQuestion }, {
    stage: "Practice", position: 0, previous: undefined,
  });
  assert.deepEqual({ stage: last?.stage.name, position: last?.questionIndexInPath, next: last?.nextQuestion }, {
    stage: "Practice", position: 29, next: undefined,
  });
  assert.equal("practiceQuestionIds" in higherPhysics, false);
  assert.deepEqual(higherPhysics.learningStages?.map((stage) => stage.name), [
    "Foundations",
    "Applications",
    "Past Paper-style Questions",
  ]);
});
