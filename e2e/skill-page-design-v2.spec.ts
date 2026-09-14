import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";

const route = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";

test("guest confidence uses one shared store across Skill Page, Tracker and tabs", async ({ page, context }) => {
  await page.goto(route);
  const tracker = await context.newPage();
  await tracker.goto("/subjects/higher-maths/course-tracker");
  const saved = tracker.getByTestId("tracker-confidence-basic-differentiation");
  for (const [label, color] of [["Developing", "rgb(138, 97, 24)"], ["Needs work", "rgb(178, 58, 52)"], ["Confident", "rgb(47, 122, 77)"]] as const) {
    const choice = page.getByRole("button", { name: label, exact: true });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(choice).toHaveCSS("color", color);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(saved).toContainText(label);
    await expect(saved).toHaveCSS("color", color);
    await expect(saved.getByRole("button")).toHaveCount(0);
    await page.reload();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "Clear rating", exact: true }).click();
  await expect(page.getByRole("group", { name: "Your confidence" }).getByRole("button", { pressed: true })).toHaveCount(0);
  await expect(saved).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Not rated", { exact: true })).toBeVisible();
  await tracker.close();
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 900 }, { width: 390, height: 812 }, { width: 375, height: 812 }, { width: 320, height: 700 }]) {
  test(`Skill Page composition and confidence at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(route);
    const header = page.getByTestId("skill-path-compact-header");
    await expect(header.getByRole("heading", { name: "Basic differentiation", level: 1 })).toBeVisible();
    const confidence = header.getByRole("group", { name: "Your confidence" });
    await expect(confidence.getByRole("button", { pressed: true })).toHaveCount(0);
    const developing = confidence.getByRole("button", { name: "Developing", exact: true });
    await developing.focus();
    await expect(developing).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(developing).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(confidence.getByRole("button", { name: "Developing", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(header.getByTestId("skill-primary-action")).toHaveAttribute("href", "/subjects/higher-maths/revision-notes?path=basic-differentiation");
    const journey = page.getByTestId("skill-learning-journey");
    await expect(journey.getByRole("listitem")).toHaveCount(4);
    await expect(journey.locator('[data-journey-kind="notes"]')).not.toContainText("Complete");
    await expect(page.getByTestId("skill-review")).toHaveCount(0);
    const stageBoxes = await Promise.all((await journey.getByRole("listitem").all()).map((stage) => stage.boundingBox()));
    if (viewport.width >= 1024) expect(stageBoxes.every((box) => box!.y === stageBoxes[0]!.y)).toBe(true);
    else for (let i = 1; i < stageBoxes.length; i++) expect(stageBoxes[i]!.y).toBeGreaterThanOrEqual(stageBoxes[i - 1]!.y + stageBoxes[i - 1]!.height);
    for (const action of await header.getByRole("button").all()) {
      expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await action.evaluate((button) => button.scrollWidth <= button.clientWidth)).toBe(true);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByTestId("skill-official-requirements").locator("summary").click();
    await expect(page.getByTestId("skill-official-requirement")).toHaveCount(1);
    await expect.poll(() => page.getByTestId("skill-official-requirements").evaluate((details) => getComputedStyle(details, "::details-content").transitionDuration)).toBe("0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await developing.click();
    await page.getByRole("button", { name: "Confident", exact: true }).click();
    await expect(page.getByRole("button", { name: "Confident", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expectNoHorizontalOverflow(page);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await page.screenshot({ path: testInfo.outputPath(`skill-${viewport.width}.png`), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Clear rating", exact: true }).click();
    await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "0" })]));
    await page.goto(route);
    const confident = page.getByRole("button", { name: "Confident", exact: true });
    await confident.click();
    const dialog = page.getByRole("dialog");
    const save = dialog.getByRole("button", { name: "Save as Confident", exact: true });
    await expect(save).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`confidence-dialog-${viewport.width}.png`), animations: "disabled" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(dialog).toHaveCSS("animation-name", "none");
    await dialog.getByRole("button", { name: "Cancel confidence change", exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(save).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(confident).toHaveAttribute("aria-pressed", "false");
    await expect(confident).toBeFocused();
    await confident.click();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await confident.click();
    await dialog.getByRole("button", { name: "Save as Confident", exact: true }).click();
    await expect(confident).toHaveAttribute("aria-pressed", "true");
    await expect(dialog).toHaveCount(0);
  });
}

test("confidence disagreement preserves learner choice and exact evidence semantics", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "0" })]));
  await page.goto(route);
  await page.getByRole("button", { name: "Confident", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName("Save confidence as Confident?");
  await dialog.getByRole("button", { name: "Save as Confident", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Confident", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Confident", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Orthic suggests needs work.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confident", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/subjects/higher-maths/course-tracker");
  const savedConfidence = page.getByTestId("tracker-confidence-basic-differentiation");
  await expect(savedConfidence).toContainText("Confident");
  await expect(savedConfidence).toHaveCSS("color", "rgb(47, 122, 77)");
  await page.reload();
  await expect(savedConfidence).toContainText("Confident");
  await page.goto(route);
  await page.getByRole("button", { name: "Clear rating", exact: true }).click();
  await expect(page.getByRole("group", { name: "Your confidence" }).getByRole("button", { pressed: true })).toHaveCount(0);
});

test("real stage transition, separate due Review and shared reduced motion", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.slice(0, 3).map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(route);
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.locator('[aria-current="step"]')).toContainText("Applications");
  await expect(page.getByTestId("skill-primary-action")).toHaveAttribute("href", `/question/${QUESTION_IDS[3]}`);
  await expect(journey.locator('[data-journey-state="complete"]')).toHaveCount(1);
  await expect(page.getByTestId("skill-primary-action")).toHaveCSS("transition-duration", "0.15s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByTestId("skill-primary-action")).toHaveCSS("transition-duration", "0s");
  await expect(page.getByRole("button", { name: "Developing", exact: true })).toHaveCSS("transition-duration", "0s");
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(route);
  await expect(journey.getByRole("listitem")).toHaveCount(4);
  await expect(journey.locator('[data-journey-state="complete"]')).toHaveCount(3);
  await expect(page.getByTestId("skill-review")).toContainText("Due now");
  await expect(page.getByTestId("skill-review")).not.toHaveAttribute("aria-current", "step");
  await expect(page.getByTestId("skill-primary-action")).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
  await expect(page.getByTestId("completed-path-card")).toHaveCSS("animation-name", "none");
});
