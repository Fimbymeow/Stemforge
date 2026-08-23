import { expect, test } from "./fixtures/test";
import { currentAttempt, seedStoredProgress, STORAGE_KEY, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { contentResolver } from "../lib/content-resolver";

const enabled = process.env.STEMFORGE_STUDY_PLAN_ENABLED === "true";
const studyPlanKey = "orthic.studyPlan.v1";
const premiumPreviewKey = "orthic.premiumPreview.v1";

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

  test("a learner who skipped Study Rhythm gets setup, continuation, courses and Activity in that order", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByTestId("study-plan-setup")).toBeVisible();
    await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
    await expect(page.getByTestId("dashboard-courses-section")).toBeVisible();
    await expect(page.getByTestId("dashboard-activity-summary")).toContainText("No activity in the last 14 days");
    await expect(page.getByTestId("learner-name-prompt")).toHaveCount(0);
    await expectVerticalOrder(page, ["study-plan-setup", "dashboard-progress-summary", "dashboard-courses-section", "dashboard-activity-summary"]);
  });

  test("setup makes Today the sole equivalent next-action surface and preserves evidence when marked Done", async ({ page, seriousBrowserErrors }) => {
    await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
    const setup = page.getByRole("dialog", { name: "Plan your study week" });
    await expect(setup.getByRole("heading", { name: "Plan your study week" })).toBeVisible();
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByLabel("Weekly study time in hours").fill("1.5");
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

  test("configured Today suppresses a distinct active Practice action instead of creating a competing Dashboard recommendation", async ({ page }) => {
    await page.goto("/practice");
    await page.getByTestId("quick-practice-action").click();
    await expect(page).toHaveURL(/\/practice\/session\//);
    await page.goto("/dashboard");
    await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
    const setup = page.getByRole("dialog", { name: "Plan your study week" });
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-resume-course")).toHaveCount(0);
    await expectVerticalOrder(page, ["study-plan-today", "dashboard-courses-section", "dashboard-activity-summary"]);
    await expect(page.getByTestId("study-plan-today")).toBeVisible();
  });

  test("Move offers only available current-week dates and removes the item from Today", async ({ page }) => {
    await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
    const setup = page.getByRole("dialog", { name: "Plan your study week" });
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
    await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
    const setup = page.getByRole("dialog", { name: "Plan your study week" });
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    const today = page.getByTestId("study-plan-today");
    await today.getByLabel(/Actions for/).click();
    await today.getByRole("button", { name: "Swap" }).click();
    await expect(today.getByRole("status")).toContainText("No other useful recommendation");
    await today.getByRole("button", { name: "Skip" }).click();
    await expect(today.getByTestId("study-plan-item")).toHaveCount(0);
    await expect(today).toContainText("Nothing is planned for today");
    await today.getByRole("button", { name: "Plan settings" }).click();
    await expect(page.getByRole("dialog", { name: "Plan settings" }).getByRole("button", { name: "Save plan" })).toBeVisible();
    expect(seriousBrowserErrors).toEqual([]);
  });

  test("a learner with all live work recently completed sees the calm caught-up state", async ({ page }) => {
    await seedStoredProgress(page, v3Payload(completedLiveAttempts()));
    await page.goto("/dashboard");
    await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
    const setup = page.getByRole("dialog", { name: "Plan your study week" });
    for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
    await setup.getByRole("button", { name: "Create my plan" }).click();
    const today = page.getByTestId("study-plan-today");
    await expect(today).toContainText("You’re caught up for now.");
    await expect(today.getByTestId("study-plan-item")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-resume-course")).toBeVisible();
    await expect(page.getByTestId("dashboard-resume-course")).toContainText("Continue learning");
  });

  test("Review due is carried by Today without creating a separate Dashboard Review card", async ({ page }) => {
    await seedStoredProgress(page, v3Payload(completedPathAttempts("basic-differentiation", "2026-08-01T08:00:00.000Z")));
    await page.goto("/dashboard");
    await createPlan(page);
    const today = page.getByTestId("study-plan-today");
    await expect(today.getByTestId("study-plan-item")).toContainText("Basic differentiation");
    await expect(today.getByTestId("study-plan-item")).toContainText(/Review/);
    await expect(page.getByRole("heading", { name: "Review" })).toHaveCount(0);
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
  });

  test("an upcoming assessment stays contextual to the existing Today item", async ({ page }) => {
    await page.evaluate(({ studyPlanKey, premiumPreviewKey }) => {
      localStorage.setItem(premiumPreviewKey, JSON.stringify({ version: 1, enabled: true }));
      localStorage.setItem(studyPlanKey, JSON.stringify({
        version: 3,
        setup: {
          weeklyMinutes: 90,
          availableDays: ["wed", "fri", "sun"],
          assessments: [{
            id: "dashboard-class-test",
            courseSlug: "higher-maths",
            type: "class_test",
            title: "Differentiation class test",
            date: { precision: "exact", date: "2026-09-05" },
            scope: { kind: "skills", skillPathIds: ["basic-differentiation"] },
            source: "learner",
          }],
        },
        plan: null,
        previousWeek: null,
        preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [] },
      }));
    }, { studyPlanKey, premiumPreviewKey });
    await page.reload();
    const today = page.getByTestId("study-plan-today");
    await expect(today.getByTestId("study-plan-item")).toContainText("On your test in 24 days");
    await expect(page.getByRole("heading", { name: /assessment/i })).toHaveCount(0);
    await expect(page.getByTestId("dashboard-progress-summary")).toHaveCount(0);
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

function completedPathAttempts(pathId: string, attemptedAt: string) {
  const context = contentResolver.getPathContext(pathId);
  if (!context) throw new Error(`Missing test path ${pathId}`);
  return (context.skillPath.learningStages ?? []).flatMap((stage) => stage.questionIds).map((questionId, index) => {
    const questionContext = contentResolver.getQuestionContext(questionId)!;
    return currentAttempt(questionId as Parameters<typeof currentAttempt>[0], index + 1, {
      eventId: `study_plan_review_due_${index}`,
      skillPathId: pathId,
      stageId: questionContext.stage.id,
      attemptedAt: new Date(Date.parse(attemptedAt) + index * 1_000).toISOString(),
      versionEvidence: { kind: "known", questionVersion: questionContext.question.questionVersion },
    });
  });
}

async function createPlan(page: import("@playwright/test").Page) {
  await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
  const setup = page.getByRole("dialog", { name: "Plan your study week" });
  for (const day of ["Tuesday", "Thursday", "Friday", "Sunday"]) await setup.getByTitle(day).click();
  await setup.getByRole("button", { name: "Create my plan" }).click();
}

async function expectVerticalOrder(page: import("@playwright/test").Page, testIds: string[]) {
  const boxes = await Promise.all(testIds.map((testId) => page.getByTestId(testId).boundingBox()));
  for (const box of boxes) expect(box).not.toBeNull();
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]!.y).toBeGreaterThanOrEqual(boxes[index - 1]!.y + boxes[index - 1]!.height);
  }
}

test("Study Plan is absent when the feature flag is disabled", async ({ page }) => {
  test.skip(enabled, "This assertion covers the normal fail-closed configuration.");
  await page.goto("/dashboard");
  await expect(page.getByTestId("study-plan-today")).toHaveCount(0);
  await expect(page.getByTestId("study-plan-setup")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary")).toBeVisible();
  await expect(page.getByTestId("dashboard-activity-summary")).toBeVisible();
});
