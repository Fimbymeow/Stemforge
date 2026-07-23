import { expect, test } from "./fixtures/test";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";
import { STORAGE_KEY } from "./fixtures/progress";

test("Quick Practice starts one deterministic untimed session without creating an attempt", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practise Basic differentiation" })).toBeVisible();
  await expect(page.getByLabel("Requested questions")).not.toBeVisible();
  await expect(page.getByLabel("Timed session")).not.toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const stored = await page.evaluate(({ sessionKey, progressKey }) => {
    const store = JSON.parse(localStorage.getItem(sessionKey)!);
    const session = store.sessions.find((item: { sessionId: string }) => item.sessionId === store.activeSessionId);
    return {
      mode: session.mode,
      timing: session.timing,
      count: session.questionReferences.length,
      versions: session.questionReferences.map((reference: { questionVersion: number }) => reference.questionVersion),
      progress: localStorage.getItem(progressKey),
    };
  }, { sessionKey: PRACTICE_SESSIONS_STORAGE_KEY, progressKey: STORAGE_KEY });
  expect(stored).toMatchObject({ mode: "targeted", timing: { type: "untimed" }, count: 6, progress: null });
  expect(stored.versions.every((version: number) => version > 0)).toBe(true);
  expect(seriousBrowserErrors).toEqual([]);
});

test("an active session is resumed instead of replaced", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const sessionUrl = new URL(page.url()).pathname;
  await page.goto("/practice");
  await expect(page.getByTestId("quick-practice-action")).toContainText("Resume Practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(sessionUrl)}$`));
  const activeCount = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    return store.sessions.filter((session: { status: string }) => session.status === "active").length;
  }, PRACTICE_SESSIONS_STORAGE_KEY);
  expect(activeCount).toBe(1);
});

test("Question Bank exposes eight direct questions while future paths stay collapsed", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page.getByRole("heading", { name: "8 matching questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
  await page.getByRole("link", { name: "Open Differentiate a power" }).click();
  await expect(page).toHaveURL(/\/question\/hm-calc-diff-basic-f-001$/);
  expect(seriousBrowserErrors).toEqual([]);
});

test("question and resource links preserve an active-session return without creating evidence", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const sessionUrl = new URL(page.url()).pathname;
  await expect(page.getByRole("link", { name: "Notes: What differentiation does" })).toBeVisible();
  await page.getByRole("link", { name: "Notes: What differentiation does" }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes\?returnTo=.*#basic-diff-note-what-differentiation-does$/);
  await expect(page.getByRole("heading", { name: "What differentiation does" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  await page.getByRole("link", { name: "Return to active practice" }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(sessionUrl)}$`));
});

test("resource pages lead with available content and can start contextual practice", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/subjects/higher-maths/revision-notes");
  const firstNote = page.getByRole("heading", { name: "What differentiation does" });
  await expect(firstNote).toBeVisible();
  const noteBox = await firstNote.boundingBox();
  expect(noteBox).not.toBeNull();
  expect(noteBox!.y).toBeLessThan(1100);
  await expect(page.getByRole("heading", { name: "Power rule", exact: true })).toBeVisible();
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
  await page.getByTestId("notes-practice").getByRole("button", { name: "Practice" }).click();
  await page.getByTestId("practice-chooser-quick").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("question support remains Notes-only before and after an attempt", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await expect(page.getByRole("link", { name: "Notes: What differentiation does" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Worked example:/ })).toHaveCount(0);
  await page.getByLabel("Your answer").fill("wrong");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByRole("link", { name: /Worked example:/ })).toHaveCount(0);
});

test("keyboard users can move from a resource into practice and reach the summary", async ({ page }) => {
  await page.goto("/subjects/higher-maths/revision-notes");
  const practice = page.getByTestId("notes-practice").getByRole("button", { name: "Practice" });
  await practice.focus();
  await expect(practice).toBeFocused();
  await practice.press("Enter");
  await page.getByTestId("practice-chooser-quick").press("Enter");
  await expect(page).toHaveURL(/\/practice\/session\//);
  await page.getByLabel("Your answer").fill("wrong");
  await page.getByRole("button", { name: "Submit Answer" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Not quite yet" })).toBeFocused();
  const finish = page.getByRole("button", { name: "Finish session" });
  await finish.focus();
  await finish.press("Enter");
  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  const retry = page.getByRole("button", { name: "Retry incorrect" });
  await retry.focus();
  await expect(retry).toBeFocused();
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
