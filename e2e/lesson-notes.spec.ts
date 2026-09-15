import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const NOTES_ROUTE = "/subjects/higher-maths/revision-notes";

test("Design V2 keeps real Notes content primary and resource navigation secondary", async ({ page, seriousBrowserErrors }) => {
  await page.goto(`${NOTES_ROUTE}?path=basic-differentiation`);
  const lesson = page.getByTestId("lesson-document");
  await expect(lesson.getByRole("heading", { level: 1, name: "Basic differentiation" })).toBeVisible();
  await expect(lesson).not.toContainText(/\d+ min read/);
  await expect(lesson.locator(".katex-error")).toHaveCount(0);
  const definition = lesson.locator('[data-callout-family="core"]').first();
  const warning = lesson.locator('[data-callout-family="caution"]').first();
  await expect(definition).toHaveCSS("border-left-width", "2px");
  await expect(warning).toHaveCSS("border-left-width", "2px");
  await expect(lesson.getByTestId("lesson-worked-example").first()).toHaveCSS("border-left-width", "1px");
  const progression = lesson.getByTestId("lesson-closure").getByRole("link", { name: "Continue to Foundations" });
  await expect(progression).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  const resources = page.getByRole("navigation", { name: "Other learning resources" });
  await expect(resources.getByRole("link", { name: "Flashcards" })).toHaveCount(0);
  await expect(resources.getByRole("link", { name: "Practice" })).toHaveAttribute("href", "/practice?path=basic-differentiation");
  await expect(lesson.getByRole("heading", { name: "Recap", exact: true })).toHaveCount(0);
  expect((await resources.boundingBox())!.y).toBeGreaterThan((await lesson.boundingBox())!.y + (await lesson.boundingBox())!.height);
  expect(seriousBrowserErrors).toEqual([]);
});

for (const width of [390, 375, 320]) {
  test(`mobile Notes contents remain a compact native disclosure at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 812 });
    await page.goto(`${NOTES_ROUTE}?path=basic-differentiation`);
    const contents = page.locator("[data-lesson-contents]");
    await expect(contents).toBeVisible();
    await expect(contents).not.toHaveAttribute("open", "");
    const summary = contents.locator("summary");
    await summary.focus();
    await expect(summary).toBeFocused();
    await summary.press("Enter");
    await expect(contents).toHaveAttribute("open", "");
    await expect(contents.getByRole("navigation", { name: "Lesson sections" }).getByRole("link", { name: "The power rule" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

for (const path of ["basic-differentiation", "chain-rule"]) {
  for (const width of [1440, 1024, 390, 375, 320]) {
    test(`${path} keeps worked examples in the reading column and feedback clear at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : width < 1024 ? 812 : 900 });
      await page.goto(`${NOTES_ROUTE}?path=${path}`);
      const example = page.getByTestId("lesson-worked-example").first();
      const prose = page.locator(path === "chain-rule" ? "#chain-rule-composite-prose" : "#basic-diff-gradient-function");
      const exampleBox = (await example.boundingBox())!;
      const proseBox = (await prose.boundingBox())!;
      expect(Math.abs(exampleBox.x - proseBox.x)).toBeLessThan(1);
      // Prose uses 1.02rem; both measures are 70ch, so allow that small font-size difference.
      expect(Math.abs(exampleBox.width - proseBox.width)).toBeLessThanOrEqual(proseBox.width * 0.03);
      await expectNoHorizontalOverflow(page);
      const dock = page.locator("[data-global-report-dock]");
      await expect(dock).toHaveCSS("position", width < 640 ? "static" : "fixed");
      if (width < 640) {
        await page.getByTestId("lesson-closure").scrollIntoViewIfNeeded();
        const lessonBox = (await page.getByTestId("lesson-document").boundingBox())!;
        const dockBox = (await dock.boundingBox())!;
        expect(dockBox.y).toBeGreaterThanOrEqual(lessonBox.y + lessonBox.height);
        const feedback = page.getByRole("button", { name: "Send feedback", exact: true });
        await feedback.focus();
        await feedback.press("Enter");
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(feedback).toBeFocused();
      }
    });
  }
}

