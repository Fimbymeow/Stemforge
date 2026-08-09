import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { deriveLearnerDashboardModel } from "../lib/dashboard-derivations";
import type { AchievementSnapshot, ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";

const maybeSkillPath = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
assert.ok(maybeSkillPath);
const skillPath = maybeSkillPath;
const questionIds = skillPath.learningStages?.flatMap((stage) => stage.questionIds) ?? [];
const questionVersions = Object.fromEntries(higherMathsDifferentiationQuestions.map((question) => [question.id, question.questionVersion]));
assert.ok(questionIds.length > 0);

test("empty learner dashboard recommends a deterministic guest start without fake activity", () => {
  const model = deriveLearnerDashboardModel({ evidence: evidence(), now: now() });

  assert.equal(model.nextAction.kind, "start_learning");
  assert.equal(model.nextAction.pathId, "basic-differentiation");
  assert.equal(model.course.completionPercentage, 0);
  assert.equal(model.course.availablePathCount, 2);
  assert.equal(model.weeklyActivity.activeDays, 0);
  assert.equal(model.recentActivity.length, 0);
  assert.equal(model.sync.label, "Saved on this browser");
});

test("recent genuine attempts are grouped by path and day", () => {
  const model = deriveLearnerDashboardModel({
    evidence: evidence([
      attempt(questionIds[0], 1, { attemptedAt: "2026-07-16T10:00:00.000Z", isCorrect: false }),
      attempt(questionIds[1], 2, { attemptedAt: "2026-07-16T10:04:00.000Z", isCorrect: true }),
    ]),
    now: now(),
  });

  assert.equal(model.recentActivity[0]?.title, "2 questions attempted");
  assert.match(model.recentActivity[0]?.detail ?? "", /1 correct/);
  assert.equal(model.weeklyActivity.attempts, 2);
  assert.equal(model.weeklyActivity.activeDays, 1);
});

test("incomplete and review-recommended evidence drives the needs-work lane", () => {
  const model = deriveLearnerDashboardModel({
    evidence: evidence([
      attempt(questionIds[0], 1, { isCorrect: false }),
      attempt(questionIds[0], 2, { isCorrect: false, attemptedAt: "2026-07-16T10:02:00.000Z" }),
    ]),
    now: now(),
  });

  assert.equal(model.nextAction.kind, "resume_question");
  assert.equal(model.needsWork[0]?.pathId, "basic-differentiation");
  assert.equal(model.needsWork[0]?.detail, "1 unresolved question");
});

test("current mastered evidence appears in the secure and mastered lane", () => {
  const attempts = questionIds.map((questionId, index) => attempt(questionId, index + 1, {
    isCorrect: true,
    answer: "correct",
    attemptedAt: `2026-07-16T10:${String(index).padStart(2, "0")}:00.000Z`,
  }));
  const model = deriveLearnerDashboardModel({ evidence: evidence(attempts), now: now() });

  assert.equal(model.course.masteredPathCount, 1);
  assert.equal(model.nextAction.kind, "start_learning");
  assert.equal(model.nextAction.pathId, "chain-rule");
  assert.match(model.secureAndMastered[0]?.title ?? "", /mastered/i);
});

test("achievement recent-activity titles name the specific stage or path rather than a generic kind label", () => {
  const firstStage = skillPath.learningStages?.[0];
  assert.ok(firstStage);
  const model = deriveLearnerDashboardModel({
    evidence: evidence([], [], [
      achievementSnapshot("stage_completed", { snapshotId: "snap_stage_completed", stageId: firstStage.id, achievedAt: "2026-07-16T10:00:00.000Z" }),
      achievementSnapshot("stage_secure", { snapshotId: "snap_stage_secure", stageId: firstStage.id, achievedAt: "2026-07-16T10:01:00.000Z" }),
      achievementSnapshot("path_secure", { snapshotId: "snap_path_secure", achievedAt: "2026-07-16T10:02:00.000Z" }),
      achievementSnapshot("path_mastered", { snapshotId: "snap_path_mastered", achievedAt: "2026-07-16T10:03:00.000Z" }),
    ]),
    now: now(),
  });

  const titles = model.recentActivity.map((item) => item.title);
  assert.ok(titles.includes(`${firstStage.name} completed`), titles.join(", "));
  assert.ok(titles.includes(`${firstStage.name} is now Secure`), titles.join(", "));
  assert.ok(titles.includes(`${skillPath.name} is now Secure`), titles.join(", "));
  assert.ok(titles.includes(`${skillPath.name} is now Mastered`), titles.join(", "));
  assert.ok(!titles.some((title) => /^(Stage|Path) (Completed|Secure|Mastered)$/.test(title)), titles.join(", "));
});

test("the learner's first full path completion is framed as a first-time milestone, later ones are not", () => {
  const model = deriveLearnerDashboardModel({
    evidence: evidence([], [], [
      achievementSnapshot("path_completed", { snapshotId: "snap_first", pathId: "basic-differentiation", achievedAt: "2026-07-10T10:00:00.000Z" }),
      achievementSnapshot("path_completed", { snapshotId: "snap_second", pathId: "basic-differentiation", achievedAt: "2026-07-16T10:00:00.000Z" }),
    ]),
    now: now(),
  });

  const first = model.recentActivity.find((item) => item.id === "achievement:snap_first");
  const second = model.recentActivity.find((item) => item.id === "achievement:snap_second");
  assert.equal(first?.title, "Completed your first full learning path");
  assert.equal(second?.title, `${skillPath.name} completed`);
});

test("coverage framing derives '2 of 49' from the live registry, not a hard-coded constant", () => {
  const allSkillPaths = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []);
  assert.equal(allSkillPaths.length, 49);
  assert.equal(allSkillPaths.filter((path) => path.isAvailable).length, 2);

  const model = deriveLearnerDashboardModel({ evidence: evidence(), now: now() });
  assert.equal(model.course.availablePathCount, 2);
  assert.equal(model.course.plannedPathCount, 47);
  assert.equal(model.course.notice, "2 of 49 Higher Maths skills available, with more on the way.");
});

