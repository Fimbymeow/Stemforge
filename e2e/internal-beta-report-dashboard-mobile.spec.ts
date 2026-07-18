import { test, expect } from "./fixtures/test";

test("allowlisted operator dashboard remains keyboard-usable without mobile overflow", async ({ page }) => {
  const email = process.env.STEMFORGE_AUTH_TEST_EMAIL;
  const password = process.env.STEMFORGE_AUTH_TEST_PASSWORD;
  if (!email || !password) throw new Error("Dedicated authentication test credentials are required.");
  await page.goto("/account/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).press("Enter");
  await page.waitForURL((url) => url.pathname === "/account" || (url.pathname === "/account/sign-in" && url.searchParams.has("result")), { timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe("/account");
  await page.goto("/internal/beta-reports?status=all&pageSize=10");
  await expect(page.getByRole("heading", { name: "Beta report queue" })).toBeVisible();
  await page.getByLabel("Search").focus();
  await page.getByLabel("Search").fill("SF-OPS0000001");
  await page.getByRole("button", { name: "Apply filters" }).press("Enter");
  await expect(page.getByRole("link", { name: "SF-OPS0000001" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
