import type { ProgressPayload } from "../lib/progress/types";
import { test, expect } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, currentAttempt, readStoredProgress, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("V3 completion writes one V4 path snapshot and refresh does not duplicate it", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.slice(0, -1).map((id, index) => currentAttempt(id, index + 1))));
  await openQuestion(page, QUESTION_IDS.at(-1)!);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS.at(-1)!]);

  let stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts.at(-1)?.eventId).toMatch(/^attempt_/);
  expect(stored.data.achievementSnapshots.filter((item) => item.kind === "path_completed")).toHaveLength(1);
  expect(stored.data.achievementSnapshots.filter((item) => item.kind === "path_mastered")).toHaveLength(1);

  await page.reload();
  stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.data.achievementSnapshots.filter((item) => item.kind === "path_completed")).toHaveLength(1);
  expect(stored.data.achievementSnapshots.filter((item) => item.kind === "path_mastered")).toHaveLength(1);
});

test("path reset preserves historical snapshots while current readiness resets", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.slice(0, -1).map((id, index) => currentAttempt(id, index + 1))));
  await openQuestion(page, QUESTION_IDS.at(-1)!);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS.at(-1)!]);
  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("reset-progress").click();
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  const stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.data.attempts).toHaveLength(0);
  expect(stored.data.achievementSnapshots.some((item) => item.kind === "path_completed")).toBe(true);
});

test("a corrupt V4 snapshot is repaired on the next valid submission without crashing", async ({ page }) => {
  await seedStoredProgress(page, { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [{ invalid: true }] } });
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  const stored = await readStoredProgress(page) as ProgressPayload;
  expect(stored.version).toBe(4);
  expect(stored.data.attempts).toHaveLength(1);
  expect(stored.data.achievementSnapshots).toEqual([]);
});
