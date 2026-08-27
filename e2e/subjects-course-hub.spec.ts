import { expect, test } from "./fixtures/test";
import { QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";

const hub = "/subjects/higher-maths";

test("Subjects remains a restrained catalogue with one usable Higher Maths course", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/subjects");
  const catalogue = page.getByTestId("qualification-course-list");
  await expect(catalogue.getByRole("heading", { name: "Higher", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Higher Maths" })).toBeVisible();
  await expect(page.getByTestId("subject-card-higher-physics")).toHaveCount(0);
  await expect(page.getByText(/% complete|skills complete/i)).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

test("Course Hub exposes strand availability before selection and only one Course Tracker link", async ({ page }) => {
  await page.goto(hub);
  const strands = page.getByRole("navigation", { name: "Course strands" });
  await expect(strands.getByRole("button", { name: /Algebra and Trigonometry.*Coming soon/ })).toBeVisible();
  await expect(strands.getByRole("button", { name: /Vectors.*Coming soon/ })).toBeVisible();
  await expect(strands.getByRole("button", { name: /Calculus.*2 available/ })).toHaveAttribute("aria-current", "true");
  await expect(strands.getByRole("button", { name: /Lines, Circles and Sequences.*Coming soon/ })).toBeVisible();
  await expect(page.locator('a[href="/subjects/higher-maths/course-tracker"]')).toHaveCount(1);
  await expect(page.getByText(/0%|complete.*strand|strand.*complete/i)).toHaveCount(0);
});

test("roadmap caps the unavailable tail, preserves order and reveals the remainder natively", async ({ page }) => {
  await page.goto(hub);
  const calculus = page.getByTestId("roadmap-strand-calculus");
  const preview = calculus.getByRole("list", { name: "Calculus skill preview" });
  await expect(preview.getByRole("listitem")).toHaveCount(5);
  await expect(preview.getByRole("listitem").nth(0)).toContainText("Basic differentiation");
  await expect(preview.getByRole("listitem").nth(1)).toContainText("Chain rule");
  await expect(preview.getByRole("listitem").nth(2)).toContainText("Trigonometric differentiation");
  await expect(preview.locator('[data-availability="available"]')).toHaveCount(2);
  await expect(preview.locator('[data-availability="coming-soon"]')).toHaveCount(3);
  await expect(preview.locator('[data-availability="coming-soon"] a')).toHaveCount(0);

  const disclosure = page.getByTestId("roadmap-more-calculus");
  const summary = disclosure.locator("summary");
  await expect(summary).toHaveText("+12 more coming soon");
  await summary.focus();
  await summary.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.getByRole("list", { name: "Calculus remaining planned skills" }).getByRole("listitem")).toHaveCount(12);

  await page.getByRole("navigation", { name: "Course strands" }).getByRole("button", { name: /Algebra and Trigonometry/ }).click();
  const algebra = page.getByTestId("roadmap-strand-algebra-and-trigonometry");
  await expect(algebra.getByRole("list", { name: "Algebra and Trigonometry skill preview" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByTestId("roadmap-more-algebra-and-trigonometry").locator("summary")).toHaveText("+14 more coming soon");
});

test("Review uses a calm distinct state only when review is genuinely due", async ({ page }) => {
  await page.goto(hub);
  const upToDate = page.getByTestId("review-entry-card");
  await expect(upToDate).toHaveAttribute("data-review-state", "up-to-date");
  await expect(upToDate).toHaveAccessibleName("Review, up to date");
  const upToDateBackground = await upToDate.evaluate((element) => getComputedStyle(element).backgroundColor);

  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(hub);
  const due = page.getByTestId("review-entry-card");
  await expect(due).toHaveAttribute("data-review-state", "due");
  await expect(due).toHaveAccessibleName("Review, 1 skill due");
  await expect(due).not.toHaveCSS("background-color", upToDateBackground);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 760 },
]) {
  test(`Subjects and Course Hub remain compact and overflow-free at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of ["/subjects", hub]) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
    const roadmap = page.getByTestId("roadmap-strand-calculus");
    await expect(roadmap.getByRole("list", { name: "Calculus skill preview" }).getByRole("listitem")).toHaveCount(5);
    await expect(page.getByTestId("roadmap-more-calculus").locator("summary")).toBeVisible();
  });
}
