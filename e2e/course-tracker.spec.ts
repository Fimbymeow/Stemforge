import { expect, test } from "./fixtures/test";
import { seedStoredProgress } from "./fixtures/progress";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { CONFIDENCE_LOCAL_STATE_STORAGE_KEY } from "../lib/confidence/local-state";
import type { ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";

const route = "/subjects/higher-maths/course-tracker";
const payload = (attempts: QuestionAttempt[], supportEvents: QuestionSupportEvent[] = []): ProgressPayload => ({ version: 7, data: { attempts, supportEvents, guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] } });
function attempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return { questionId: "hm-calc-diff-basic-f-001", skillPathId: "basic-differentiation", stageId: "basic-diff-stage-foundations", isCorrect: true, answer: "fixture", attemptedAt: "2026-08-26T10:00:00.000Z", sequence: 1, isGenuine: true, hintViewedBeforeSubmission: false, supportKnowledge: "known", versionEvidence: { kind: "known", questionVersion: 1 }, eventId: "tracker-e2e-1", ...overrides };
}

async function seedConfidence(page: Parameters<typeof seedStoredProgress>[0], level: "needs_work" | "developing" | "confident") {
  await page.goto("/");
  await page.evaluate(({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)), {
    key: CONFIDENCE_LOCAL_STATE_STORAGE_KEY,
    value: {
      version: 1,
      ratings: { "basic-differentiation": { skillPathId: "basic-differentiation", level, setAt: "2026-08-26T11:00:00.000Z" } },
      overrides: {},
    },
  });
}

test("tracker keeps curriculum navigation while removing implementation coverage and dead learner rows", async ({ page }) => {
  await page.goto(route);
  const navigation = page.getByTestId("course-tracker-unit-navigation");
  for (const area of ["Algebra and Trigonometry", "Vectors", "Calculus", "Lines, Circles and Sequences"]) await expect(navigation.getByRole("button", { name: area })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Calculus" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("course-tracker-coverage")).toHaveCount(0);
  await expect(page.getByText(/skills available|coming soon/i)).toHaveCount(0);

  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.getByText(/Not started|Foundations|Applications|Past Paper-style Questions/)).toHaveCount(0);
  await expect(basic.getByText(/Confident|Developing|Needs work/, { exact: true })).toHaveCount(0);
  await expect(basic.getByText(/Notes available|Practice \d+\/\d+ complete/)).toHaveCount(0);
  await expect(basic.getByTestId("tracker-status-basic-differentiation")).toHaveAttribute("data-tracker-status", "neutral");
  await expect(basic.getByRole("link", { name: "Open Basic differentiation skill overview" })).toHaveAttribute("href", "/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(basic.locator("[data-review-state]")).toHaveCount(0);
  await expect(basic.locator("details, summary, [data-mastery-status]")).toHaveCount(0);

  await navigation.getByRole("button", { name: "Algebra and Trigonometry" }).click();
  const reference = page.getByTestId("tracker-skill-factorising-cubics-and-quartics");
  await expect(page.getByRole("heading", { name: "Algebra and Trigonometry", exact: true })).toBeVisible();
  await expect(reference).not.toContainText(/\d+ official requirements?/);
  await expect(reference.getByTestId("tracker-status-factorising-cubics-and-quartics")).toHaveAttribute("data-tracker-status", "neutral");
  await expect(reference.getByRole("link")).toHaveCount(0);
  await expect(reference.locator("details, button, [data-mastery-status], [data-review-state]")).toHaveCount(0);
  await expect(page.getByTestId("course-wide-requirements")).not.toHaveAttribute("open", "");
});

test("official requirements live collapsed, keyboard accessible and exact on Skill Page only", async ({ page }) => {
  await page.goto(route);
  const point = higherMathematicsSpecificationRegister.points.find((candidate) => candidate.specPointId === "hm-calc-diff-power-rule")!;
  await expect(page.getByTestId("tracker-requirements-basic-differentiation")).toHaveCount(0);
  await page.getByRole("link", { name: "Open Basic differentiation skill overview" }).click();
  const disclosure = page.getByTestId("skill-official-requirements");
  await expect(disclosure).not.toHaveAttribute("open", "");
  const summary = disclosure.locator("summary");
  await expect(summary).toHaveAccessibleName("Qualifications Scotland specification");
  await expect(summary).not.toContainText(/\d+ mapped outcomes?/);
  await summary.focus();
  await summary.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure).toContainText(point.officialStatement!);
});

