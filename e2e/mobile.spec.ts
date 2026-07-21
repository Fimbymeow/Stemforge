import { test, expect } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow, openQuestion, openWorkedSolution, submitAnswer } from "./fixtures/student-actions";

test("mobile student can navigate, answer, use support and continue without overflow", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  await expect(page.getByRole("heading", { name: "Course evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent activity" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole("link", { name: "Subjects" })).toBeVisible();

  await page.goto("/subjects/higher-maths");
  await expect(page.getByRole("heading", { name: "Higher Maths", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  await expect(page.getByTestId("reset-progress")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.getByText("Optional keypad")).toBeVisible();
  await expect(page.getByTestId("hint-control")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await submitAnswer(page, "wrong");
  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();
  await openWorkedSolution(page);
  await expect(page.getByTestId("question-status")).toContainText("Completed with solution");
  await expect(page.getByTestId("next-question-action")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("next-question-action").click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[1]}$`));
});

test("mobile final completion is readable, stacked and free of horizontal overflow", async ({ page }) => {
  const prior = QUESTION_IDS.slice(0, -1).map((id, index) => currentAttempt(id, index + 1));
  await seedStoredProgress(page, v3Payload(prior));
  const finalQuestion = QUESTION_IDS.at(-1)!;
  await openQuestion(page, finalQuestion);
  await submitAnswer(page, QUESTION_ANSWERS[finalQuestion]);

  const panel = page.getByTestId("path-completion-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Basic differentiation mastered");
  await expect(panel).toContainText("8 / 8 completed");
  const primary = panel.getByTestId("path-completion-primary-action");
  const secondary = panel.getByRole("link", { name: "Review a stage" });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const primaryBox = await primary.boundingBox();
  const secondaryBox = await secondary.boundingBox();
  expect(primaryBox).not.toBeNull();
  expect(secondaryBox).not.toBeNull();
  expect(secondaryBox!.y).toBeGreaterThan(primaryBox!.y + primaryBox!.height - 1);
  expect(Math.abs(secondaryBox!.x - primaryBox!.x)).toBeLessThanOrEqual(1);
  await expectNoHorizontalOverflow(page);
  await primary.focus();
  await expect(primary).toBeFocused();
});

test("mobile taxonomy and question context remain readable without page overflow", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page.getByText("Differentiating functions", { exact: true })).toBeVisible();
  await expect(page.getByText("Applying integral calculus", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await page.goto("/question/hm-calc-diff-basic-a-001");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb).toContainText("Differentiating functions");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("mobile disabled account state remains readable and offers guest continuation", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Accounts are not available" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue as a guest" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("mobile Functional Honesty surfaces remain compact, semantic and error-free", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/practice");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("combobox", { name: "Course" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Path" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Mixed practice/ })).toHaveCount(0);
  await expect(page.getByLabel("Notifications")).toHaveCount(0);
  await expect(page.getByLabel("Profile preview")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/subjects/higher-maths/formula-cards");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Higher Maths Formula Cards", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});
