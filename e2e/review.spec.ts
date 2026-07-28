import { expect, test } from "./fixtures/test";
import {
  PATH_ID,
  QUESTION_IDS,
  currentAttempt,
  seedStoredProgress,
  v3Payload,
} from "./fixtures/progress";

const reviewHref = `/practice?review=1&path=${PATH_ID}`;

test("due scheduled Review launches the existing Practice Session without console errors", async ({ page, seriousBrowserErrors }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1)),
  ));
  await page.goto("/subjects/higher-maths");
  await page.getByRole("link", { name: "Review 1 skill due" }).click();
  await expect(page).toHaveURL(new RegExp(`${reviewHref.replace(/[?]/g, "\\?")}$`));
  const card = page.getByTestId("review-launch-card");
  await expect(card).toContainText("1 skill due");
  await expect(card).toContainText("6 questions ready");
  await card.getByRole("button", { name: "Start Review" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/[^?]+$/);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Review");
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("stemforge.practiceSessions.v1");
    return raw ? JSON.parse(raw) : null;
  });
  expect(stored.schemaVersion).toBe(3);
  const active = stored.sessions.find((session: { sessionId: string }) => session.sessionId === stored.activeSessionId);
  expect(active.mode).toBe("review");
  expect(active.origin).toBe("scheduled_review");
  expect(active.reviewTargets).toHaveLength(1);
  expect(active.reviewTargets[0].questionIds).toEqual(active.questionReferences.map((item: { questionId: string }) => item.questionId));
  expect(seriousBrowserErrors).toEqual([]);
});

test("recent completion produces a calm zero-due Review state", async ({ page }) => {
  const start = Date.now() - 60_000;
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, {
      attemptedAt: new Date(start + index * 1_000).toISOString(),
    })),
  ));
  await page.goto(reviewHref);
  await expect(page.getByTestId("review-launch-card")).toContainText("Nothing is due right now");
  await expect(page.getByRole("button", { name: "Start Review" })).toHaveCount(0);
});
