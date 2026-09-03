import { expect, test } from "./fixtures/test";
import {
  PATH_ID,
  QUESTION_IDS,
  currentAttempt,
  seedStoredProgress,
  v3Payload,
} from "./fixtures/progress";

for (const width of [1440, 1024, 390, 375, 320]) test(`scheduled Review remains accessible, bounded and uses the existing workspace at ${width}px`, async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width, height: 900 });
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1)),
  ));
  await page.goto(`/practice?review=1&path=${PATH_ID}`);
  const card = page.getByTestId("review-launch-card");
  await expect(card).toContainText("Basic differentiation is ready to review");
  await expect(page.getByRole("navigation", { name: "Review navigation" }).getByRole("link", { name: "Back to Higher Maths" })).toBeVisible();
  const start = card.getByRole("button", { name: "Start Review" });
  await expect(start).toBeVisible();
  const box = await start.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await start.click();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Review");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(seriousBrowserErrors).toEqual([]);
});
