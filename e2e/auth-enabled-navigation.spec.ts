import { expect, test } from "./fixtures/test";

test("enabled account navigation hydrates without console or page errors", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  expect(seriousBrowserErrors).toEqual([]);
});
