import { isGradedAttempt, isGradedCorrectAttempt, isGradedIncorrectAttempt } from "@/lib/progress/attempt-outcomes";
import { MASTERY_CONTRIBUTIONS } from "@/lib/progress/calculations";
import type { ProgressEvidence, QuestionAttempt, QuestionOutcome, QuestionSupportEvent, VersionEvidence } from "@/lib/progress/types";

export const ACTIVITY_RANGE_DAYS = 84;
export const ACTIVITY_DISPLAY_CAP = 4;

export type ActivityIntensityLevel = 0 | 1 | 2 | 3 | 4;
export type ActivityIntensityLabel = "No activity" | "Light" | "Moderate" | "Strong" | "Very strong";

export type ActivityDay = {
  dayKey: string;
  date: string;
  weekIndex: number;
  weekdayIndex: number;
  rawScore: number;
  displayScore: number;
  intensityLevel: ActivityIntensityLevel;
  intensityLabel: ActivityIntensityLabel;
  distinctQuestionsWorkedOn: number;
  independentlyCompletedQuestionCount: number;
  milestoneCount: number;
  independentReviewSuccessCount: number;
  detailHeading: string;
  detailCounts: string;
  additionalFact: string | null;
  accessibleText: string;
};

export type ActivityWeek = {
  weekIndex: number;
  startDayKey: string;
  endDayKey: string;
  label: string;
  days: ActivityDay[];
};

export type ActivityHistory = {
  days: ActivityDay[];
  weeks: ActivityWeek[];
  activeDayCount: number;
  totalDayCount: number;
  totalDistinctQuestionsWorkedOn: number;
  totalIndependentCompletions: number;
  totalMilestones: number;
  totalIndependentReviewSuccesses: number;
  hasActivity: boolean;
  summaryText: string;
};

type DayAccumulator = {
  attempts: Map<string, QuestionAttempt[]>;
  supportEvents: Map<string, QuestionSupportEvent[]>;
  milestoneIds: Set<string>;
  independentReviewIds: Set<string>;
};

export function deriveActivityHistory(
  evidence: ProgressEvidence,
  now: Date,
  options: { rangeDays?: number } = {},
): ActivityHistory {
  const rangeDays = options.rangeDays ?? ACTIVITY_RANGE_DAYS;
  if (!Number.isInteger(rangeDays) || rangeDays <= 0 || rangeDays % 7 !== 0) {
    throw new Error("Activity range must be a positive whole number of weeks.");
  }
  const end = new Date(now);
  const start = utcStartOfDay(end);
  start.setUTCDate(start.getUTCDate() - (rangeDays - 1));
  const accumulators = new Map<string, DayAccumulator>();
  for (let offset = 0; offset < rangeDays; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    accumulators.set(utcDayKey(date), emptyAccumulator());
  }

  for (const attempt of evidence.attempts) {
    if (!attempt.isGenuine || !isGradedAttempt(attempt) || !withinRange(attempt.attemptedAt, start, end)) continue;
    const day = accumulators.get(utcDayKey(attempt.attemptedAt));
    if (!day) continue;
    const key = questionVersionKey(attempt.questionId, attempt.versionEvidence);
    day.attempts.set(key, [...(day.attempts.get(key) ?? []), attempt]);
  }
  for (const event of evidence.supportEvents) {
    if (!withinRange(event.occurredAt, start, end)) continue;
    const day = accumulators.get(utcDayKey(event.occurredAt));
    if (!day) continue;
    const key = questionVersionKey(event.questionId, event.versionEvidence);
    day.supportEvents.set(key, [...(day.supportEvents.get(key) ?? []), event]);
  }
  for (const snapshot of evidence.achievementSnapshots) {
    if (!withinRange(snapshot.achievedAt, start, end)) continue;
    accumulators.get(utcDayKey(snapshot.achievedAt))?.milestoneIds.add(snapshot.snapshotId);
  }
  for (const event of evidence.reviewEvents) {
    if (event.outcome !== "independent_success" || !withinRange(event.occurredAt, start, end)) continue;
    accumulators.get(utcDayKey(event.occurredAt))?.independentReviewIds.add(event.eventId);
  }

  const attemptOutcomes = deriveAttemptOutcomes(evidence.attempts);
  const days = [...accumulators.entries()].map(([dayKey, accumulator], index) =>
    buildDay(dayKey, accumulator, attemptOutcomes, Math.floor(index / 7), index % 7));
  const weeks = Array.from({ length: rangeDays / 7 }, (_, weekIndex) => {
    const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);
    return {
      weekIndex,
      startDayKey: weekDays[0].dayKey,
      endDayKey: weekDays[6].dayKey,
      label: formatWeekRange(weekDays[0].date, weekDays[6].date),
      days: weekDays,
    };
  });
  const activeDayCount = days.filter((day) => day.rawScore > 0).length;
  return {
    days,
    weeks,
    activeDayCount,
    totalDayCount: rangeDays,
    totalDistinctQuestionsWorkedOn: sum(days, "distinctQuestionsWorkedOn"),
    totalIndependentCompletions: sum(days, "independentlyCompletedQuestionCount"),
    totalMilestones: sum(days, "milestoneCount"),
    totalIndependentReviewSuccesses: sum(days, "independentReviewSuccessCount"),
    hasActivity: activeDayCount > 0,
    summaryText: `Activity over the last ${rangeDays / 7} weeks: ${activeDayCount} active day${activeDayCount === 1 ? "" : "s"} out of ${rangeDays}.`,
  };
}