test("dashboard progress stays truthful when both skills are untouched", () => {
  const model = deriveLearnerDashboardModel({ evidence: evidence(), now: now() });
  assert.equal(model.paths.length, 2);
  for (const path of model.paths) {
    assert.equal(path.completedQuestions, 0);
    assert.equal(path.completionPercentage, 0);
  }
  assert.equal(model.course.completedQuestions, 0);
  assert.equal(model.course.totalQuestions, 42);
});

test("dashboard progress stays truthful when one skill is fully complete and the other is untouched", () => {
  const attempts = questionIds.map((questionId, index) => attempt(questionId, index + 1, {
    isCorrect: true,
    answer: "correct",
    attemptedAt: `2026-07-16T10:${String(index).padStart(2, "0")}:00.000Z`,
  }));
  const model = deriveLearnerDashboardModel({ evidence: evidence(attempts), now: now() });

  const basic = model.paths.find((path) => path.skillPathId === "basic-differentiation");
  const chain = model.paths.find((path) => path.skillPathId === "chain-rule");
  assert.ok(basic);
  assert.ok(chain);
  assert.equal(basic.completedQuestions, basic.totalQuestions);
  assert.equal(basic.completionPercentage, 100);
  assert.equal(chain.completedQuestions, 0);
  assert.equal(chain.completionPercentage, 0);
  // The combined figure must never be presented as if it were per-skill or full-course completion.
  assert.ok(model.course.completionPercentage < 100);
  assert.equal(model.course.totalQuestions, 42);
});

