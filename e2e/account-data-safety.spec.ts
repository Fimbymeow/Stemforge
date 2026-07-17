import { expect, test } from "./fixtures/test";
import { EVIDENCE_PROVENANCE_KEY } from "../lib/progress/evidence-provenance";
import { currentAttempt, QUESTION_ANSWERS, QUESTION_IDS, STORAGE_KEY } from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("auth-disabled learning records anonymous provenance and keeps reset wording truthful", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  const sources = await page.evaluate((key) => {
    const metadata = JSON.parse(localStorage.getItem(key)!);
    return Object.values(metadata.records).map((entry) => (entry as { source: string }).source);
  }, EVIDENCE_PROVENANCE_KEY);
  expect(sources.length).toBeGreaterThan(0);
  expect(sources.every((source) => source === "local_anonymous")).toBe(true);

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByText(/Historical achievements may remain/)).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Progress already synced to your account is not deleted");
    await dialog.dismiss();
  });
  await page.getByTestId("reset-progress").click();
});

test("auth-disabled account page exports current browser data without account configuration", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/");
  await page.evaluate(({ progressKey, attempt }) => {
    localStorage.setItem(progressKey, JSON.stringify({ version: 4, data: { attempts: [attempt], supportEvents: [], achievementSnapshots: [] } }));
  }, { progressKey: STORAGE_KEY, attempt: currentAttempt(QUESTION_IDS[0], 1, { eventId: "attempt_guest_browser_export" }) });
  await page.goto("/account");
  await expect(page.getByText("Accounts are not available")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download this browser's data" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^stem-forge-browser-data-\d{4}-\d{2}-\d{2}\.json$/);
  expect(seriousBrowserErrors).toEqual([]);
});
