import { expect, test } from "./fixtures/test";
import { QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";

const hub = "/subjects/higher-maths";

test("Subjects remains a restrained catalogue with one usable Higher Maths course", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/subjects");
  const catalogue = page.getByTestId("qualification-course-list");
  await expect(catalogue.getByRole("heading", { name: "Higher", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Higher Maths" })).toBeVisible();
  await expect(page.getByTestId("subject-card-higher-physics")).toHaveCount(0);
  await expect(page.getByText(/% complete|skills complete|skills available|coming soon/i)).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

test("Course Hub presents four curriculum strands without exposing implementation coverage", async ({ page }) => {
  await page.goto(hub);
  const strands = page.getByRole("navigation", { name: "Course strands" });
  await expect(strands.getByRole("button", { name: "Algebra and Trigonometry", exact: true })).toBeVisible();
  await expect(strands.getByRole("button", { name: "Vectors", exact: true })).toBeVisible();
  await expect(strands.getByRole("button", { name: "Calculus", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(strands.getByRole("button", { name: "Lines, Circles and Sequences", exact: true })).toBeVisible();
  await expect(page.getByText(/skills available|\d+ available|coming soon/i)).toHaveCount(0);
  await expect(page.locator('a[href="/subjects/higher-maths/course-tracker"]')).toHaveCount(1);
  await expect(page.getByText(/0%|complete.*strand|strand.*complete/i)).toHaveCount(0);
});

test("Course units expose actionable skills and use a restrained empty state for other strands", async ({ page }) => {
  await page.goto(hub);
  const calculus = page.getByTestId("roadmap-strand-calculus");
  const activities = calculus.getByRole("list", { name: "Calculus learning activities" });
  await expect(activities.getByRole("listitem")).toHaveCount(2);
  await expect(activities.getByRole("link", { name: /Basic differentiation/ })).toBeVisible();
  await expect(activities.getByRole("link", { name: /Chain rule/ })).toBeVisible();
  await expect(calculus.getByText("Trigonometric differentiation", { exact: true })).toHaveCount(0);

  await page.getByRole("navigation", { name: "Course strands" }).getByRole("button", { name: "Algebra and Trigonometry", exact: true }).click();
  const algebra = page.getByTestId("roadmap-strand-algebra-and-trigonometry");
  await expect(algebra.getByRole("status")).toHaveText("This area has no learning activities to show right now.");
  await expect(algebra.getByRole("list")).toHaveCount(0);
  await expect(algebra.getByText("Factorising cubics and quartics", { exact: true })).toHaveCount(0);
});

test("Course Actions are one neutral navigation family while Review state remains semantic", async ({ page }) => {
  await page.goto(hub);
  const destinations = page.getByTestId("higher-maths-destinations");
  const neutralCards = [
    page.getByTestId("practice-destination"),
    page.getByTestId("question-bank-destination"),
    page.getByTestId("review-entry-card"),
    page.getByTestId("course-tracker-destination"),
    page.getByTestId("past-papers-destination"),
  ];
  await expect(destinations.getByRole("link")).toHaveCount(5);
  const neutralBackgrounds = await Promise.all(neutralCards.map((card) => card.evaluate((element) => getComputedStyle(element).backgroundColor)));
  expect(new Set(neutralBackgrounds).size).toBe(1);
  await expect(page.getByTestId("practice-destination")).not.toHaveAttribute("data-emphasis");
  await expect(page.getByTestId("course-tracker-destination")).not.toHaveAttribute("data-emphasis");
  const defaultTextColours = await Promise.all([
    page.getByTestId("practice-destination"),
    page.getByTestId("question-bank-destination"),
    page.getByTestId("course-tracker-destination"),
    page.getByTestId("past-papers-destination"),
  ].map((card) => card.evaluate((element) => getComputedStyle(element).color)));
  expect(new Set(defaultTextColours).size).toBe(1);

  const upToDate = page.getByTestId("review-entry-card");
  await expect(upToDate).toHaveAttribute("data-review-state", "up-to-date");
  await expect(upToDate).toHaveAccessibleName("Review, up to date");
  const upToDateBackground = await upToDate.evaluate((element) => getComputedStyle(element).backgroundColor);
  const upToDateDetailColour = await upToDate.getByText("Up to date").evaluate((element) => getComputedStyle(element).color);

  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(hub);
  const due = page.getByTestId("review-entry-card");
  await expect(due).toHaveAttribute("data-review-state", "due");
  await expect(due).toHaveAccessibleName("Review, 1 skill due");
  await expect(due).toHaveCSS("background-color", upToDateBackground);
  const dueDetailColour = await due.getByText("1 skill due").evaluate((element) => getComputedStyle(element).color);
  expect(dueDetailColour).not.toBe(upToDateDetailColour);
});

test("Continue Learning remains structurally primary above Course Actions and exploration", async ({ page }) => {
  await page.goto(hub);
  const learning = await page.getByTestId("working-context-hub").boundingBox();
  const actions = await page.getByTestId("higher-maths-destinations").boundingBox();
  const units = await page.getByRole("heading", { name: "Course units" }).boundingBox();
  expect(learning).not.toBeNull();
  expect(actions).not.toBeNull();
  expect(units).not.toBeNull();
  expect(learning!.y).toBeLessThan(actions!.y);
  expect(actions!.y).toBeLessThan(units!.y);
  await expect(page.getByTestId("working-context-hub").getByRole("link", { name: "Start", exact: true })).toBeVisible();
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
    await expect(roadmap.getByRole("list", { name: "Calculus learning activities" }).getByRole("listitem")).toHaveCount(2);
  });
}
