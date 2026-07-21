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

test("question bank exposes ordered specification strands and pure query states", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  const headings = [
    "Differentiating functions",
    "Using differentiation to investigate the nature and properties of functions",
    "Integrating functions",
    "Using integration to calculate definite integrals",
    "Applying differential calculus",
    "Applying integral calculus",
  ];
  for (const heading of headings) await expect(page.getByText(heading, { exact: true })).toBeVisible();

  const search = page.getByRole("textbox", { name: "Search question bank" });
  await search.fill("definite integrals");
  await expect(page.getByText("Definite integrals", { exact: true })).toBeVisible();
  await expect(page.getByText("Differentiating functions", { exact: true })).toHaveCount(0);
  await search.fill("no such curriculum item");
  await expect(page.getByText("No topics match the current search and filter.")).toBeVisible();
});

test("a planned path resolves through the generic route without exposing fake questions", async ({ page }) => {
  await page.goto("/subjects/higher-maths/calculus/integration/basic-integration");
  await expect(page.getByRole("heading", { level: 1, name: "Basic integration" })).toBeVisible();
  await expect(page.getByText("Reviewed questions are being prepared", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Integrating functions", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Basic differentiation" })).toHaveAttribute(
    "href",
    "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
  );
  await expect(page.getByRole("link", { name: /question/i })).toHaveCount(0);
});
