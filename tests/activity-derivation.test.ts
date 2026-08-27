import assert from "node:assert/strict";
import test from "node:test";
import { activityIntensity, deriveActivityHistory, deriveWeeklyActivity } from "../lib/activity/derivation";
import { activityIntensityClass, deriveDashboardActivityRecap } from "../lib/activity/presentation";
import type { AchievementSnapshot, ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";
import type { ReviewEvent, ReviewOutcome } from "../lib/review/types";
import type { FlashcardReviewEvent } from "../lib/flashcards/types";

const NOW = new Date("2026-09-12T12:00:00.000Z");

test("empty evidence returns 84 zero days and an empty-state model", () => {
  const model = deriveActivityHistory(emptyEvidence(), NOW);
  assert.equal(model.days.length, 84);
  assert.equal(model.weeks.length, 12);
  assert.equal(model.activeDayCount, 0);
  assert.equal(model.hasActivity, false);
  assert.equal(model.days.every((day) => day.rawScore === 0 && day.intensityLevel === 0), true);
});

test("Dashboard recap is calm and factual for empty, low, Review, flashcard and mixed activity", () => {
  assert.equal(deriveDashboardActivityRecap(deriveActivityHistory(emptyEvidence(), NOW, { rangeDays: 14 })), "No activity in the last 14 days");

  const oneDay = emptyEvidence();
  oneDay.attempts.push(attempt({ isCorrect: true }));
  assert.equal(deriveDashboardActivityRecap(deriveActivityHistory(oneDay, NOW, { rangeDays: 14 })), "1 active day in the last 14 days · 1 question worked on");

  const severalDays = emptyEvidence();
  severalDays.attempts.push(attempt({ isCorrect: true }), attempt({ eventId: "yesterday", questionId: "q2", sequence: 2, attemptedAt: "2026-09-11T12:00:00.000Z", isCorrect: true }));
  assert.equal(deriveDashboardActivityRecap(deriveActivityHistory(severalDays, NOW, { rangeDays: 14 })), "2 active days in the last 14 days · 2 questions worked on");

  const reviewOnly = emptyEvidence();
  reviewOnly.reviewEvents.push(review());
  assert.equal(deriveDashboardActivityRecap(deriveActivityHistory(reviewOnly, NOW, { rangeDays: 14 })), "1 active day in the last 14 days · Review completed");

  const flashcardOnly = emptyEvidence();
  flashcardOnly.flashcardReviews.push(flashcard(), flashcard({ eventId: "flashcard_2", cardId: "card-2", sequence: 2 }));
  assert.equal(deriveDashboardActivityRecap(deriveActivityHistory(flashcardOnly, NOW, { rangeDays: 14 })), "1 active day in the last 14 days · 2 flashcards reviewed");

  const mixed = emptyEvidence();
  mixed.attempts.push(attempt({ isCorrect: true }));
  mixed.reviewEvents.push(review());
  mixed.flashcardReviews.push(flashcard());
  assert.equal(deriveDashboardActivityRecap(deriveActivityHistory(mixed, NOW, { rangeDays: 14 })), "1 active day in the last 14 days · 1 question worked on · Review completed");
});

test("one canonical activity colour ramp uses the existing semantic tokens", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((level) => activityIntensityClass(level as 0 | 1 | 2 | 3 | 4)), [
    "border-line bg-paper forced-colors:border-[CanvasText]",
    "border-forge/20 bg-forge-soft forced-colors:border-[Highlight]",
    "border-forge/30 bg-activity-moderate forced-colors:border-[Highlight]",
    "border-forge/40 bg-activity-strong forced-colors:border-[Highlight]",
    "border-forge bg-forge forced-colors:border-[Highlight]",
  ]);
});

test("one genuine incorrect graded attempt is Light activity", () => {
  const day = today([attempt({ isCorrect: false })]);
  assert.equal(day.rawScore, 0.1);
  assert.equal(day.intensityLabel, "Light");
  assert.equal(day.distinctQuestionsWorkedOn, 1);
});

