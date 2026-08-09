import { expect, test } from "./fixtures/test";

for (const width of [390, 375, 320]) {
  test(`Past Papers remains readable and overflow-free at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/subjects/higher-maths/past-papers");
    await expect(page.getByRole("heading", { name: "Past Papers", level: 1 })).toBeVisible();
    await expect(page.getByTestId(/^past-paper-/)).toHaveCount(8);
    await expect(page.getByTestId("past-paper-2025-1").getByRole("link")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px overflow`).toBe(0);
  });
}
