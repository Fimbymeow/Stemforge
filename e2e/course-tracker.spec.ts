import { expect, test } from "./fixtures/test";
import { seedStoredProgress, STORAGE_KEY } from "./fixtures/progress";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import type { ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";

const payload = (attempts: QuestionAttempt[], supportEvents: QuestionSupportEvent[] = []): ProgressPayload => ({
  version: 7,
  data: { attempts, supportEvents, guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] },
});

function attempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return {
    questionId: "hm-calc-diff-basic-f-001", skillPathId: "basic-differentiation", stageId: "basic-diff-stage-foundations",
    isCorrect: true, answer: "fixture", attemptedAt: "2026-08-06T10:00:00.000Z", sequence: 1, isGenuine: true,
    hintViewedBeforeSubmission: false, supportKnowledge: "known", versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: "tracker-e2e-1", ...overrides,
  };
}

test("fresh tracker is skill-primary while preserving all mappings and honest availability", async ({ page }) => {
  await page.goto("/subjects/higher-maths/course-tracker");
  await expect(page.locator("[data-course-tracker-skill]")).toHaveCount(49);
  const representedPointIds = await page.getByTestId("course-tracker-official-point").evaluateAll((points) => [...new Set(points.map((point) => point.getAttribute("data-official-point-id")))]);
  expect(representedPointIds).toHaveLength(58);

  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  const chain = page.getByTestId("tracker-skill-chain-rule");
  await expect(basic).toContainText("Progress: Not started");
  await expect(chain).toContainText("Progress: Not started");
  await expect(basic.getByRole("link", { name: "Start learning" })).toBeVisible();
  await expect(chain.getByRole("link", { name: "Start learning" })).toBeVisible();

  const unavailable = page.getByTestId("tracker-skill-trigonometric-differentiation");
  await expect(unavailable).toContainText("Coming soon");
  await expect(unavailable.getByRole("link")).toHaveCount(0);
  await expect(unavailable.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Reasoning across the course" })).toBeVisible();
});

test("skill disclosures expose exact and multiple mapped official requirements in one interaction", async ({ page }) => {
  await page.goto("/subjects/higher-maths/course-tracker");
  const basicPoint = higherMathematicsSpecificationRegister.points.find((point) => point.specPointId === "hm-calc-diff-power-rule");
  expect(basicPoint).toBeTruthy();
  const basicDisclosure = page.getByTestId("tracker-requirements-basic-differentiation");
  const basicSummary = basicDisclosure.locator("summary");
  await expect(basicSummary).toHaveAccessibleName("View official requirements for Basic differentiation");
  await basicSummary.click();
  await expect(basicDisclosure).toHaveAttribute("open", "");
  await expect(basicDisclosure).toContainText(basicPoint!.officialStatement!);

  const multipleIds = ["hm-calc-integration-linear-power-unit", "hm-calc-integration-linear-power-scaled"];
  const multipleDisclosure = page.getByTestId("tracker-requirements-integration-composite-power");
  const multipleSummary = multipleDisclosure.locator("summary");
  await expect(multipleSummary).toHaveAccessibleName("View official requirements for Integration of Bracket Powers");
  await multipleSummary.click();
  await expect(multipleDisclosure.getByTestId("course-tracker-official-point")).toHaveCount(2);
  for (const pointId of multipleIds) {
    const point = higherMathematicsSpecificationRegister.points.find((candidate) => candidate.specPointId === pointId);
    expect(point).toBeTruthy();
    await expect(multipleDisclosure).toContainText(point!.officialStatement!);
  }
});

test("tracker keeps Basic and Chain evidence independent and exposes the correct action", async ({ page }) => {
  await seedStoredProgress(page, payload([attempt()]));
  await page.goto("/subjects/higher-maths/course-tracker");
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
  await page.goto("/subjects/higher-maths/course-tracker");
  await expect(page.getByTestId("tracker-skill-chain-rule")).toContainText("Progress: In progress");
  await expect(page.getByTestId("tracker-skill-chain-rule").getByRole("link", { name: "Continue Foundations" })).toHaveAttribute("href", "/question/hm-calc-diff-chain-f-002");
});

test("Review due remains an independent label on a completed healthy skill", async ({ page }) => {
  const attempts = higherMathsDifferentiationQuestions.map((question, index) => attempt({
    questionId: question.id, stageId: question.stageId, versionEvidence: { kind: "known", questionVersion: question.questionVersion },
    attemptedAt: "2026-06-01T10:00:00.000Z", sequence: index + 1, eventId: `tracker-complete-${index}`,
  }));
  await seedStoredProgress(page, payload(attempts));
  await page.goto("/subjects/higher-maths/course-tracker");
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic).toContainText("Progress: Completed");
  await expect(basic).toContainText("Knowledge: Healthy");
  await expect(basic).toContainText("Review due");
});

test("needs-practice remains distinct from structural progress", async ({ page }) => {
  const weakAttempt = attempt({ isCorrect: false });
  const supportEvent: QuestionSupportEvent = {
    questionId: weakAttempt.questionId, skillPathId: weakAttempt.skillPathId, stageId: weakAttempt.stageId,
    type: "solution_viewed", occurredAt: "2026-08-06T10:01:00.000Z", sequence: 2, afterGenuineAttempt: true,
    versionEvidence: weakAttempt.versionEvidence, eventId: "tracker-needs-practice-support",
  };
  await seedStoredProgress(page, payload([weakAttempt], [supportEvent]));
  await page.goto("/subjects/higher-maths/course-tracker");
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic).toContainText("Progress: In progress");
  await expect(basic).toContainText("Knowledge: Needs practice");
  await expect(basic).toContainText("Foundations: 1/3 complete");
});

test("tracker is keyboard-usable and overflow-free at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/subjects/higher-maths/course-tracker");
  const disclosure = page.getByTestId("tracker-requirements-factorising-cubics-and-quartics").locator("summary");
  await disclosure.focus(); await expect(disclosure).toBeFocused(); await disclosure.press("Enter");
  await expect(disclosure.locator("xpath=parent::details")).toHaveAttribute("open", "");
  const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});