export function deriveWeeklyActivity(evidence: ProgressEvidence, now: Date) {
  const history = deriveActivityHistory(evidence, now, { rangeDays: 7 });
  return {
    activeDays: history.activeDayCount,
    attempts: history.totalDistinctQuestionsWorkedOn,
    achievements: history.totalMilestones,
    label: history.activeDayCount === 0
      ? "No activity in the last 7 days"
      : `${history.activeDayCount} active day${history.activeDayCount === 1 ? "" : "s"} in the last 7 days`,
  };
}

export function activityIntensity(score: number): { level: ActivityIntensityLevel; label: ActivityIntensityLabel } {
  if (score <= 0) return { level: 0, label: "No activity" };
  if (score < 1) return { level: 1, label: "Light" };
  if (score < 2) return { level: 2, label: "Moderate" };
  if (score < 3) return { level: 3, label: "Strong" };
  return { level: 4, label: "Very strong" };
}

/** Activity uses UTC calendar days because existing evidence has no persisted learner timezone. */
export function utcDayKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildDay(dayKey: string, accumulator: DayAccumulator, attemptOutcomes: ReadonlyMap<string, QuestionOutcome>, weekIndex: number, weekdayIndex: number): ActivityDay {
  let questionScore = 0;
  let independentlyCompletedQuestionCount = 0;
  for (const [key, attempts] of accumulator.attempts) {
    const events = accumulator.supportEvents.get(key) ?? [];
    const outcomes = attempts.map((attempt) => attemptOutcomes.get(attempt.eventId) ?? "attempted_unresolved");
    if (events.some((event) => event.type === "solution_viewed" && event.afterGenuineAttempt)) outcomes.push("completed_with_solution");
    const outcome = outcomes.reduce((best, candidate) =>
      MASTERY_CONTRIBUTIONS[candidate] > MASTERY_CONTRIBUTIONS[best] ? candidate : best, "not_attempted");
    questionScore += MASTERY_CONTRIBUTIONS[outcome];
    if (isIndependentOutcome(outcome)) independentlyCompletedQuestionCount += 1;
  }
  const milestoneCount = accumulator.milestoneIds.size;
  const independentReviewSuccessCount = accumulator.independentReviewIds.size;
  const rawScore = roundScore(questionScore + milestoneCount * 0.5 + independentReviewSuccessCount * 0.5);
  const intensity = activityIntensity(rawScore);
  const date = `${dayKey}T00:00:00.000Z`;
  const detailHeading = `${formatFullDate(date)} — ${intensity.level === 0 ? "No activity" : `${intensity.label} activity`}`;
  const distinctQuestionsWorkedOn = accumulator.attempts.size;
  const detailCounts = `${distinctQuestionsWorkedOn} question${distinctQuestionsWorkedOn === 1 ? "" : "s"} worked on · ${independentlyCompletedQuestionCount} completed independently`;
  const additionalFact = independentReviewSuccessCount > 0
    ? `Review completed${independentReviewSuccessCount > 1 ? ` (${independentReviewSuccessCount})` : ""}`
    : milestoneCount > 0 ? `Milestone completed${milestoneCount > 1 ? ` (${milestoneCount})` : ""}` : null;
  const accessibleText = [detailHeading, detailCounts, additionalFact].filter(Boolean).join(". ");
  return {
    dayKey,
    date,
    weekIndex,
    weekdayIndex,
    rawScore,
    displayScore: Math.min(rawScore, ACTIVITY_DISPLAY_CAP),
    intensityLevel: intensity.level,
    intensityLabel: intensity.label,
    distinctQuestionsWorkedOn,
    independentlyCompletedQuestionCount,
    milestoneCount,
    independentReviewSuccessCount,
    detailHeading,
    detailCounts,
    additionalFact,
    accessibleText,
  };
}

