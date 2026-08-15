import assert from "node:assert/strict";
import test from "node:test";

import { contentResolver } from "@/lib/content-resolver";
import type { ResolvedSkillPath } from "@/lib/content-resolver";
import type { ProgressEvidence, QuestionAttempt } from "@/lib/progress/types";
import { allocateStudyPlan } from "@/lib/study-plan/allocator";
import { buildStudyPlanCandidates, isValidStudyPlanHref } from "@/lib/study-plan/candidate-builder";
import { getStudyPlanConfiguration } from "@/lib/study-plan/config";
import { classifyExamPhase, datesForAvailableDays, utcWeekStart } from "@/lib/study-plan/dates";
import { generateStudyPlan } from "@/lib/study-plan/planner";
import { presentStudyPlanReason } from "@/lib/study-plan/presenter";
import {
  emptyStudyPlanLocalState,
  localCalendarDate,
  localDayKey,
  parseStoredStudyPlanLocalState,
  readStudyPlanLocalState,
  STUDY_PLAN_LOCAL_STATE_STORAGE_KEY,
  writeStudyPlanLocalState,
} from "@/lib/study-plan/local-state";
import type { StudyPlanCandidate, StudyPlanGenerationInput, StudyPlanWeekday } from "@/lib/study-plan/types";

const BASIC = context("basic-differentiation");
const CHAIN = context("chain-rule");
const NOW = new Date("2026-07-13T09:00:00.000Z");
const WEEK_START = "2026-07-13";

test("worked 180-minute fixture prioritises one Basic Review and Chain Rule Applications without double counting", () => {
  const input = workedInput();
  const result = generateStudyPlan(input);

  assert.equal(result.status, "ok");
  assert.equal(result.examPhase, "far");
  assert.deepEqual(result.items.map((item) => ({
    date: item.date,
    skill: item.skillPathId,
    action: item.actionType,
    reason: item.reasonCode,
    stage: item.stageName,
    minutes: item.suggestedMinutes,
  })), [
    {
      date: "2026-07-13",
      skill: "basic-differentiation",
      action: "review",
      reason: "review_due",
      stage: null,
      minutes: 20,
    },
    {
      date: "2026-07-13",
      skill: "chain-rule",
      action: "continue_stage",
      reason: "continue",
      stage: "Applications",
      minutes: 20,
    },
  ]);
  assert.equal(result.allocatedMinutes, 40);
  assert.equal(result.unusedMinutes, 140);
  assert.equal(result.items.filter((item) => item.skillPathId === BASIC.skillPath.slug).length, 1);
  assert.equal(result.diagnostics.some((item) => item.code === "mistake_absorbed_by_review"), true);
});

test("missed Wednesday preservation keeps completed Monday work, skips the moved item, and leaves capacity unused", () => {
  const initial = generateStudyPlan(workedInput());
  const basic = initial.items.find((item) => item.skillPathId === BASIC.skillPath.slug)!;
  const chain = initial.items.find((item) => item.skillPathId === CHAIN.skillPath.slug)!;
  const result = generateStudyPlan({
    ...workedInput(),
    preservation: {
      itemStates: { [basic.itemKey]: "completed", [chain.itemKey]: "skipped" },
      movedDates: { [basic.itemKey]: "2026-07-13", [chain.itemKey]: "2026-07-15" },
    },
  });

  assert.deepEqual(result.items.map((item) => [item.skillPathId, item.date, item.state]), [
    ["basic-differentiation", "2026-07-13", "completed"],
    ["chain-rule", "2026-07-15", "skipped"],
  ]);
  assert.equal(result.allocatedMinutes, 20);
  assert.equal(result.unusedMinutes, 160);
  assert.equal(result.items.some((item) => item.date === "2026-07-18"), false);
});

test("no activity recommends only the first available prerequisite-safe curriculum skill", () => {
  const result = generateStudyPlan(baseInput(emptyEvidence()));
  assert.deepEqual(result.items.map((item) => [item.skillPathId, item.reasonCode, item.href]), [
    ["basic-differentiation", "next_skill", "/question/hm-calc-diff-basic-f-001"],
  ]);
  assert.equal(result.diagnostics.some((item) =>
    item.skillPathId === "chain-rule" && item.code === "hard_prerequisite_incomplete"), true);
});

