import { calculateSkillPathProgress, getQuestionProgress } from "../lib/progress/calculations";
import { higherMaths } from "../data/higher-maths";
import type { ProgressPayload } from "../lib/progress/types";
import { test, expect } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, readStoredProgress, seedStoredProgress, currentAttempt, v3Payload } from "./fixtures/progress";
import { openHint, openQuestion, openWorkedSolution, retryAnswer, submitAnswer } from "./fixtures/student-actions";

function stateFromStored(stored: unknown, questionId: string) {
  return getQuestionProgress(questionId, (stored as ProgressPayload).data);
}

const skillPath = higherMaths.courseAreas[0].specAreas[0].skillPaths?.[0];
if (!skillPath) throw new Error("Basic differentiation test path is missing");

test("empty and whitespace-only input cannot create progress or reveal a solution", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  const submit = page.getByRole("button", { name: "Submit Answer" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("Your answer").fill("   ");
  await expect(submit).toBeDisabled();
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
  await expect(page.getByTestId("next-question-locked")).toBeVisible();
  expect(await readStoredProgress(page)).toBeNull();
});

test("incorrect answer remains incomplete across refresh and pages", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");
  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  await expect(page.getByTestId("next-question-locked")).toBeVisible();
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();
  let stored = await readStoredProgress(page);
  expect(stateFromStored(stored, QUESTION_IDS[0])).toMatchObject({ attempted: true, completed: false, bestOutcome: "attempted_unresolved" });

  await page.reload();
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();
  stored = await readStoredProgress(page);
  expect(stateFromStored(stored, QUESTION_IDS[0]).completed).toBe(false);
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
});

test("independent first-attempt correctness persists and unlocks progression", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await expect(page.getByTestId("next-question-action")).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
  const storedAfterSubmission = await readStoredProgress(page) as ProgressPayload;
  expect(storedAfterSubmission.version).toBe(4);
  expect(storedAfterSubmission.data.attempts[0].eventId).toMatch(/^attempt_/);
  expect(storedAfterSubmission.data.attempts[0].versionEvidence).toEqual({ kind: "known", questionVersion: 1 });
  let state = stateFromStored(storedAfterSubmission, QUESTION_IDS[0]);
  expect(state).toMatchObject({ completed: true, bestOutcome: "independently_correct_first_attempt", masteryContribution: 1 });
  expect(calculateSkillPathProgress(skillPath, (await readStoredProgress(page) as ProgressPayload).data).firstAttemptAccuracyPercentage).toBe(100);

  await page.reload();
  state = stateFromStored(await readStoredProgress(page), QUESTION_IDS[0]);
  expect(state.bestOutcome).toBe("independently_correct_first_attempt");
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("1 / 8 completed");
  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("skill-path-hero-progress").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");
});

test("hint-assisted correct is completed with support and review evidence", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await openHint(page);
  await expect(page.getByText("Bring the power down, then reduce the power by 1.")).toBeVisible();
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await expect(page.getByTestId("question-status")).toContainText("Correct with support");
  const storedWithHint = await readStoredProgress(page) as ProgressPayload;
  expect(storedWithHint.data.supportEvents[0].versionEvidence).toEqual({ kind: "known", questionVersion: 1 });
  expect(storedWithHint.data.attempts[0].versionEvidence).toEqual({ kind: "known", questionVersion: 1 });
  let state = stateFromStored(storedWithHint, QUESTION_IDS[0]);
  expect(state).toMatchObject({ completed: true, bestOutcome: "correct_with_hint", masteryContribution: 0.7, reviewRecommended: true });
  await page.reload();
  state = stateFromStored(await readStoredProgress(page), QUESTION_IDS[0]);
  expect(state.bestOutcome).toBe("correct_with_hint");
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("1 / 8 completed");
});

test("worked solution is gated, completes after an attempt, and unlocks next", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
  await submitAnswer(page, "wrong");
  await openWorkedSolution(page);
  await expect(page.getByTestId("question-status")).toContainText("Completed with solution");
  await expect(page.getByRole("heading", { name: "Worked solution" })).toBeVisible();
  await expect(page.getByTestId("next-question-action")).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
  const storedWithSolution = await readStoredProgress(page) as ProgressPayload;
  expect(storedWithSolution.data.supportEvents.find((event) => event.type === "solution_viewed")?.versionEvidence)
    .toEqual({ kind: "known", questionVersion: 1 });
  const state = stateFromStored(storedWithSolution, QUESTION_IDS[0]);
  expect(state).toMatchObject({ completed: true, bestOutcome: "completed_with_solution", masteryContribution: 0.35, reviewRecommended: true, correctWithoutSolution: false });
  await page.reload();
  expect(stateFromStored(await readStoredProgress(page), QUESTION_IDS[0]).solutionViewed).toBe(true);
});

test("incorrect then correct separates first accuracy from latest outcome", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "wrong");
  await retryAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  const stored = await readStoredProgress(page) as ProgressPayload;
  const state = stateFromStored(stored, QUESTION_IDS[0]);
  expect(stored.data.attempts).toHaveLength(2);
  expect(state).toMatchObject({ completed: true, bestOutcome: "independently_correct_after_error", masteryContribution: 0.85, latestResult: true });
  const progress = calculateSkillPathProgress(skillPath, stored.data);
  expect(progress.firstAttemptAccuracyPercentage).toBe(0);
  expect(progress.latestAttemptAccuracyPercentage).toBe(100);
});

test("strong independent result survives a later incorrect review", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await page.reload();
  await submitAnswer(page, "wrong");
  const state = stateFromStored(await readStoredProgress(page), QUESTION_IDS[0]);
  expect(state).toMatchObject({ completed: true, bestOutcome: "independently_correct_first_attempt", latestResult: false, reviewRecommended: true });
  await page.reload();
  expect(stateFromStored(await readStoredProgress(page), QUESTION_IDS[0]).bestOutcome).toBe("independently_correct_first_attempt");
});

test("solution-assisted work can later improve independently without losing history", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "wrong");
  await openWorkedSolution(page);
  await page.reload();
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  const stored = await readStoredProgress(page) as ProgressPayload;
  const state = stateFromStored(stored, QUESTION_IDS[0]);
  expect(stored.data.attempts).toHaveLength(2);
  expect(stored.data.supportEvents.some((event) => event.type === "solution_viewed")).toBe(true);
  expect(state).toMatchObject({ bestOutcome: "independently_correct_after_error", masteryContribution: 0.85, completed: true, reviewRecommended: true });
});

test("the last completed question offers path review from the completion panel", async ({ page }) => {
  const prior = QUESTION_IDS.slice(0, -1).map((id, index) => currentAttempt(id, index + 1));
  await seedStoredProgress(page, v3Payload(prior));
  const last = QUESTION_IDS.at(-1)!;
  await openQuestion(page, last);
  await submitAnswer(page, QUESTION_ANSWERS[last]);
  await expect(page.getByTestId("path-completion-panel")).toBeVisible();
  await expect(page.getByTestId("path-completion-panel").getByRole("link", { name: "Review a stage" })).toHaveAttribute(
    "href",
    "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
  );
});

test("next and previous navigation retain the completed question state", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await page.getByTestId("next-question-action").click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[1]}$`));
  await page.getByRole("link", { name: "Previous" }).click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}$`));
  const state = stateFromStored(await readStoredProgress(page), QUESTION_IDS[0]);
  expect(state).toMatchObject({ completed: true, bestOutcome: "independently_correct_first_attempt" });
  await expect(page.getByTestId("next-question-action")).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
});
