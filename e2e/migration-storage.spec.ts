import { getQuestionProgress } from "../lib/progress/calculations";
import type { ProgressPayload } from "../lib/progress/types";
import { test, expect } from "./fixtures/test";
import {
  QUESTION_ANSWERS,
  QUESTION_IDS,
  STORAGE_KEY,
  currentAttempt,
  legacyAttempt,
  readStoredProgress,
  seedStoredProgress,
  v1Payload,
  v2Payload,
} from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("V1 progress stays visible and continued activity writes V4 safely", async ({ page }) => {
  await seedStoredProgress(page, v1Payload([legacyAttempt()]));
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("1 / 8 completed");

  await openQuestion(page, QUESTION_IDS[1]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[1]]);
  const stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts).toHaveLength(2);
  expect(stored.data.attempts[0]).toMatchObject({
    supportKnowledge: "unknown_legacy",
    legacyCompleted: true,
    versionEvidence: { kind: "unknown_legacy", questionVersion: null },
  });
  expect(stored.data.attempts[1]).toMatchObject({ versionEvidence: { kind: "known", questionVersion: 1 } });
  const legacyState = getQuestionProgress(QUESTION_IDS[0], stored.data);
  expect(legacyState.completed).toBe(true);
  expect(legacyState.correctWithoutSolution).toBe(false);
});

test("unversioned incorrect-only completion is preserved conservatively", async ({ page }) => {
  await seedStoredProgress(page, [legacyAttempt({ isCorrect: false, answer: "wrong" })]);
  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("skill-path-hero-progress").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");

  await openQuestion(page, QUESTION_IDS[1]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[1]]);
  const stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts).toHaveLength(2);
  const state = getQuestionProgress(QUESTION_IDS[0], stored.data);
  expect(state).toMatchObject({
    completed: true,
    currentVersionCompleted: false,
    historicalBestOutcome: "legacy_completed",
    masteryContribution: 0,
    reviewRecommended: true,
    correctWithoutSolution: false,
  });
});

test("malformed JSON and invalid shape render a safe state without a read-time overwrite", async ({ page }) => {
  await seedStoredProgress(page, "{broken-json");
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  expect(await readStoredProgress(page)).toBe("{broken-json");

  await page.goto("/");
  await page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ version: 2, data: { nope: true } })), STORAGE_KEY);
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
});

test("partially malformed V2 keeps valid records and repairs into V4 on the next save", async ({ page }) => {
  const source = v2Payload([currentAttempt(QUESTION_IDS[0], 1)]);
  await seedStoredProgress(page, {
    ...source,
    data: { attempts: [...source.data.attempts, { invalid: true }], supportEvents: [null] },
  });
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("1 / 8 completed");
  await openQuestion(page, QUESTION_IDS[1]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[1]]);
  const stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts).toHaveLength(2);
  expect(stored.data.supportEvents).toEqual([]);
});

test("V2 evidence becomes explicit unknown while a new submission captures known version and survives refresh", async ({ page }) => {
  await seedStoredProgress(page, v2Payload([currentAttempt(QUESTION_IDS[0], 1)]));
  await openQuestion(page, QUESTION_IDS[1]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[1]]);

  let stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts[0].versionEvidence).toEqual({ kind: "unknown_legacy", questionVersion: null });
  expect(stored.data.attempts[1].versionEvidence).toEqual({ kind: "known", questionVersion: 1 });

  await page.reload();
  stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts).toHaveLength(2);
});

test("malformed V3 version evidence is dropped without crashing the learner flow", async ({ page }) => {
  await seedStoredProgress(page, {
    version: 3,
    data: {
      attempts: [{ ...currentAttempt(QUESTION_IDS[0], 1), versionEvidence: { kind: "known", questionVersion: 0 } }],
      supportEvents: [],
    },
  });
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
});

test("migrating an already-complete V2 path does not replay the completion celebration", async ({ page }) => {
  const completedV2 = v2Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1)));
  await seedStoredProgress(page, completedV2);
  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("path-completion-panel")).toHaveCount(0);
  await expect(page.getByTestId("version-progress-notice").first()).toContainText("Previous completion is retained");
});

test("unsupported future payload remains untouched", async ({ page }) => {
  const future = { version: 99, data: { attempts: [{ future: true }] } };
  await seedStoredProgress(page, future);
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]], false);
  expect(await readStoredProgress(page)).toEqual(future);
});