test("dashboard progress stays truthful for a skill that is only partway complete", () => {
  const model = deriveLearnerDashboardModel({
    evidence: evidence([
      attempt(questionIds[0], 1, { isCorrect: true }),
      attempt(questionIds[1], 2, { isCorrect: true, attemptedAt: "2026-07-16T10:02:00.000Z" }),
    ]),
    now: now(),
  });
  const basic = model.paths.find((path) => path.skillPathId === "basic-differentiation");
  assert.ok(basic);
  assert.equal(basic.completedQuestions, 2);
  assert.equal(basic.totalQuestions, 8);
  assert.ok(basic.completionPercentage > 0 && basic.completionPercentage < 100);
});

test("weekly activity exposes the exact label/count the dashboard now renders", () => {
  const recentNow = new Date("2026-07-17T12:00:00.000Z");
  const model = deriveLearnerDashboardModel({
    evidence: evidence([attempt(questionIds[0], 1, { attemptedAt: "2026-07-16T09:00:00.000Z", isCorrect: true })]),
    now: recentNow,
  });
  assert.equal(model.weeklyActivity.activeDays, 1);
  assert.equal(model.weeklyActivity.label, "1 active day in the last 7 days");
});

test("multi-skill next action still recommends the untouched skill once the first is mastered (no Sprint 1B regression)", () => {
  const attempts = questionIds.map((questionId, index) => attempt(questionId, index + 1, {
    isCorrect: true,
    answer: "correct",
    attemptedAt: `2026-07-16T10:${String(index).padStart(2, "0")}:00.000Z`,
  }));
  const model = deriveLearnerDashboardModel({ evidence: evidence(attempts), now: now() });
  assert.equal(model.nextAction.kind, "start_learning");
  assert.equal(model.nextAction.pathId, "chain-rule");
});

test("sync states are conservative and do not require public credentials", () => {
  const model = deriveLearnerDashboardModel({
    evidence: evidence(),
    now: now(),
    sync: {
      status: "pending_upload",
      pendingCount: 3,
      accountFingerprint: "dashboard-test-account",
      lastSuccessfulSyncAt: null,
      differentAccount: false,
    },
  });

  assert.equal(model.sync.label, "Waiting to sync");
  assert.match(model.sync.detail, /3 local changes/);
});

function now() {
  return new Date("2026-07-17T12:00:00.000Z");
}

function evidence(
  attempts: QuestionAttempt[] = [],
  supportEvents: QuestionSupportEvent[] = [],
  achievementSnapshots: AchievementSnapshot[] = [],
): ProgressEvidence {
  return { attempts, supportEvents, guidedSelfAssessments: [], achievementSnapshots, reviewEvents: [], flashcardReviews: [] };
}

function achievementSnapshot(kind: AchievementSnapshot["kind"], overrides: Partial<AchievementSnapshot> & { snapshotId: string }): AchievementSnapshot {
  const isStageKind = kind.startsWith("stage_");
  return {
    kind,
    subjectId: "higher-maths",
    courseId: "calculus",
    pathId: skillPath.slug,
    pathVersion: 1,
    stageId: isStageKind ? skillPath.learningStages?.[0]?.id : undefined,
    stageVersion: isStageKind ? 1 : undefined,
    achievedAt: "2026-07-16T10:00:00.000Z",
    masteryScore: 100,
    independentPerformancePercentage: 100,
    completionCount: 1,
    totalRequiredCount: 1,
    source: "derived_current",
    ...overrides,
  };
}

function attempt(questionId: string, sequence: number, overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  const stage = skillPath.learningStages?.find((candidate) => candidate.questionIds.includes(questionId));
  assert.ok(stage);
  return {
    questionId,
    skillPathId: skillPath.slug,
    stageId: stage.id,
    isCorrect: true,
    answer: "correct",
    attemptedAt: "2026-07-16T10:00:00.000Z",
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: questionVersions[questionId] ?? 1 },
    eventId: `dashboard_attempt_${sequence}`,
    ...overrides,
  };
}
