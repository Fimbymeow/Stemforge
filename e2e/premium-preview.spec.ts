import { expect, test } from "./fixtures/test";

const studyPlanEnabled = process.env.STEMFORGE_STUDY_PLAN_ENABLED === "true";
const STUDY_PLAN_KEY = "orthic.studyPlan.v1";
const PREMIUM_PREVIEW_KEY = "orthic.premiumPreview.v1";

test.describe("development-only Premium Preview", () => {
  test.skip(!studyPlanEnabled, "The previewed assessment features live on the feature-flagged Study Plan surface.");

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-08-12T10:00:00.000Z"));
    await page.goto("/");
    await page.evaluate(({ key }) => localStorage.setItem(key, JSON.stringify({
      version: 3,
      setup: {
        weeklyMinutes: 90,
        availableDays: ["mon", "wed", "sat"],
        assessments: [{
          id: "class-test",
          courseSlug: "higher-maths",
          type: "class_test",
          title: "Differentiation class test",
          date: { precision: "exact", date: "2026-08-20" },
          scope: { kind: "skills", skillPathIds: ["basic-differentiation"] },
          source: "learner",
        }],
      },
      plan: null,
      previousWeek: null,
      preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [] },
    })), { key: STUDY_PLAN_KEY });
  });

  test("switches between the free and built Premium-shaped assessment experience", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByTestId("premium-preview-toggle")).toHaveCount(0);

    await page.goto("/study-plan");
    await expect(page.getByTestId("assessment-readiness")).toHaveCount(0);
    await page.getByRole("button", { name: "Plan settings" }).click();
    await expect(page.getByTestId("premium-assessment-settings")).toHaveCount(0);
    await page.getByRole("button", { name: "Close plan settings" }).click();
    await page.goto("/practice");
    await expect(page.getByTestId("quick-practice-recommendation")).not.toContainText("Differentiation class test");

    await setPreview(page, true);
    await page.goto("/study-plan");
    await expect(page.getByTestId("assessment-readiness")).toBeVisible();
    await page.getByRole("button", { name: "Plan settings" }).click();
    await expect(page.getByTestId("premium-assessment-settings")).toBeVisible();
    await page.getByRole("button", { name: "Close plan settings" }).click();
    await page.goto("/practice");
    await expect(page.getByTestId("quick-practice-recommendation")).toContainText("Differentiation class test");

    await setPreview(page, false);
    const assessmentCount = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).setup.assessments.length, STUDY_PLAN_KEY);
    expect(assessmentCount).toBe(1);
  });
});

async function setPreview(page: import("@playwright/test").Page, enabled: boolean) {
  await page.evaluate(({ key, enabled }) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, enabled }));
    window.dispatchEvent(new Event("orthic:premium-preview-updated"));
  }, { key: PREMIUM_PREVIEW_KEY, enabled });
}
