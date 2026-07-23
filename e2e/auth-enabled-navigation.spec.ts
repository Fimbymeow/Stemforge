import { expect, test } from "./fixtures/test";

test("enabled account navigation hydrates without console or page errors", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  expect(seriousBrowserErrors).toEqual([]);
});

test("enabled four-item navigation has no document overflow at 320px", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/practice");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Dashboard", "Subjects", "Path", "Account"]) {
    const link = nav.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  expect(seriousBrowserErrors).toEqual([]);
});
