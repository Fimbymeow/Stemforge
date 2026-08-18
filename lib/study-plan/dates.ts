import {
  CLOSE_EXAM_PHASE_MAX_DAYS,
  MEDIUM_EXAM_PHASE_MAX_DAYS,
} from "@/lib/study-plan/constants";
import type { StudyPlanExamPhase, StudyPlanWeekday } from "@/lib/study-plan/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX: Record<StudyPlanWeekday, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

export function utcDayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function utcWeekStart(value: Date): string {
  const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  return utcDayKey(start);
}

export function datesForAvailableDays(weekStart: string, days: readonly StudyPlanWeekday[]): string[] {
  const start = parseDateOnly(weekStart);
  if (!start) return [];
  return [...new Set(days)]
    .sort((left, right) => WEEKDAY_INDEX[left] - WEEKDAY_INDEX[right])
    .map((day) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + WEEKDAY_INDEX[day]);
      return utcDayKey(date);
    });
}

export function isAvailableDate(
  date: string,
  weekStart: string,
  days: readonly StudyPlanWeekday[],
): boolean {
  return datesForAvailableDays(weekStart, days).includes(date);
}

export function classifyExamPhase(now: Date, examDate?: string | null): StudyPlanExamPhase {
  if (!examDate) return "no_date";
  const parsed = parseDateOnly(examDate);
  if (!parsed) return "no_date";
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.ceil((parsed.getTime() - today) / DAY_MS);
  if (days <= CLOSE_EXAM_PHASE_MAX_DAYS) return "close";
  if (days <= MEDIUM_EXAM_PHASE_MAX_DAYS) return "medium";
  return "far";
}

/**
 * Month-precision assessment phase, e.g. a provisional "May 2027" national exam period.
 * Deliberately coarser than `classifyExamPhase`: it reasons in whole months, never a fake day
 * count. `close` once the calendar reaches the target month (or later, if the provisional
 * estimate has gone stale and hasn't been replaced with an official date yet), `medium` for the
 * one full preceding month, `far` otherwise.
 */
export function classifyMonthPhase(now: Date, year: number, month: number): StudyPlanExamPhase {
  const nowMonths = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const targetMonths = year * 12 + (month - 1);
  const monthsUntil = targetMonths - nowMonths;
  if (monthsUntil <= 0) return "close";
  if (monthsUntil === 1) return "medium";
  return "far";
}

export function isValidDateOnly(value: string): boolean {
  return parseDateOnly(value) !== null;
}

export function dateIsInWeek(date: string, weekStart: string): boolean {
  const value = parseDateOnly(date);
  const start = parseDateOnly(weekStart);
  if (!value || !start) return false;
  const difference = Math.floor((value.getTime() - start.getTime()) / DAY_MS);
  return difference >= 0 && difference < 7;
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && utcDayKey(parsed) === value ? parsed : null;
}
