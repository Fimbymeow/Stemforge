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
  await submitAnswer(page, "wrong");
  await openWorkedSolution(page);

  await openQuestion(page, QUESTION_IDS[3]);
  await submitAnswer(page, "wrong");
  await expect(page.getByTestId("next-question-locked")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("3 / 8 completed");
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "38");

  await page.goto("/subjects/higher-maths");
  await expect(page.getByText("3 / 8 completed", { exact: true })).toBeVisible();
  await expect(page.getByText("38% complete", { exact: true })).toBeVisible();

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("skill-path-hero-progress")).toContainText("In Progress");
  await expect(page.getByText("3 / 3 complete", { exact: true })).toBeVisible();
  await expect(page.getByText("0 / 3 complete", { exact: true })).toBeVisible();
});

test("path reset clears only Basic differentiation and remains valid after refresh", async ({ page }) => {
  const unrelated = currentAttempt("other-question", 2, { skillPathId: "other-path", stageId: "other-stage" });
  const payload = v3Payload(
    [currentAttempt(QUESTION_IDS[0], 1), unrelated],
    [supportEvent(QUESTION_IDS[0], 3, "hint_viewed"), supportEvent("other-question", 4, "hint_viewed", { skillPathId: "other-path", stageId: "other-stage" })],
  );
  await seedStoredProgress(page, payload);
  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("skill-path-hero-progress").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("reset-progress").click();
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  let stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts).toHaveLength(1);
  expect(stored.data.attempts[0].skillPathId).toBe("other-path");
  expect(stored.data.supportEvents).toHaveLength(1);

  await page.reload();
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.data.attempts.some((item) => item.skillPathId === PATH_ID)).toBe(false);
});