test("Review now replaces Open and launches scoped Review without stage progress or mastery", async ({ page, seriousBrowserErrors }) => {
  const attempts = higherMathsDifferentiationQuestions.map((question, index) => attempt({ questionId: question.id, stageId: question.stageId, versionEvidence: { kind: "known", questionVersion: question.questionVersion }, attemptedAt: "2026-06-01T10:00:00.000Z", sequence: index + 1, eventId: `tracker-complete-${index}` }));
  await seedStoredProgress(page, payload(attempts));
  await page.goto(route);
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.getByText(/Mastered|Learned|Foundations|Applications|Past Paper-style Questions/)).toHaveCount(0);
  await expect(basic.locator("[data-mastery-status]")).toHaveCount(0);
  await expect(basic.locator('[data-review-state="due"]')).toHaveText("Review now");
  await expect(basic.getByTestId("tracker-status-basic-differentiation")).toHaveAttribute("data-tracker-status", "review-due");
  const action = basic.getByRole("link", { name: "Review now: Basic differentiation" });
  await expect(action).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
  await expect(basic.getByRole("link")).toHaveCount(1);
  await expect(basic.getByText("Open", { exact: true })).toHaveCount(0);
  await expect(basic.getByText(/Available|Recommended/, { exact: true })).toHaveCount(0);
  await action.focus();
  await expect(action).toBeFocused();
  await action.press("Enter");
  await expect(page).toHaveURL(/\/practice\?review=1&path=basic-differentiation/);
  const launch = page.getByTestId("review-launch-card");
  await expect(launch).toContainText("Basic differentiation is ready to review");
  await launch.getByRole("button", { name: "Start Review" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/[^?]+$/);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Review");
  expect(seriousBrowserErrors).toEqual([]);
});

test("recent completion hides non-due Review states", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-28T12:00:00.000Z"));
  const attempts = higherMathsDifferentiationQuestions.map((question, index) => attempt({ questionId: question.id, stageId: question.stageId, versionEvidence: { kind: "known", questionVersion: question.questionVersion }, attemptedAt: "2026-08-28T10:00:00.000Z", sequence: index + 1, eventId: `tracker-recent-${index}` }));
  await seedStoredProgress(page, payload(attempts));
  await page.goto(route);
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.locator("[data-review-state]")).toHaveCount(0);
  await expect(basic.getByTestId("tracker-status-basic-differentiation")).toHaveAttribute("data-tracker-status", "neutral");
  await expect(basic.getByText(/Review|Available|Recommended/, { exact: true })).toHaveCount(0);
  await expect(basic.getByRole("link", { name: "Open Basic differentiation skill overview" })).toBeVisible();
});

test("detailed progress remains off the compact Tracker row", async ({ page }) => {
  const weak = attempt({ isCorrect: false });
  const support: QuestionSupportEvent = { questionId: weak.questionId, skillPathId: weak.skillPathId, stageId: weak.stageId, type: "solution_viewed", occurredAt: "2026-08-26T10:01:00.000Z", sequence: 2, afterGenuineAttempt: true, versionEvidence: weak.versionEvidence, eventId: "tracker-needs-practice-support" };
  await seedStoredProgress(page, payload([weak], [support]));
  await page.goto(route);
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.getByText(/1\/3 complete|Foundations|Applications|Past Paper-style Questions/)).toHaveCount(0);
  await expect(basic.getByText("In progress", { exact: true })).toHaveCount(0);
  await expect(basic.getByText("Needs practice", { exact: true })).toHaveCount(0);
  await expect(basic.getByText("Set confidence", { exact: true })).toHaveCount(0);
  expect(await basic.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
});

