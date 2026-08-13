import type { ProgressPayload } from "../lib/progress/types";
import { test, expect } from "./fixtures/test";
import {
  PATH_ID,
  QUESTION_ANSWERS,
  QUESTION_IDS,
  currentAttempt,
  readStoredProgress,
  seedStoredProgress,
  supportEvent,
  v3Payload,
} from "./fixtures/progress";
import { openHint, openQuestion, openWorkedSolution, submitAnswer } from "./fixtures/student-actions";

test("dashboard, Higher Maths hub and path agree for mixed outcomes", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);

  await openQuestion(page, QUESTION_IDS[1]);
  await openHint(page);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[1]]);

  await openQuestion(page, QUESTION_IDS[2]);
  await submitAnswer(page, "0");
  await openWorkedSolution(page);

  await openQuestion(page, QUESTION_IDS[3]);
  await submitAnswer(page, "0");
  await expect(page.getByTestId("next-question-locked")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("Basic differentiation");
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Applications \u00b7 0/3 complete");

  await page.goto("/subjects/higher-maths");
  await expect(page.getByTestId("working-context-hub")).toContainText("Applications \u00b7 0/3 complete");

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.locator('[data-mastery-status="in_progress"]')).toHaveAccessibleName("Progress: In progress");
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" })).toHaveAttribute("data-journey-state", "complete");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Applications" })).toContainText("0 of 3 complete");
});

test("path reset clears only Basic differentiation and remains valid after refresh", async ({ page }) => {
  const unrelated = currentAttempt("other-question", 2, { skillPathId: "other-path", stageId: "other-stage" });
  const payload = v3Payload(
    [currentAttempt(QUESTION_IDS[0], 1), unrelated],
    [supportEvent(QUESTION_IDS[0], 3, "hint_viewed"), supportEvent("other-question", 4, "hint_viewed", { skillPathId: "other-path", stageId: "other-stage" })],
  );
  await seedStoredProgress(page, payload);
  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  const resetRoute = page.url();
  await expect(page.getByTestId("skill-path-hero-progress").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");

  await page.getByText("Progress options", { exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("reset-progress").click();
  await expect(page).toHaveURL(resetRoute);
  await expect(page.locator('[data-mastery-status="not_started"]')).toHaveAccessibleName("Progress: Not started");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  let stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(7);
  expect(stored.data.attempts).toHaveLength(1);
  expect(stored.data.attempts[0].skillPathId).toBe("other-path");
  expect(stored.data.supportEvents).toHaveLength(1);

  await page.reload();
  await expect(page.locator('[data-mastery-status="not_started"]')).toHaveAccessibleName("Progress: Not started");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0/3 complete");
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.data.attempts.some((item) => item.skillPathId === PATH_ID)).toBe(false);
});
