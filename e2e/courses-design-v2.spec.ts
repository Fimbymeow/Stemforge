import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 900 }, { width: 390, height: 812 }, { width: 375, height: 812 }, { width: 320, height: 700 }]) {
  test(`single real course is intentional and accessible at ${viewport.width}px`, async ({ page, seriousBrowserErrors }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/subjects");
    await expect(page.getByRole("heading", { name: "Courses", level: 1 })).toBeVisible();
    const row = page.getByTestId("subject-card-higher-maths");
    await expect(page.getByTestId("your-courses").getByRole("article")).toHaveCount(1);
    await expect(row).toContainText("0 of 2 skills learned");
    await expect(page.getByTestId("explore-courses")).toHaveCount(0);
    await expect(page.getByText(/Current focus|coming soon|Higher Physics|Advanced Higher/)).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Subjects", exact: true })).toHaveAttribute("aria-current", "page");
    const open = row.getByRole("link", { name: "Open Higher Maths" });
    await expect(open).toHaveAttribute("href", "/subjects/higher-maths");
    const box = (await open.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    await open.focus();
    await expect(open).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`courses-${viewport.width}.png`), fullPage: true, animations: "disabled" });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/subjects\/higher-maths$/);
    expect(seriousBrowserErrors).toEqual([]);
  });
}

test("real learned/review-due evidence stays high-level and does not replace course access", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto("/subjects");
  const row = page.getByTestId("subject-card-higher-maths");
  await expect(row).toContainText("1 of 2 skills learned");
  await expect(row).toContainText("1 review due");
  await expect(row.getByRole("link")).toHaveCount(1);
  await expect(row.getByRole("link", { name: "Open Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
  await expect(page.getByText(/Current focus|Basic differentiation|Chain rule/)).toHaveCount(0);
});

test("course hover reuses restrained motion and respects reduced motion", async ({ page }) => {
  await page.goto("/subjects");
  const row = page.getByTestId("subject-card-higher-maths");
  const open = row.getByRole("link", { name: "Open Higher Maths" });
  await expect(row).toHaveCSS("transition-duration", "0.15s");
  await expect(row).toHaveCSS("box-shadow", "none");
  await open.hover();
  await expect(open.locator("svg")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 2, 0)");
  await expect(row).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(row).toHaveCSS("transition-duration", "0s");
  await expect(open).toHaveCSS("transition-duration", "0s");
  await expect(open.locator("svg")).toHaveCSS("transform", "none");
});