function emptyAccumulator(): DayAccumulator {
  return { attempts: new Map(), supportEvents: new Map(), milestoneIds: new Set(), independentReviewIds: new Set() };
}
function questionVersionKey(questionId: string, version: VersionEvidence) {
  return `${questionId}:${version.kind === "known" ? version.questionVersion : "unknown"}`;
}
function deriveAttemptOutcomes(attempts: readonly QuestionAttempt[]) {
  const outcomes = new Map<string, QuestionOutcome>();
  const priorIncorrect = new Set<string>();
  const ordered = attempts
    .filter((attempt) => attempt.isGenuine && isGradedAttempt(attempt))
    .sort((left, right) => Date.parse(left.attemptedAt) - Date.parse(right.attemptedAt) || left.sequence - right.sequence);
  for (const attempt of ordered) {
    const key = questionVersionKey(attempt.questionId, attempt.versionEvidence);
    if (isGradedCorrectAttempt(attempt)) {
      outcomes.set(attempt.eventId,
        attempt.supportKnowledge === "unknown_legacy" ? "legacy_correct_unknown_support"
          : attempt.hintViewedBeforeSubmission ? "correct_with_hint"
            : priorIncorrect.has(key) ? "independently_correct_after_error"
              : "independently_correct_first_attempt");
    } else {
      outcomes.set(attempt.eventId, "attempted_unresolved");
    }
    if (isGradedIncorrectAttempt(attempt)) priorIncorrect.add(key);
  }
  return outcomes;
}
function withinRange(iso: string, start: Date, end: Date) {
  const value = Date.parse(iso);
  return Number.isFinite(value) && value >= start.getTime() && value <= end.getTime();
}
function utcStartOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
function isIndependentOutcome(outcome: QuestionOutcome) {
  return outcome === "independently_correct_first_attempt" || outcome === "independently_correct_after_error";
}
function roundScore(value: number) { return Math.round(value * 100) / 100; }
function sum(days: ActivityDay[], key: "distinctQuestionsWorkedOn" | "independentlyCompletedQuestionCount" | "milestoneCount" | "independentReviewSuccessCount") {
  return days.reduce((total, day) => total + day[key], 0);
}
function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}
function formatWeekRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(end);
  return startMonth === endMonth ? `${startDay}–${endDay} ${endMonth}` : `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}