test("Chain rule common mistakes render inline mathematics instead of raw delimiters", async ({ page }) => {
  await page.goto(`${NOTES_ROUTE}?path=chain-rule`);
  const mistakes = page.getByTestId("lesson-common-mistake");
  await expect(mistakes).toHaveCount(2);
  for (const mistake of await mistakes.all()) {
    await expect(mistake.locator(".katex")).toHaveCount(2);
    await expect(mistake).not.toContainText("$");
    await expect(mistake.locator(".katex-error")).toHaveCount(0);
  }
});

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

test("self-check answer needs explicit reveal and Continue to Foundations is never gated", async ({ page }) => {
  await page.goto(NOTES_ROUTE);
  const continueLink = page.getByRole("link", { name: "Continue to Foundations" });
  await expect(continueLink).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  const selfCheck = page.getByTestId("lesson-self-check");
  await expect(selfCheck).not.toHaveAttribute("open", "");
  await selfCheck.locator("summary").click();
  await expect(selfCheck).toHaveAttribute("open", "");
  const answer = selfCheck.getByTestId("lesson-self-check-answer");
  await expect(selfCheck.getByRole("button", { name: "Reveal answer" })).toHaveAttribute("aria-expanded", "false");
  await expect(answer).not.toContainText("Answer");
  await expect(answer.locator(".katex")).toHaveCount(0);
  await expect(selfCheck.getByText("Answer", { exact: true })).toHaveCount(0);
  const reveal = selfCheck.getByRole("button", { name: "Reveal answer" });
  await reveal.focus();
  await expect(reveal).toBeFocused();
  await reveal.press("Enter");
  await expect(answer).toHaveAttribute("data-answer-revealed", "true");
  await expect(selfCheck.getByRole("button", { name: "Hide answer" })).toHaveAttribute("aria-expanded", "true");
  await expect(selfCheck.getByText("Answer", { exact: true })).toBeVisible();
  await selfCheck.getByRole("button", { name: "Hide answer" }).click();
  await expect(answer).toHaveAttribute("data-answer-revealed", "false");
  await expect(answer.locator(".katex")).toHaveCount(0);
  await expect(continueLink).toBeVisible();
});

for (const width of [1440, 1024, 390, 375, 320]) {
  test(`Notes cleanup preserves distinct content roles and answer reveal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 700 : width < 1024 ? 812 : 900 });
    await page.goto(`${NOTES_ROUTE}?path=basic-differentiation`);
    const lesson = page.getByTestId("lesson-document");
    const concept = lesson.locator('[data-callout-family="core"]').first();
    const example = lesson.getByTestId("lesson-worked-example").first();
    const caution = lesson.locator('[data-callout-family="caution"]').first();
    await expect(concept).toHaveCSS("border-left-width", "2px");
    await expect(example).toHaveCSS("border-width", "1px");
    await expect(caution).toHaveCSS("border-left-width", "2px");
    await expect(caution.getByRole("heading", { name: "Common mistakes" })).toBeVisible();
    await expect(example.getByRole("list", { name: "Worked solution steps" }).getByRole("listitem")).toHaveCount(2);
    const selfCheck = lesson.getByTestId("lesson-self-check");
    await selfCheck.locator("summary").click();
    const answer = selfCheck.getByTestId("lesson-self-check-answer");
    await expect(answer.locator(".katex")).toHaveCount(0);
    await selfCheck.getByRole("button", { name: "Reveal answer" }).click();
    await expect(answer.locator(".katex")).not.toHaveCount(0);
    await expect(lesson.getByTestId("lesson-closure").getByRole("link", { name: "Continue to Foundations" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

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
  const reader = page.locator('[data-typography="restrained_serif"]');
  await expect(reader).toBeVisible();
  await expect(reader.locator(".lesson-prose").first()).toHaveCSS("font-family", /Georgia/);
  await expect(reader.getByRole("heading", { level: 2, name: "The power rule" })).not.toHaveCSS("font-family", /Georgia/);
  await expect(page.getByTestId("lesson-document")).toHaveAttribute("data-lesson-id", "basic-differentiation-lesson");
});
