import { expect, test } from "./fixtures/test";

test("resources, topbar controls and app landmarks are functionally honest", async ({ page }) => {
  await page.goto("/resources");
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/formula-cards$/);
  await expect(page.getByRole("heading", { name: "Higher Maths Formula Cards", level: 1 })).toBeVisible();

  await page.goto("/question/demo");
  const formulaLinks = page.getByRole("link", { name: "Formula Sheet" });
  await expect(formulaLinks).toHaveCount(2);
  await expect(page.locator('a[href="/subjects/higher-maths/formula-cards"]').filter({ hasText: "Formula Sheet" })).toHaveCount(2);
  await formulaLinks.first().focus();
  await expect(formulaLinks.first()).toBeFocused();

  for (const route of [
    "/subjects",
    "/subjects/higher-maths",
    "/subjects/higher-maths/question-bank",
    "/subjects/higher-maths/formula-cards",
    "/dashboard",
    "/practice",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByLabel("Notifications")).toHaveCount(0);
    await expect(page.getByLabel("Profile preview")).toHaveCount(0);
  }
});

test("fresh dashboard and single-path practice omit meaningless zero-value choices", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("No activity in the last 7 days")).toBeVisible();
  await expect(page.getByText("Milestones", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Days", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Attempts", { exact: true })).toHaveCount(0);

  await page.goto("/practice");
  await expect(page.getByRole("combobox", { name: "Course" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Path" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Mixed practice/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Needs-work practice/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Retry incorrect/ })).toBeDisabled();
  const targeted = page.getByRole("button", { name: /Targeted practice/ });
  await targeted.focus();
  await expect(targeted).toBeFocused();
});
