import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const enabled = process.env.STEMFORGE_STUDY_PLAN_ENABLED === "true";
const STUDY_PLAN_KEY = "orthic.studyPlan.v1";
const PREMIUM_PREVIEW_KEY = "orthic.premiumPreview.v1";

test.describe("feature-flagged assessment readiness", () => {
  test.skip(!enabled, "Assessment readiness belongs to the feature-flagged Study Plan surface.");

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-08-12T10:00:00.000Z"));
    await page.addInitScript(({ key }) => localStorage.setItem(key, JSON.stringify({ version: 1, enabled: true })), { key: PREMIUM_PREVIEW_KEY });
  });

  test("shows a real supported skill state and routes the best focus through Review", async ({ page }) => {
    await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
    await seedPlan(page, [assessment({ id: "class-test", title: "Differentiation class test", scope: { kind: "skills", skillPathIds: ["basic-differentiation"] } })]);
    await page.goto("/study-plan");

    const card = page.getByTestId("assessment-readiness-card").filter({ hasText: "Differentiation class test" });
    await expect(card).toContainText("Needs attention");
    await expect(card).toContainText(/Review due|Review overdue/);
    await expect(card.getByRole("link", { name: "Start Review" }).first()).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
  });

  test("keeps canonical unavailable skills in scope without offering a false action", async ({ page }) => {
    await seedPlan(page, [assessment({
      id: "mixed-scope",
      title: "Differentiation check",
      scope: { kind: "skills", skillPathIds: ["basic-differentiation", "tangents-and-normals"] },
    })]);
    await page.goto("/study-plan");

    const card = page.getByTestId("assessment-readiness-card").filter({ hasText: "Differentiation check" });
    await expect(card.getByTestId("assessment-coverage")).toHaveText("Orthic can currently assess 1 of 2 skills on this assessment.");
    const tangents = card.getByTestId("assessment-skill-row").filter({ hasText: "Tangents" });
    await expect(tangents).toContainText("Not available");
    await expect(tangents.getByRole("link")).toHaveCount(0);
  });

  test("whole-course and month-precision assessments use honest coverage and timing", async ({ page }) => {
    await seedPlan(page, [{
      ...assessment({ id: "final", title: "Higher Maths final", scope: { kind: "whole_course" } }),
      type: "final_exam" as const,
      date: { precision: "month" as const, year: 2026, month: 9 },
    }]);
    await page.goto("/study-plan");

    const card = page.getByTestId("assessment-readiness-card").filter({ hasText: "Higher Maths final" });
    await expect(card).toContainText("Expected next month");
    await expect(card.getByTestId("assessment-coverage")).toHaveText("Orthic can currently assess 2 of 49 course skills.");
    await expect(card.getByText("View readiness", { exact: true })).toBeVisible();
    const basicRow = card.getByTestId("assessment-skill-row").filter({ hasText: "Basic differentiation" });
    await expect(basicRow).not.toBeVisible();
    await card.getByText("View readiness", { exact: true }).click();
    await expect(basicRow).toBeVisible();
    await expect(card.getByText("Not available in Orthic yet (47)")).toBeVisible();
  });

  test("readiness remains overflow-free at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await seedPlan(page, [assessment({
      id: "mobile",
      title: "Differentiation class test",
      scope: { kind: "skills", skillPathIds: ["basic-differentiation", "tangents-and-normals"] },
    })]);
    await page.goto("/study-plan");
    await expect(page.getByTestId("assessment-readiness")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

function assessment(overrides: { id: string; title: string; scope: { kind: "whole_course" } | { kind: "skills"; skillPathIds: string[] } }) {
  return {
    id: overrides.id,
    courseSlug: "higher-maths",
    type: "class_test" as const,
    title: overrides.title,
    date: { precision: "exact" as const, date: "2026-08-20" },
    scope: overrides.scope,
    source: "learner" as const,
  };
}

async function seedPlan(page: Page, assessments: unknown[]) {
  await page.goto("/");
  await page.evaluate(({ key, assessments }) => localStorage.setItem(key, JSON.stringify({
    version: 3,
    setup: { weeklyMinutes: 90, availableDays: ["mon", "wed", "sat"], assessments },
    plan: null,
    previousWeek: null,
    preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [] },
  })), { key: STUDY_PLAN_KEY, assessments });
}
