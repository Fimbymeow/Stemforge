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
      const primary = page.getByRole("link", { name: "Open Higher Maths", exact: true });
      const secondary = page.getByRole("link", { name: "Start learning", exact: true });
      await expect(primary).toBeVisible();
      await expect(secondary).toBeVisible();
      await expect(primary).toHaveAttribute("href", "/subjects/higher-maths");
      await expect(secondary).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
      const primaryBox = await primary.boundingBox();
      const secondaryBox = await secondary.boundingBox();
      expect(primaryBox).not.toBeNull();
      expect(secondaryBox).not.toBeNull();
      expect(primaryBox!.height).toBeGreaterThanOrEqual(44);
      expect(secondaryBox!.height).toBeGreaterThanOrEqual(44);
      expect(await primary.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(await secondary.evaluate((element) => getComputedStyle(element).backgroundColor));
      await expectNoHorizontalOverflow(page);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const primary = page.getByRole("link", { name: "Open Higher Maths", exact: true });
  const secondary = page.getByRole("link", { name: "Start learning", exact: true });
  await primary.focus();
  await expect(primary).toBeFocused();
  await primary.press("Tab");
  await expect(secondary).toBeFocused();
  expect(seriousBrowserErrors).toEqual([]);
});

test("review and active-practice recommendations never replace course access at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: index === 0 })),
  ));
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review 1 question", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const sessionPath = new URL(page.url()).pathname;

  for (const route of ["/dashboard", "/subjects"]) {
    await page.goto(route);
    await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Resume practice", exact: true })).toHaveAttribute("href", sessionPath);
    await expectNoHorizontalOverflow(page);
  }
});
