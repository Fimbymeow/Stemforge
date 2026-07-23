import { higherMaths } from "../data/higher-maths";
import { contentResolver } from "../lib/content-resolver";
import { createPracticeQuestionReference } from "../lib/practice/practice-eligibility";
import type { PracticeSession, PracticeSessionStore } from "../lib/practice/practice-types";
import { test, expect } from "./fixtures/test";
import {
  QUESTION_ANSWERS,
  QUESTION_IDS,
  STAGE_CELEBRATION_STORAGE_KEY,
  currentAttempt,
  seedStoredProgress,
  v3Payload,
} from "./fixtures/progress";
import { expectNoHorizontalOverflow, openQuestion, submitAnswer } from "./fixtures/student-actions";

const PRACTICE_SESSIONS_STORAGE_KEY = "stemforge.practiceSessions.v1";
const skillPath = higherMaths.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
if (!skillPath) throw new Error("Basic differentiation test path is missing");

const FOUNDATIONS_IDS = QUESTION_IDS.slice(0, 3);
const FINAL_QUESTION_ID = QUESTION_IDS.at(-1)!;

function priorAttempts(ids: readonly string[]) {
  return ids.map((id, index) => currentAttempt(id, index + 1));
}

async function seedPracticeSession(page: import("@playwright/test").Page, questionIds: readonly string[]) {
  await page.goto("/");
  const now = new Date().toISOString();
  const sessionId = await page.evaluate(
    ({ key, refs, timestamp }) => {
      const session = {
        schemaVersion: 1,
        sessionId: `e2e-session-${Date.now()}`,
        mode: "targeted",
        courseId: "calculus",
        selectedPathIds: ["basic-differentiation"],
        questionReferences: refs,
        currentQuestionIndex: 0,
        startedAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
        status: "active",
        timing: { type: "untimed" },
        selectionMetadata: {
          seed: "e2e",
          requestedCount: refs.length,
          availableCount: refs.length,
          selectedCount: refs.length,
          fullySatisfied: true,
          shortageReason: null,
          excludedByReason: {},
          includedPathIds: ["basic-differentiation"],
          createdAt: timestamp,
        },
      };
      const store = { schemaVersion: 1, activeSessionId: session.sessionId, sessions: [session] };
      window.localStorage.setItem(key, JSON.stringify(store));
      return session.sessionId;
    },
    { key: PRACTICE_SESSIONS_STORAGE_KEY, refs: questionIds.map((id) => createPracticeQuestionReference(contentResolver.getQuestion(id)!)), timestamp: now },
  );
  return sessionId as string;
}

test("completing a stage without completing the whole path shows a one-time stage-completion moment", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorAttempts(FOUNDATIONS_IDS.slice(0, 2))));
  await openQuestion(page, FOUNDATIONS_IDS[2]);
  await submitAnswer(page, QUESTION_ANSWERS[FOUNDATIONS_IDS[2] as keyof typeof QUESTION_ANSWERS]);

  const stagePanel = page.getByTestId("stage-completion-panel");
  await expect(stagePanel).toBeVisible();
  // Three independently-correct answers reach the "mastered" stage tier, not merely "completed" —
  // assert on the stage name and a valid tier suffix rather than over-specifying the exact tier.
  await expect(stagePanel.getByRole("heading", { name: /^Foundations (complete|secure|mastered)$/ })).toBeVisible();
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);

  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null"), STAGE_CELEBRATION_STORAGE_KEY);
  expect(stored?.data?.paths?.["basic-differentiation:basic-diff-stage-foundations"]?.lastAcknowledgedStatus).toBeTruthy();

  // Revisit must not replay the one-time moment.
  await openQuestion(page, FOUNDATIONS_IDS[1]);
  await expect(page.getByTestId("stage-completion-panel")).toHaveCount(0);
});

test("completing the whole path in one submission shows only the path panel, never a stacked stage panel", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorAttempts(QUESTION_IDS.slice(0, -1))));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID as keyof typeof QUESTION_ANSWERS]);

  await expect(page.getByTestId("path-completion-panel")).toBeVisible();
  await expect(page.getByTestId("stage-completion-panel")).toHaveCount(0);
});

