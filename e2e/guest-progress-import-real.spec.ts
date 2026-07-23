import { expect, test } from "./fixtures/test";
import {
  CELEBRATION_STORAGE_KEY,
  STORAGE_KEY,
  currentAttempt,
  seedStoredCelebrations,
  seedStoredProgress,
} from "./fixtures/progress";
import { PROGRESS_IMPORT_METADATA_KEY } from "../lib/progress/import-metadata";

const initialEvidence = {
  version: 4 as const,
  data: {
    attempts: [currentAttempt("hm-calc-diff-basic-f-001", 1, { eventId: "attempt_real_import_1" })],
    supportEvents: [],
    achievementSnapshots: [],
  },
};

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
  const duplicate = await page.request.post("/api/progress/import", {
    headers: { Origin: "http://127.0.0.1:3081", "Content-Type": "application/json" },
    data: { protocolVersion: 1, evidence: initialEvidence },
  });
  expect(duplicate.ok()).toBe(true);
  const duplicateBody = await duplicate.json();
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