test("repeated incorrect attempts on one question/version contribute once", () => {
  const day = today([attempt({ eventId: "attempt_1", sequence: 1, isCorrect: false }), attempt({ eventId: "attempt_2", sequence: 2, isCorrect: false })]);
  assert.equal(day.rawScore, 0.1);
  assert.equal(day.distinctQuestionsWorkedOn, 1);
});

test("wrong then independent correct uses only the better after-error outcome", () => {
  const day = today([attempt({ eventId: "attempt_1", sequence: 1, isCorrect: false }), attempt({ eventId: "attempt_2", sequence: 2, isCorrect: true })]);
  assert.equal(day.rawScore, 0.85);
  assert.equal(day.independentlyCompletedQuestionCount, 1);
});

test("an independent correct retains after-error contribution when the error was on an earlier day", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(
    attempt({ eventId: "prior_error", attemptedAt: "2026-09-11T10:00:00.000Z", isCorrect: false }),
    attempt({ eventId: "today_correct", sequence: 2, isCorrect: true }),
  );
  assert.equal(currentDay(deriveActivityHistory(evidence, NOW)).rawScore, 0.85);
});

test("independent first correct uses full contribution", () => {
  assert.equal(today([attempt({ isCorrect: true })]).rawScore, 1);
});

test("hint-assisted correct uses the existing reduced contribution", () => {
  assert.equal(today([attempt({ isCorrect: true, hintViewedBeforeSubmission: true })]).rawScore, 0.7);
});

test("solution-assisted completion uses the existing reduced contribution", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(attempt({ isCorrect: false }));
  evidence.supportEvents.push(support({ type: "solution_viewed", afterGenuineAttempt: true }));
  assert.equal(currentDay(deriveActivityHistory(evidence, NOW)).rawScore, 0.35);
});

test("distinct achievements add 0.5 and duplicate snapshot IDs cannot double count", () => {
  const evidence = emptyEvidence();
  evidence.achievementSnapshots.push(achievement(), achievement());
  const day = currentDay(deriveActivityHistory(evidence, NOW));
  assert.equal(day.rawScore, 0.5);
  assert.equal(day.milestoneCount, 1);
});

test("only distinct independent Review successes add a 0.5 bonus", () => {
  const evidence = emptyEvidence();
  evidence.reviewEvents.push(review(), review(), review({ eventId: "review_assisted", outcome: "hint_assisted" }));
  const day = currentDay(deriveActivityHistory(evidence, NOW));
  assert.equal(day.rawScore, 0.5);
  assert.equal(day.independentReviewSuccessCount, 1);
});

test("Flashcards use conservative best-outcome-per-card/version daily credit", () => {
  const evidence = emptyEvidence();
  evidence.flashcardReviews.push(
    flashcard({ eventId: "forgot_1", outcome: "forgot" }),
    flashcard({ eventId: "forgot_repeat", sequence: 2, outcome: "forgot" }),
    flashcard({ eventId: "remembered_best", sequence: 3, outcome: "remembered" }),
  );
  const day = currentDay(deriveActivityHistory(evidence, NOW));
  assert.equal(day.rawScore, 0.25);
  assert.equal(day.distinctFlashcardsReviewed, 1);
  assert.equal(day.intensityLabel, "Light");
});

test("different Flashcards accumulate while the unchanged daily display cap still applies", () => {
  const evidence = emptyEvidence();
  evidence.flashcardReviews.push(
    flashcard({ eventId: "card_1" }),
    flashcard({ eventId: "card_2", cardId: "card-2", sequence: 2 }),
  );
  evidence.attempts.push(...Array.from({ length: 5 }, (_, index) => attempt({ questionId: `cap-${index}`, eventId: `cap-${index}`, sequence: index + 3, isCorrect: true })));
  const day = currentDay(deriveActivityHistory(evidence, NOW));
  assert.equal(day.rawScore, 5.5);
  assert.equal(day.displayScore, 4);
  assert.equal(day.distinctFlashcardsReviewed, 2);
});

