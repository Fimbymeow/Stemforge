import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("guest learner dashboard hydrates without errors and shows deterministic evidence sections", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");

  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("Start Basic differentiation");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  await expect(page.getByText("Saved on this browser")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent activity" })).toBeVisible();
  await expect(page.getByText("No recent activity yet. Your first genuine attempt will appear here.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Secure and mastered" })).toBeVisible();
  await expect(page.getByRole("progressbar").first()).toHaveAttribute("aria-valuenow", "0");
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("dashboard updates from stored evidence with grouped recent activity and a resume action", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong", attemptedAt: "2026-07-16T10:00:00.000Z" }),
    currentAttempt(QUESTION_IDS[1], 2, { isCorrect: true, attemptedAt: "2026-07-16T10:05:00.000Z" }),
  ]));

  await page.goto("/dashboard");

  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("Continue Basic differentiation");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("1 / 8");
  await expect(page.getByText("2 questions attempted")).toBeVisible();
  await expect(page.getByText("Basic differentiation · 1 correct")).toBeVisible();
  await expect(page.getByText("1 active day in the last 7 days")).toBeVisible();
  await expect(page.getByTestId("dashboard-path-basic-differentiation")).toContainText("1 / 8");
});
