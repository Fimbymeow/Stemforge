import { expect, test } from "./fixtures/test";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { CELEBRATION_STORAGE_KEY } from "../lib/completion-tracking";
import { EVIDENCE_PROVENANCE_KEY } from "../lib/progress/evidence-provenance";
import { PROGRESS_IMPORT_METADATA_KEY } from "../lib/progress/import-metadata";
import { PROGRESS_STORAGE_KEY } from "../lib/progress/storage";
import { PROGRESS_SYNC_METADATA_KEY } from "../lib/progress/sync-protocol";
import { currentAttempt, QUESTION_ANSWERS, QUESTION_IDS } from "./fixtures/progress";
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

test("confirmed remote learning-data erasure exports, deletes and reconciles stale devices", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const errors: string[] = [];
  watchErrors(pageA, errors);
  watchErrors(pageB, errors);
  const remoteAttempt = currentAttempt(QUESTION_IDS[2], 51, { eventId: "attempt_remote_erasure_real" });
  try {
    await seed(pageA, [remoteAttempt]);
    await signIn(pageA);
    await pageA.getByRole("button", { name: "Enable synchronization" }).click();
    await expect(pageA.getByTestId("progress-sync-panel")).toContainText("can sync with your account");
    await expect.poll(() => remoteEventIds(), { timeout: 20_000 }).toContain(remoteAttempt.eventId);

    await signIn(pageB);
    await pageB.getByRole("button", { name: "Enable synchronization" }).click();
    await pageB.getByRole("button", { name: "Sync now" }).click();
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("can sync with your account");
    await expect.poll(() => ids(pageB)).toContain(remoteAttempt.eventId);
    await pageB.getByRole("button", { name: "Pause sync" }).click();
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("Sync is paused");

    const password = requiredPassword();
    await pageA.getByLabel("Current password").fill(password);
    const exportDownload = pageA.waitForEvent("download");
    await pageA.getByRole("button", { name: "Download remote account learning data" }).click();
    const downloaded = await exportDownload;
    expect(downloaded.suggestedFilename()).toMatch(/^stem-forge-account-data-\d{4}-\d{2}-\d{2}\.json$/);
    const exportPath = await downloaded.path();
    expect(exportPath).toBeTruthy();
    const exported = JSON.parse(await readFile(exportPath!, "utf8"));
    expect(exported.records.some((record: { eventId: string }) => record.eventId === remoteAttempt.eventId)).toBe(true);

    await pageA.getByRole("button", { name: "Start deletion" }).click();
    await expect(pageA.getByText("Confirm your identity again before continuing.")).toBeVisible();
    await pageA.getByLabel("Current password").fill("");
    await pageA.getByLabel("Current password").fill(password);
    await expect(pageA.getByRole("button", { name: "Confirm password" })).toBeEnabled();
    await pageA.getByRole("button", { name: "Confirm password" }).click();
    await pageA.getByLabel("Type DELETE MY LEARNING DATA to confirm.").fill("DELETE MY LEARNING DATA");
    await pageA.getByRole("button", { name: "Schedule deletion" }).click();
    await expect(pageA.getByRole("status")).toContainText("Deletion will begin in 10 minutes");
    await fastForwardScheduledErasure();
    await expect.poll(async () => {
      const response = await pageA.request.get("/api/account-data/erasure");
      const body = await response.json();
      return body.request?.status;
    }, { timeout: 20_000 }).toBe("completed");
    await pageA.reload();
    await expect(pageA.getByTestId("account-learning-data")).toContainText("Remote learning progress was deleted");

    const emptyExport = await pageA.request.post("/api/account-data/export", { headers: { Origin: new URL(pageA.url()).origin }, data: { password } });
    expect(emptyExport.ok()).toBe(true);
    expect((await emptyExport.json()).records).toEqual([]);

    await pageB.goto("/account");
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("older account progress to review");
    expect(await ids(pageB)).toContain(remoteAttempt.eventId);
    await pageB.getByRole("button", { name: "Reconcile this browser" }).click();
    await expect(pageB.getByTestId("account-learning-data")).toContainText("browser's cleanup are complete");
    expect(await ids(pageB)).not.toContain(remoteAttempt.eventId);
    await pageB.getByRole("button", { name: "Enable synchronization" }).click();
    await expect(pageB.getByTestId("progress-sync-panel")).toContainText("can sync with your account");
    const stillEmpty = await pageB.request.post("/api/account-data/export", { headers: { Origin: new URL(pageB.url()).origin }, data: { password } });
    expect(stillEmpty.ok()).toBe(true);
    expect((await stillEmpty.json()).records).toEqual([]);
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
  await page.waitForURL((url) => url.pathname === "/account" || (url.pathname === "/account/sign-in" && url.searchParams.has("result")), { timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe("/account");
  await expect(page.getByText("Account ready")).toBeVisible();
}

async function ids(page: import("@playwright/test").Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw).data.attempts.map((item: { eventId: string }) => item.eventId).sort();
  }, PROGRESS_STORAGE_KEY);
}

async function seed(page: import("@playwright/test").Page, attempts: unknown[]) {
  await page.goto("/");
  await page.evaluate(({ key, attempts }) => {
    localStorage.setItem(key, JSON.stringify({ version: 4, data: { attempts, supportEvents: [], achievementSnapshots: [] } }));
  }, { key: PROGRESS_STORAGE_KEY, attempts });
}

function requiredPassword() {
  const password = process.env.STEMFORGE_AUTH_TEST_PASSWORD;
  if (!password) throw new Error("Dedicated authentication test credentials are required.");
  return password;
}

async function fastForwardScheduledErasure() {
  const connectionString = process.env.STEMFORGE_DATABASE_URL;
  if (!connectionString) throw new Error("The disposable evidence database URL is required for real account-safety verification.");
  const pool = new Pool({ connectionString });
  try {
    await pool.query("UPDATE stemforge_account_data.requests SET cancellation_deadline = clock_timestamp() - interval '1 second' WHERE status = 'scheduled'");
  } finally {
    await pool.end();
  }
}

async function remoteEventIds() {
  const connectionString = process.env.STEMFORGE_DATABASE_URL;
  if (!connectionString) throw new Error("The disposable evidence database URL is required for real account-safety verification.");
  const pool = new Pool({ connectionString });
  try {
    const result = await pool.query<{ event_id: string }>(`
      SELECT event_id FROM stemforge_remote.question_attempts
      UNION ALL SELECT event_id FROM stemforge_remote.support_events
      UNION ALL SELECT event_id FROM stemforge_remote.achievement_snapshots
      UNION ALL SELECT event_id FROM stemforge_remote.evidence_conflicts
    `);
    return result.rows.map((row) => row.event_id);
  } finally {
    await pool.end();
  }
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
    errors.push(`console: ${text} ${message.location().url}`);
  });
}
