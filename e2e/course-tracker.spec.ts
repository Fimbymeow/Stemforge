import { expect, test } from "./fixtures/test";
import { seedStoredProgress, STORAGE_KEY } from "./fixtures/progress";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import type { ProgressPayload, QuestionAttempt } from "../lib/progress/types";

const payload = (attempts: QuestionAttempt[]): ProgressPayload => ({
  version: 6,
  data: { attempts, supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] },
});

function attempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return {
    questionId: "hm-calc-diff-basic-f-001", skillPathId: "basic-differentiation", stageId: "basic-diff-stage-foundations",
    isCorrect: true, answer: "fixture", attemptedAt: "2026-08-06T10:00:00.000Z", sequence: 1, isGenuine: true,
    hintViewedBeforeSubmission: false, supportKnowledge: "known", versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: "tracker-e2e-1", ...overrides,
  };
}

test("tracker keeps Basic and Chain evidence independent and exposes the correct action", async ({ page }) => {
  await seedStoredProgress(page, payload([attempt()]));
  await page.goto("/subjects/higher-maths");
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  const chain = page.getByTestId("tracker-skill-chain-rule");
  await expect(basic).toContainText("Progress: In progress");
  await expect(basic.getByRole("link", { name: "Continue Foundations" })).toHaveAttribute("href", "/question/hm-calc-diff-basic-f-002");
  await expect(chain).toContainText("Progress: Not started");

  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  const chainFirst = higherMathsChainRuleQuestions.find((question) => question.id === "hm-calc-diff-chain-f-001");
  expect(chainFirst).toBeTruthy();
  await seedStoredProgress(page, payload([attempt({
    questionId: "hm-calc-diff-chain-f-001", skillPathId: "chain-rule", stageId: "chain-rule-stage-foundations",
    versionEvidence: { kind: "known", questionVersion: chainFirst!.questionVersion }, eventId: "tracker-chain-1",
  })]));
  await page.goto("/subjects/higher-maths");
  await expect(page.getByTestId("tracker-skill-chain-rule")).toContainText("Progress: In progress");
  await expect(page.getByTestId("tracker-skill-chain-rule").getByRole("link", { name: "Continue Foundations" })).toHaveAttribute("href", "/question/hm-calc-diff-chain-f-002");
});

test("Review due remains an independent label on a completed healthy skill", async ({ page }) => {
  const attempts = higherMathsDifferentiationQuestions.map((question, index) => attempt({
    questionId: question.id, stageId: question.stageId, versionEvidence: { kind: "known", questionVersion: question.questionVersion },
    attemptedAt: "2026-06-01T10:00:00.000Z", sequence: index + 1, eventId: `tracker-complete-${index}`,
  }));
  await seedStoredProgress(page, payload(attempts));
  await page.goto("/subjects/higher-maths");
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic).toContainText("Progress: Completed");
  await expect(basic).toContainText("Knowledge: Healthy");
  await expect(basic).toContainText("Review due");
});

test("tracker is keyboard-usable and overflow-free at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/subjects/higher-maths");
  const disclosure = page.getByTestId("course-tracker").locator("summary").first();
  await disclosure.focus(); await expect(disclosure).toBeFocused(); await disclosure.press("Enter");
  await expect(disclosure.locator("xpath=parent::details")).toHaveAttribute("open", "");
  const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});