test("support, guided assessment and other non-scored events create no activity alone", () => {
  const evidence = emptyEvidence();
  evidence.supportEvents.push(support({ type: "hint_viewed" }));
  evidence.guidedSelfAssessments.push({ eventId: "self_1", practiceSessionId: "practice_1", questionId: "q1", skillPathId: "path", stageId: "stage", outcome: "confident", occurredAt: NOW.toISOString(), sequence: 2, versionEvidence: { kind: "known", questionVersion: 1 } });
  assert.equal(deriveActivityHistory(evidence, NOW).activeDayCount, 0);
});

test("Mistake resolution and Practice Session completion add no separate bonus", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(attempt({ isCorrect: true, practiceSessionId: "mistake_remediation_session_1" }));
  const day = currentDay(deriveActivityHistory(evidence, NOW));
  assert.equal(day.rawScore, 1);
  assert.equal(day.distinctQuestionsWorkedOn, 1);
});

test("display score caps at 4 while raw history remains intact", () => {
  const attempts = Array.from({ length: 5 }, (_, index) => attempt({ questionId: `q${index}`, eventId: `attempt_${index}`, sequence: index + 1, isCorrect: true }));
  const day = today(attempts);
  assert.equal(day.rawScore, 5);
  assert.equal(day.displayScore, 4);
  assert.equal(day.intensityLevel, 4);
});

test("intensity boundaries are exact", () => {
  assert.deepEqual([0, 0.5, 1, 1.99, 2, 2.99, 3].map((score) => activityIntensity(score).level), [0, 1, 2, 2, 3, 3, 4]);
});

test("active day has one definition: raw score greater than zero", () => {
  const evidence = emptyEvidence();
  evidence.reviewEvents.push(review());
  const model = deriveActivityHistory(evidence, NOW);
  assert.equal(model.activeDayCount, model.days.filter((day) => day.rawScore > 0).length);
});

test("UTC midnight places adjacent timestamps on adjacent days", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(
    attempt({ eventId: "before", attemptedAt: "2026-09-11T23:59:59.999Z", isCorrect: true }),
    attempt({ questionId: "q2", eventId: "after", sequence: 2, attemptedAt: "2026-09-12T00:00:00.000Z", isCorrect: true }),
  );
  const model = deriveActivityHistory(evidence, NOW);
  assert.equal(model.days.find((day) => day.dayKey === "2026-09-11")?.rawScore, 1);
  assert.equal(model.days.find((day) => day.dayKey === "2026-09-12")?.rawScore, 1);
});

test("historical/imported evidence keeps its original timestamp", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(attempt({ attemptedAt: "2026-08-20T08:00:00.000Z", isCorrect: true }));
  const model = deriveActivityHistory(evidence, NOW);
  assert.equal(model.days.find((day) => day.dayKey === "2026-08-20")?.rawScore, 1);
  assert.equal(currentDay(model).rawScore, 0);
});

test("evidence outside the 12-week window and future evidence are clipped", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(attempt({ eventId: "old", attemptedAt: "2026-06-20T12:00:00.000Z", isCorrect: true }), attempt({ eventId: "future", questionId: "q2", attemptedAt: "2026-09-12T13:00:00.000Z", isCorrect: true }));
  assert.equal(deriveActivityHistory(evidence, NOW).activeDayCount, 0);
});

test("weeks and days are chronological with the most recent week last", () => {
  const model = deriveActivityHistory(emptyEvidence(), NOW);
  assert.equal(model.weeks[0].startDayKey, "2026-06-21");
  assert.equal(model.weeks.at(-1)?.endDayKey, "2026-09-12");
});

test("activity is global across subject/path identifiers", () => {
  const day = today([
    attempt({ eventId: "maths", questionId: "maths-q", skillPathId: "maths-path", isCorrect: true }),
    attempt({ eventId: "physics", questionId: "physics-q", skillPathId: "physics-path", sequence: 2, isCorrect: true }),
  ]);
  assert.equal(day.rawScore, 2);
  assert.equal(day.distinctQuestionsWorkedOn, 2);
});