test("everything complete and nothing due returns a valid caught-up plan", () => {
  const evidence = completedAvailableEvidence("2026-07-13T07:00:00.000Z");
  const result = generateStudyPlan(baseInput(evidence));
  assert.equal(result.status, "ok");
  assert.equal(result.caughtUp, true);
  assert.deepEqual(result.items, []);
  assert.equal(result.unusedMinutes, 180);
});

test("everything overdue respects a 30-minute weekly budget and leaves lower-priority Review unscheduled", () => {
  const evidence = completedAvailableEvidence("2026-07-01T07:00:00.000Z");
  const result = generateStudyPlan({
    ...baseInput(evidence),
    preferences: { ...baseInput(evidence).preferences, weeklyMinutes: 30 },
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].reasonCode, "review_overdue");
  assert.equal(result.allocatedMinutes, 20);
  assert.equal(result.allocatedMinutes <= 30, true);
  assert.equal(result.diagnostics.some((item) => item.code === "weekly_budget_exhausted"), true);
});

test("ordinary Review uses a soft share when other work exists and may use idle capacity when it is the only useful work", () => {
  const reviews = ["skill-a", "skill-b", "skill-c"].map((skillPathId, index) => syntheticCandidate({
    candidateKey: `${skillPathId}:review:all`,
    skillPathId,
    skillName: skillPathId,
    actionType: "review",
    href: `/practice?review=1&path=${skillPathId}`,
    reasonCode: "review_due",
    tier: 1,
    dueAt: `2026-07-13T0${index}:00:00.000Z`,
  }));
  const continuation = syntheticCandidate({
    candidateKey: "skill-d:continue_stage:foundations",
    skillPathId: "skill-d",
    skillName: "skill-d",
    actionType: "continue_stage",
    href: "/question/synthetic-question",
    reasonCode: "continue",
    tier: 3,
    stageId: "foundations",
    stageName: "Foundations",
  });
  const mixed = allocateStudyPlan({
    ...allocationInput([...reviews, continuation], "far"),
    weeklyMinutes: 60,
  });
  const reviewOnly = allocateStudyPlan({
    ...allocationInput(reviews, "far"),
    weeklyMinutes: 60,
  });
  assert.equal(mixed.items.filter((item) => item.actionType === "review").length, 1);
  assert.equal(mixed.items.some((item) => item.actionType === "continue_stage"), true);
  assert.equal(mixed.diagnostics.filter((item) => item.code === "soft_review_cap").length, 2);
  assert.equal(reviewOnly.items.length, 3);
  assert.equal(reviewOnly.allocatedMinutes, 60);
});

