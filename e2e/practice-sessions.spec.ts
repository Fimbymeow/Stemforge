import { expect, test } from "./fixtures/test";
import { QUESTION_ANSWERS, readStoredProgress, STORAGE_KEY } from "./fixtures/progress";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";

test("guest targeted practice starts, uses the canonical question workspace, persists, and summarizes", async ({ page }) => {
  const errors: string[] = [];
  watchErrors(page, errors);
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practise Higher Maths" })).toBeVisible();
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  await expect(page.getByTestId("practice-session-panel")).toContainText(/Question 1 of/);
  await expect(page.getByRole("heading", { name: "Differentiate a power" })).toBeVisible();

  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const progress = await readStoredProgress(page);
  const payload = progress as { data: { attempts: Array<{ questionId: string; isCorrect: boolean; practiceSessionId?: string }> } };
  expect(payload.data.attempts).toHaveLength(1);
  expect(payload.data.attempts[0]).toMatchObject({ questionId: "hm-calc-diff-basic-f-001", isCorrect: true });
  expect(payload.data.attempts[0].practiceSessionId).toBeTruthy();

  await page.getByRole("button", { name: /Next/i }).click();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 2 of");
  await page.reload();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 2 of");
  await page.getByTestId("practice-session-panel").getByRole("button", { name: "Previous" }).click();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of");
  await page.getByRole("button", { name: /Finish session/i }).click();
  await expect(page.getByRole("dialog", { name: "Finish this session?" })).toBeVisible();
  await page.getByRole("dialog", { name: "Finish this session?" }).getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  await expect(page.getByText("Unanswered", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry incorrect" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("question list, reversible Skip and 320px session chrome remain usable without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  const taskHeadingBox = await page.getByRole("heading", { name: "Differentiate a power" }).boundingBox();
  expect(taskHeadingBox).not.toBeNull();
  expect(taskHeadingBox!.y).toBeLessThan(700);
  await page.setViewportSize({ width: 320, height: 568 });
  const panel = page.getByTestId("practice-session-panel");
  await panel.getByRole("button", { name: /Question 1 of/i }).click();
  const list = page.getByRole("dialog", { name: "Session questions" });
  await expect(list).toBeVisible();
  await list.getByRole("button", { name: /Question 2:/i }).click();
  await expect(panel).toContainText("Question 2 of");
  await panel.getByRole("button", { name: "Skip" }).click();
  await expect(panel).toContainText("Question 3 of");
  await panel.getByRole("button", { name: "Previous question" }).click();
  await panel.getByRole("button", { name: "Undo Skip" }).click();
  const geometry = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    finishVisible: Boolean([...document.querySelectorAll("button")].find((button) => button.textContent?.includes("Finish session"))?.getBoundingClientRect().width),
  }));
  expect(geometry).toEqual({ overflow: false, finishVisible: true });
});

test("Practice Session retains malformed and unmarkable interactions without treating them as incorrect", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  const input = page.getByLabel("Your answer");
  await input.fill("5x^");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Answer format could not be read");
  await page.getByRole("button", { name: "Try again" }).click();
  await input.fill("y=5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("This form cannot be checked safely");

  const stored = await readStoredProgress(page) as { data: { attempts: Array<{ outcomeKind: string; practiceSessionId?: string }> } };
  expect(stored.data.attempts.map((attempt) => attempt.outcomeKind)).toEqual(["malformed", "unmarkable"]);
  expect(stored.data.attempts.every((attempt) => Boolean(attempt.practiceSessionId))).toBe(true);

  await page.getByRole("button", { name: "Finish session" }).click();
  await page.getByRole("dialog", { name: "Finish this session?" }).getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry incorrect" })).toHaveCount(0);
});

test("standalone Question Workspace keeps its footer and writes no session identity", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await expect(page.getByTestId("practice-session-panel")).toHaveCount(0);
  await expect(page.getByTestId("next-question-locked")).toBeVisible();
  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const progress = await readStoredProgress(page) as { data: { attempts: Array<Record<string, unknown>> } };
  expect(Object.hasOwn(progress.data.attempts[0], "practiceSessionId")).toBe(false);
});

test("completed-session retry contains exactly that session's incorrect questions", async ({ page }) => {
  await page.goto("/practice");
  await page.getByText("Choose practice options", { exact: true }).click();
  await page.getByText("Advanced options", { exact: true }).click();
  await page.getByLabel("Requested questions").fill("2");
  await page.getByRole("button", { name: "Start configured practice" }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const references = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    return store.sessions[0].questionReferences.map((reference: { questionId: string }) => reference.questionId) as string[];
  }, PRACTICE_SESSIONS_STORAGE_KEY);

  await page.getByLabel("Your answer").fill("4x^5");
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
  const completedSessionUrl = page.url();
  await retry.press("Enter");
  await expect.poll(() => page.url()).not.toBe(completedSessionUrl);
  await expect(page).toHaveURL(/\/practice\/session\//);
  const retrySessionId = page.url().split("/").pop();
  const retryState = await page.evaluate(({ sessionKey, progressKey, retrySessionId }) => {
    const store = JSON.parse(localStorage.getItem(sessionKey)!);
    const active = store.sessions.find((session: { sessionId: string }) => session.sessionId === retrySessionId);
    const progress = JSON.parse(localStorage.getItem(progressKey)!);
    return {
      status: active.status,
      activeSessionId: store.activeSessionId,
      mode: active.mode,
      questionIds: active.questionReferences.map((reference: { questionId: string }) => reference.questionId),
      attemptCount: progress.data.attempts.length,
    };
  }, { sessionKey: PRACTICE_SESSIONS_STORAGE_KEY, progressKey: STORAGE_KEY, retrySessionId });
  expect(retryState).toEqual({
    status: "active",
    activeSessionId: retrySessionId,
    mode: "retry_incorrect",
    questionIds: [references[0]],
    attemptCount: 2,
  });
});

test("Needs more practice appears only after relevant progress and later correct work removes it", async ({ page }) => {
  await page.goto("/practice");
  await page.getByText("Choose practice options", { exact: true }).click();
  await expect(page.getByRole("button", { name: /Needs more practice/i })).toHaveCount(0);
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await page.getByLabel("Your answer").fill("x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  await page.goto("/practice");
  await page.getByText("Choose practice options", { exact: true }).click();
  await page.getByRole("button", { name: /Needs more practice/i }).click();
  await expect(page.getByText(/1 question is currently available/i)).toBeVisible();
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.goto("/practice");
  await page.getByText("Choose practice options", { exact: true }).click();
  await expect(page.getByRole("button", { name: /Needs more practice/i })).toHaveCount(0);
});

test("timed practice expires without submitting blank answers and mobile layout has no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice");
  await page.getByText("Choose practice options", { exact: true }).click();
  await page.getByText("Advanced options", { exact: true }).click();
  await page.getByLabel("Timed session").check();
  await page.getByRole("button", { name: "Start configured practice" }).click();
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
  await expect(page.getByText(/Blank answers were never submitted automatically/i)).toBeVisible();
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(raw).toBeNull();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

function watchErrors(page: import("@playwright/test").Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
}
