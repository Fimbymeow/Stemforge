import { test, expect } from "./fixtures/test";
import { readStoredProgress } from "./fixtures/progress";

test("fresh student reaches the Basic differentiation path through the app", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Practice · Question 1 of 8");

  await page.getByRole("link", { name: "Subjects" }).click();
  await expect(page).toHaveURL(/\/subjects$/);
  await page.getByRole("link", { name: "Open Higher Maths" }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths$/);
  await page.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes\?path=basic-differentiation$/);
  await expect(page.getByRole("link", { name: "Continue to Practice" })).toHaveAttribute("href", "/question/hm-calc-diff-basic-f-001");
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  await page.getByRole("link", { name: "View full overview" }).click();
  await expect(page.getByRole("heading", { name: "Basic differentiation", level: 1 })).toBeVisible();
  await expect(page.getByTestId("skill-path-hero-progress")).toContainText("8");
  await expect(page.locator('[data-mastery-status="not_started"]')).toHaveAccessibleName("Progress: Not started");
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.getByRole("listitem")).toHaveCount(3);
  await expect(journey.locator('[data-journey-kind="notes"]')).not.toContainText("Available");
  await expect(journey.locator('[data-journey-kind="practice"]')).toContainText("0 of 8 questions completed");
  const review = journey.locator('[data-journey-kind="review"]');
  await expect(review).toContainText("Nothing due");
  await expect(review.getByRole("link", { name: "Open Review" })).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
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
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
  await expect(page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Accounts are not available" })).toBeVisible();
  await page.getByRole("link", { name: "Continue as a guest" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Practice · Question 1 of 8");
  expect(seriousBrowserErrors).toEqual([]);
});
