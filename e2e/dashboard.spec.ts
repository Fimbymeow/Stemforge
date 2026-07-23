import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("guest learner dashboard hydrates without errors and presents course access before one recommendation", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  const summary = page.getByTestId("dashboard-progress-summary");
  await expect(summary).toContainText("Start Basic differentiation");
  await expect(summary.getByRole("link", { name: "Open Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
  await expect(summary.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(summary).toContainText("0 / 8 completed");
  await expect(page.getByText("Saved on this browser")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course progress" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Needs work" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Secure and mastered" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Quick links" })).toHaveCount(0);
  await expect(page.getByTestId("dashboard-quick-practice")).toContainText("Quick Practice");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("dashboard updates from stored evidence with compact course context and a resume action", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong", attemptedAt: "2026-07-16T10:00:00.000Z" }),
    currentAttempt(QUESTION_IDS[1], 2, { isCorrect: true, attemptedAt: "2026-07-16T10:05:00.000Z" }),
  ]));

  await page.goto("/dashboard");

  const summary = page.getByTestId("dashboard-progress-summary");
  await expect(summary).toContainText("Resume Foundations");
  await expect(summary.getByRole("link", { name: "Open Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
  await expect(summary.getByRole("link", { name: "Resume question" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(summary).toContainText("1 / 8 completed");
  await expect(page.getByTestId("dashboard-course-progress").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
});
