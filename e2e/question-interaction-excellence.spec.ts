import { test, expect } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, readStoredProgress } from "./fixtures/progress";
import { openHint, openQuestion, openWorkedSolution } from "./fixtures/student-actions";
import {
  ANSWER_DRAFT_STORAGE_KEY,
  ANSWER_DRAFT_SCHEMA_VERSION,
  createAnswerDraftKey,
} from "../lib/questions/answer-drafts";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";

const firstQuestion = higherMathsDifferentiationQuestions[0];

test("the question and answer dominate first arrival with accurate stage context", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByTestId("stage-question-position")).toHaveText("Question 1 of 3 in Foundations");
  await expect(page.getByRole("heading", { level: 1, name: "Differentiate a power" })).toBeVisible();
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.getByText("Original Qualifications Scotland-style practice; not copied from Qualifications Scotland materials.")).toBeHidden();
  const interaction = await page.getByTestId("question-interaction").boundingBox();
  expect(interaction).not.toBeNull();
  expect(interaction!.y).toBeLessThan(430);
});

test("empty stays draft-only while malformed and unmarkable answers retain non-graded evidence", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  const input = page.getByLabel("Your answer");

  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Enter an answer");
  await expect(input).toBeFocused();
  expect(await readStoredProgress(page)).toBeNull();

  await input.fill("5x^");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Answer format could not be read");
  await expect(page.getByTestId("question-status")).toHaveAttribute("data-feedback-state", "warning");
  await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: format warning");
  await expect(page.getByRole("button", { name: "Try again" })).not.toHaveClass(/text-danger/);
  await expect(input).toHaveAttribute("aria-invalid", "true");
  let stored = await readStoredProgress(page) as { data: { attempts: Array<{ isCorrect: boolean | null; outcomeKind: string }> } };
  expect(stored.data.attempts).toHaveLength(1);
  expect(stored.data.attempts[0]).toMatchObject({ isCorrect: null, outcomeKind: "malformed" });

  await page.getByRole("button", { name: "Try again" }).click();
  await input.fill("y=5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("This form cannot be checked safely");
  await expect(page.getByTestId("question-status")).toHaveAttribute("data-feedback-state", "neutral");
  await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: not marked");
  await expect(page.getByRole("button", { name: "Try again" })).not.toHaveClass(/text-danger/);
  stored = await readStoredProgress(page) as { data: { attempts: Array<{ isCorrect: boolean | null; outcomeKind: string }> } };
  expect(stored.data.attempts).toHaveLength(2);
  expect(stored.data.attempts[1]).toMatchObject({ isCorrect: null, outcomeKind: "unmarkable" });
});

test("safe numeric equivalents pass while legacy multiplication collisions are never correct", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[2]);
  await page.getByLabel("Your answer").fill("28/2");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.reload();
  await page.getByLabel("Your answer").fill("1×4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("This form cannot be checked safely");
});

test("save failure unlocks the solution for the current view but not after refresh", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "stemforge.localProgress.v1") throw new DOMException("blocked", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await openQuestion(page, QUESTION_IDS[0]);
  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Your answer was not saved");
  await expect(page.getByTestId("question-status")).toHaveAttribute("data-feedback-state", "neutral");
  await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: system issue");
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
});

test("incorrect submission stays visible, Retry focuses the retained answer, and later correctness replaces the comparison", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  const input = page.getByLabel("Your answer");
  await input.fill("4x^5");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Not quite yet");
  await expect(page.getByTestId("question-status")).toHaveAttribute("data-feedback-state", "danger");
  await expect(page.getByTestId("question-status")).toHaveAccessibleName("Answer feedback: incorrect");
  await expect(page.getByRole("button", { name: "Try again" })).toHaveClass(/text-danger/);
  await expect(page.getByTestId("submitted-answer")).toContainText("4x^5");
  await expect(input).toHaveValue("4x^5");

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("4x^5");
  await input.fill(QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Correct", level: 2 })).toBeFocused();
  await expect(page.getByTestId("submitted-answer")).toContainText(QUESTION_ANSWERS[QUESTION_IDS[0]]);
  const stored = await readStoredProgress(page) as { data: { attempts: unknown[] } };
  expect(stored.data.attempts).toHaveLength(2);
});

test("hint language is supportive and its revealed content receives focus", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  const hintPanel = page.getByTestId("question-hint-panel");
  await expect(hintPanel).toContainText("Use a hint when you need one");
  await expect(hintPanel).not.toContainText("recorded for mastery");
  await openHint(page);
  await expect(page.getByTestId("hint-content")).toBeFocused();
});

test("hint evidence survives refresh and still qualifies the later submission as supported", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await openHint(page);
  await page.reload();
  await page.getByLabel("Your answer").fill(QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const stored = await readStoredProgress(page) as { data: { attempts: Array<{ hintViewedBeforeSubmission: boolean }> } };
  expect(stored.data.attempts[0].hintViewedBeforeSubmission).toBe(true);
});

test("current unstructured solutions use the safe full fallback after a genuine attempt", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await page.getByLabel("Your answer").fill("4x^5");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await openWorkedSolution(page);
  await expect(page.getByRole("heading", { name: "Worked solution" })).toBeFocused();
  await expect(page.getByTestId("full-solution-fallback")).toBeVisible();
  await expect(page.getByTestId("full-solution-fallback").getByText("Final answer", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("question-status")).toContainText("Completed with solution");
});

test("a local draft survives refresh and navigation, stays out of evidence, and clears after correctness", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  const input = page.getByLabel("Your answer");
  await input.fill("5x^");
  await page.reload();
  await expect(page.getByLabel("Your answer")).toHaveValue("5x^");
  expect(await readStoredProgress(page)).toBeNull();

  await page.goto("/dashboard");
  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByLabel("Your answer")).toHaveValue("5x^");
  await page.getByLabel("Your answer").fill(QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const matchingKey = createAnswerDraftKey({
    questionId: firstQuestion.id,
    questionVersion: firstQuestion.questionVersion,
    contentRevision: firstQuestion.contentRevision,
  });
  const storedDraft = await page.evaluate(({ storageKey, draftKey }) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as { drafts?: Record<string, unknown> }).drafts?.[draftKey] : undefined;
  }, { storageKey: ANSWER_DRAFT_STORAGE_KEY, draftKey: matchingKey });
  expect(storedDraft).toBeUndefined();
});

test("a stale-version draft is not restored into current content and corrupted storage fails silently", async ({ page }) => {
  const staleKey = createAnswerDraftKey({
    questionId: firstQuestion.id,
    questionVersion: firstQuestion.questionVersion + 1,
    contentRevision: firstQuestion.contentRevision,
  });
  await page.addInitScript(({ storageKey, version, key, question }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      version,
      drafts: {
        [key]: {
          questionId: question.id,
          questionVersion: question.questionVersion + 1,
          contentRevision: question.contentRevision,
          answer: "stale answer",
          updatedAt: "2026-07-21T10:00:00.000Z",
        },
      },
    }));
  }, { storageKey: ANSWER_DRAFT_STORAGE_KEY, version: ANSWER_DRAFT_SCHEMA_VERSION, key: staleKey, question: firstQuestion });
  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByLabel("Your answer")).toHaveValue("");

  await page.evaluate((storageKey) => localStorage.setItem(storageKey, "{corrupted"), ANSWER_DRAFT_STORAGE_KEY);
  await page.reload();
  await expect(page.getByLabel("Your answer")).toHaveValue("");
});
