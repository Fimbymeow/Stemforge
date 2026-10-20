import { test, expect } from "./fixtures/test";

test("Higher Maths hub prioritises the live path and links to the full course structure", async ({ page }) => {
  await page.goto("/subjects/higher-maths");
  await expect(page.getByRole("heading", { level: 1, name: "Higher Maths" })).toBeVisible();
  await expect(page.getByText(/practise each skill in one continuous sequence/)).toBeVisible();
  const trackerLink = page.getByTestId("course-tracker-destination");
  await expect(trackerLink).toHaveAttribute("href", "/subjects/higher-maths/course-tracker");
  await expect(trackerLink).not.toHaveAttribute("data-emphasis");
  await expect(page.getByTestId("practice-destination")).not.toHaveAttribute("data-emphasis");
  await expect(page.locator('a[href="/subjects/higher-maths/course-tracker"]')).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Course strands" }).getByRole("button", { name: "Calculus", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("link", { name: "Start", exact: true })).toHaveAttribute("href", "/subjects/higher-maths/revision-notes?path=basic-differentiation");
  await expect(page.getByText(/1 of 51|1 \/ 51|1 of 50|1 \/ 50/i)).toHaveCount(0);
  await expect(page.getByText(/skills available|coming soon/i)).toHaveCount(0);
  await expect(page.locator('a[href="/subjects/higher-maths/calculus"]')).toHaveCount(0);
  await expect(page.getByTestId("roadmap-skill-basic-differentiation").getByRole("link", { name: "Basic differentiation" })).toHaveAttribute(
    "href",
    "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
  );

  await trackerLink.click();
  await expect(page).toHaveURL("/subjects/higher-maths/course-tracker");
  for (const area of ["Algebra and Trigonometry", "Vectors", "Calculus", "Lines, Circles and Sequences"]) await expect(page.getByTestId("course-tracker-unit-navigation").getByRole("button", { name: area })).toBeVisible();
});

test("legacy Higher Maths area and spec-area URLs return to the course with area context", async ({ page }) => {
  await page.goto("/subjects/higher-maths/calculus");
  await expect(page).toHaveURL("/subjects/higher-maths#course-area-calculus");
  await expect(page.getByRole("heading", { level: 1, name: "Higher Maths" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Calculus", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("Partially available", { exact: true })).toHaveCount(0);

  await page.goto("/subjects/higher-maths/algebra-and-trigonometry/polynomials");
  await expect(page).toHaveURL("/subjects/higher-maths#course-area-algebra-and-trigonometry");
  await expect(page.getByRole("button", { name: "Algebra and Trigonometry", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("heading", { level: 1, name: "Polynomials" })).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "72 matching questions" })).toBeVisible();
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
