import { expect, test } from "./fixtures/test";
import { currentAttempt, STORAGE_KEY } from "./fixtures/progress";
import { PROGRESS_SYNC_METADATA_KEY } from "../lib/progress/sync-protocol";

const deviceAEvent = currentAttempt("hm-calc-diff-basic-f-001", 41, { eventId: "attempt_sync_device_a" });
const deviceBEvent = currentAttempt("hm-calc-diff-basic-f-002", 42, { eventId: "attempt_sync_device_b" });
const concurrentEvent = currentAttempt("hm-calc-diff-basic-f-003", 43, { eventId: "attempt_sync_concurrent_local" });
const cursorFailureEvent = currentAttempt("hm-calc-diff-basic-a-001", 44, { eventId: "attempt_sync_cursor_failure" });
const offlineEvent = currentAttempt("hm-calc-diff-basic-a-002", 45, { eventId: "attempt_sync_offline_local" });

test("two authenticated devices converge safely through incremental evidence synchronization", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const errors: string[] = [];
  watchErrors(pageA, errors);
  watchErrors(pageB, errors);
  try {
    await seed(pageA, [deviceAEvent]);
    let deviceAPushes = 0;
    pageA.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/progress/sync/push")) deviceAPushes += 1;
    });
    await signIn(pageA);
    const syncContext = await pageA.request.get("/api/progress/sync/context");
    expect(syncContext.status(), "trusted sync context should resolve for the signed-in test user").toBe(200);
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("Confirm before");
    expect(deviceAPushes).toBe(0);
    await pageA.getByRole("button", { name: "Enable synchronization" }).click();
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");
    expect(deviceAPushes).toBeGreaterThan(0);

    await seed(pageB, []);
    await signIn(pageB);
    await pageB.getByRole("button", { name: "Enable synchronization" }).click();
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");
    await expectIds(pageB, [deviceAEvent.eventId]);

    await appendLocal(pageB, deviceBEvent);
    await pageB.getByRole("button", { name: "Sync now" }).click();
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");

    let heldPull = false;
    await pageA.route("**/api/progress/sync/pull*", async (route) => {
      if (!heldPull) {
        heldPull = true;
        await appendLocal(pageA, concurrentEvent);
      }
      await route.continue();
    });
    await pageA.getByRole("button", { name: "Sync now" }).click();
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");
    await expectIds(pageA, [deviceAEvent.eventId, deviceBEvent.eventId, concurrentEvent.eventId]);
    await pageA.unroute("**/api/progress/sync/pull*");

    await pageB.getByRole("button", { name: "Sync now" }).click();
    await expectIds(pageB, [deviceAEvent.eventId, deviceBEvent.eventId, concurrentEvent.eventId]);
    const beforeReplay = await ids(pageB);
    await pageB.getByRole("button", { name: "Sync now" }).click();
    expect(await ids(pageB)).toEqual(beforeReplay);

    await appendLocal(pageB, cursorFailureEvent);
    await pageB.getByRole("button", { name: "Sync now" }).click();
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");
    const cursorBefore = await currentCursor(pageA);
    await pageA.evaluate((metadataKey) => {
      const original = Storage.prototype.setItem;
      let failOnce = true;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (failOnce && key === metadataKey) {
          failOnce = false;
          throw new DOMException("Simulated sync metadata persistence failure", "QuotaExceededError");
        }
        return original.call(this, key, value);
      };
    }, PROGRESS_SYNC_METADATA_KEY);
    await pageA.getByRole("button", { name: "Sync now" }).click();
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("could not synchronize");
    expect(await currentCursor(pageA)).toBe(cursorBefore);
    await expectIds(pageA, [cursorFailureEvent.eventId]);
    await pageA.getByRole("button", { name: "Sync now" }).click();
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");
    expect(await currentCursor(pageA)).not.toBe(cursorBefore);

    await contextA.setOffline(true);
    await appendLocal(pageA, offlineEvent);
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("Offline");
    await expectIds(pageA, [offlineEvent.eventId]);
    await contextA.setOffline(false);
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("synchronized with the account");

    const pushesBeforeDifferentAccount = deviceAPushes;
    await pageA.evaluate((metadataKey) => {
      const metadata = JSON.parse(localStorage.getItem(metadataKey)!);
      metadata.lastAssociatedAccountFingerprint = "Z".repeat(43);
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
    }, PROGRESS_SYNC_METADATA_KEY);
    await pageA.reload();
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("different account");
    expect(deviceAPushes).toBe(pushesBeforeDifferentAccount);
    await pageA.setViewportSize({ width: 390, height: 844 });
    await expect(pageA.getByTestId("progress-sync-panel")).toBeVisible();
    await pageA.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
    await expect(pageA.getByText("A browser reset does not delete evidence already synchronized to an account.")).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

async function signIn(page: import("@playwright/test").Page) {
  const email = process.env.STEMFORGE_AUTH_TEST_EMAIL;
  const password = process.env.STEMFORGE_AUTH_TEST_PASSWORD;
  if (!email || !password) throw new Error("Dedicated authentication test credentials are required.");
  await page.goto("/account/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account(?:\?|$)/);
  await expect(page.getByText("Account ready")).toBeVisible();
}

async function seed(page: import("@playwright/test").Page, attempts: unknown[]) {
  await page.goto("/");
  await page.evaluate(({ key, attempts }) => localStorage.setItem(key, JSON.stringify({ version: 4, data: { attempts, supportEvents: [], achievementSnapshots: [] } })), { key: STORAGE_KEY, attempts });
}

async function appendLocal(page: import("@playwright/test").Page, attempt: unknown) {
  await page.evaluate(({ key, attempt }) => {
    const payload = JSON.parse(localStorage.getItem(key)!);
    payload.data.attempts.push(attempt);
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("stemforge:local-progress-updated"));
  }, { key: STORAGE_KEY, attempt });
}

async function ids(page: import("@playwright/test").Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).data.attempts.map((item: { eventId: string }) => item.eventId).sort(), STORAGE_KEY);
}

async function expectIds(page: import("@playwright/test").Page, expected: string[]) {
  await expect.poll(() => ids(page)).toEqual(expect.arrayContaining(expected));
}

async function currentCursor(page: import("@playwright/test").Page) {
  return page.evaluate((key) => {
    const metadata = JSON.parse(localStorage.getItem(key)!);
    return metadata.accounts[metadata.lastAssociatedAccountFingerprint]?.lastPulledCursor ?? null;
  }, PROGRESS_SYNC_METADATA_KEY);
}

function watchErrors(page: import("@playwright/test").Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
}
