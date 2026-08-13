import { expect, test } from "./fixtures/test";

const bank = "/subjects/higher-maths/question-bank";

test("Question Bank opens directly into compact discovery with published-only filters", async ({ page }) => {
  await page.goto(bank);
  await expect(page.getByRole("heading", { name: "Question Bank", exact: true })).toBeVisible();
  await expect(page.getByText("Best next step")).toHaveCount(0);
  await expect(page.getByText("42 questions available")).toBeVisible();
  await page.getByLabel("Course area").selectOption({ label: "Calculus" });
  await page.getByLabel("Specification area").selectOption({ label: "Differentiation" });
  await page.getByRole("button", { name: "Skills: All skills" }).click();
  await page.getByRole("group", { name: "Skills" }).getByLabel("Basic differentiation").click();
  await page.getByRole("group", { name: "Skills" }).getByRole("button", { name: "Done" }).click();
  await page.getByRole("group", { name: "Stages" }).getByLabel("Foundations").click();
  await expect(page.getByRole("heading", { name: "3 matching questions" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("heading", { name: "42 matching questions" })).toBeVisible();
});

test("filter state is shareable through the URL and survives refresh and Back/Forward", async ({ page }) => {
  await page.goto(bank);
  await page.getByRole("button", { name: "Skills: All skills" }).click();
  await page.getByRole("group", { name: "Skills" }).getByLabel("Basic differentiation").click();
  await expect(page).toHaveURL(/path=basic-differentiation/);
  await page.getByRole("group", { name: "Skills" }).getByRole("button", { name: "Done" }).click();
  await page.getByRole("group", { name: "Stages" }).getByLabel("Foundations").click();
  await expect(page).toHaveURL(/path=basic-differentiation/);
  await expect(page).toHaveURL(/stage=basic-diff-stage-foundations/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "3 matching questions" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Stages" }).getByLabel("Foundations")).toBeChecked();
  await page.goBack();
  await expect(page).toHaveURL(/path=basic-differentiation/);
  await expect(page).not.toHaveURL(/stage=/);
  await expect(page.getByRole("heading", { name: "8 matching questions" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "3 matching questions" })).toBeVisible();
});

test("skill and stage multi-select state is visible, shareable and removable", async ({ page }) => {
  await page.goto(bank);
  const skills = page.getByRole("group", { name: "Skills" });
  await skills.getByRole("button", { name: "Skills: All skills" }).click();
  await skills.getByLabel("Basic differentiation").click();
  await skills.getByLabel("Chain rule").click();
  await skills.getByRole("button", { name: "Done" }).click();
  const stages = page.getByRole("group", { name: "Stages" });
  await stages.getByLabel("Foundations").click();
  await stages.getByLabel("Applications").click();
  await expect(page).toHaveURL(/path=basic-differentiation%2Cchain-rule/);
  await expect(page).toHaveURL(/stage=basic-diff-stage-foundations%2Cchain-rule-stage-foundations%2Cbasic-diff-stage-applications%2Cchain-rule-stage-applications|stage=basic-diff-stage-foundations%2Cbasic-diff-stage-applications%2Cchain-rule-stage-foundations%2Cchain-rule-stage-applications/);
  for (const label of ["Basic differentiation", "Chain rule", "Foundations", "Applications"]) {
    await expect(page.getByRole("button", { name: `Remove ${label} filter` })).toBeVisible();
  }
  await page.getByRole("button", { name: "Remove Foundations filter" }).click();
  await expect(page.getByRole("button", { name: "Remove Foundations filter" })).toHaveCount(0);
});

test("selection survives filtering, can be reviewed and creates an ordered custom session", async ({ page }) => {
  await page.goto(bank);
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
  await expect(page.getByLabel("Question selection summary")).toContainText("1 selected");
  await page.getByRole("button", { name: "Skills: All skills" }).click();
  await page.getByRole("group", { name: "Skills" }).getByLabel("Basic differentiation").click();
  await page.getByRole("group", { name: "Skills" }).getByRole("button", { name: "Done" }).click();
  await page.getByRole("group", { name: "Stages" }).getByLabel("Applications").click();
  await expect(page.getByLabel("Question selection summary")).toContainText("1 selected");
  await page.getByRole("button", { name: /Select all 3 filtered questions/ }).click();
  await expect(page.getByLabel("Question selection summary")).toContainText("4 selected");
  await page.getByRole("button", { name: "Review selection" }).click();
  const dialog = page.getByRole("dialog", { name: "Review selection" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Remove Find gradient at a point/ }).click();
  await expect(dialog).toContainText("3 questions");
  await dialog.getByRole("button", { name: "Start selected practice" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/practice_custom_/);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Custom practice");
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of 3");
  await page.reload();
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of 3");
  await page.getByRole("link", { name: "Question Bank" }).click();
  await expect(page).toHaveURL(bank);
});

test("the compact skill picker searches, selects, clears and restores focus on Escape", async ({ page }) => {
  await page.goto(bank);
  const skills = page.getByRole("group", { name: "Skills" });
  const trigger = skills.getByRole("button", { name: "Skills: All skills" });
  await expect(skills.getByTestId("skill-picker-options")).toHaveCount(0);
  await trigger.click();
  await skills.getByLabel("Search skills").fill("chain");
  await expect(skills.getByLabel("Chain rule")).toBeVisible();
  await expect(skills.getByLabel("Basic differentiation")).toHaveCount(0);
  await skills.getByLabel("Chain rule").click();
  await expect(page).toHaveURL(/path=chain-rule/);
  await skills.getByLabel("Search skills").fill("");
  await skills.getByLabel("Basic differentiation").click();
  await expect(page).toHaveURL(/path=basic-differentiation%2Cchain-rule|path=chain-rule%2Cbasic-differentiation/);
  await skills.getByRole("button", { name: "Clear selected skills" }).click();
  await expect(page).not.toHaveURL(/path=/);
  await page.keyboard.press("Escape");
  await expect(skills.getByTestId("skill-picker-options")).toHaveCount(0);
  await expect(skills.getByRole("button", { name: "Skills: All skills" })).toBeFocused();
});

test("group selection spans the full matching group with an accurate indeterminate state, and direct question access does not start practice", async ({ page }) => {
  await page.goto(bank);
  const groupCheckbox = page.getByLabel("Select all 3 matching Foundations questions");
  await groupCheckbox.check();
  await expect(page.getByLabel("Question selection summary")).toContainText("3 selected");
  await expect(page.getByLabel("Deselect all 3 matching Foundations questions")).toBeVisible();
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").uncheck();
  const indeterminate = await page.getByLabel("Select all 3 matching Foundations questions").evaluate((node) => (node as HTMLInputElement).indeterminate);
  expect(indeterminate).toBe(true);

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
  await page.getByRole("button", { name: "Start selected practice" }).click();
  const conflict = page.getByRole("dialog", { name: "You already have active practice" });
  await expect(conflict).toBeVisible();
  await conflict.getByRole("button", { name: "Resume current session" }).click();
  await expect(page).toHaveURL((url) => url.pathname === activeUrl);
  await page.goto(bank);
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
  await page.getByRole("button", { name: "Start selected practice" }).click();
  await expect(conflict).toBeVisible();
  await conflict.getByRole("button", { name: "Replace and start" }).click();
  await expect(page).toHaveURL(/\/practice\/session\/practice_custom_/);
});

test("collapsed rows never mount full MathContent, and only the expanded row previews", async ({ page }) => {
  await page.goto(bank);
  await expect(page.locator(".math-content")).toHaveCount(0);
  const firstRow = page.locator("li").filter({ hasText: "Differentiate a power" });
  const secondRow = page.locator("li").filter({ hasText: "Differentiate a sum of powers" });
  await firstRow.getByRole("button", { name: "Preview" }).click();
  await expect(page.locator(".math-content")).toHaveCount(1);
  await expect(firstRow.getByRole("button", { name: "Hide preview" })).toBeVisible();
  await secondRow.getByRole("button", { name: "Preview" }).click();
  await expect(page.locator(".math-content")).toHaveCount(1);
  await expect(firstRow.getByRole("button", { name: "Preview" })).toBeVisible();
  await expect(secondRow.getByRole("button", { name: "Hide preview" })).toBeVisible();
  await secondRow.getByRole("button", { name: "Hide preview" }).click();
  await expect(page.locator(".math-content")).toHaveCount(0);
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
    await expect(page.getByRole("button", { name: "Start selected practice" })).toBeVisible();
  }
});
