import { test, expect } from "./fixtures/test";
import { QUESTION_IDS } from "./fixtures/progress";
import { openQuestion } from "./fixtures/student-actions";

for (const width of [1440, 1024, 390, 375, 320]) {
  test(`V2 learner surfaces remain readable and overflow-free at ${width}px`, async ({ page, seriousBrowserErrors }) => {
    await page.setViewportSize({ width, height: width < 400 ? 812 : 900 });
    for (const [route, title] of [["/practice/test", "Build a Test"], ["/subjects/higher-maths/past-papers", "Past Papers"], ["/practice?review=1", "Review what is due"]]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
    await expect(page.getByTestId("review-launch-card")).toContainText("Nothing is due right now");
    const next = page.getByRole("link", { name: "Continue learning", exact: true });
    await next.focus();
    await expect(next).toBeFocused();
    await openQuestion(page, QUESTION_IDS[0]);
    await expect(page.getByTestId("question-completion-status")).toHaveText("This question has not yet been completed.");
    await expect(page.getByLabel("Your answer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Answer" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    expect(seriousBrowserErrors).toEqual([]);
  });
}

test("V2 answer action stays still and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openQuestion(page, QUESTION_IDS[0]);
  const submit = page.getByRole("button", { name: "Submit Answer" });
  await submit.focus();
  await expect(submit).toBeFocused();
  await submit.hover();
  await expect(submit).toHaveCSS("transform", "none");
  await expect(submit).toHaveCSS("transition-duration", "0s");
});
