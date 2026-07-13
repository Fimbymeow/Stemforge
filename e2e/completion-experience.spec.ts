import { calculateSkillPathProgress, getQuestionProgress } from "../lib/progress/calculations";
import { higherMaths } from "../data/higher-maths";
import type { ProgressPayload } from "../lib/progress/types";
import { test, expect } from "./fixtures/test";
import {
  CELEBRATION_STORAGE_KEY,
  PATH_ID,
  QUESTION_ANSWERS,
  QUESTION_IDS,
  STORAGE_KEY,
  currentAttempt,
  readStoredCelebrations,
  readStoredProgress,
  seedStoredCelebrations,
  seedStoredProgress,
  supportEvent,
  v3Payload,
} from "./fixtures/progress";
import { openQuestion, openWorkedSolution, retryAnswer, submitAnswer } from "./fixtures/student-actions";

const PATH_ROUTE = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";
const HUB_ROUTE = "/subjects/higher-maths";
const FINAL_QUESTION_ID = QUESTION_IDS.at(-1)!;
const skillPath = higherMaths.courseAreas[0].specAreas[0].skillPaths?.[0];
if (!skillPath) throw new Error("Basic differentiation test path is missing");

function priorIndependentAttempts() {
  return QUESTION_IDS.slice(0, -1).map((id, index) => currentAttempt(id, index + 1));
}

function allIndependentAttempts() {
  return QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1));
}

function attemptsAfterErrors(questionIds: readonly string[]) {
  return questionIds.flatMap((id, index) => [
    currentAttempt(id, index * 2 + 1, { isCorrect: false, answer: "wrong" }),
    currentAttempt(id, index * 2 + 2),
  ]);
}

function solutionCompletedPayload(questionIds: readonly string[]) {
  return v3Payload(
    questionIds.map((id, index) => currentAttempt(id, index + 1, { isCorrect: false, answer: "wrong" })),
    questionIds.map((id, index) => supportEvent(id, index + 9, "solution_viewed")),
  );
}

function celebrationPayload(
  paths: Record<string, { celebratedAt: string; lastAcknowledgedStatus: "completed" | "secure" | "mastered" }>,
) {
  return { version: 1, data: { paths } };
}

const acknowledgedAt = "2026-07-13T12:00:00.000Z";

test("final-question completion triggers the data-driven acknowledgement once", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);

  const panel = page.getByTestId("path-completion-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Basic differentiation mastered" })).toBeVisible();
  await expect(panel.getByText("Mastered", { exact: true })).toBeVisible();
  await expect(panel).toContainText("8 / 8 completed");
  await expect(panel.getByTestId("path-completion-primary-action")).toBeVisible();

  const stored = await readStoredCelebrations(page) as ReturnType<typeof celebrationPayload>;
  expect(stored.version).toBe(1);
  expect(stored.data.paths[PATH_ID].lastAcknowledgedStatus).toBe("mastered");
  expect(Number.isNaN(Date.parse(stored.data.paths[PATH_ID].celebratedAt))).toBe(false);
});

test("ordinary non-final completion keeps normal feedback without a path celebration", async ({ page }) => {
  const prior = QUESTION_IDS.slice(0, 6).map((id, index) => currentAttempt(id, index + 1));
  await seedStoredProgress(page, v3Payload(prior));
  await openQuestion(page, QUESTION_IDS[6]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[6]]);

  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
  const progress = calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data);
  expect(progress.completedQuestionIds).toHaveLength(7);
  expect(progress.status).toBe("in_progress");
  expect(await readStoredCelebrations(page)).toBeNull();
});

test("refresh does not replay completion and the permanent completed state remains", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);
  await expect(page.getByTestId("path-completion-panel")).toBeVisible();
  const acknowledgement = await readStoredCelebrations(page);

  await page.reload();
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
  expect(await readStoredCelebrations(page)).toEqual(acknowledgement);
  await page.goto(PATH_ROUTE);
  await expect(page.getByTestId("completed-path-card")).toContainText("Basic differentiation mastered");
  await expect(page.getByTestId("path-mastery-status")).toContainText("Mastered");
});

