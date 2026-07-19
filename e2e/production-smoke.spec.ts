import { expect, test } from "./fixtures/test";
import { QUESTION_IDS } from "./fixtures/progress";

const expectReady = process.env.STEMFORGE_PRODUCTION_EXPECT_READY !== "false";

test("production guest surface, health, security and internal denial are operational", async ({ page, seriousBrowserErrors }) => {
  const failedAssets: string[] = [];
  page.on("requestfailed", (request) => {
    if (["document", "script", "stylesheet", "font"].includes(request.resourceType())) failedAssets.push(request.url());
  });

  const visit = async (path: string) => {
    const response = await page.goto(path);
    await page.waitForLoadState("networkidle");
    return response;
  };

  const landing = await visit("/");
  expect(landing?.status()).toBe(200);
  expect(landing?.url()).toMatch(/^https:\/\//);
  expect(landing?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(landing?.headers()["strict-transport-security"]).toContain("max-age=");
  expect(landing?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page.getByRole("heading", { name: "Forge Your Potential.", level: 1 })).toBeVisible();

  const health = await page.request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toContain("no-store");
  expect(await health.json()).toMatchObject({ status: "ok", appVersion: "private-beta" });
  const readiness = await page.request.get("/api/health/ready");
  expect(readiness.headers()["cache-control"]).toContain("no-store");
  expect(readiness.status()).toBe(expectReady ? 200 : 503);
  expect((await readiness.json()).status).toBe(expectReady ? "ready" : "not_ready");

  await visit("/dashboard");
  await expect(page.getByRole("heading", { name: "STEM Forge", level: 1 })).toBeVisible();
  await visit("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByRole("heading", { name: "Basic differentiation", level: 1 })).toBeVisible();
  await visit(`/question/${QUESTION_IDS[0]}`);
  await expect(page.getByRole("heading", { name: "Differentiate a power", level: 1 })).toBeVisible();
  await visit("/graph-demo");
  await expect(page.getByTestId("linked-derivative-graphs")).toBeVisible();
  await visit("/practice");
  await expect(page.getByRole("heading", { name: "Practice sessions", level: 1 })).toBeVisible();

  await visit("/dashboard");
  const feedback = page.getByRole("button", { name: "Send feedback" });
  expect(await feedback.count()).toBeGreaterThan(0);
  await feedback.first().click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await visit("/account/sign-in");
  await expect(page.locator("h1")).toBeVisible();
  const callback = await page.request.get("/auth/callback?next=%2F%2Fevil.example", { maxRedirects: 0 });
  expect([307, 308]).toContain(callback.status());
  const location = callback.headers().location;
  expect(location).toMatch(/^https:\/\/[^/]+\/account(?:\/sign-in\?result=callback_invalid)?$/);
  expect(location).not.toContain("evil.example");

  const internal = await page.request.get("/internal/beta-reports");
  expect([403, 404]).toContain(internal.status());
  expect(failedAssets).toEqual([]);
  expect(seriousBrowserErrors).toEqual([]);
});
