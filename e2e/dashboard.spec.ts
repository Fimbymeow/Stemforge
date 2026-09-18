import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("Dashboard context surface spans the workspace even beyond the content measure", async ({ page }) => {
  for (const width of [2200, 1440, 1024, 390, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard");
    const bar = page.getByTestId("workspace-context-bar");
    await expect(bar).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const box = (await bar.boundingBox())!;
    expect(box.x).toBe(width >= 1024 ? 240 : 0);
    expect(box.x + box.width).toBe(width);
    await expectNoHorizontalOverflow(page);
  }
});

test("Dashboard action motion is tactile and disabled for reduced motion", async ({ page }) => {
  await page.goto("/dashboard");
  const action = page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Start learning" });
  const arrow = action.locator("svg");
  const background = await action.evaluate((element) => getComputedStyle(element).backgroundColor);
  await action.hover();
  await expect.poll(() => arrow.evaluate((element) => getComputedStyle(element).transform)).toBe("matrix(1, 0, 0, 1, 2, 0)");
  expect(await action.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(background);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(arrow).toHaveCSS("transform", "none");
  await expect(action).toHaveCSS("transition-duration", "0s");
  await expect(arrow).toHaveCSS("transition-duration", "0s");
  await action.focus();
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("guest learner dashboard hydrates without errors and presents calm course access", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  const summary = page.getByTestId("dashboard-progress-summary");
  await expect(summary.getByText("Recommended next")).toHaveCount(0);
  await expect(summary.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(summary).toContainText("Basic differentiation");
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0/3 complete");
  const pathway = summary.getByRole("list", { name: "Learning pathway" });
  await expect(pathway.getByRole("listitem", { name: "Foundations: current" })).toHaveAttribute("aria-current", "step");
  await expect(pathway.getByRole("listitem", { name: "Applications: not complete" })).toBeVisible();
  await expect(pathway.getByRole("listitem").filter({ hasText: /^Notes$/ })).not.toHaveAttribute("aria-current", "step");
  await expect(pathway).not.toContainText("✓");
  await expect(page.getByTestId("dashboard-course-progress")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-per-skill-progress")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-weekly-activity")).toHaveCount(0);
  await expect(page.getByText("Saved on this browser")).toHaveCount(0);
  await expect(page.getByTestId("sidebar-course-context")).toHaveCount(0);
  await expect(page.getByRole("complementary").getByText("Current path", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Course progress" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Needs work" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Secure and mastered" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Quick links" })).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Practise your way" })).toHaveAttribute("href", "/practice");
  const course = page.getByTestId("dashboard-courses").getByRole("link", { name: "Open Higher Maths" });
  await expect(course).toContainText("0 of 2 skills learned");
  await expect(course).toContainText("Up to date");
  await expect(page.getByRole("link", { name: "Higher Maths course hub" })).toHaveAttribute("href", "/subjects/higher-maths");
  await expect(page.getByRole("link", { name: "Higher Maths course tracker" })).toHaveAttribute("href", "/subjects/higher-maths/course-tracker");
  await expect(page.getByTestId("dashboard-review-summary")).toHaveCount(0);
  await expect(page.getByText("Needs attention", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("dashboard updates from stored evidence with compact course context and a resume action", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong", attemptedAt: "2026-07-16T10:00:00.000Z" }),
    currentAttempt(QUESTION_IDS[1], 2, { isCorrect: true, attemptedAt: "2026-07-16T10:05:00.000Z" }),
  ]));

  await page.goto("/dashboard");

  const summary = page.getByTestId("dashboard-progress-summary");
  await expect(summary).not.toContainText("Combined progress across the Higher Maths skills available now");
  await expect(summary.getByRole("link", { name: "Resume question" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(summary).toContainText("Basic differentiation");
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 1/3 complete");
  await expect(page.getByTestId("dashboard-course-progress")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-per-skill-progress")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("dashboard keeps weekly activity out of the primary recommendation", async ({ page }) => {
  const today = new Date().toISOString();
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: true, attemptedAt: today }),
  ]));

  await page.goto("/dashboard");

  await expect(page.getByTestId("dashboard-weekly-activity")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary")).not.toContainText("active day");
  await expect(page.getByRole("heading", { name: "Weekly activity" })).toHaveCount(0);
});

test("Design V2 keeps continuation first and course access usable at each target viewport", async ({ page, seriousBrowserErrors }) => {
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1024, height: 900 },
    { width: 390, height: 812 }, { width: 375, height: 812 }, { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    const continuation = page.getByTestId("dashboard-progress-summary");
    const courses = page.getByTestId("dashboard-courses-section");
    const activity = page.getByTestId("dashboard-activity-summary");
    await expect(continuation.getByRole("link", { name: "Start learning" })).toBeVisible();
    await expect(courses.getByRole("link", { name: "Open Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
    await expect(courses.getByRole("progressbar")).toHaveCount(0);
    const boxes = await Promise.all([continuation, courses, activity].map((element) => element.boundingBox()));
    expect(boxes[0]!.y + boxes[0]!.height).toBeLessThanOrEqual(boxes[1]!.y);
    expect(boxes[1]!.y + boxes[1]!.height).toBeLessThanOrEqual(boxes[2]!.y);
    if (viewport.width < 640) {
      const feedback = page.getByRole("button", { name: "Send feedback", exact: true });
      await expect(feedback).toBeVisible();
      expect((await feedback.boundingBox())!.y).toBeGreaterThanOrEqual(boxes[2]!.y + boxes[2]!.height);
    }
    await expectNoHorizontalOverflow(page);
  }
  expect(seriousBrowserErrors).toEqual([]);
});