test("navigation away and revisit do not replay the transient celebration", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);
  await expect(page.getByTestId("path-completion-panel")).toBeVisible();

  await page.goto(HUB_ROUTE);
  await expect(page.getByText("Path complete.")).toBeVisible();
  await page.goto(PATH_ROUTE);
  await expect(page.getByTestId("completed-path-card")).toBeVisible();
  await openQuestion(page, FINAL_QUESTION_ID);
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
});

test("solution-assisted final completion is Completed with Review Recommended", async ({ page }) => {
  await seedStoredProgress(page, solutionCompletedPayload(QUESTION_IDS.slice(0, -1)));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, "wrong");
  await openWorkedSolution(page);

  const panel = page.getByTestId("path-completion-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Completed", { exact: true })).toBeVisible();
  await expect(panel.getByText("Review recommended", { exact: true })).toBeVisible();
  await expect(panel).toContainText("8 / 8 completed");
  await expect(panel.getByText("Mastered", { exact: true })).toHaveCount(0);

  const stored = await readStoredProgress(page) as ProgressPayload;
  expect(getQuestionProgress(FINAL_QUESTION_ID, stored.data)).toMatchObject({
    completed: true,
    bestOutcome: "completed_with_solution",
    masteryContribution: 0.35,
  });
  expect(calculateSkillPathProgress(skillPath, stored.data).status).toBe("completed");
  await expect(page.getByTestId("path-completion-primary-action")).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("secure completion uses the Secure variant without a Mastered claim", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(attemptsAfterErrors(QUESTION_IDS.slice(0, -1))));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, "wrong");
  await retryAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);

  const panel = page.getByTestId("path-completion-panel");
  await expect(panel.getByText("Secure", { exact: true })).toBeVisible();
  await expect(panel).toContainText("8 / 8 completed");
  await expect(panel.getByText("Mastered", { exact: true })).toHaveCount(0);
  expect(calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data).status).toBe("secure");

  await page.goto(PATH_ROUTE);
  await expect(page.getByTestId("completed-path-card")).toContainText("Basic differentiation secure");
  await expect(page.getByTestId("path-mastery-status")).toContainText("Secure");
});

test("mastered completion stays consistent across question, dashboard, hub and path", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);
  await expect(page.getByTestId("path-completion-panel").getByText("Mastered", { exact: true })).toBeVisible();
  expect(calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data).status).toBe("mastered");

  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("8 / 8 completed");
  await page.goto(HUB_ROUTE);
  await expect(page.getByText("Mastered", { exact: true })).toBeVisible();
  await page.goto(PATH_ROUTE);
  await expect(page.getByTestId("path-mastery-status")).toContainText("Mastered");
  await expect(page.getByTestId("completed-path-card")).toContainText("8 / 8 questions");
});

test("later Completed to Secure improvement uses only the smaller upgrade acknowledgement", async ({ page }) => {
  const supported = QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: true }));
  await seedStoredProgress(page, v3Payload(supported));
  await seedStoredCelebrations(page, celebrationPayload({
    [PATH_ID]: { celebratedAt: acknowledgedAt, lastAcknowledgedStatus: "completed" },
  }));
  expect(calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data).status).toBe("completed");

  await openQuestion(page, QUESTION_IDS[6]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[6]]);
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
  await page.goto(PATH_ROUTE);

  await expect(page.getByTestId("mastery-upgrade-banner")).toContainText("This path is now Secure.");
  await expect(page.getByTestId("completed-path-card")).toContainText("Basic differentiation secure");
  const upgraded = await readStoredCelebrations(page) as ReturnType<typeof celebrationPayload>;
  expect(upgraded.data.paths[PATH_ID]).toEqual({ celebratedAt: acknowledgedAt, lastAcknowledgedStatus: "secure" });

  await page.reload();
  await expect(page.getByTestId("mastery-upgrade-banner")).toHaveCount(0);
  await expect(page.getByTestId("completed-path-card")).toContainText("Basic differentiation secure");
});

