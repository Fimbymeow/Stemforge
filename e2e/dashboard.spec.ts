import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("guest learner dashboard hydrates without errors and presents calm course access", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  const summary = page.getByTestId("dashboard-progress-summary");
  await expect(summary.getByText("Recommended next")).toHaveCount(0);
  await expect(summary.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(summary).toContainText("Basic differentiation");
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0/3 complete");
  await expect(page.getByTestId("dashboard-course-progress")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-per-skill-progress")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-weekly-activity")).toHaveCount(0);
  await expect(page.getByText("Saved on this browser")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course progress" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Needs work" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Secure and mastered" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Quick links" })).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Practise your way" })).toHaveAttribute("href", "/practice");
  const course = page.getByTestId("dashboard-courses").getByRole("link", { name: "Open Higher Maths" });
  await expect(course).toContainText("0 of 2 skills learned");
  await expect(course).toContainText("Up to date");
  await expect(page.getByTestId("dashboard-review-summary")).toHaveCount(0);
  await expect(page.getByText("Needs attention", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("dashboard updates from stored evidence with compact course context and a resume action", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong", attemptedAt: "2026-07-16T10:00:00.000Z" }),
    currentAttempt(QUESTION_IDS[1], 2, { isCorrect: true, attemptedAt: "2026-07-16T10:05:00.000Z" }),
  ]));

  await page.goto("/dashboard");

  const summary = page.getByTestId("dashboard-progress-summary");
  await expect(summary).not.toContainText("Combined progress across the Higher Maths skills available now");
  await expect(summary.getByRole("link", { name: "Resume question" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(summary).toContainText("Basic differentiation");
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 1/3 complete");
  await expect(page.getByTestId("dashboard-course-progress")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-per-skill-progress")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("dashboard keeps weekly activity out of the primary recommendation", async ({ page }) => {
  const today = new Date().toISOString();
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: true, attemptedAt: today }),
  ]));

  await page.goto("/dashboard");

  await expect(page.getByTestId("dashboard-weekly-activity")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary")).not.toContainText("active day");
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
});
