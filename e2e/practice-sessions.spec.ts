import { expect, test } from "./fixtures/test";
import { QUESTION_ANSWERS, readStoredProgress, STORAGE_KEY } from "./fixtures/progress";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";

test("guest targeted practice starts, uses the canonical question workspace, persists, and summarizes", async ({ page }) => {
  const errors: string[] = [];
  watchErrors(page, errors);
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practice sessions" })).toBeVisible();
  await expect(page.getByText(/eligible question/i)).toBeVisible();
  await page.getByRole("button", { name: /Start session/i }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  await expect(page.getByTestId("practice-session-panel")).toContainText(/Question 1 of/);
  await expect(page.getByRole("heading", { name: "Differentiate a power" })).toBeVisible();

  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const progress = await readStoredProgress(page);
  const payload = progress as { data: { attempts: Array<{ questionId: string; isCorrect: boolean }> } };
  expect(payload.data.attempts).toHaveLength(1);
  expect(payload.data.attempts[0]).toMatchObject({ questionId: "hm-calc-diff-basic-f-001", isCorrect: true });

  await page.getByRole("button", { name: /Next/i }).click();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 2 of");
  await page.reload();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 2 of");
  await page.getByTestId("practice-session-panel").getByRole("button", { name: "Previous" }).click();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of");
  await page.getByRole("button", { name: /Finish session/i }).click();
  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  await expect(page.getByText("Attempted")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry incorrect" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("completed-session retry contains exactly that session's incorrect questions", async ({ page }) => {
  await page.goto("/practice");
  await page.getByLabel("Requested questions").fill("2");
  await page.getByRole("button", { name: /Start session/i }).click();
  const references = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    return store.sessions[0].questionReferences.map((reference: { questionId: string }) => reference.questionId) as string[];
  }, PRACTICE_SESSIONS_STORAGE_KEY);

  await page.getByLabel("Your answer").fill("definitely wrong");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  await page.getByTestId("practice-session-panel").getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Your answer").fill(QUESTION_ANSWERS[references[1] as keyof typeof QUESTION_ANSWERS]);
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.getByRole("button", { name: /Finish session/i }).click();

  const retry = page.getByRole("button", { name: "Retry incorrect" });
  await retry.focus();
  await expect(retry).toBeFocused();
  await retry.press("Enter");
  await expect(page).toHaveURL(/\/practice\/session\//);
  const retryState = await page.evaluate(({ sessionKey, progressKey }) => {
    const store = JSON.parse(localStorage.getItem(sessionKey)!);
    const active = store.sessions.find((session: { status: string }) => session.status === "active");
    const progress = JSON.parse(localStorage.getItem(progressKey)!);
    return {
      mode: active.mode,
      questionIds: active.questionReferences.map((reference: { questionId: string }) => reference.questionId),
      attemptCount: progress.data.attempts.length,
    };
  }, { sessionKey: PRACTICE_SESSIONS_STORAGE_KEY, progressKey: STORAGE_KEY });
  expect(retryState).toEqual({ mode: "retry_incorrect", questionIds: [references[0]], attemptCount: 2 });
});

test("retry-incorrect appears after an incorrect attempt and later correct removes it", async ({ page }) => {
  await page.goto("/practice");
  const initiallyUnavailable = page.getByRole("button", { name: /Retry incorrect/i });
  await expect(initiallyUnavailable).toBeDisabled();
  await expect(initiallyUnavailable).toContainText(/There are no current-version incorrect attempts/i);
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await page.getByLabel("Your answer").fill("x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  await page.goto("/practice");
  await page.getByRole("button", { name: /Retry incorrect/i }).click();
  await expect(page.getByText(/1 eligible question/i)).toBeVisible();
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.goto("/practice");
  const noLongerAvailable = page.getByRole("button", { name: /Retry incorrect/i });
  await expect(noLongerAvailable).toBeDisabled();
  await expect(noLongerAvailable).toContainText(/There are no current-version incorrect attempts/i);
});

test("timed practice expires without submitting blank answers and mobile layout has no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice");
  await page.getByLabel("Timed session").check();
  await page.getByRole("button", { name: /Start session/i }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    const session = store.sessions[0];
    session.timing = { type: "timed", timeLimitSeconds: 1, elapsedSeconds: 1 };
    session.updatedAt = new Date(Date.now() - 2000).toISOString();
    localStorage.setItem(key, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("stemforge:practice-session-updated"));
  }, PRACTICE_SESSIONS_STORAGE_KEY);
  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  await expect(page.getByText(/No blank answers were submitted automatically/i)).toBeVisible();
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(raw).toBeNull();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

function watchErrors(page: import("@playwright/test").Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
}