test("ten hours with two live skills leaves honest unused capacity instead of repetitive filler", () => {
  const result = generateStudyPlan({
    ...baseInput(emptyEvidence()),
    preferences: { ...baseInput(emptyEvidence()).preferences, weeklyMinutes: 600 },
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.allocatedMinutes, 15);
  assert.equal(result.unusedMinutes, 585);
});

test("exam tomorrow suppresses new starts, while no exam date follows the base plan", () => {
  const close = generateStudyPlan({
    ...baseInput(emptyEvidence()),
    preferences: { ...baseInput(emptyEvidence()).preferences, examDate: "2026-07-14" },
  });
  const normal = generateStudyPlan(baseInput(emptyEvidence()));
  assert.equal(close.examPhase, "close");
  assert.deepEqual(close.items, []);
  assert.equal(close.diagnostics.some((item) => item.code === "new_start_suppressed_close_exam"), true);
  assert.equal(normal.examPhase, "no_date");
  assert.equal(normal.items[0].skillPathId, "basic-differentiation");
});

test("medium exam phase moves exam-practice continuation ahead within its existing tier", () => {
  const evidence = twoInProgressSkillsEvidence();
  const far = buildStudyPlanCandidates({ now: NOW, courseSlug: "higher-maths", evidence, examPhase: "far" });
  const medium = buildStudyPlanCandidates({ now: NOW, courseSlug: "higher-maths", evidence, examPhase: "medium" });
  const farItems = allocateStudyPlan(allocationInput(far.candidates, "far")).items;
  const mediumItems = allocateStudyPlan(allocationInput(medium.candidates, "medium")).items;
  assert.deepEqual(farItems.map((item) => item.skillPathId), ["basic-differentiation", "chain-rule"]);
  assert.deepEqual(mediumItems.map((item) => item.skillPathId), ["chain-rule", "basic-differentiation"]);
  assert.equal(mediumItems[0].stageName, "Past Paper-style Questions");
});

test("Review changes predictably from not due to due soon to due", () => {
  const evidence = completedPathEvidence(BASIC, "2026-07-10T09:00:00.000Z");
  const before = buildStudyPlanCandidates({
    now: new Date("2026-07-11T08:00:00.000Z"), courseSlug: "higher-maths", evidence, examPhase: "no_date",
  });
  const soon = buildStudyPlanCandidates({
    now: new Date("2026-07-11T12:00:00.000Z"), courseSlug: "higher-maths", evidence, examPhase: "no_date",
  });
  const due = buildStudyPlanCandidates({
    now: new Date("2026-07-12T12:00:00.000Z"), courseSlug: "higher-maths", evidence, examPhase: "no_date",
  });
  assert.equal(before.candidates.some((item) => item.skillPathId === BASIC.skillPath.slug && item.actionType === "review"), false);
  assert.equal(soon.candidates.find((item) => item.skillPathId === BASIC.skillPath.slug)?.reasonCode, "review_due_soon");
  assert.equal(due.candidates.find((item) => item.skillPathId === BASIC.skillPath.slug)?.reasonCode, "review_due");
});

test("a whole missed week creates no punitive catch-up multiplier", () => {
  const fresh = generateStudyPlan(workedInput());
  const missed = generateStudyPlan({ ...workedInput(), now: new Date("2026-07-20T09:00:00.000Z") });
  assert.equal(missed.items.every((item) => item.suggestedMinutes <= 25), true);
  assert.equal(missed.items.reduce((sum, item) => sum + (item.state === "skipped" ? 0 : item.suggestedMinutes), 0) <= 180, true);
  assert.equal(missed.items.length <= fresh.items.length, true);
});

test("unavailable content and dead destinations never survive final output", () => {
  const result = generateStudyPlan(baseInput(emptyEvidence()));
  const availableIds = new Set(contentResolver.getAllPathContexts()
    .filter((item) => item.skillPath.isAvailable)
    .map((item) => item.skillPath.slug));
  assert.equal(result.items.every((item) => availableIds.has(item.skillPathId)), true);
  assert.equal(result.items.every((item) => isValidStudyPlanHref(item.href)), true);
  assert.equal(result.diagnostics.some((item) => item.code === "content_unavailable"), true);
});

test("a course with no live paths returns an honest empty result and malformed input returns safe errors", () => {
  const noLive = generateStudyPlan({
    ...baseInput(emptyEvidence()),
    preferences: { ...baseInput(emptyEvidence()).preferences, courseSlug: "higher-physics" },
  });
  assert.equal(noLive.status, "no_available_content");
  assert.deepEqual(noLive.items, []);

  for (const [overrides, errorCode] of [
    [{ weeklyMinutes: 0 }, "invalid_weekly_minutes"],
    [{ availableDays: [] }, "invalid_available_days"],
    [{ examDate: "not-a-date" }, "invalid_exam_date"],
  ] as const) {
    const result = generateStudyPlan({
      ...baseInput(emptyEvidence()),
      preferences: { ...baseInput(emptyEvidence()).preferences, ...overrides } as StudyPlanGenerationInput["preferences"],
    });
    assert.equal(result.status, "invalid_input");
    assert.equal(result.errorCode, errorCode);
    assert.deepEqual(result.items, []);
  }
});

test("candidate generation derives the Mistake Log exactly once per course", () => {
  let calls = 0;
  const result = buildStudyPlanCandidates(
    { now: NOW, courseSlug: "higher-maths", evidence: emptyEvidence(), examPhase: "no_date" },
    { deriveMistakes: (evidence, subjectSlug = "higher-maths") => {
      calls += 1;
      return {
        subjectSlug,
        href: "/subjects/higher-maths/mistakes",
        openCount: evidence.attempts.length,
        resolvedCount: 0,
        historicalCount: 0,
        openGroups: [],
        historyGroups: [],
      };
    } },
  );
  assert.equal(calls, 1);
  assert.equal(result.candidates.length > 0, true);
});

test("planner invariants hold across fixed budgets, days, and exam phases", () => {
  const availableIds = new Set(contentResolver.getAllPathContexts()
    .filter((item) => item.skillPath.isAvailable)
    .map((item) => item.skillPath.slug));
  const cases = [
    { minutes: 15, days: ["mon"] as const, examDate: null },
    { minutes: 30, days: ["wed", "sat"] as const, examDate: "2026-07-14" },
    { minutes: 180, days: ["mon", "wed", "sat"] as const, examDate: "2026-08-01" },
    { minutes: 600, days: ["sun"] as const, examDate: "2026-10-01" },
  ];
  for (const fixture of cases) {
    const input: StudyPlanGenerationInput = {
      now: NOW,
      evidence: workedEvidence(),
      preferences: {
        courseSlug: "higher-maths",
        weeklyMinutes: fixture.minutes,
        availableDays: [...fixture.days],
        examDate: fixture.examDate,
      },
    };
    const first = generateStudyPlan(input);
    const second = generateStudyPlan(structuredClone(input));
    assert.deepEqual(first, second);
    assert.equal(first.allocatedMinutes <= fixture.minutes, true);
    assert.equal(first.items.every((item) => availableIds.has(item.skillPathId)), true);
    assert.equal(first.items.every((item) => isValidStudyPlanHref(item.href)), true);
    assert.equal(first.items.every((item) => item.suggestedMinutes > 0 && item.suggestedMinutes <= 120), true);
    assert.equal(first.items.every((item) => fixture.days.includes(weekdayFor(item.date) as never)), true);
    assert.equal(new Set(first.items.map((item) => `${item.skillPathId}:${item.actionType}:${item.date}`)).size, first.items.length);
    assert.equal(first.items.every((item) => presentStudyPlanReason(item.reasonCode).length > 0), true);
  }
});

test("UTC calendar helpers and exam thresholds are deterministic at boundaries", () => {
  assert.equal(utcWeekStart(new Date("2026-07-19T23:59:59.999Z")), "2026-07-13");
  assert.equal(utcWeekStart(new Date("2026-07-20T00:00:00.000Z")), "2026-07-20");
  assert.deepEqual(datesForAvailableDays("2026-07-13", ["sat", "mon", "wed"]), [
    "2026-07-13", "2026-07-15", "2026-07-18",
  ]);
  assert.equal(classifyExamPhase(NOW, null), "no_date");
  assert.equal(classifyExamPhase(NOW, "2026-07-20"), "close");
  assert.equal(classifyExamPhase(NOW, "2026-07-21"), "medium");
  assert.equal(classifyExamPhase(NOW, "2026-08-10"), "medium");
  assert.equal(classifyExamPhase(NOW, "2026-08-11"), "far");
});

test("Study Plan inspection configuration fails closed", () => {
  assert.deepEqual(getStudyPlanConfiguration({}), { enabled: false });
  assert.deepEqual(getStudyPlanConfiguration({ STEMFORGE_STUDY_PLAN_ENABLED: "false" }), { enabled: false });
  assert.deepEqual(getStudyPlanConfiguration({ STEMFORGE_STUDY_PLAN_ENABLED: "true" }), { enabled: true });
});

test("browser-local P1 state is versioned, bounded, and safely rejects malformed setup", () => {
  assert.deepEqual(parseStoredStudyPlanLocalState("not-json"), emptyStudyPlanLocalState());
  assert.deepEqual(parseStoredStudyPlanLocalState(JSON.stringify({ version: 999, setup: {} })), emptyStudyPlanLocalState());
  const normalized = parseStoredStudyPlanLocalState(JSON.stringify({
    version: 1,
    setup: { weeklyMinutes: 90, availableDays: ["wed", "mon", "wed", "bad"], examDate: "2026-08-20" },
    preservation: {
      itemStates: { valid: "completed", invalid: "planned" },
      movedDates: { valid: "2026-08-19", invalid: "tomorrow" },
      excludedItemKeys: ["valid", "valid", 4],
    },
  }));
  assert.deepEqual(normalized.setup, { weeklyMinutes: 90, availableDays: ["wed", "mon"], examDate: "2026-08-20" });
  assert.deepEqual(normalized.preservation, {
    itemStates: { valid: "completed" }, movedDates: { valid: "2026-08-19" }, excludedItemKeys: ["valid"],
  });
});

test("browser-local P1 state round-trips without touching progress evidence storage", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const state = { ...emptyStudyPlanLocalState(), setup: { weeklyMinutes: 120, availableDays: ["tue", "thu"] as StudyPlanWeekday[], examDate: null } };
  assert.equal(writeStudyPlanLocalState(storage, state), true);
  assert.deepEqual(readStudyPlanLocalState(storage), state);
  assert.deepEqual([...values.keys()], [STUDY_PLAN_LOCAL_STATE_STORAGE_KEY]);
});

