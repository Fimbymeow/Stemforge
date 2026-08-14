import { expect, test } from "./fixtures/test";
import { QUESTION_IDS } from "./fixtures/progress";
import { expectNoHorizontalOverflow, openQuestion, submitAnswer } from "./fixtures/student-actions";

test("product feedback remains available without beta messaging on learner surfaces", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");
  await expect(page.getByLabel("Public beta notice", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send feedback" })).toBeVisible();
  await expect(page.getByTestId("question-status")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByLabel("Public beta notice", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("Question Bank filters keep a direct question action visible at desktop size", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page.getByLabel("Course area")).toBeVisible();
  const firstQuestion = page.getByRole("link", { name: "Open Differentiate a power" });
  await expect(firstQuestion).toBeInViewport();
  await firstQuestion.focus();
  await expect(firstQuestion).toBeFocused();
});

test("practice summary retains the app shell and exact-session retry priority", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  await page.getByLabel("Your answer").fill("4x^5");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await page.getByRole("button", { name: "Finish session" }).click();
  await page.getByRole("dialog", { name: "Finish this session?" }).getByRole("button", { name: "Finish session" }).click();

  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Orthic" })).toBeVisible();
  const retry = page.getByRole("button", { name: "Retry incorrect" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
});

test("course tracker remains overflow-free at desktop and mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/subjects/higher-maths/course-tracker");
  await expect(page.getByTestId("course-tracker")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByTestId("tracker-skill-area-between-curves")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("focused recovery shell keeps brand, landmark, headings, skip link and mobile geometry", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/missing-p10-route");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page could not be found.");
  await expect(page.getByRole("img", { name: "Orthic" })).toBeVisible();
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await skip.focus();
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});
