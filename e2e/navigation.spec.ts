import { test, expect } from "./fixtures/test";
import { readStoredProgress } from "./fixtures/progress";

test("fresh student reaches the Basic differentiation path through the app", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "STEM Forge", level: 1 })).toBeVisible();
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0 of 3 complete");

  await page.getByRole("link", { name: "Subjects" }).click();
  await expect(page).toHaveURL(/\/subjects$/);
  const mathsCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Higher Maths", level: 3 }) });
  await mathsCard.getByRole("link", { name: "Open Higher Maths" }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths$/);
  await page.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes\?path=basic-differentiation$/);
  await expect(page.getByRole("link", { name: "Continue to Foundations" })).toHaveAttribute("href", "/question/hm-calc-diff-basic-f-001");
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  await page.getByRole("link", { name: "View full overview" }).click();
  await expect(page.getByRole("heading", { name: "Basic differentiation", level: 1 })).toBeVisible();
  await expect(page.getByTestId("skill-path-hero-progress")).toContainText("8");
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.locator('[data-journey-kind="stage"]')).toHaveCount(3);
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" })).toContainText("0 of 3 complete");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Applications" })).toContainText("Not started");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Exam practice" })).toContainText("Not started");
  expect(await readStoredProgress(page)).toBeNull();
});

test("invalid question and learning routes render the not-found recovery page", async ({ page }) => {
  const questionResponse = await page.goto("/question/not-a-real-question");
  expect(questionResponse?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse subjects" })).toBeVisible();

  const pathResponse = await page.goto("/subjects/higher-maths/calculus/differentiation/not-a-real-path");
  expect(pathResponse?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
});

test("disabled account navigation hydrates without console or page errors and fails safely", async ({
  page,
  seriousBrowserErrors,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Account" })).toHaveCount(0);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Accounts are not available" })).toBeVisible();
  await page.getByRole("link", { name: "Continue as a guest" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0 of 3 complete");
  expect(seriousBrowserErrors).toEqual([]);
});
