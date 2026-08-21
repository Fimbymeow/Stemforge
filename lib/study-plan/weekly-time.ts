/**
 * Learner-facing hours conversion for the weekly study-time field. Presentation only — storage
 * (`StudyPlanSetup.weeklyMinutes`) and all planner arithmetic remain integer minutes throughout;
 * these functions exist solely so the settings form can think and speak in hours, the way learners
 * actually conceptualise a weekly commitment.
 */
export const WEEKLY_TIME_HOUR_STEP = 0.5;
export const MIN_WEEKLY_HOURS = 0.5;
export const MAX_WEEKLY_HOURS = 168; // 7 * 24, matches MAX_WEEKLY_MINUTES exactly.

/** Rounds to the nearest half-hour so legacy/odd-minute values (e.g. from the old 5-minute-step field) still display cleanly. */
export function minutesToWeeklyHours(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.round(minutes / 60 / WEEKLY_TIME_HOUR_STEP) * WEEKLY_TIME_HOUR_STEP;
}

/** Always an integer — never lets floating-point drift (e.g. 89.999999...) into stored minutes. */
export function weeklyHoursToMinutes(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return Math.round(hours * 60);
}

/** "1 hour" / "1.5 hours" / "4 hours" — singular only for exactly 1. */
export function formatWeeklyHours(hours: number): string {
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${value} hour${hours === 1 ? "" : "s"}`;
}
