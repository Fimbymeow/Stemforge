import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";

test("enabled account navigation hydrates without console or page errors", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0/3 complete");
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
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByTestId("google-provider-icon")).toBeVisible();
  await expect(page.getByTestId("auth-sso-divider")).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "current-password");
  await expectAccountActionStyle(page.getByRole("button", { name: "Sign in" }));
  const emailSignInForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Sign in", exact: true }) });
  await expect(emailSignInForm.locator('input[name="next"]')).toHaveValue(destination);
  await expect(page.getByRole("link", { name: "Continue where you left off" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", `/account/sign-up?next=${encodeURIComponent(destination)}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue where you left off" })).toHaveCount(0);
  const accountCard = page.getByRole("article");
  await expect(accountCard.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  await expect(accountCard.getByRole("link", { name: "Privacy Notice" })).toHaveAttribute("href", "/privacy");
  await expectAccountActionStyle(page.getByRole("button", { name: "Create account" }));
  const emailSignUpForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create account", exact: true }) });
  await expect(emailSignUpForm.locator('input[name="next"]')).toHaveValue(destination);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await page.goto(`/account/sign-in?result=invalid_credentials&next=${encodeURIComponent(destination)}`);
  const error = page.locator("#account-result");
  await expect(error).toHaveText("Check your email and password, then try again.");
  await expect(error).toBeFocused();

  await page.goto("/account/forgot-password");
  await expectAccountActionStyle(page.getByRole("button", { name: "Send recovery link" }));
  expect(seriousBrowserErrors).toEqual([]);
});

test("auth entry surfaces are narrow, singular and resilient across states", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/account/sign-up");

  const signUpSurface = page.getByTestId("account-auth-surface");
  const signUpBox = await signUpSurface.boundingBox();
  const signUpInputBox = await page.getByLabel("Email address").boundingBox();
  expect(signUpBox).not.toBeNull();
  expect(signUpInputBox).not.toBeNull();
  expect(signUpBox!.width).toBeLessThanOrEqual(384);
  expect(signUpInputBox!.width).toBeLessThan(signUpBox!.width);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  await expect(signUpSurface.locator("article")).toHaveCount(0);

  await page.goto("/account/sign-in?result=oauth_identity_conflict");
  const longResult = page.locator("#account-result");
  await expect(longResult).toContainText("already connected to an account");
  expect(await longResult.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.goto("/account/forgot-password");
  await expect(page.getByTestId("account-auth-surface")).toHaveAttribute("data-account-shell", "auth");

  for (const viewport of [{ width: 375, height: 812 }, { width: 320, height: 760 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/account/sign-up?result=signup_check_email");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    expect(await page.locator("#account-result").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(seriousBrowserErrors).toEqual([]);
});

test("signed-out account puts authentication first and omits the preview toggle", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/account");

  const actions = page.getByTestId("signed-out-account-actions");
  const guestContext = page.getByTestId("signed-out-guest-context");
  await expect(actions.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await expect(actions.getByRole("link", { name: "Create account", exact: true })).toBeVisible();
  await expect(page.getByTestId("premium-preview-toggle")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ready to keep learning?" })).toHaveCount(0);
  const actionBox = await actions.boundingBox();
  const guestBox = await guestContext.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(guestBox).not.toBeNull();
  expect(actionBox!.y).toBeLessThan(guestBox!.y);
  expect(seriousBrowserErrors).toEqual([]);
});

test("OAuth cancellation is calm, sanitized and preserves only a safe return", async ({ page, seriousBrowserErrors }) => {
  const destination = `/question/${QUESTION_IDS[0]}`;
  await page.goto(`/auth/callback?error=access_denied&error_description=${encodeURIComponent("raw provider detail")}&next=${encodeURIComponent(destination)}`);
  await expect(page).toHaveURL(new RegExp(`/account/sign-in\\?result=oauth_cancelled&next=`));
  await expect(page.locator("#account-result")).toHaveText("Google sign-in was cancelled. You can try again or use email and password.");
  await expect(page.getByText("raw provider detail")).toHaveCount(0);

  await page.goto("/auth/callback?error=access_denied&next=%2F%2Fevil.example");
  await expect(page).toHaveURL(/\/account\/sign-in\?result=oauth_cancelled$/);
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
  const courses = await page.getByTestId("dashboard-courses-section").boundingBox();
  const protection = await prompt.boundingBox();
  expect(courses).not.toBeNull();
  expect(protection).not.toBeNull();
  expect(protection!.y).toBeGreaterThanOrEqual(courses!.y + courses!.height);
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