test("calendar date separates local Today/week allocation from the real Review instant", () => {
  const instant = new Date("2026-07-19T23:30:00.000Z");
  const localMonday = new Date("2026-07-20T00:00:00.000Z");
  const result = generateStudyPlan({ ...baseInput(emptyEvidence()), now: instant, calendarDate: localMonday });
  assert.equal(result.weekStart, "2026-07-20");
  assert.equal(result.generatedAt, instant.toISOString());
  const sample = new Date("2026-03-29T23:30:00.000Z");
  assert.equal(localDayKey(sample), `${sample.getFullYear()}-${String(sample.getMonth() + 1).padStart(2, "0")}-${String(sample.getDate()).padStart(2, "0")}`);
  assert.equal(localCalendarDate(sample).getUTCHours(), 0);
  const beforeBritishSummerMidnight = new Date("2026-03-29T22:59:00.000Z");
  const afterBritishSummerMidnight = new Date("2026-03-29T23:01:00.000Z");
  assert.equal(localDayKey(beforeBritishSummerMidnight, "Europe/London"), "2026-03-29");
  assert.equal(localDayKey(afterBritishSummerMidnight, "Europe/London"), "2026-03-30");
  assert.equal(utcWeekStart(localCalendarDate(beforeBritishSummerMidnight, "Europe/London")), "2026-03-23");
  assert.equal(utcWeekStart(localCalendarDate(afterBritishSummerMidnight, "Europe/London")), "2026-03-30");
});

