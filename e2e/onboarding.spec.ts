import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const onboardingKey = "orthic.onboarding.v1";
const preferenceKey = "orthic.learnerPreferences.v1";
const studyPlanKey = "orthic.studyPlan.v1";
const premiumPreviewKey = "orthic.premiumPreview.v1";

test.use({ newLearner: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate((keys) => keys.forEach((key) => localStorage.removeItem(key)), [onboardingKey, preferenceKey, studyPlanKey, premiumPreviewKey]);
});

test("a genuinely new guest is routed through all three calm steps and completion persists", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/onboarding\?step=1$/);
  await expect(page.getByRole("heading", { name: "Welcome to Orthic" })).toBeVisible();
  await expect(page.getByLabel("Step 1 of 3")).toBeVisible();

  await page.getByLabel("What should we call you?").fill("  Finlay  ");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=2$/);
  await expect(page.getByRole("radio", { name: /Higher Maths/ })).toBeChecked();
  await expect(page.getByText("Higher Physics")).toBeVisible();
  await expect(page.getByText("Coming soon")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=3$/);
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByRole("heading", { name: "Your Orthic is ready." })).toBeVisible();
  await page.getByRole("button", { name: "Go to Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back, Finlay" })).toBeVisible();
  await expect(page.getByTestId("learner-name-prompt")).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null").status, onboardingKey)).toBe("completed");
  expect(seriousBrowserErrors).toEqual([]);
});

test("an established learner with progress but no onboarding flag bypasses the flow", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: true, attemptedAt: "2026-08-23T10:00:00.000Z" }),
  ]));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome to Orthic" })).toHaveCount(0);
});

test("pre-onboarding learner preferences protect an existing learner", async ({ page }) => {
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({
    version: 1, firstName: "Ada", namePromptDismissed: false, selectedCourseSlugs: ["higher-maths"],
  })), preferenceKey);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back, Ada" })).toBeVisible();
});

test("full setup writes the existing preference and Study Plan models", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByLabel("What should we call you?").fill("Maya");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Weekly study time in hours").fill("2");
  await page.getByTitle("Wednesday").click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page.getByRole("heading", { name: "Your Orthic is ready." })).toBeVisible();

  const stored = await page.evaluate(({ preferenceKey, studyPlanKey }) => ({
    preferences: JSON.parse(localStorage.getItem(preferenceKey) ?? "null"),
    studyPlan: JSON.parse(localStorage.getItem(studyPlanKey) ?? "null"),
  }), { preferenceKey, studyPlanKey });
  expect(stored.preferences.firstName).toBe("Maya");
  expect(stored.preferences.selectedCourseSlugs).toEqual(["higher-maths"]);
  expect(stored.preferences.namePromptDismissed).toBe(true);
  expect(stored.studyPlan.setup.weeklyMinutes).toBe(120);
  expect(stored.studyPlan.setup.availableDays).toEqual(["mon", "sat"]);
});

test("skipping Study Plan writes no fake setup", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), studyPlanKey)).toBeNull();
});

test("refresh and browser back preserve a sensible mid-flow position", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=2$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "What are you studying?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=3$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "What are you studying?" })).toBeVisible();
});

test("Premium Preview OFF keeps assessment UI out and ON uses the existing Assessment shape", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("onboarding-assessment")).toHaveCount(0);

  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ version: 1, enabled: true })), premiumPreviewKey);
  await page.reload();
  const assessment = page.getByTestId("onboarding-assessment");
  await expect(assessment).toBeVisible();
  await assessment.getByRole("checkbox", { name: /Add an upcoming assessment/ }).check();
  await assessment.getByLabel("Assessment name").fill("Calculus prelim");
  await assessment.getByLabel("Date").fill("2027-02-12");
  await page.getByRole("button", { name: "Finish setup" }).click();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), studyPlanKey);
  expect(saved.setup.assessments[0]).toMatchObject({ title: "Calculus prelim", courseSlug: "higher-maths", scope: { kind: "whole_course" } });
});

for (const width of [320, 375, 390]) test(`onboarding stays usable and overflow-free at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 720 });
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Finish setup" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
