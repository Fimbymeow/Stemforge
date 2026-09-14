import { execFileSync } from "node:child_process";
import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("real Dashboard retains course access, quiet full catalogue link and keyboard navigation", async ({ page }) => {
  await page.goto("/dashboard");
  const section = page.getByTestId("dashboard-courses-section");
  await expect(section.getByTestId("dashboard-course-row")).toHaveCount(1);
  const all = section.getByRole("link", { name: "View all courses" });
  await expect(all).toHaveAttribute("href", "/subjects");
  await all.focus();
  await expect(all).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/subjects$/);
});

for (const count of [1, 2, 4]) test(`isolated ${count}-course fixture renders at most two compact rows at all target widths`, async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-courses-section")).toBeVisible();
  // Test-only props in the real rendered Dashboard. No catalogue, enrolment or stored evidence changes.
  const courses = Array.from({ length: count }, (_, index) => ({ slug: `fixture-${index}`, name: `Fixture course ${index + 1}`, href: `/subjects/fixture-${index}` }));
  const props = { courses, focusCourseSlug: courses[count - 1].slug, attentionCourseSlugs: count > 2 ? [courses[1].slug] : [], selectedCourseSlugs: courses.map((course) => course.slug), progressCourseSlug: courses[count - 1].slug, completedPathCount: 0, availablePathCount: 2, reviewSummary: "Up to date", reviewDue: false };
  // Render outside Playwright's JSX instrumentation, using the production component itself.
  const markup = execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "-e", `import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server'; import { DashboardCourses } from './components/dashboard-courses'; globalThis.React = React; process.stdout.write(renderToStaticMarkup(React.createElement(DashboardCourses, ${JSON.stringify(props)})));`], { encoding: "utf8" });
  await page.getByTestId("dashboard-courses-section").evaluate((section, html) => { section.outerHTML = html; }, markup);
  for (const width of [1440, 1024, 390, 375, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 700 : width < 1024 ? 812 : 900 });
    const section = page.getByTestId("dashboard-courses-section");
    const rows = section.getByTestId("dashboard-course-row");
    await expect(rows).toHaveCount(Math.min(count, 2));
    await expect(rows.first().getByRole("link", { name: `Open Fixture course ${count}`, exact: true })).toBeVisible();
    if (count > 2) await expect(rows.nth(1)).toContainText("Fixture course 2");
    const coursesBox = (await section.boundingBox())!;
    const activityBox = (await page.getByTestId("dashboard-activity-summary").boundingBox())!;
    expect(activityBox.y).toBeGreaterThanOrEqual(coursesBox.y + coursesBox.height);
    for (const action of await rows.getByRole("link").all()) {
      await action.focus();
      await expect(action).toBeFocused();
    }
    await expectNoHorizontalOverflow(page);
    await page.mouse.move(0, 0);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await page.screenshot({ path: testInfo.outputPath(`courses-${count}-${width}.png`), fullPage: true, animations: "disabled" });
  }
});