test("swap exclusions remove only the chosen deterministic item and allow the next useful candidate", () => {
  const candidates = ["a", "b"].map((id, index) => syntheticCandidate({
    candidateKey: `${id}:continue_stage:foundations`, skillPathId: id, skillName: id,
    actionType: "continue_stage", href: `/question/${id}`, reasonCode: "continue", tier: (3 + index) as 3 | 4,
  }));
  const initial = allocateStudyPlan({ ...allocationInput(candidates, "far"), weeklyMinutes: 20 });
  const swapped = allocateStudyPlan({
    ...allocationInput(candidates, "far"), weeklyMinutes: 20,
    preservation: { excludedItemKeys: [initial.items[0].itemKey] },
  });
  assert.deepEqual(initial.items.map((item) => item.skillPathId), ["a"]);
  assert.deepEqual(swapped.items.map((item) => item.skillPathId), ["b"]);
  assert.equal(swapped.diagnostics.some((item) => item.code === "preserved_exclusion"), true);
});

function workedInput(): StudyPlanGenerationInput {
  return {
    now: NOW,
    evidence: workedEvidence(),
    preferences: {
      courseSlug: "higher-maths",
      weeklyMinutes: 180,
      availableDays: ["mon", "wed", "sat"],
      examDate: "2026-10-01",
    },
  };
}

function baseInput(evidence: ProgressEvidence): StudyPlanGenerationInput {
  return {
    now: NOW,
    evidence,
    preferences: {
      courseSlug: "higher-maths",
      weeklyMinutes: 180,
      availableDays: ["mon", "wed", "sat"],
    },
  };
}

