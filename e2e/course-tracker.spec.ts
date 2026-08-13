import { expect, test } from "./fixtures/test";
import { seedStoredProgress } from "./fixtures/progress";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import type { ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";

const payload = (attempts: QuestionAttempt[], supportEvents: QuestionSupportEvent[] = []): ProgressPayload => ({ version: 7, data: { attempts, supportEvents, guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] } });
function attempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return { questionId: "hm-calc-diff-basic-f-001", skillPathId: "basic-differentiation", stageId: "basic-diff-stage-foundations", isCorrect: true, answer: "fixture", attemptedAt: "2026-08-06T10:00:00.000Z", sequence: 1, isGenuine: true, hintViewedBeforeSubmission: false, supportKnowledge: "known", versionEvidence: { kind: "known", questionVersion: 1 }, eventId: "tracker-e2e-1", ...overrides };
}

test("tracker opens the current area and keeps all major course areas directly reachable", async ({ page }) => {
  await page.goto("/subjects/higher-maths/course-tracker");
  const navigation = page.getByTestId("course-tracker-unit-navigation");
  for (const area of ["Algebra and Trigonometry", "Vectors", "Calculus", "Lines, Circles and Sequences"]) await expect(navigation.getByRole("button", { name: area })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Calculus" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("tracker-skill-basic-differentiation")).toBeVisible();
  await expect(page.getByTestId("tracker-skill-basic-differentiation").locator('[data-mastery-status="not_started"]')).toBeVisible();
  await expect(page.getByTestId("tracker-skill-basic-differentiation").getByRole("link", { name: "Open Basic differentiation skill overview" })).toHaveAttribute("href", "/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await navigation.getByRole("button", { name: "Algebra and Trigonometry" }).click();
  await expect(page.getByTestId("tracker-skill-factorising-cubics-and-quartics")).toContainText("Coming soon");
  await expect(page.getByTestId("course-wide-requirements")).not.toHaveAttribute("open", "");
});

test("official requirements remain collapsed by default and expand accessibly", async ({ page }) => {
  await page.goto("/subjects/higher-maths/course-tracker");
  const point = higherMathematicsSpecificationRegister.points.find((candidate) => candidate.specPointId === "hm-calc-diff-power-rule")!;
  const disclosure = page.getByTestId("tracker-requirements-basic-differentiation");
  await expect(disclosure).not.toHaveAttribute("open", "");
  const summary = disclosure.locator("summary");
  await expect(summary).toHaveAccessibleName("View official requirements for Basic differentiation");
  await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure).toContainText(point.officialStatement!);
});

test("mastery and Review remain independent evidence-backed signals", async ({ page }) => {
  const attempts = higherMathsDifferentiationQuestions.map((question, index) => attempt({ questionId: question.id, stageId: question.stageId, versionEvidence: { kind: "known", questionVersion: question.questionVersion }, attemptedAt: "2026-06-01T10:00:00.000Z", sequence: index + 1, eventId: `tracker-complete-${index}` }));
  await seedStoredProgress(page, payload(attempts));
  await page.goto("/subjects/higher-maths/course-tracker");
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.locator('[data-mastery-status="mastered"]')).toHaveAccessibleName("Mastery: Mastered");
  await expect(basic.locator('[data-review-state="due"]')).toContainText("Due");
});

test("needs-practice remains distinct from structural mastery", async ({ page }) => {
  const weak = attempt({ isCorrect: false });
  const support: QuestionSupportEvent = { questionId: weak.questionId, skillPathId: weak.skillPathId, stageId: weak.stageId, type: "solution_viewed", occurredAt: "2026-08-06T10:01:00.000Z", sequence: 2, afterGenuineAttempt: true, versionEvidence: weak.versionEvidence, eventId: "tracker-needs-practice-support" };
  await seedStoredProgress(page, payload([weak], [support]));
  await page.goto("/subjects/higher-maths/course-tracker");
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.locator('[data-mastery-status="in_progress"]')).toBeVisible();
  await expect(basic).toContainText("Needs practice");
  await expect(basic).toContainText("Foundations: 1/3 complete");
});

test("tracker navigation and disclosures are keyboard-usable and overflow-free at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/subjects/higher-maths/course-tracker");
  const algebra = page.getByTestId("course-tracker-unit-navigation").getByRole("button", { name: "Algebra and Trigonometry" });
  await algebra.focus(); await expect(algebra).toBeFocused(); await algebra.press("Enter");
  const disclosure = page.getByTestId("tracker-requirements-factorising-cubics-and-quartics").locator("summary");
  await disclosure.focus(); await disclosure.press("Enter"); await expect(disclosure.locator("xpath=parent::details")).toHaveAttribute("open", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