test("saved confidence remains stored but tracker exposes only its compact semantic indicator", async ({ page }) => {
  await seedStoredProgress(page, payload([attempt()]));
  await seedConfidence(page, "confident");
  await page.goto(route);
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  await expect(basic.getByText(/Confident|Developing|Needs work|Unrated/, { exact: true })).toHaveCount(0);
  await expect(basic.getByTestId("tracker-status-basic-differentiation")).toHaveAttribute("data-tracker-status", "confident");
  await expect(basic.getByTestId("tracker-status-basic-differentiation")).toHaveCSS("background-color", "rgb(47, 122, 77)");
  await expect(basic.getByText(/Orthic suggests|Set confidence|Your confidence and recent evidence differ/, { exact: true })).toHaveCount(0);
  await expect(basic.locator("button, details[class*='confidence']")).toHaveCount(0);
});

test("saved confidence uses the existing restrained semantic colour mapping", async ({ page }) => {
  for (const [level, tone, colour] of [
    ["confident", "confident", "rgb(47, 122, 77)"],
    ["developing", "developing", "rgb(138, 97, 24)"],
    ["needs_work", "needs-work", "rgb(178, 58, 52)"],
  ] as const) {
    await seedConfidence(page, level);
    await page.goto(route);
    const status = page.getByTestId("tracker-status-basic-differentiation");
    await expect(status).toHaveAttribute("data-tracker-status", tone);
    await expect(status).toHaveCSS("background-color", colour);
    await expect(page.getByTestId("tracker-skill-basic-differentiation").getByText(/Confident|Developing|Needs work/, { exact: true })).toHaveCount(0);
  }
});

test("curriculum rows remain readable and references do not become interactive", async ({ page }) => {
  await page.goto(route);
  const fullRow = page.getByTestId("tracker-skill-basic-differentiation");
  const reference = page.getByTestId("tracker-skill-trigonometric-differentiation");
  const fullHeight = await fullRow.evaluate((element) => element.getBoundingClientRect().height);
  const referenceHeight = await reference.evaluate((element) => element.getBoundingClientRect().height);
  expect(fullHeight).toBeGreaterThanOrEqual(48);
  expect(referenceHeight).toBeGreaterThanOrEqual(44);
  expect(referenceHeight).toBeLessThanOrEqual(fullHeight + 16);
  await expect(reference.locator("a, button, details, summary")).toHaveCount(0);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 900 },
  { width: 768, height: 900 },
  { width: 430, height: 900 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 760 },
]) {
  test(`tracker remains keyboard-usable and overflow-free at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(route);
    await expect(page.getByTestId("course-hub-progress")).toHaveAccessibleName("Course progress: 0 of 49 skills learned, 0%");
    const basic = page.getByTestId("tracker-skill-basic-differentiation");
    await expect(basic.getByTestId("tracker-status-basic-differentiation")).toBeVisible();
    await expect(basic.getByText("Open", { exact: true })).toBeVisible();
    await expect(basic.getByRole("link")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    const navigation = page.getByTestId("course-tracker-unit-navigation");
    const algebra = navigation.getByRole("button", { name: "Algebra and Trigonometry" });
    await algebra.focus();
    await expect(algebra).toBeFocused();
    await algebra.press("Enter");
    await expect(page.getByTestId("tracker-skill-factorising-cubics-and-quartics")).toBeVisible();
    await expect(page.getByTestId("tracker-skill-factorising-cubics-and-quartics").locator("a, button, summary")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}

test("course-wide reasoning and source citation remain available", async ({ page }) => {
  await page.goto(route);
  const reasoning = page.getByTestId("course-wide-requirements");
  await expect(reasoning).not.toHaveAttribute("open", "");
  await reasoning.locator("summary").first().click();
  await expect(reasoning).toHaveAttribute("open", "");
  await expect(page.getByText(/Source: Higher Mathematics course specification/)).toBeVisible();
});