test("question version is part of daily deduplication identity", () => {
  const day = today([
    attempt({ eventId: "v1", isCorrect: true }),
    attempt({ eventId: "v2", sequence: 2, isCorrect: true, versionEvidence: { kind: "known", questionVersion: 2 } }),
  ]);
  assert.equal(day.distinctQuestionsWorkedOn, 2);
  assert.equal(day.rawScore, 2);
});

test("weekly Dashboard signal agrees with the full activity definition", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(attempt({ isCorrect: false }));
  evidence.achievementSnapshots.push(achievement({ snapshotId: "milestone_2", achievedAt: "2026-09-11T12:00:00.000Z" }));
  evidence.reviewEvents.push(review({ eventId: "review_2", occurredAt: "2026-09-10T12:00:00.000Z" }));
  const weekly = deriveWeeklyActivity(evidence, NOW);
  const full = deriveActivityHistory(evidence, NOW);
  assert.equal(weekly.activeDays, 3);
  assert.equal(weekly.activeDays, full.days.slice(-7).filter((day) => day.rawScore > 0).length);
});

test("large repeated histories stay bounded without inflating question counts", () => {
  const evidence = emptyEvidence();
  evidence.attempts.push(...Array.from({ length: 10_000 }, (_, index) => attempt({ eventId: `scale_${index}`, sequence: index + 1, isCorrect: index === 9_999 })));
  const started = performance.now();
  const day = currentDay(deriveActivityHistory(evidence, NOW));
  assert.equal(day.distinctQuestionsWorkedOn, 1);
  assert.equal(day.rawScore, 0.85);
  assert.ok(performance.now() - started < 1_500);
});

function today(attempts: QuestionAttempt[]) {
  const evidence = emptyEvidence();
  evidence.attempts.push(...attempts);
  return currentDay(deriveActivityHistory(evidence, NOW));
}
function currentDay(model: ReturnType<typeof deriveActivityHistory>) { return model.days.at(-1)!; }
function emptyEvidence(): ProgressEvidence { return { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] }; }
function attempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return { questionId: "q1", skillPathId: "path", stageId: "stage", isCorrect: false, answer: "answer", attemptedAt: NOW.toISOString(), sequence: 1, isGenuine: true, hintViewedBeforeSubmission: false, supportKnowledge: "known", versionEvidence: { kind: "known", questionVersion: 1 }, eventId: "attempt_1", outcomeKind: "graded", strategy: "closed_vocabulary_text_answer", strategyVersion: 1, ...overrides };
}
function support(overrides: Partial<QuestionSupportEvent> = {}): QuestionSupportEvent {
  return { questionId: "q1", skillPathId: "path", stageId: "stage", type: "hint_viewed", occurredAt: NOW.toISOString(), sequence: 2, afterGenuineAttempt: true, versionEvidence: { kind: "known", questionVersion: 1 }, eventId: "support_1", ...overrides };
}
function achievement(overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return { snapshotId: "milestone_1", kind: "stage_completed", subjectId: "subject", courseId: "course", pathId: "path", pathVersion: 1, stageId: "stage", stageVersion: 1, achievedAt: NOW.toISOString(), masteryScore: 50, independentPerformancePercentage: 50, completionCount: 1, totalRequiredCount: 1, source: "derived_current", ...overrides };
}
function review(overrides: Partial<ReviewEvent> & { outcome?: ReviewOutcome } = {}): ReviewEvent {
  return { eventId: "review_1", source: { sourceType: "practice_session", sourceId: "session_1" }, target: { targetType: "skill", targetId: "path" }, targetVersion: { versionType: "skill_path", version: 1 }, outcome: "independent_success", occurredAt: NOW.toISOString(), sequence: 3, priorEventId: null, schedulerVersion: 1, stageAfter: 1, evidenceRefs: [], questionIds: ["q1"], ...overrides };
}
function flashcard(overrides: Partial<FlashcardReviewEvent> = {}): FlashcardReviewEvent {
  return { eventId: "flashcard_1", cardId: "card-1", cardVersion: 1, outcome: "remembered", outcomeSource: "self_rated", occurredAt: NOW.toISOString(), sequence: 1, schedulerVersion: 1, ...overrides };
}
