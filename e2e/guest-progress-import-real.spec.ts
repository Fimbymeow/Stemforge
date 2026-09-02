import { expect, test } from "./fixtures/test";
import {
  CELEBRATION_STORAGE_KEY,
  STORAGE_KEY,
  currentAttempt,
  seedStoredCelebrations,
  seedStoredProgress,
} from "./fixtures/progress";
import { PROGRESS_IMPORT_METADATA_KEY } from "../lib/progress/import-metadata";
import { LEARNER_PREFERENCES_STORAGE_KEY } from "../lib/learner-preferences";
import { migrateProgressPayload } from "../lib/progress/payload";

const initialEvidence = {
  version: 4 as const,
  data: {
    attempts: [currentAttempt("hm-calc-diff-basic-f-001", 1, { eventId: "attempt_real_import_1" })],
    supportEvents: [],
    achievementSnapshots: [],
  },
};
const canonicalInitialEvidence = migrateProgressPayload(initialEvidence).payload;

test("confirmed real-auth import is durable, idempotent, local-preserving and retry-safe", async ({ page, seriousBrowserErrors }) => {
  await seedStoredProgress(page, initialEvidence);
  await seedStoredCelebrations(page, { version: 1, data: { paths: { "basic-differentiation": { acknowledgedStatus: "completed" } } } });
  let importPosts = 0;
  page.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/api/progress/import")) importPosts += 1; });
  await signIn(page);

  await expect(page.getByTestId("guest-progress-import")).toContainText("ready to protect");
  expect(importPosts).toBe(0);
  await page.getByRole("button", { name: "Review and add progress" }).click();
  expect(importPosts).toBe(0);
  await page.getByRole("button", { name: "Add progress" }).click();
  await expect(page.getByTestId("guest-progress-import")).toContainText("Progress added to your account");
  expect(importPosts).toBe(1);

  const localAfter = await page.evaluate(({ progressKey, celebrationKey }) => ({
    progress: window.localStorage.getItem(progressKey),
    celebration: window.localStorage.getItem(celebrationKey),
  }), { progressKey: STORAGE_KEY, celebrationKey: CELEBRATION_STORAGE_KEY });
  expect(JSON.parse(localAfter.progress!)).toEqual(initialEvidence);
  expect(localAfter.celebration).not.toBeNull();

  await page.reload();
  await expect(page.getByTestId("guest-progress-import")).toContainText("already been confirmed");
  const context = await page.request.get("/api/progress/sync/context");
  expect(context.ok()).toBe(true);
  const contextBody = await context.json();
  const duplicate = await page.request.post("/api/progress/import", {
    headers: { Origin: "http://127.0.0.1:3081", "Content-Type": "application/json" },
    data: { protocolVersion: 1, expectedGeneration: contextBody.accountGeneration, evidence: canonicalInitialEvidence },
  });
  const duplicateBody = await duplicate.json();
  expect(duplicate.ok(), JSON.stringify(duplicateBody)).toBe(true);
  expect(duplicateBody.accepted).toHaveLength(0);
  expect(duplicateBody.alreadyPresent).toHaveLength(1);
  expect(duplicateBody.alreadyPresent[0].receiveCursor).toMatch(/^\d+$/);

  await page.evaluate(({ progressKey, metadataKey, secondAttempt }) => {
    const payload = JSON.parse(window.localStorage.getItem(progressKey)!);
    payload.data.attempts.push(secondAttempt);
    window.localStorage.setItem(progressKey, JSON.stringify(payload));
    const metadata = JSON.parse(window.localStorage.getItem(metadataKey)!);
    metadata.accounts["Z".repeat(43)] = {
      acknowledged: { "attempt:anonymous_previous": { disposition: "accepted", receiveCursor: "999", acknowledgedAt: "2026-07-16T12:00:00.000Z" } },
      lastImportAt: "2026-07-16T12:00:00.000Z",
    };
    window.localStorage.setItem(metadataKey, JSON.stringify(metadata));
  }, {
    progressKey: STORAGE_KEY,
    metadataKey: PROGRESS_IMPORT_METADATA_KEY,
    secondAttempt: currentAttempt("hm-calc-diff-basic-f-002", 2, { eventId: "attempt_real_import_2" }),
  });
  await page.reload();
  await expect(page.getByTestId("guest-progress-import")).toContainText("previously added progress to another account");
  await page.getByRole("button", { name: "Continue to confirmation" }).click();
  await page.getByRole("button", { name: "Review and add progress" }).click();

  const beforeFailure = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  await page.evaluate(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      return url.endsWith("/api/progress/import")
        ? Promise.reject(new Error("Simulated offline import request"))
        : originalFetch(input, init);
    };
  });
  await page.getByRole("button", { name: "Add progress" }).click();
  await expect(page.getByTestId("guest-progress-import")).toContainText("Nothing was deleted");
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)).toBe(beforeFailure);
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.locator("body").evaluate((body) => body.clientWidth));
  expect(seriousBrowserErrors).toEqual([]);
});

