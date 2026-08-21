import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";

test("Quick Practice explains its choice and converts duration presets into bounded sessions", async ({ page }) => {
  await page.goto("/practice");
  const card = page.getByTestId("practice-quick-card");
  await expect(card.getByTestId("quick-practice-recommendation")).toContainText("Basic differentiation");
  const durations = card.getByTestId("quick-practice-duration-options");
  await expect(durations.getByRole("button", { name: "20 min" })).toHaveAttribute("aria-pressed", "true");
  await expect(card).toContainText("About 4 questions");
  await durations.getByRole("button", { name: "10 min" }).click();
  await expect(card).toContainText("About 2 questions");
  await card.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const count = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    return store.sessions.find((session: { sessionId: string }) => session.sessionId === store.activeSessionId).questionReferences.length;
  }, PRACTICE_SESSIONS_STORAGE_KEY);
  expect(count).toBe(2);
});

test("a due Review stays advisory while Quick Practice remains available", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((questionId, index) => currentAttempt(questionId, index + 1, {
    attemptedAt: "2026-06-01T10:00:00.000Z",
  }))));
  await page.goto("/practice");
  const card = page.getByTestId("practice-quick-card");
  const advisory = card.getByTestId("quick-practice-review-advisory");
  await expect(advisory).toContainText("Review due: Basic differentiation");
  await expect(advisory.getByRole("link", { name: "Start Review" })).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
  await expect(card.getByTestId("quick-practice-action")).toBeEnabled();
  await expect(card.getByTestId("quick-practice-recommendation")).not.toContainText(/review/i);
});

test("mistake reason and duration controls remain calm and overflow-free at 375px", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([currentAttempt(QUESTION_IDS[0], 1, {
    isCorrect: false,
    answer: "wrong",
    attemptedAt: new Date().toISOString(),
  })]));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/practice");
  const card = page.getByTestId("practice-quick-card");
  await expect(card.getByTestId("quick-practice-recommendation")).toContainText("recent mistake");
  for (const label of ["10 min", "20 min", "30 min"]) await expect(card.getByRole("button", { name: label })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByText("Choose practice options", { exact: true })).toBeVisible();
});
