import { test, expect } from "./fixtures/test";

test("Higher Maths hub presents four broad areas and prioritises the live path", async ({ page }) => {
  await page.goto("/subjects/higher-maths");
  await expect(page.getByRole("heading", { level: 1, name: "Higher Maths" })).toBeVisible();
  await expect(page.getByText("Calculus is partially available now. More Higher Maths areas are being added.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Algebra and Trigonometry" }).last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Vectors" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Calculus" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lines, Circles and Sequences" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start", exact: true })).toHaveAttribute("href", "/question/hm-calc-diff-basic-f-001");
  await expect(page.getByText(/1 of 51|1 \/ 51|1 of 50|1 \/ 50/i)).toHaveCount(0);
});

test("generic course and spec-area hubs distinguish published and planned coverage", async ({ page }) => {
  await page.goto("/subjects/higher-maths/calculus");
  await expect(page.getByRole("heading", { level: 1, name: "Calculus" })).toBeVisible();
  await expect(page.getByText("Partially available", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Higher Maths");
  await expect(page.getByRole("link", { name: /Differentiation/ })).toBeVisible();

  await page.goto("/subjects/higher-maths/algebra-and-trigonometry");
  await expect(page.getByRole("heading", { level: 1, name: "Algebra and Trigonometry" })).toBeVisible();
  await expect(page.getByText("Planned coverage", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("0% Complete")).toHaveCount(0);

  await page.goto("/subjects/higher-maths/algebra-and-trigonometry/polynomials");
  await expect(page.getByRole("heading", { level: 1, name: "Polynomials" })).toBeVisible();
  await expect(page.getByText("No questions or learning resources are published here yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Factorising cubics and quartics" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Algebra and Trigonometry");
  await expect(page.getByRole("link", { name: /Practise/ })).toHaveCount(0);
});

test("planned paths have no learning workspace while existing deep links remain live", async ({ page }) => {
  const planned = await page.goto("/subjects/higher-maths/calculus/integration/basic-integration");
  expect(planned?.status()).toBe(404);
  const live = await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  expect(live?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Basic differentiation" })).toBeVisible();
});

test("Question Bank keeps active questions usable and groups future coverage broadly", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page.getByRole("heading", { name: "8 matching questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  await page.getByText("Future Higher Maths coverage", { exact: true }).click();
  await expect(page.getByText("Algebra and Trigonometry", { exact: true })).toBeVisible();
  await expect(page.getByText("Vectors", { exact: true })).toBeVisible();
  await expect(page.getByRole("strong").filter({ hasText: /^Calculus$/ })).toBeVisible();
  await expect(page.getByText("Lines, Circles and Sequences", { exact: true })).toBeVisible();
  await expect(page.getByText(/Polynomials/)).toBeVisible();
  await expect(page.getByText("Factorising cubics and quartics", { exact: true })).toHaveCount(0);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 568 },
]) {
  test(`course architecture has no document overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of [
      "/subjects/higher-maths",
      "/subjects/higher-maths/calculus",
      "/subjects/higher-maths/algebra-and-trigonometry/polynomials",
      "/subjects/higher-maths/question-bank",
      "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        `${route} should not overflow at ${viewport.width}px`,
      ).toBe(0);
    }
  });
}