test("authenticated account with no local evidence shows a quiet empty state", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/");
  await page.evaluate(({ progressKey, metadataKey }) => {
    window.localStorage.removeItem(progressKey);
    window.localStorage.removeItem(metadataKey);
  }, { progressKey: STORAGE_KEY, metadataKey: PROGRESS_IMPORT_METADATA_KEY });
  await signIn(page);
  await expect(page.getByTestId("guest-progress-import")).toContainText("no learning progress saved on this browser yet");
  expect(seriousBrowserErrors).toEqual([]);
});

test("signed-in Account uses grouped settings and modal safety at every target width", async ({ page, seriousBrowserErrors }) => {
  await signIn(page);

  for (const heading of ["Profile", "Learning data", "Preferences", "Session", "Danger zone"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByTestId("premium-preview-toggle")).toHaveCount(0);
  await expect(page.getByText("More account and data controls", { exact: true })).toHaveCount(0);
  const positions = await Promise.all(["Profile", "Learning data", "Preferences", "Session", "Danger zone"].map(async (heading) =>
    (await page.getByRole("heading", { name: heading, exact: true }).boundingBox())!.y));
  expect(positions).toEqual([...positions].sort((a, b) => a - b));

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 320, height: 760 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }

  const clearTrigger = page.getByRole("button", { name: "Clear all Orthic progress from this browser" });
  await clearTrigger.click();
  await expect(page.locator("[data-dialog-shell]")).toHaveAttribute("role", "alertdialog");
  await expect(page.getByRole("button", { name: "Cancel" }).last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-dialog-shell]")).toHaveCount(0);
  await expect(clearTrigger).toBeFocused();

  await page.getByRole("button", { name: "Remove this account's data from this browser, then sign out" }).click();
  await expect(page.getByRole("heading", { name: "Remove account data and sign out?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Remove account data and sign out?" })).toHaveCount(0);
  expect(seriousBrowserErrors).toEqual([]);
});

test("real sign-in and sign-out preserve the useful learning destination without importing", async ({ page, seriousBrowserErrors }) => {
  const destination = "/question/hm-calc-diff-basic-f-001";
  await page.goto(`/account/sign-in?next=${encodeURIComponent(destination)}`);
  await page.getByLabel("Email").fill(requiredEmail());
  await page.getByLabel("Password").fill(requiredPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  await page.getByRole("link", { name: "Account" }).click();
  await expect(page).toHaveURL(new RegExp(`/account\\?next=${encodeURIComponent(destination)}$`));
  await page.getByRole("button", { name: "Sign out and keep progress on this browser" }).click();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  expect(seriousBrowserErrors).toEqual([]);
});

test("guest account setup imports explicitly, remains editable and can be cleared without blocking learning", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({
    version: 1,
    firstName: "Guest name",
    namePromptDismissed: true,
    selectedCourseSlugs: ["higher-maths"],
  })), LEARNER_PREFERENCES_STORAGE_KEY);
  await signIn(page);
  await expect(page.getByTestId("guest-account-state-import")).toBeVisible();
  await page.getByRole("button", { name: "Add browser setup" }).click();
  await expect(page.getByTestId("guest-account-state-import")).toHaveCount(0);

  const editor = page.getByTestId("account-learner-preferences");
  await expect(editor.getByLabel("First name")).toHaveValue("Guest name");
  await editor.getByLabel("First name").fill("Account name");
  await editor.getByRole("button", { name: "Save preferences" }).click();
  await expect(editor).toContainText("preferences were saved");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome back, Account name" })).toBeVisible();

  await page.goto("/account");
  await page.getByTestId("account-learner-preferences").getByLabel("First name").fill("");
  await page.getByTestId("account-learner-preferences").getByRole("button", { name: "Save preferences" }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await expect(page.getByTestId("learner-name-prompt")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Higher Maths" })).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});

async function signIn(page: import("@playwright/test").Page) {
  const email = requiredEmail();
  const password = requiredPassword();
  await page.goto("/account/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname === "/account" || (url.pathname === "/account/sign-in" && url.searchParams.has("result")), { timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe("/account");
  await expect(page.getByText(/^Signed in/)).toBeVisible();
}

function requiredEmail() {
  const email = process.env.STEMFORGE_AUTH_TEST_EMAIL;
  if (!email) throw new Error("Dedicated authentication test credentials are required.");
  return email;
}

function requiredPassword() {
  const password = process.env.STEMFORGE_AUTH_TEST_PASSWORD;
  if (!password) throw new Error("Dedicated authentication test credentials are required.");
  return password;
}
