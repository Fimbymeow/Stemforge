import { expect, test } from "./fixtures/test";
import { currentAttempt, seedStoredProgress, STORAGE_KEY, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { contentResolver } from "../lib/content-resolver";

const enabled = process.env.STEMFORGE_STUDY_PLAN_ENABLED === "true";
const studyPlanKey = "orthic.studyPlan.v1";

test.describe("feature-flagged Study Plan Today", () => {
  test.skip(!enabled, "Study Plan P1 is intentionally hidden unless its server flag is enabled.");

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-08-12T10:00:00.000Z"));
    await page.goto("/dashboard");
    await page.evaluate(({ studyPlanKey, progressKey }) => {
      localStorage.removeItem(studyPlanKey);
      localStorage.removeItem(progressKey);
    }, { studyPlanKey, progressKey: STORAGE_KEY });
    await page.reload();
  });

  test("setup makes Today the sole equivalent next-action surface and preserves evidence when marked Done", async ({ page, seriousBrowserErrors }) => {
    const setup = page.getByTestId("study-plan-setup");
    await expect(setup.getByRole("heading", { name: "Plan your study week" })).toBeVisible();
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByLabel("Minutes each week").fill("90");
    await setup.getByRole("button", { name: "Create my plan" }).click();

    const today = page.getByTestId("study-plan-today");
    await expect(today.getByRole("heading", { name: "Today" })).toBeVisible();
    await expect(today.getByTestId("study-plan-item")).toHaveCount(1);
    await expect(today.getByTestId("study-plan-item").getByRole("link", { name: "Start" })).toHaveAttribute("href", /\/question\/hm-calc-diff-basic-f-001$/);
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-resume-course")).toHaveCount(0);

    const evidenceBefore = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    const actions = today.getByLabel(/Actions for/);
    await expect(actions).toHaveAttribute("aria-label", /Actions for/);
    await actions.click();
    await today.getByRole("button", { name: "Done" }).click();
    await expect(today.getByRole("status")).toContainText("Marked done for this plan");
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(evidenceBefore);
    await page.reload();
    await expect(page.getByTestId("study-plan-item")).toContainText("Open");
    expect(seriousBrowserErrors).toEqual([]);
  });

  test("a distinct active Practice action becomes compact Resume course rather than a second large card", async ({ page }) => {
    await page.goto("/practice");
    await page.getByTestId("quick-practice-action").click();
    await expect(page).toHaveURL(/\/practice\/session\//);
    const sessionPath = new URL(page.url()).pathname;
    await page.goto("/dashboard");
    const setup = page.getByTestId("study-plan-setup");
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
    const resume = page.getByTestId("dashboard-resume-course");
    await expect(resume).toBeVisible();
    await expect(resume.getByRole("link")).toHaveAttribute("href", sessionPath);
  });

  test("Move offers only available current-week dates and removes the item from Today", async ({ page }) => {
    const setup = page.getByTestId("study-plan-setup");
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    const today = page.getByTestId("study-plan-today");
    await today.getByLabel(/Actions for/).click();
    await today.getByRole("button", { name: "Move" }).click();
    await expect(today.getByRole("button", { name: "Thu 13 Aug" })).toBeVisible();
    await expect(today.getByRole("button", { name: "Tue 11 Aug" })).toHaveCount(0);
    await today.getByRole("button", { name: "Thu 13 Aug" }).click();
    await expect(today.getByTestId("study-plan-item")).toHaveCount(0);
    await expect(today.getByRole("status")).toContainText("Moved within this week");
  });

  test("Skip hides the item, Swap is honest without an alternative, and settings remain editable", async ({ page, seriousBrowserErrors }) => {
    const setup = page.getByTestId("study-plan-setup");
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    const today = page.getByTestId("study-plan-today");
    await today.getByLabel(/Actions for/).click();
    await today.getByRole("button", { name: "Swap" }).click();
    await expect(today.getByRole("status")).toContainText("No other useful recommendation");
    await today.getByRole("button", { name: "Skip" }).click();
    await expect(today.getByTestId("study-plan-item")).toHaveCount(0);
    await expect(today).toContainText("Nothing is planned for today");
    await today.getByLabel("Plan options").click();
    await today.getByRole("button", { name: "Plan settings" }).click();
    await expect(page.getByTestId("study-plan-setup").getByRole("button", { name: "Save plan" })).toBeVisible();
    expect(seriousBrowserErrors).toEqual([]);
  });

  test("a learner with all live work recently completed sees the calm caught-up state", async ({ page }) => {
    await seedStoredProgress(page, v3Payload(completedLiveAttempts()));
    await page.goto("/dashboard");
    const setup = page.getByTestId("study-plan-setup");
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    const today = page.getByTestId("study-plan-today");
    await expect(today).toContainText("You’re caught up for now.");
    await expect(today.getByTestId("study-plan-item")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-resume-course")).toHaveCount(0);
  });

  for (const width of [390, 320]) test(`Today and Activity remain overflow-free at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await expect(page.getByTestId("study-plan-setup")).toBeVisible();
    await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.getByTestId("dashboard-activity-summary")).toBeVisible();
  });
});

function completedLiveAttempts() {
  const contexts = contentResolver.getAllPathContexts().filter((context) => context.skillPath.isAvailable);
  return contexts.flatMap((context) => (context.skillPath.learningStages ?? []).flatMap((stage) => stage.questionIds)).map((questionId, index) => {
    const context = contentResolver.getQuestionContext(questionId)!;
    return currentAttempt(questionId as Parameters<typeof currentAttempt>[0], index + 1, {
      eventId: `study_plan_caught_up_${index}`,
      skillPathId: context.skillPath.slug,
      stageId: context.stage.id,
      attemptedAt: new Date(Date.parse("2026-08-12T08:00:00.000Z") + index * 1_000).toISOString(),
      versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    });
  });
}

test("Study Plan is absent when the feature flag is disabled", async ({ page }) => {
  test.skip(enabled, "This assertion covers the normal fail-closed configuration.");
  await page.goto("/dashboard");
  await expect(page.getByTestId("study-plan-today")).toHaveCount(0);
  await expect(page.getByTestId("study-plan-setup")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
  await expect(page.getByTestId("dashboard-activity-summary")).toBeVisible();
});
