import { expect, test } from "./fixtures/test";
import { contentResolver } from "../lib/content-resolver";
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
  const reviewEntry = page.getByTestId("review-entry-card");
  await expect(reviewEntry).toContainText("Basic differentiation is ready to review.");
  await reviewEntry.getByRole("link", { name: "Start Review for 1 skill" }).click();
  await expect(page).toHaveURL(/\/practice\?review=1$/);
  const card = page.getByTestId("review-launch-card");
  await expect(card).toContainText("1 skill due");
  await expect(card).toContainText("6 questions ready");
  await card.getByRole("button", { name: "Start Review" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/[^?]+$/);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Review");
  await expect(page.getByTestId("practice-session-panel").getByRole("link", { name: "Review" })).toHaveAttribute("href", reviewHref);
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

test("both due skills create a mixed Review that exposes the current skill and keeps a combined return", async ({ page, seriousBrowserErrors }) => {
  const basicPath = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  const chainPath = contentResolver.getPathContext("chain-rule")!.skillPath;
  await seedStoredProgress(page, v3Payload([
    ...completedAttempts(basicPath.slug, 0),
    ...completedAttempts(chainPath.slug, 100),
  ]));

  await page.goto("/subjects/higher-maths");
  const reviewEntry = page.getByTestId("review-entry-card");
  await expect(reviewEntry).toContainText("Review is due across 2 skills.");
  await reviewEntry.getByRole("link", { name: "Start Review across 2 skills" }).click();
  await expect(page).toHaveURL(/\/practice\?review=1$/);
  const card = page.getByTestId("review-launch-card");
  await expect(card).toContainText("2 skills due");
  await card.getByRole("button", { name: "Start Review" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/[^?]+$/);

  const panel = page.getByTestId("practice-session-panel");
  await expect(panel.getByTestId("review-current-skill")).toHaveText("Basic differentiation");
  await panel.getByRole("button", { name: "Next question" }).click();
  await expect(panel.getByTestId("review-current-skill")).toHaveText("Chain rule");
  await expect(panel.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/practice?review=1");
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

function completedAttempts(pathId: string, sequenceOffset: number) {
  const path = contentResolver.getPathContext(pathId)!.skillPath;
  const ids = (path.learningStages ?? []).flatMap((stage) => stage.questionIds);
  return ids.map((id, index) => {
    const context = contentResolver.getQuestionContext(id)!;
    return currentAttempt(id, sequenceOffset + index + 1, {
      eventId: `attempt_e2e_${pathId}_${index}`,
      skillPathId: pathId,
      stageId: context.stage.id,
      attemptedAt: new Date(Date.parse("2026-07-01T10:00:00.000Z") + (sequenceOffset + index) * 60_000).toISOString(),
      versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    });
  });
}
