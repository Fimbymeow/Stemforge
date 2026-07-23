import { expect, test } from "./fixtures/test";

const bank = "/subjects/higher-maths/question-bank";

test("Question Bank opens directly into compact discovery with published-only filters", async ({ page }) => {
  await page.goto(bank);
  await expect(page.getByRole("heading", { name: "Question Bank", exact: true })).toBeVisible();
  await expect(page.getByText("Best next step")).toHaveCount(0);
  await expect(page.getByText("8 questions available")).toBeVisible();
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await page.getByLabel("Course area").selectOption({ label: "Calculus" });
  await page.getByLabel("Specification area").selectOption({ label: "Differentiation" });
  await page.getByLabel("Skill path").selectOption({ label: "Basic differentiation" });
  await page.getByLabel("Stage", { exact: true }).selectOption({ label: "Foundations" });
  await expect(page.getByRole("heading", { name: "3 matching questions" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("heading", { name: "8 matching questions" })).toBeVisible();
});

test("selection survives filtering, can be reviewed and creates an ordered custom session", async ({ page }) => {
  await page.goto(bank);
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
  await expect(page.getByLabel("Question selection summary")).toContainText("1 selected");
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await page.getByLabel("Stage", { exact: true }).selectOption({ label: "Applications" });
  await expect(page.getByLabel("Question selection summary")).toContainText("1 selected");
  await page.getByRole("button", { name: /Select all 3 filtered questions/ }).click();
  await expect(page.getByLabel("Question selection summary")).toContainText("4 selected");
  await page.getByRole("button", { name: "Review selection" }).click();
  const dialog = page.getByRole("dialog", { name: "Review selection" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Remove Find gradient at a point/ }).click();
  await expect(dialog).toContainText("3 questions");
  await dialog.getByRole("button", { name: "Start practice" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/practice_custom_/);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Custom practice");
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of 3");
  await page.reload();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of 3");
  await page.getByRole("link", { name: "Question Bank" }).click();
  await expect(page).toHaveURL(bank);
});

test("group selection language is precise and direct question access does not start practice", async ({ page }) => {
  await page.goto(bank);
  await page.getByLabel("Select this stage").first().check();
  await expect(page.getByLabel("Question selection summary")).toContainText("3 selected");
  const directLink = page.getByRole("link", { name: "Open Differentiate a power" });
  await expect(directLink).toHaveAttribute("href", "/question/hm-calc-diff-basic-f-001");
  await directLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/question\/hm-calc-diff-basic-f-001/);
  await expect(page.getByTestId("practice-session-panel")).toHaveCount(0);
});

test("review dialog supports Escape and meaningful checkbox names", async ({ page }) => {
  await page.goto(bank);
  const checkbox = page.getByLabel("Select Basic differentiation, Foundations, Question 1");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Review selection" }).click();
  await expect(page.getByRole("dialog", { name: "Review selection" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Review selection" })).toHaveCount(0);
});

test("an active session is never overwritten without explicit confirmation", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const activeUrl = new URL(page.url()).pathname;
  await page.goto(bank);
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
  await page.getByRole("button", { name: "Start practice" }).click();
  const conflict = page.getByRole("dialog", { name: "You already have active practice" });
  await expect(conflict).toBeVisible();
  await expect(conflict.getByRole("link", { name: "Resume current session" })).toHaveAttribute("href", activeUrl);
  await conflict.getByRole("button", { name: "Replace and start" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/practice_custom_/);
});

test("Question Bank and selection controls have no document overflow at required widths", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 720, height: 450 },
    { width: 390, height: 844 }, { width: 360, height: 800 }, { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(bank);
    await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
    const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(geometry.scroll, `${viewport.width}px document overflow`).toBeLessThanOrEqual(geometry.client);
    await expect(page.getByRole("button", { name: "Start practice" })).toBeVisible();
  }
});