function workedEvidence(): ProgressEvidence {
  let sequence = 0;
  const basic = completedPathEvidence(BASIC, "2026-07-01T09:00:00.000Z", () => ++sequence);
  const wrongQuestion = BASIC.skillPath.learningStages![0].questionIds[0];
  const wrong = attemptFor(wrongQuestion, ++sequence, false, "2026-07-12T08:00:00.000Z");
  const chainFoundations = CHAIN.skillPath.learningStages![0].questionIds
    .map((questionId) => attemptFor(questionId, ++sequence, true, "2026-07-10T08:00:00.000Z"));
  const firstApplication = CHAIN.skillPath.learningStages![1].questionIds[0];
  return evidence([
    ...basic.attempts,
    wrong,
    ...chainFoundations,
    attemptFor(firstApplication, ++sequence, true, "2026-07-11T08:00:00.000Z"),
  ]);
}

function twoInProgressSkillsEvidence(): ProgressEvidence {
  let sequence = 0;
  const basicFirst = BASIC.skillPath.learningStages![0].questionIds[0];
  const chainBeforeExam = CHAIN.skillPath.learningStages!.slice(0, 2).flatMap((stage) => stage.questionIds)
    .map((questionId) => attemptFor(questionId, ++sequence, true, "2026-07-09T08:00:00.000Z"));
  const chainExam = CHAIN.skillPath.learningStages![2].questionIds[0];
  return evidence([
    ...chainBeforeExam,
    attemptFor(chainExam, ++sequence, true, "2026-07-10T08:00:00.000Z"),
    attemptFor(basicFirst, ++sequence, true, "2026-07-12T08:00:00.000Z"),
  ]);
}

function completedAvailableEvidence(at: string): ProgressEvidence {
  let sequence = 0;
  return evidence([
    ...completedPathEvidence(BASIC, at, () => ++sequence).attempts,
    ...completedPathEvidence(CHAIN, at, () => ++sequence).attempts,
  ]);
}

function completedPathEvidence(
  path: ResolvedSkillPath,
  at: string,
  nextSequence: () => number = sequenceCounter(),
): ProgressEvidence {
  return evidence(path.skillPath.learningStages!.flatMap((stage) =>
    stage.questionIds.map((questionId) => attemptFor(questionId, nextSequence(), true, at))));
}

function attemptFor(questionId: string, sequence: number, isCorrect: boolean, attemptedAt: string): QuestionAttempt {
  const question = contentResolver.getQuestionContext(questionId)!;
  return {
    eventId: `study_plan_attempt_${sequence}_${isCorrect ? "right" : "wrong"}`,
    questionId,
    skillPathId: question.skillPath.slug,
    stageId: question.stage.id,
    isCorrect,
    answer: isCorrect ? question.question.correctAnswer : "incorrect",
    attemptedAt: offsetSeconds(attemptedAt, sequence),
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: question.question.questionVersion },
    outcomeKind: "graded",
  };
}

function evidence(attempts: QuestionAttempt[]): ProgressEvidence {
  return {
    attempts,
    supportEvents: [],
    guidedSelfAssessments: [],
    achievementSnapshots: [],
    reviewEvents: [],
    flashcardReviews: [],
  };
}

function emptyEvidence(): ProgressEvidence {
  return evidence([]);
}

function context(pathId: string): ResolvedSkillPath {
  const result = contentResolver.getPathContext(pathId);
  assert.ok(result);
  return result;
}

function offsetSeconds(value: string, seconds: number): string {
  return new Date(Date.parse(value) + seconds * 1000).toISOString();
}

function sequenceCounter() {
  let value = 0;
  return () => ++value;
}

function allocationInput(candidates: StudyPlanCandidate[], examPhase: "far" | "medium") {
  return {
    candidates,
    weekStart: WEEK_START,
    courseSlug: "higher-maths",
    weeklyMinutes: 180,
    availableDays: ["mon", "wed", "sat"] as const,
    examPhase,
  };
}

function syntheticCandidate(overrides: Partial<StudyPlanCandidate> & Pick<StudyPlanCandidate, "candidateKey" | "skillPathId" | "skillName" | "actionType" | "href" | "reasonCode" | "tier">): StudyPlanCandidate {
  return {
    stageId: null,
    stageName: null,
    suggestedMinutes: 20,
    dueAt: null,
    latestActivityAt: null,
    latestMistakeAt: null,
    examPractice: false,
    examQualifier: "far",
    ...overrides,
  };
}

function weekdayFor(date: string) {
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
}
