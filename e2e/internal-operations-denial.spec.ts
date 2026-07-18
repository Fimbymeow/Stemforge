import { test, expect } from "./fixtures/test";

test("ordinary learner cannot access internal operations pages or APIs", async ({ page }) => {
  const pageResponse = await page.goto("/internal/beta-reports");
  expect(pageResponse?.status()).toBe(404);
  await expect(page.locator("body")).not.toContainText("Beta report queue");
  const list = await page.request.get("/api/internal/beta-reports");
  expect(list.status()).toBe(403);
  expect(list.headers()["cache-control"]).toContain("no-store");
  const detail = await page.request.get("/api/internal/beta-reports/SF-OPS0000001");
  expect(detail.status()).toBe(403);
  const health = await page.request.get("/api/internal/health");
  expect(health.status()).toBe(403);
  expect(JSON.stringify(await health.json())).not.toMatch(/owner_|supabase|postgres|allowlist/i);
});
