import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { STORAGE_KEY } from "./fixtures/progress";

const enabled = process.env.STEMFORGE_STUDY_PLAN_ENABLED === "true";
const studyPlanKey = "orthic.studyPlan.v1";

test.describe("feature-flagged Study Plan This Week", () => {
  test.skip(!enabled, "Study Plan P2 is intentionally hidden unless its server flag is enabled.");

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-08-12T10:00:00.000Z"));
    await page.goto("/dashboard");
    await page.evaluate(({ studyPlanKey, progressKey }) => { localStorage.removeItem(studyPlanKey); localStorage.removeItem(progressKey); }, { studyPlanKey, progressKey: STORAGE_KEY });
    await page.reload();
    await page.getByTestId("study-plan-setup").getByRole("button", { name: "Set up my plan" }).click();
    await page.getByRole("dialog", { name: "Plan your study week" }).getByRole("button", { name: "Create my plan" }).click();
  });

  test("Today and This Week project the same canonical item and keep Dashboard sparse", async ({ page, seriousBrowserErrors }) => {
    const todayItem = page.getByTestId("study-plan-today").getByTestId("study-plan-item");
    const itemKey = await todayItem.getAttribute("data-item-key");
    await page.getByRole("link", { name: /View this week/ }).click();
    await expect(page).toHaveURL(/\/study-plan$/);
    const week = page.getByTestId("study-plan-week");
    await expect(week.getByRole("heading", { name: "This week" })).toBeVisible();
    await expect(week.getByTestId("study-plan-day-group")).toHaveCount(1);
    await expect(week.getByTestId("study-plan-item")).toHaveAttribute("data-item-key", itemKey!);
    await expect(week).toContainText(/min planned/);
    expect(seriousBrowserErrors).toEqual([]);
  });

  test("weekly Move supports Later this week and Today immediately reflects the edit", async ({ page }) => {
    await page.getByRole("link", { name: /View this week/ }).click();
    const week = page.getByTestId("study-plan-week");
    await week.getByLabel(/Actions for/).click();
    await week.getByRole("button", { name: "Move" }).click();
    await week.getByRole("button", { name: "Later this week" }).click();
    await expect(week.getByRole("heading", { name: "Later this week" })).toBeVisible();
    await expect(week.getByRole("status")).toContainText("Moved to later this week");
    await week.getByRole("link", { name: "Today" }).click();
    await expect(page.getByTestId("study-plan-today").getByTestId("study-plan-item")).toHaveCount(0);
    await expect(page.getByTestId("study-plan-today")).toContainText("Nothing is planned for today");
  });

  test("Done and Skip remain lightweight weekly actions with accessible status", async ({ page }) => {
    await page.getByRole("link", { name: /View this week/ }).click();
    const week = page.getByTestId("study-plan-week");
    await week.getByLabel(/Actions for/).click();
    await week.getByRole("button", { name: "Done" }).click();
    await expect(week.getByRole("status")).toContainText("Marked done for this plan");
    await expect(week.getByTestId("study-plan-item")).toContainText("Open");
  });

  test("opening a later day calmly rebalances missed work without behind or catch-up language", async ({ page }) => {
    await page.evaluate((key) => {
      const value = JSON.parse(localStorage.getItem(key)!);
      value.plan.items[0].scheduledDate = "2026-08-10";
      value.plan.items[0].date = "2026-08-10";
      value.plan.items[0].originalSuggestedDate = "2026-08-10";
      localStorage.setItem(key, JSON.stringify(value));
    }, studyPlanKey);
    await page.goto("/study-plan");
    const week = page.getByTestId("study-plan-week");
    await expect(week.getByRole("status")).toContainText("Plan adjusted");
    await expect(week).not.toContainText(/behind|catch up|failed day/i);
    await expect(week.getByTestId("study-plan-item")).toHaveCount(1);
  });

  test("Plan settings and quiet Refresh remain available without competing with Today", async ({ page }) => {
    await page.getByRole("link", { name: /View this week/ }).click();
    const week = page.getByTestId("study-plan-week");
    await week.getByRole("button", { name: "Refresh" }).click();
    await expect(week.getByRole("status")).toContainText(/already up to date|Plan adjusted/);
    const settingsTrigger = week.getByRole("button", { name: "Plan settings" });
    await settingsTrigger.click();
    const dialog = page.getByRole("dialog", { name: "Plan settings" });
    await expect(dialog).toHaveAttribute("data-dialog-shell", "true");
    await expect(dialog.getByRole("button", { name: "Save plan" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close plan settings" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(settingsTrigger).toBeFocused();
  });

  for (const width of [390, 320]) test(`weekly groups and action menus remain overflow-free at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole("link", { name: /View this week/ }).click();
    await expect(page.getByTestId("study-plan-week")).toBeVisible();
    await page.getByTestId("study-plan-week").getByLabel(/Actions for/).click();
    await expectNoHorizontalOverflow(page);
    await page.getByTestId("study-plan-week").getByRole("button", { name: "Plan settings" }).click();
    const dialog = page.locator("[data-dialog-shell]");
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expectNoHorizontalOverflow(page);
  });
});
