import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";

const hub = "/subjects/higher-maths";
for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 900 }, { width: 390, height: 812 }, { width: 375, height: 812 }, { width: 320, height: 700 }]) {
  test(`Hub hierarchy, real skills and keyboard actions at ${viewport.width}px`, async ({ page, seriousBrowserErrors }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(hub);
    await expect(page.getByRole("heading", { name: "Higher Maths", level: 1 })).toBeVisible();
    const learning = page.getByTestId("working-context-hub");
    await expect(learning.getByText("Start learning", { exact: true })).toBeVisible();
    await expect(learning.getByRole("link", { name: "Start", exact: true })).toHaveAttribute("href", "/subjects/higher-maths/revision-notes?path=basic-differentiation");
    const tools = page.getByTestId("higher-maths-destinations");
    const selectors = page.getByRole("navigation", { name: "Course strands" });
    const skills = page.getByTestId("roadmap-strand-calculus");
    await expect(tools.getByRole("link")).toHaveCount(5);
    await expect(selectors.getByRole("button")).toHaveCount(4);
    await expect(skills.getByRole("listitem")).toHaveCount(2);
    const boxes = await Promise.all([learning, tools, selectors, skills].map((locator) => locator.boundingBox()));
    for (let index = 1; index < boxes.length; index++) expect(boxes[index]!.y).toBeGreaterThanOrEqual(boxes[index - 1]!.y + boxes[index - 1]!.height);
    const vectors = selectors.getByRole("button", { name: "Vectors", exact: true });
    await vectors.focus();
    await expect(vectors).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(vectors).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("roadmap-strand-vectors").getByRole("status")).toBeVisible();
    await selectors.getByRole("button", { name: "Calculus", exact: true }).click();
    const open = page.getByTestId("roadmap-skill-chain-rule").getByRole("link");
    await open.focus();
    await expect(open).toBeFocused();
    expect((await open.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await page.screenshot({ path: testInfo.outputPath(`hub-${viewport.width}.png`), fullPage: true, animations: "disabled" });
    await open.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Chain rule", level: 1 })).toBeVisible();
    expect(seriousBrowserErrors).toEqual([]);
  });
}

test("real in-progress and review-due states preserve existing destinations", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1)]));
  await page.goto(hub);
  await expect(page.getByTestId("working-context-hub").getByRole("link", { name: "Continue", exact: true })).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(hub);
  await expect(page.getByTestId("review-entry-card")).toHaveAccessibleName("Review, 1 skill due");
  await expect(page.getByTestId("past-papers-destination")).toHaveAttribute("href", `${hub}/past-papers`);
});

test("Hub motion is restrained and reduced motion removes transitions", async ({ page }) => {
  await page.goto(hub);
  const selector = page.getByRole("navigation", { name: "Course strands" }).getByRole("button", { name: "Calculus", exact: true });
  const row = page.getByTestId("roadmap-skill-basic-differentiation").getByRole("link");
  await expect(selector).toHaveCSS("transition-duration", "0.15s");
  await row.hover();
  await expect(row.locator("svg").last()).toHaveCSS("transform", "matrix(1, 0, 0, 1, 2, 0)");
  await expect(row).toHaveCSS("transform", "none");
  await expect(row).toHaveCSS("box-shadow", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(selector).toHaveCSS("transition-duration", "0s");
  await expect(row).toHaveCSS("transition-duration", "0s");
  await expect(row.locator("svg").last()).toHaveCSS("transform", "none");
});
