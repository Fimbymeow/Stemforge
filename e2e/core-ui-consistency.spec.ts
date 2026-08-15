import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("Courses presents only usable course access without roadmap placeholders", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/subjects");
  const catalogue = page.getByTestId("qualification-course-list");
  await expect(catalogue.getByRole("heading", { name: "Higher", level: 2 })).toBeVisible();
  await expect(catalogue.getByText("National 5", { exact: true })).toHaveCount(0);
  await expect(catalogue.getByText("Advanced Higher", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Higher Maths" })).toContainText("Structured notes, practice and Review");
  await expect(page.getByTestId("subject-card-higher-physics")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("Dashboard Activity is a compact summary below course access", async ({ page }) => {
  await page.goto("/dashboard");
  const courses = await page.getByTestId("dashboard-courses").boundingBox();
  const activity = page.getByTestId("dashboard-activity-summary");
  const activityBox = await activity.boundingBox();
  expect(courses).not.toBeNull();
  expect(activityBox).not.toBeNull();
  expect(activityBox!.y).toBeGreaterThanOrEqual(courses!.y + courses!.height);
  await expect(activity.getByRole("link", { name: "View full activity history" })).toHaveAttribute("href", "/activity");
  await expect(activity.getByTestId("dashboard-activity-strip").locator("[data-intensity]")).toHaveCount(14);
  const content = await activity.getByTestId("dashboard-activity-content").boundingBox();
  expect(content).not.toBeNull();
  expect(content!.width).toBeLessThan(activityBox!.width);
});

test("Practice and Review use solid restrained setup surfaces", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practise Higher Maths" })).toBeVisible();
  expect(await page.getByTestId("practice-quick-card").evaluate((card) => getComputedStyle(card).backgroundImage)).toBe("none");

  await page.goto("/practice?review=1");
  await expect(page.getByRole("heading", { name: "Review what is due" })).toBeVisible();
  expect(await page.getByTestId("review-launch-card").evaluate((card) => getComputedStyle(card).backgroundImage)).toBe("none");
});

test("Course Tracker has restrained primary and contextual Hub access", async ({ page }) => {
  await page.goto("/subjects/higher-maths");
  await expect(page.getByTestId("practice-destination")).toHaveAttribute("data-emphasis", "true");
  await expect(page.getByTestId("course-tracker-destination")).toHaveAttribute("data-emphasis", "true");
  await expect(page.getByTestId("course-tracker-context-link")).toHaveAttribute("href", "/subjects/higher-maths/course-tracker");
  await expect(page.getByTestId("higher-maths-destinations").getByRole("link")).toHaveCount(5);
  await expect(page.getByTestId("review-entry-card")).toBeVisible();
});

for (const width of [390, 320]) {
  test(`touched learner surfaces remain overflow-free at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const route of ["/subjects", "/dashboard", "/practice", "/practice?review=1", "/subjects/higher-maths"]) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
    }
  });
}