test("path reset clears only its acknowledgement and permits a future celebration", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(allIndependentAttempts()));
  await seedStoredCelebrations(page, celebrationPayload({
    [PATH_ID]: { celebratedAt: acknowledgedAt, lastAcknowledgedStatus: "mastered" },
    "unrelated-path": { celebratedAt: acknowledgedAt, lastAcknowledgedStatus: "secure" },
  }));
  await page.goto(PATH_ROUTE);
  await expect(page.getByTestId("completed-path-card")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("reset-progress").click();
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  const resetProgress = await readStoredProgress(page) as ProgressPayload;
  expect(resetProgress.data.attempts.some((attempt) => attempt.skillPathId === PATH_ID)).toBe(false);
  const resetAcknowledgements = await readStoredCelebrations(page) as ReturnType<typeof celebrationPayload>;
  expect(resetAcknowledgements.data.paths[PATH_ID]).toBeUndefined();
  expect(resetAcknowledgements.data.paths["unrelated-path"].lastAcknowledgedStatus).toBe("secure");

  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(1);
  const afterRecompletion = await readStoredCelebrations(page) as ReturnType<typeof celebrationPayload>;
  expect(afterRecompletion.data.paths[PATH_ID].lastAcknowledgedStatus).toBe("mastered");
  expect(afterRecompletion.data.paths["unrelated-path"].lastAcknowledgedStatus).toBe("secure");
  await page.reload();
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
});

test("reduced motion keeps completion readable, polite and keyboard usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);

  const panel = page.getByTestId("path-completion-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("role", "status");
  await expect(panel).toHaveAttribute("aria-live", "polite");
  await expect(panel).toContainText("Basic differentiation mastered");
  expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const primary = panel.getByTestId("path-completion-primary-action");
  await primary.focus();
  await expect(primary).toBeFocused();
  await expect(panel).toBeVisible();
});

test("malformed acknowledgement data fails safely and future versions are preserved", async ({ page }) => {
  const repairableCases: Array<[string, unknown]> = [
    ["invalid JSON", "{broken"],
    ["array root", []],
    ["missing paths", { version: 1, data: {} }],
    ["invalid path record", celebrationPayload({ [PATH_ID]: { celebratedAt: "not-a-date", lastAcknowledgedStatus: "completed" } })],
  ];

  for (const [name, value] of repairableCases) {
    await test.step(name, async () => {
      await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
      await seedStoredCelebrations(page, value);
      await openQuestion(page, FINAL_QUESTION_ID);
      await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);
      await expect(page.getByTestId("path-completion-panel")).toBeVisible();
      const repaired = await readStoredCelebrations(page) as ReturnType<typeof celebrationPayload>;
      expect(repaired.version).toBe(1);
      expect(repaired.data.paths[PATH_ID].lastAcknowledgedStatus).toBe("mastered");
      expect(calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data).status).toBe("mastered");
    });
  }

  const future = { version: 99, data: { paths: { future: { acknowledged: true } } } };
  await seedStoredProgress(page, v3Payload(priorIndependentAttempts()));
  await seedStoredCelebrations(page, future);
  await openQuestion(page, FINAL_QUESTION_ID);
  await submitAnswer(page, QUESTION_ANSWERS[FINAL_QUESTION_ID]);
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
  expect(await readStoredCelebrations(page)).toEqual(future);
  expect(calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data).status).toBe("mastered");
  await page.goto(PATH_ROUTE);
  await expect(page.getByTestId("completed-path-card")).toContainText("Basic differentiation mastered");
  expect(await page.evaluate(({ progressKey, celebrationKey }) => ({
    progressExists: window.localStorage.getItem(progressKey) !== null,
    celebrationExists: window.localStorage.getItem(celebrationKey) !== null,
  }), { progressKey: STORAGE_KEY, celebrationKey: CELEBRATION_STORAGE_KEY })).toEqual({ progressExists: true, celebrationExists: true });
});
