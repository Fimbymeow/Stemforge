import { expect, test } from "./fixtures/test";
import { CELEBRATION_STORAGE_KEY } from "../lib/completion-tracking";
import { EVIDENCE_PROVENANCE_KEY } from "../lib/progress/evidence-provenance";
import { PROGRESS_IMPORT_METADATA_KEY } from "../lib/progress/import-metadata";
import { PROGRESS_STORAGE_KEY } from "../lib/progress/storage";
import { PROGRESS_SYNC_METADATA_KEY } from "../lib/progress/sync-protocol";
import { QUESTION_ANSWERS, QUESTION_IDS } from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("shared browser keeps or removes account data deliberately without affecting remote evidence", async ({ browser }) => {
  const sharedContext = await browser.newContext();
  const remoteContext = await browser.newContext();
  const shared = await sharedContext.newPage();
  const remote = await remoteContext.newPage();
  const errors: string[] = [];
  const expectedUnauthorized = { count: 0 };
  watchErrors(shared, errors, expectedUnauthorized);
  watchErrors(remote, errors);
  try {
    await openQuestion(shared, QUESTION_IDS[0]);
    await submitAnswer(shared, QUESTION_ANSWERS[QUESTION_IDS[0]]);
    const anonymousId = (await ids(shared))[0];
    expect(await sourceFor(shared, anonymousId)).toBe("local_anonymous");

    await signIn(remote);
    await remote.getByRole("button", { name: "Enable synchronization" }).click();
    await expect(remote.getByTestId("progress-sync-panel")).toContainText("can sync with your account");
    await openQuestion(remote, QUESTION_IDS[1]);
    await submitAnswer(remote, QUESTION_ANSWERS[QUESTION_IDS[1]]);
    const remoteId = (await ids(remote))[0];
    await remote.goto("/account");
    await remote.getByRole("button", { name: "Sync now" }).click();
    await expect(remote.getByTestId("progress-sync-panel")).toContainText("can sync with your account");

    await signIn(shared);
    let sharedPushes = 0;
    shared.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/progress/sync/push")) sharedPushes += 1;
    });
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("Confirm before");
    expect(sharedPushes).toBe(0);
    await shared.getByRole("button", { name: "Enable synchronization" }).click();
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("can sync with your account");
    await expect.poll(() => ids(shared)).toEqual(expect.arrayContaining([anonymousId, remoteId]));
    expect(await sourceFor(shared, anonymousId)).toBe("local_anonymous");
    expect(await sourceFor(shared, remoteId)).toBe("remote_pull");
    await remote.goto("/account");
    await remote.getByRole("button", { name: "Sync now" }).click();
    await expect.poll(() => ids(remote)).toEqual(expect.arrayContaining([anonymousId, remoteId]));
    await remote.getByRole("button", { name: "Pause sync" }).click();

    await shared.getByRole("button", { name: "Sign out and keep progress on this browser" }).click();
    await expect(shared).toHaveURL(/\/account\/sign-in/);
    await expect.poll(() => ids(shared)).toEqual(expect.arrayContaining([anonymousId, remoteId]));
    await signIn(shared);
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("can sync with your account");
    await expect(shared.getByRole("button", { name: "Enable synchronization" })).toHaveCount(0);

    const beforeExpiry = await shared.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY);
    await shared.route("**/api/progress/sync/pull*", async (route) => {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ protocolVersion: 1, error: "sign_in_required", message: "Sign in required." }) });
    });
    await shared.getByRole("button", { name: "Sync now" }).click();
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("Sign in again to continue syncing");
    expect(await shared.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY)).toBe(beforeExpiry);
    await shared.unroute("**/api/progress/sync/pull*");
    await shared.reload();
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("can sync with your account");

    await shared.getByRole("button", { name: "Remove this account's data from this browser, then sign out" }).click();
    await expect(shared.getByRole("button", { name: "Cancel" }).last()).toBeFocused();
    await shared.getByRole("button", { name: "Remove and sign out" }).click();
    await expect(shared).toHaveURL(/\/account\/sign-in/);
    expect(await ids(shared)).toEqual([anonymousId]);
    expect(await sourceFor(shared, anonymousId)).toBe("local_anonymous");
    await expect.poll(() => ids(remote)).toEqual(expect.arrayContaining([anonymousId, remoteId]));

    await signIn(shared);
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("Confirm before");
    const pushesBeforeMismatch = sharedPushes;
    await shared.evaluate((key) => {
      const fingerprint = "B".repeat(43);
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        lastAssociatedAccountFingerprint: fingerprint,
        accounts: { [fingerprint]: {
          syncEnabled: true, associationConfirmed: true, acknowledged: {}, lastPulledCursor: null,
          lastSuccessfulPushAt: null, lastSuccessfulPullAt: null, lastFullyCaughtUpAt: null,
          permanentlyRejected: {}, retry: { consecutiveFailures: 0, nextRetryAt: null, lastFailureKind: null },
        } },
      }));
    }, PROGRESS_SYNC_METADATA_KEY);
    await shared.reload();
    await expect(shared.getByTestId("progress-sync-panel")).toContainText("associated with another account");
    expect(sharedPushes).toBe(pushesBeforeMismatch);

    await shared.evaluate((key) => localStorage.setItem(key, JSON.stringify({ version: 1, data: { paths: {} } })), CELEBRATION_STORAGE_KEY);
    await shared.setViewportSize({ width: 390, height: 844 });
    await expect(shared.getByTestId("account-data-controls")).toBeVisible();
    await shared.getByRole("button", { name: "Clear all STEM Forge progress from this browser" }).click();
    await expect(shared.getByRole("button", { name: "Cancel" }).last()).toBeFocused();
    await shared.getByRole("button", { name: "Confirm removal" }).click();
    await expect(shared.getByRole("status")).toContainText("cleared from this browser");
    const cleared = await shared.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])), [
      PROGRESS_STORAGE_KEY, EVIDENCE_PROVENANCE_KEY, PROGRESS_SYNC_METADATA_KEY, PROGRESS_IMPORT_METADATA_KEY, CELEBRATION_STORAGE_KEY,
    ]);
    expect(Object.values(cleared).every((value) => value === null)).toBe(true);
    await expect.poll(() => ids(remote)).toEqual(expect.arrayContaining([anonymousId, remoteId]));
    expect(expectedUnauthorized.count).toBe(1);
    expect(errors).toEqual([]);
  } finally {
    await sharedContext.close();
    await remoteContext.close();
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

async function ids(page: import("@playwright/test").Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw).data.attempts.map((item: { eventId: string }) => item.eventId).sort();
  }, PROGRESS_STORAGE_KEY);
}

async function sourceFor(page: import("@playwright/test").Page, eventId: string) {
  return page.evaluate(({ key, reference }) => JSON.parse(localStorage.getItem(key)!).records[reference]?.source, {
    key: EVIDENCE_PROVENANCE_KEY,
    reference: `attempt:${eventId}`,
  });
}

function watchErrors(page: import("@playwright/test").Page, errors: string[], expectedUnauthorized?: { count: number }) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() !== "error") return;
    if (expectedUnauthorized && /401 \(Unauthorized\)/.test(text)) {
      expectedUnauthorized.count += 1;
      return;
    }
    errors.push(`console: ${text}`);
  });
}
