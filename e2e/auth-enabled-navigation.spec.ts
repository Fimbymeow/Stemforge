import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";

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

test("sign-in and sign-up preserve a safe learning return with accessible mobile forms", async ({ page, seriousBrowserErrors }) => {
  const destination = `/question/${QUESTION_IDS[0]}`;
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/account/sign-in?next=${encodeURIComponent(destination)}`);

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "current-password");
  await expectAccountActionStyle(page.getByRole("button", { name: "Sign in" }));
  await expect(page.locator('input[name="next"]')).toHaveValue(destination);
  await expect(page.getByRole("link", { name: "Continue where you left off" })).toHaveAttribute("href", destination);
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", `/account/sign-up?next=${encodeURIComponent(destination)}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expect(page.getByText("not stored in STEM Forge learning data")).toBeVisible();
  await expectAccountActionStyle(page.getByRole("button", { name: "Create account" }));
  await expect(page.locator('input[name="next"]')).toHaveValue(destination);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await page.goto(`/account/sign-in?result=invalid_credentials&next=${encodeURIComponent(destination)}`);
  const error = page.locator("#account-result");
  await expect(error).toHaveText("The email address or password was not accepted.");
  await expect(error).toBeFocused();

  await page.goto("/account/forgot-password");
  await expectAccountActionStyle(page.getByRole("button", { name: "Send recovery link" }));
  expect(seriousBrowserErrors).toEqual([]);
});

test("meaningful guest progress gets one dismissible non-blocking protection prompt", async ({ page, seriousBrowserErrors }) => {
  await page.route("**/api/progress/sync/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ protocolVersion: 1, authenticated: false }),
  }));
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1)]));
  await page.goto("/dashboard");

  const prompt = page.getByTestId("guest-progress-protection");
  await expect(prompt).toContainText("Your progress currently lives on this browser");
  await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
  await prompt.getByRole("button", { name: "Dismiss account protection reminder" }).click();
  await expect(prompt).toHaveCount(0);
  await page.reload();
  await expect(prompt).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

test("signed-in context never receives the guest protection prompt", async ({ page, seriousBrowserErrors }) => {
  await page.route("**/api/progress/sync/context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      protocolVersion: 1,
      authenticated: true,
      accountFingerprint: "a".repeat(43),
      accountGeneration: "1",
      accountDataStatus: "active",
    }),
  }));
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1)]));
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
  await expect(page.getByTestId("guest-progress-protection")).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

async function expectAccountActionStyle(locator: import("@playwright/test").Locator) {
  await expect(locator).toBeVisible();
  expect(await locator.evaluate((element) => getComputedStyle(element).textTransform)).toBe("none");
  expect(await locator.evaluate((element) => getComputedStyle(element).borderRadius)).toBe("8px");
}
