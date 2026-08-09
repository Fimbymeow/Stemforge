import { expect, test } from "./fixtures/test";

test("Flashcards remain reachable and overflow-free at 390, 375 and 320px", async ({ page }) => {
  for (const width of [390, 375, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/subjects/synthetic-science/flashcards");
    await page.getByRole("button", { name: "Learn new cards" }).click();
    await expect(page.getByTestId("flashcard-card")).toBeVisible();
    await page.getByRole("button", { name: "Show answer" }).click();
    const forgot = page.getByRole("button", { name: "Forgot" });
    const remembered = page.getByRole("button", { name: "Remembered" });
    await expect(forgot).toBeVisible();
    await expect(remembered).toBeVisible();
    const forgotBox = await forgot.boundingBox();
    const rememberedBox = await remembered.boundingBox();
    expect(forgotBox?.height).toBeGreaterThanOrEqual(44);
    expect(rememberedBox?.height).toBeGreaterThanOrEqual(44);
    expect((forgotBox?.x ?? -1) + (forgotBox?.width ?? width + 1)).toBeLessThanOrEqual(width);
    expect((rememberedBox?.x ?? -1) + (rememberedBox?.width ?? width + 1)).toBeLessThanOrEqual(width);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
});