test("a path completed through a practice session is acknowledged in the practice summary", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorAttempts(QUESTION_IDS.slice(0, -1))));
  const sessionId = await seedPracticeSession(page, [FINAL_QUESTION_ID]);
  await page.goto(`/practice/session/${sessionId}`);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID as keyof typeof QUESTION_ANSWERS]);

  // The path completion panel never renders inside a practice session...
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);

  await page.getByRole("button", { name: /Finish session/i }).click();
  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  const completion = page.getByTestId("practice-summary-path-completion");
  await expect(completion).toBeVisible();
  await expect(completion).toContainText(skillPath.name);
});

test("a fully-correct practice session is acknowledged without inventing mastery", async ({ page }) => {
  await page.goto("/practice");
  await page.getByText("Choose practice options", { exact: true }).click();
  await page.getByText("Advanced options", { exact: true }).click();
  await page.getByLabel("Requested questions").fill("2");
  await page.getByRole("button", { name: "Start configured practice" }).click();
  const references = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!) as PracticeSessionStore;
    return store.sessions[0].questionReferences.map((reference) => reference.questionId);
  }, PRACTICE_SESSIONS_STORAGE_KEY);

  for (const id of references) {
    await page.getByLabel("Your answer").fill(QUESTION_ANSWERS[id as keyof typeof QUESTION_ANSWERS]);
    await page.getByRole("button", { name: "Submit Answer" }).click();
    await expect(page.getByTestId("question-status")).toContainText("Correct");
    const nextButton = page.getByTestId("practice-session-panel").getByRole("button", { name: "Next" });
    if (await nextButton.isEnabled()) await nextButton.click();
  }
  await page.getByRole("button", { name: /Finish session/i }).click();

  await expect(page.getByTestId("practice-summary-fully-correct")).toBeVisible();
  await expect(page.getByTestId("practice-summary-path-completion")).toHaveCount(0);
});

test("a review-recommended question explains why in grounded, non-judgemental terms", async ({ page }) => {
  const questionId = FOUNDATIONS_IDS[0];
  await seedStoredProgress(page, v3Payload([
    currentAttempt(questionId, 1, { hintViewedBeforeSubmission: true }),
  ]));
  await openQuestion(page, questionId);
  const reason = page.getByTestId("review-reason");
  await expect(reason).toBeVisible();
  await expect(reason).toContainText("hint");
  await expect(reason).not.toContainText(/weak|falling behind|diagnos/i);
});

test("reduced motion keeps the stage-completion panel readable, polite and keyboard usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedStoredProgress(page, v3Payload(priorAttempts(FOUNDATIONS_IDS.slice(0, 2))));
  await openQuestion(page, FOUNDATIONS_IDS[2]);
  await submitAnswer(page, QUESTION_ANSWERS[FOUNDATIONS_IDS[2] as keyof typeof QUESTION_ANSWERS]);

  const panel = page.getByTestId("stage-completion-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("role", "status");
  await expect(panel).toHaveAttribute("aria-live", "polite");
  expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const primary = panel.getByTestId("stage-completion-primary-action");
  await primary.focus();
  await expect(primary).toBeFocused();
  await expect(panel).toBeVisible();
});

test("stage-completion panel and accomplishment language fit without overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedStoredProgress(page, v3Payload(priorAttempts(FOUNDATIONS_IDS.slice(0, 2))));
  await openQuestion(page, FOUNDATIONS_IDS[2]);
  await submitAnswer(page, QUESTION_ANSWERS[FOUNDATIONS_IDS[2] as keyof typeof QUESTION_ANSWERS]);

  await expect(page.getByTestId("stage-completion-panel")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/dashboard");
  await expectNoHorizontalOverflow(page);
});

test("stage completion drives the retained dashboard recommendation and denominator without an activity widget", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorAttempts(FOUNDATIONS_IDS.slice(0, 2))));
  await openQuestion(page, FOUNDATIONS_IDS[2]);
  await submitAnswer(page, QUESTION_ANSWERS[FOUNDATIONS_IDS[2] as keyof typeof QUESTION_ANSWERS]);

  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("Begin Applications");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("3 / 8 completed");
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expect(page.getByText(/^Stage Completed$/)).toHaveCount(0);
});
