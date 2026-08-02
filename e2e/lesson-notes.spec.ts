import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const NOTES_ROUTE = "/subjects/higher-maths/revision-notes";

test("Basic Differentiation renders as one continuous native lesson with meaningful sections", async ({ page, seriousBrowserErrors }) => {
  await page.goto(NOTES_ROUTE);
  const lesson = page.getByTestId("lesson-document");
  await expect(lesson).toBeVisible();
  await expect(lesson).toHaveAttribute("data-lesson-id", "basic-differentiation-lesson");
  await expect(lesson.getByRole("heading", { level: 1, name: "Basic differentiation" })).toBeVisible();
  await expect(lesson.getByRole("heading", { name: "What differentiation does" })).toBeVisible();
  await expect(lesson.getByRole("heading", { name: "The power rule" })).toBeVisible();
  await expect(lesson.getByRole("heading", { name: "Gradient at a point", exact: true })).toBeVisible();
  await expect(lesson.getByRole("navigation", { name: "Lesson sections" }).first()).toBeVisible();
  await expect(lesson.locator('[data-callout-family="core"]')).not.toHaveCount(0);
  await expect(lesson.locator('[data-callout-family="caution"]')).not.toHaveCount(0);
  await expect(lesson.getByText("Exam tip", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("notes-practice")).toHaveCount(0);
  await expect(page.getByText(/Future Higher Maths notes/)).toHaveCount(0);
  await expect(lesson.locator("article")).toHaveCount(0);
  await expect(page.getByTestId("lesson-block-diagnostic")).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

test("worked examples show every step and final answer without reveal controls", async ({ page }) => {
  await page.goto(NOTES_ROUTE);
  const example = page.locator("#basic-diff-example-polynomial");
  await expect(example.getByText("Differentiate a polynomial", { exact: true })).toBeVisible();
  const steps = example.getByRole("list", { name: "Worked solution steps" }).getByRole("listitem");
  await expect(steps).toHaveCount(3);
  await expect(example.getByText("Final answer", { exact: true })).toBeVisible();
  await expect(page.getByTestId("lesson-worked-example")).toHaveCount(3);
  await expect(page.getByTestId("static-worked-solution")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Show (next step|full solution)/ })).toHaveCount(0);
});

test("self-check is optional and Continue to Foundations is never gated", async ({ page }) => {
  await page.goto(NOTES_ROUTE);
  const continueLink = page.getByRole("link", { name: "Continue to Foundations" });
  await expect(continueLink).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  const selfCheck = page.getByTestId("lesson-self-check");
  await expect(selfCheck).not.toHaveAttribute("open", "");
  await selfCheck.locator("summary").click();
  await expect(selfCheck).toHaveAttribute("open", "");
  await expect(selfCheck.getByText("Answer", { exact: true })).toBeVisible();
  await expect(continueLink).toBeVisible();
});

test("lesson continuation follows completed stages and due Review", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.slice(0, 3).map((id, index) => currentAttempt(id, index + 1)),
  ));
  await page.goto(NOTES_ROUTE);
  await expect(page.getByRole("link", { name: "Continue to Applications" })).toHaveAttribute("href", `/question/${QUESTION_IDS[3]}`);

  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.slice(0, 6).map((id, index) => currentAttempt(id, index + 1)),
  ));
  await page.goto(NOTES_ROUTE);
  await expect(page.getByRole("link", { name: "Continue to Exam practice" })).toHaveAttribute("href", `/question/${QUESTION_IDS[6]}`);

  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1)),
  ));
  await page.goto(NOTES_ROUTE);
  await expect(page.getByRole("link", { name: "Start Review" })).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
});

for (const anchor of [
  "basic-diff-note-what-differentiation-does",
  "basic-diff-note-power-rule",
  "basic-diff-note-constants-sums",
  "basic-diff-note-evaluating-derivative",
  "basic-diff-formula-power-rule",
  "basic-diff-example-polynomial",
]) {
  test(`legacy Notes anchor ${anchor} resolves to visible lesson content`, async ({ page }) => {
    await page.goto(`${NOTES_ROUTE}#${anchor}`);
    const target = page.locator(`#${anchor}`);
    await expect(target).toBeVisible();
    await expect.poll(() => target.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(-2);
    await expect.poll(() => target.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(page.viewportSize()!.height);
  });
}

test("section and disclosure controls are keyboard accessible", async ({ page }) => {
  await page.goto(NOTES_ROUTE);
  const sectionLink = page.getByRole("navigation", { name: "Lesson sections" }).first().getByRole("link", { name: "The power rule" });
  await sectionLink.focus();
  await expect(sectionLink).toBeFocused();
  await sectionLink.press("Enter");
  await expect(page).toHaveURL(/#basic-diff-note-power-rule$/);
  const summary = page.getByTestId("lesson-self-check").locator("summary");
  await summary.focus();
  await expect(summary).toBeFocused();
  await summary.press("Space");
  await expect(page.getByTestId("lesson-self-check")).toHaveAttribute("open", "");
});

test("lesson is mobile-safe, reduced-motion-safe and print exposes collapsed content", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(NOTES_ROUTE);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  const selfCheck = page.getByTestId("lesson-self-check");
  await expect(selfCheck).not.toHaveAttribute("open", "");
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  await expect(selfCheck.locator("[data-collapsible-content]")).toHaveCSS("display", "block");
  await expect(page.getByTestId("static-worked-solution")).toHaveCount(3);
  await expect(page.getByTestId("lesson-worked-example").first().getByText("Final answer", { exact: true })).toBeVisible();
});

test("typography comparison changes only the explicit reading mode", async ({ page }) => {
  await page.goto(NOTES_ROUTE);
  await expect(page.locator('[data-typography="system_sans"]')).toBeVisible();
  await page.goto(`${NOTES_ROUTE}?readingStyle=serif`);
  await expect(page.locator('[data-typography="restrained_serif"]')).toBeVisible();
  await expect(page.getByTestId("lesson-document")).toHaveAttribute("data-lesson-id", "basic-differentiation-lesson");
});
