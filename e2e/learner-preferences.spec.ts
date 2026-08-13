import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const preferenceKey = "orthic.learnerPreferences.v1";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), preferenceKey);
});

test("new guest can save an optional first name without Dashboard focus theft", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  const prompt = page.getByTestId("learner-name-prompt");
  const input = prompt.getByRole("textbox", { name: "What should we call you?" });
  await expect(prompt).toBeVisible();
  await expect(input).not.toBeFocused();
  await expect(page.getByRole("link", { name: "Open Higher Maths" })).toBeVisible();

  await input.fill("  Finlay  ");
  await prompt.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Finlay" })).toBeVisible();
  await expect(prompt).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back, Finlay" })).toBeVisible();
  await expect(page.getByTestId("learner-name-prompt")).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

test("Skip is persistent, non-blocking and retains the generic greeting", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("learner-name-prompt").getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start learning" })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("learner-name-prompt")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
});

test("course presentation resolves from learner data and remains mobile-safe", async ({ page }) => {
  await page.evaluate(({ key }) => window.localStorage.setItem(key, JSON.stringify({
    version: 1,
    firstName: "Ada",
    namePromptDismissed: true,
    selectedCourseSlugs: ["higher-maths", "higher-physics"],
  })), { key: preferenceKey });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome back, Ada" })).toBeVisible();
  await expect(page.getByTestId("dashboard-courses").getByRole("link", { name: "Open Higher Maths" })).toBeVisible();
  await expect(page.getByTestId("dashboard-courses").getByText("Higher Physics")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
