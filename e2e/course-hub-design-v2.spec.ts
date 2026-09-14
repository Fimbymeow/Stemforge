import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { execFileSync } from "node:child_process";

const hub = "/subjects/higher-maths";
for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 900 }, { width: 390, height: 812 }, { width: 375, height: 812 }, { width: 320, height: 700 }]) {
  test(`Hub hierarchy, real skills and keyboard actions at ${viewport.width}px`, async ({ page, seriousBrowserErrors }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(hub);
    await expect(page.getByRole("heading", { name: "Higher Maths", level: 1 })).toBeVisible();
    const learning = page.getByTestId("working-context-hub");
    await expect(page.getByTestId("course-hub-progress")).toHaveAccessibleName("Course progress: 0 of 49 skills learned, 0%");
    const stages = learning.getByRole("list", { name: "Learning stages" });
    await expect(stages.getByRole("listitem")).toHaveCount(4);
    await expect(stages.getByText("Exam practice", { exact: true })).toBeVisible();
    await expect(stages.getByRole("listitem").first()).toHaveText("NotesAvailable");
    await expect(learning.getByText("Start learning", { exact: true })).toBeVisible();
    await expect(learning.getByRole("link", { name: "Start", exact: true })).toHaveAttribute("href", "/subjects/higher-maths/revision-notes?path=basic-differentiation");
    const tools = page.getByTestId("higher-maths-destinations");
    const selectors = page.getByRole("navigation", { name: "Course strands" });
    const skills = page.getByTestId("roadmap-strand-calculus");
    await expect(tools.getByRole("link")).toHaveCount(5);
    await expect(selectors.getByRole("button")).toHaveCount(4);
    await expect(skills.getByRole("listitem")).toHaveCount(2);
    await expect(skills.getByRole("heading", { name: "Differentiating functions", level: 4 })).toBeVisible();
    await expect(skills.getByText("Start with the power rule", { exact: false })).toHaveCount(0);
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
  await expect(page.getByTestId("course-hub-progress")).toHaveAccessibleName("Course progress: 1 of 49 skills learned, 2%");
  await expect(page.getByTestId("roadmap-skill-basic-differentiation").getByText("Review due", { exact: true })).toBeVisible();
  await expect(page.getByTestId("roadmap-skill-basic-differentiation").getByLabel("Latest answer accuracy: 100%", { exact: true })).toBeVisible();
  await expect(page.getByTestId("past-papers-destination")).toHaveAttribute("href", `${hub}/past-papers`);
});

test("skill accuracy uses existing graded evidence, not completion or confidence", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false })]));
  await page.goto(hub);
  await expect(page.getByTestId("roadmap-skill-basic-differentiation").getByLabel("Latest answer accuracy: 0%", { exact: true })).toBeVisible();
  await expect(page.getByTestId("roadmap-skill-chain-rule").getByLabel(/Latest answer accuracy/)).toHaveCount(0);
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1), currentAttempt(QUESTION_IDS[1], 2, { isCorrect: false })]));
  await page.goto(hub);
  await expect(page.getByTestId("roadmap-skill-basic-differentiation").getByLabel("Latest answer accuracy: 50%", { exact: true })).toBeVisible();
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

test("test-only full-curriculum fixtures scale without changing published availability", async ({ page }, testInfo) => {
  for (const areaIndex of [0, 1, 2, 3]) {
    await page.goto(hub);
    await expect(page.getByTestId("subject-roadmap")).toBeVisible();
    const markup = execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "-e", `import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server'; import { SubjectRoadmapNavigator } from './components/learning/subject-roadmap-navigator'; import { getActiveSubject } from './lib/learning-paths'; globalThis.React = React; const real = getActiveSubject(); const areas = real.courseAreas.map(area => ({...area, specAreas: area.specAreas.map(topic => ({...topic, skillPaths: topic.skillPaths?.map(path => ({...path, isAvailable: true}))}))})); const selected = areas[${areaIndex}]; const subject = {...real, courseAreas: [selected, ...areas.filter(area => area !== selected)]}; process.stdout.write(renderToStaticMarkup(React.createElement(SubjectRoadmapNavigator, {subject})));`], { encoding: "utf8" });
    // Isolated visual fixture only: no content, stored state or production availability mutation.
    await page.getByTestId("subject-roadmap").evaluate((element, html) => { element.outerHTML = html; }, markup);
    for (const width of [1440, 1024, 390, 375, 320]) {
      await page.setViewportSize({ width, height: width === 320 ? 700 : width < 1024 ? 812 : 900 });
      const groups = page.locator('[data-testid^="spec-group-"]');
      expect(await groups.count()).toBeGreaterThan(0);
      const actions = page.locator('[data-testid^="roadmap-skill-"]').getByRole("link");
      expect(await actions.count()).toBeGreaterThan(0);
      for (const action of await actions.all()) {
        expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await actions.last().focus();
      await expect(actions.last()).toBeFocused();
      await expectNoHorizontalOverflow(page);
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
      await page.screenshot({ path: testInfo.outputPath(`full-area-${areaIndex}-${width}.png`), fullPage: true, animations: "disabled" });
    }
  }
});
