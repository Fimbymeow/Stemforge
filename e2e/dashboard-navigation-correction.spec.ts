import { expect, test } from "./fixtures/test";
import { QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 720, height: 450 }, // 1440×900 at a 200% CSS-pixel equivalent.
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 568 },
] as const;

test("revised dashboard and subject access remain distinct, ordered and overflow-free", async ({ page, seriousBrowserErrors }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const route of ["/dashboard", "/subjects"]) {
      await page.goto(route);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      const courseAccess = page.getByRole("link", { name: "Open Higher Maths", exact: true });
      await expect(courseAccess).toBeVisible();
      await expect(courseAccess).toHaveAttribute("href", "/subjects/higher-maths");

      if (route === "/dashboard") {
        const learn = page.getByTestId("dashboard-progress-summary");
        await expect(learn.getByText("Recommended next")).toHaveCount(0);
        await expect(learn.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
      } else {
        await expect(page.getByRole("link", { name: /^(Start learning|Continue|Resume question|Resume practice|Review \d+)/ })).toHaveCount(0);
      }
      await expectNoHorizontalOverflow(page);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const primary = page.getByRole("link", { name: "Start learning", exact: true });
  await primary.focus();
  await expect(primary).toBeFocused();
  expect(seriousBrowserErrors).toEqual([]);
});

test("Subjects presents a qualification-grouped course list without learner recommendations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/subjects");
  const group = page.getByTestId("qualification-group-higher");
  await expect(group.getByRole("heading", { name: "Higher", level: 2 })).toBeVisible();
  const maths = page.getByTestId("subject-card-higher-maths");
  const physics = page.getByTestId("subject-card-higher-physics");
  const [mathsBox, physicsBox] = await Promise.all([maths.boundingBox(), physics.boundingBox()]);
  expect(mathsBox).not.toBeNull();
  expect(physicsBox).not.toBeNull();
  expect(mathsBox!.y).toBeLessThan(physicsBox!.y);
  expect(Math.abs(mathsBox!.width - physicsBox!.width)).toBeLessThan(2);
  await expect(maths).toContainText("2 of 49 skills available");
  await expect(maths).toContainText("Available now");
  await expect(physics.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(physics.getByRole("link")).toHaveCount(0);
  await expect(page.getByTestId("qualification-group-national-5")).toHaveCount(0);
  await expect(page.getByTestId("qualification-group-advanced-higher")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Resume practice|Review \d+/ })).toHaveCount(0);
});

test("review and active-practice recommendations never replace course access at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: index === 0 })),
  ));
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Practise 1 question again", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const sessionPath = new URL(page.url()).pathname;

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toBeVisible();
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Resume practice", exact: true })).toHaveAttribute("href", sessionPath);
  await expectNoHorizontalOverflow(page);

  await page.goto("/subjects");
  await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Resume practice", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Review \d+/ })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
