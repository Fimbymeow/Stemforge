import assert from "node:assert/strict";
import test from "node:test";

import {
  formatWeeklyHours,
  MAX_WEEKLY_HOURS,
  MIN_WEEKLY_HOURS,
  minutesToWeeklyHours,
  weeklyHoursToMinutes,
} from "@/lib/study-plan/weekly-time";
import { MAX_WEEKLY_MINUTES } from "@/lib/study-plan/constants";
import { normalizeStudyPlanLocalState } from "@/lib/study-plan/local-state";

test("stored minutes display cleanly as hours for the brief's own worked examples", () => {
  assert.equal(minutesToWeeklyHours(60), 1);
  assert.equal(minutesToWeeklyHours(90), 1.5);
  assert.equal(minutesToWeeklyHours(240), 4);
});

test("a legacy odd-minute value (pre-dating the hours field) rounds to the nearest half hour rather than showing a jagged decimal", () => {
  assert.equal(minutesToWeeklyHours(95), 1.5);
  assert.equal(minutesToWeeklyHours(20), 0.5);
  assert.equal(minutesToWeeklyHours(50), 1);
});

test("zero or invalid minutes never produce a negative or NaN hours value", () => {
  assert.equal(minutesToWeeklyHours(0), 0);
  assert.equal(minutesToWeeklyHours(-10), 0);
  assert.equal(minutesToWeeklyHours(NaN), 0);
});

test("hours convert back to exact integer minutes, never floating-point drift", () => {
  assert.equal(weeklyHoursToMinutes(1), 60);
  assert.equal(weeklyHoursToMinutes(1.5), 90);
  assert.equal(weeklyHoursToMinutes(4), 240);
  assert.equal(weeklyHoursToMinutes(6), 360);
  for (const hours of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5.5, 10, 40, 100, 168]) {
    const minutes = weeklyHoursToMinutes(hours);
    assert.equal(Number.isInteger(minutes), true, `${hours}h produced non-integer minutes: ${minutes}`);
  }
});

test("invalid hours input (zero, negative, NaN) converts to 0 minutes rather than corrupting state", () => {
  assert.equal(weeklyHoursToMinutes(0), 0);
  assert.equal(weeklyHoursToMinutes(-2), 0);
  assert.equal(weeklyHoursToMinutes(NaN), 0);
});

test("round-tripping a value already on the half-hour grid is stable (no drift across repeated saves)", () => {
  for (const minutes of [30, 60, 90, 120, 150, 240, 360]) {
    assert.equal(weeklyHoursToMinutes(minutesToWeeklyHours(minutes)), minutes);
  }
});

test("the field's own hour bounds match the storage layer's minute bounds exactly", () => {
  assert.equal(weeklyHoursToMinutes(MAX_WEEKLY_HOURS), MAX_WEEKLY_MINUTES);
  assert.equal(MIN_WEEKLY_HOURS * 60, 30); // comfortably above the 15-minute storage floor, never below it
});

test("formatWeeklyHours reads naturally in both singular and plural form", () => {
  assert.equal(formatWeeklyHours(1), "1 hour");
  assert.equal(formatWeeklyHours(1.5), "1.5 hours");
  assert.equal(formatWeeklyHours(4), "4 hours");
});

test("a settings save built from a converted hours value still persists and rehydrates as plain integer minutes", () => {
  const weeklyMinutes = weeklyHoursToMinutes(1.5);
  const state = normalizeStudyPlanLocalState({
    setup: { weeklyMinutes, availableDays: ["mon", "wed", "sat"], assessments: [] },
  });
  assert.equal(state.setup?.weeklyMinutes, 90);
  assert.equal(Number.isInteger(state.setup?.weeklyMinutes), true);
});
