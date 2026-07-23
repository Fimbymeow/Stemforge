import { expect, test } from "./fixtures/test";

test("resources, topbar controls and app landmarks are functionally honest", async ({ page }) => {
  await page.goto("/resources");
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes$/);
  await expect(page.getByRole("heading", { name: "Higher Maths Notes", level: 1 })).toBeVisible();

  await page.goto("/question/demo");
  await expect(page.getByRole("button", { name: "Formula sheet" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Formula Sheet" })).toHaveCount(0);

  for (const route of [
    "/subjects",
    "/subjects/higher-maths",
    "/subjects/higher-maths/question-bank",
    "/subjects/higher-maths/revision-notes",
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
  await expect(page.getByText("No activity in the last 7 days")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Course progress" })).toHaveCount(0);
  await expect(page.getByText("Milestones", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Days", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Attempts", { exact: true })).toHaveCount(0);

  await page.goto("/practice");
  await expect(page.getByRole("combobox", { name: "Course" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Path" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Mixed practice/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Needs Review/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Retry incorrect/ })).toHaveCount(0);
  await expect(page.getByLabel("Requested questions")).not.toBeVisible();
  const quick = page.getByTestId("quick-practice-action");
  await quick.focus();
  await expect(quick).toBeFocused();
});
