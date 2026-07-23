import { test, expect } from "./fixtures/test";

test("question context and navigation derive from canonical ownership", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
  await breadcrumb.getByText("More context").click();
  await expect(breadcrumb.getByRole("link", { name: "Calculus" })).toHaveAttribute("href", "/subjects/higher-maths/calculus");
  await expect(breadcrumb.getByRole("link", { name: "Differentiating functions" })).toHaveAttribute("href", "/subjects/higher-maths/calculus/differentiation");
  await expect(breadcrumb).toContainText("Basic differentiation");
  await expect(page.getByTestId("stage-question-position")).toHaveText("Question 1 of 3 in Foundations");
  await expect(page.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/subjects/higher-maths/calculus/differentiation/basic-differentiation");

  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("next-question-action")).toHaveAttribute("href", "/question/hm-calc-diff-basic-f-002");
});

test("question bank leads with available questions and keeps future taxonomy secondary", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page.getByRole("heading", { name: "8 questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  await page.getByText("Filter and sort", { exact: true }).click();
  const search = page.getByRole("textbox", { name: "Search available questions" });
  await search.fill("evaluate");
  await expect(page.getByRole("link", { name: "Open Evaluate a derivative" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toHaveCount(0);
  await search.fill("no such curriculum item");
  await expect(page.getByText("No questions match these filters")).toBeVisible();
  await expect(page.getByText("Future Higher Maths paths (50)", { exact: true })).toBeVisible();
});

test("a planned path does not resolve to an empty learning workspace", async ({ page }) => {
  const response = await page.goto("/subjects/higher-maths/calculus/integration/basic-integration");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
});
