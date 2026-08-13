import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress } from "./fixtures/progress";
import type { ProgressPayload } from "../lib/progress/types";
import type { ReviewEvent } from "../lib/review/types";

test("fresh learner sees a calm empty state with the real next action", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/activity");
  await expect(page.getByRole("heading", { name: "Activity", level: 1 })).toBeVisible();
  await expect(page.getByTestId("activity-empty-state")).toContainText("Your activity will appear here");
  const action = page.getByTestId("activity-empty-state").getByRole("link");
  await expect(action).toHaveAttribute("href", new RegExp(`^/question/${QUESTION_IDS[0]}`));
  await action.click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}`));
  expect(seriousBrowserErrors).toEqual([]);
});

test("meaningful evidence renders week rows, Dashboard signal and bounded day detail", async ({ page, seriousBrowserErrors }) => {
  const { today, yesterday } = recentTimes();
  await seedStoredProgress(page, payload([
    currentAttempt(QUESTION_IDS[0], 1, { eventId: "activity_wrong", attemptedAt: today, isCorrect: false }),
    currentAttempt(QUESTION_IDS[0], 2, { eventId: "activity_correct", attemptedAt: today, isCorrect: true }),
    currentAttempt(QUESTION_IDS[1], 3, { eventId: "activity_second", attemptedAt: today, isCorrect: true }),
  ], [review(yesterday)]));
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-activity-line")).toContainText("2 active days in the last 7 days");
  await page.getByRole("link", { name: "View activity" }).click();
  await expect(page).toHaveURL(/\/activity$/);
  await expect(page.getByTestId("activity-history")).toBeVisible();
  await expect(page.getByRole("group", { name: /Activity by week/ }).getByRole("group")).toHaveCount(12);
  for (const label of ["No activity", "Light", "Moderate", "Strong", "Very strong"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.locator('[data-intensity="2"]')).toHaveCount(1);
  await expect(page.locator('[data-intensity="1"]')).toHaveCount(1);
  await page.locator(`[data-day-key="${today.slice(0, 10)}"]`).click();
  await expect(page.getByTestId("activity-detail-panel")).toContainText("Moderate activity");
  await expect(page.getByTestId("activity-detail-panel")).toContainText("2 questions worked on · 2 completed independently");
  await page.locator(`[data-day-key="${yesterday.slice(0, 10)}"]`).click();
  await expect(page.getByTestId("activity-detail-panel")).toContainText("Review completed");
  await expect(page.getByTestId("activity-history")).not.toContainText(/weighted score|current streak|longest streak|keep it going/i);
  expect(seriousBrowserErrors).toEqual([]);
});

test("repeated same-question errors do not darken the day beyond its best outcome", async ({ page, seriousBrowserErrors }) => {
  const { today } = recentTimes();
  await seedStoredProgress(page, payload([
    currentAttempt(QUESTION_IDS[0], 1, { eventId: "repeat_1", attemptedAt: today, isCorrect: false }),
    currentAttempt(QUESTION_IDS[0], 2, { eventId: "repeat_2", attemptedAt: today, isCorrect: false }),
  ]));
  await page.goto("/activity");
  await expect(page.getByTestId("activity-detail-panel")).toContainText("Hover, focus or select a day");
  const cell = page.locator(`[data-day-key="${today.slice(0, 10)}"]`);
  await expect(cell).toHaveAttribute("data-intensity", "1");
  await cell.click();
  await expect(page.getByTestId("activity-detail-panel")).toContainText("1 question worked on");
  expect(seriousBrowserErrors).toEqual([]);
});

test("each week is one tab stop and arrow navigation updates the persistent detail", async ({ page, seriousBrowserErrors }) => {
  const { today } = recentTimes();
  await seedStoredProgress(page, payload([currentAttempt(QUESTION_IDS[0], 1, { attemptedAt: today, isCorrect: true })]));
  await page.goto("/activity");
  const lastWeek = page.getByRole("group", { name: /Week 12,/ });
  const days = lastWeek.getByRole("button");
  await expect(days).toHaveCount(7);
  await expect(page.locator('[data-day-key][tabindex="0"]')).toHaveCount(12);
  await expect(days.first()).toHaveAttribute("tabindex", "0");
  await expect(days.nth(1)).toHaveAttribute("tabindex", "-1");
  await days.first().focus();
  const firstDetail = await page.getByTestId("activity-detail-panel").textContent();
  await page.keyboard.press("ArrowRight");
  await expect(days.nth(1)).toBeFocused();
  await expect(days.nth(1)).toHaveAttribute("tabindex", "0");
  expect(await page.getByTestId("activity-detail-panel").textContent()).not.toBe(firstDetail);
  await page.keyboard.press("Home");
  await expect(days.first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(days.last()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(days.last()).toBeFocused();
  expect(seriousBrowserErrors).toEqual([]);
});

test("Activity remains naturally readable without page overflow at 390, 375 and 320px", async ({ page, seriousBrowserErrors }) => {
  const { today } = recentTimes();
  await seedStoredProgress(page, payload([currentAttempt(QUESTION_IDS[0], 1, { attemptedAt: today, isCorrect: true })]));
  for (const width of [390, 375, 320]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/activity");
    await expect(page.getByTestId("activity-detail-panel")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px overflow`).toBe(0);
  }
  expect(seriousBrowserErrors).toEqual([]);
});

function payload(attempts: ProgressPayload["data"]["attempts"], reviewEvents: ReviewEvent[] = []): ProgressPayload {
  return { version: 7, data: { attempts, supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents, flashcardReviews: [] } };
}
function recentTimes() {
  const today = new Date(Date.now() - 60 * 60 * 1000);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return { today: today.toISOString(), yesterday: yesterday.toISOString() };
}
function review(occurredAt: string): ReviewEvent {
  return { eventId: "activity_review", source: { sourceType: "practice_session", sourceId: "activity_session" }, target: { targetType: "skill", targetId: "basic-differentiation" }, targetVersion: { versionType: "skill_path", version: 1 }, outcome: "independent_success", occurredAt, sequence: 4, priorEventId: null, schedulerVersion: 1, stageAfter: 1, evidenceRefs: [], questionIds: [QUESTION_IDS[0]] };
}
