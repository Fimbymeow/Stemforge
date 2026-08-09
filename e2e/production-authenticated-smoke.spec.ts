import { expect, test } from "./fixtures/test";
import { currentAttempt, STORAGE_KEY } from "./fixtures/progress";

const syntheticEvidence = {
  version: 4 as const,
  data: {
    attempts: [currentAttempt("hm-calc-diff-basic-f-001", 1, { eventId: "attempt_production_smoke_fixed" })],
    supportEvents: [],
    achievementSnapshots: [],
  },
};

test("dedicated account proves sign-in, explicit import, sync read/write and sign-out", async ({ page, seriousBrowserErrors }) => {
  const email = required("STEMFORGE_PRODUCTION_AUTH_TEST_EMAIL");
  const password = required("STEMFORGE_PRODUCTION_AUTH_TEST_PASSWORD");
  let importPosts = 0;
  let syncPushes = 0;
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (request.url().endsWith("/api/progress/import")) importPosts += 1;
    if (request.url().endsWith("/api/progress/sync/push")) syncPushes += 1;
  });

  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: syntheticEvidence });
  await page.goto("/account/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/account" || url.searchParams.has("result"), { timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe("/account");

  const contextBefore = await page.request.get("/api/progress/sync/context");
  expect(contextBefore.status()).toBe(200);
  const identityBefore = await contextBefore.json() as { authenticated: boolean; accountFingerprint: string };
  expect(identityBefore.authenticated).toBe(true);
  expect(identityBefore.accountFingerprint).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(importPosts).toBe(0);
  expect(syncPushes).toBe(0);

  const importPanel = page.getByTestId("guest-progress-import");
  if (await importPanel.getByRole("button", { name: "Review and add progress" }).count()) {
    await importPanel.getByRole("button", { name: "Review and add progress" }).click();
    await importPanel.getByRole("button", { name: "Add progress" }).click();
    await expect(importPanel).toContainText(/Progress added|already been confirmed/);
    expect(importPosts).toBe(1);
  } else {
    await expect(importPanel).toContainText("already been confirmed");
  }

  const syncPanel = page.getByTestId("progress-sync-panel");
  const enableSync = syncPanel.getByRole("button", { name: "Turn on cross-device sync" });
  if (await enableSync.count()) await enableSync.click();
  else await syncPanel.getByRole("button", { name: /Sync now|Resume sync/ }).click();
  await expect(syncPanel).toContainText("are up to date");

  const contextAfter = await page.request.get("/api/progress/sync/context");
  const identityAfter = await contextAfter.json() as { accountFingerprint: string };
  expect(identityAfter.accountFingerprint).toBe(identityBefore.accountFingerprint);
  await page.getByRole("button", { name: "Sign out and keep progress on this browser" }).click();
  await expect(page).not.toHaveURL(/\/account$/);
  const signedOut = await page.request.get("/api/progress/sync/context");
  expect((await signedOut.json()).authenticated).toBe(false);
  expect(seriousBrowserErrors).toEqual([]);
});

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Credentialed production smoke requires ${name}. No value was printed.`);
  return value;
}
