import { test, expect } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow, openQuestion, openWorkedSolution, submitAnswer } from "./fixtures/student-actions";

test("mobile student can navigate, answer, use support and continue without overflow", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-current-stage")).toHaveText("Foundations \u00b7 0/3 complete");
  await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toHaveAttribute("href", "/subjects/higher-maths");
  await expect(page.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(page.getByRole("heading", { name: "Course progress" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole("link", { name: "Subjects" })).toBeVisible();

  await page.goto("/subjects/higher-maths");
  await expect(page.getByRole("heading", { name: "Higher Maths", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.locator('[data-mastery-status="not_started"]')).toHaveAccessibleName("Progress: Not started");
  await page.getByText("Progress options", { exact: true }).click();
  await expect(page.getByTestId("reset-progress")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show maths keyboard" })).toBeVisible();
  await expect(page.getByTestId("hint-control")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await submitAnswer(page, "4x^5");
  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();
  await openWorkedSolution(page);
  await expect(page.getByTestId("question-status")).toContainText("Completed with solution");
  await expect(page.getByTestId("next-question-action")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("next-question-action").click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[1]}$`));
});

test("mobile final completion is readable, stacked and free of horizontal overflow", async ({ page }) => {
  const prior = QUESTION_IDS.slice(0, -1).map((id, index) => currentAttempt(id, index + 1));
  await seedStoredProgress(page, v3Payload(prior));
  const finalQuestion = QUESTION_IDS.at(-1)!;
  await openQuestion(page, finalQuestion);
  await submitAnswer(page, QUESTION_ANSWERS[finalQuestion]);

  const panel = page.getByTestId("path-completion-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Basic differentiation mastered");
  await expect(panel).toContainText("8 / 8 completed");
  const primary = panel.getByRole("link", { name: "Start learning" });
  const secondary = panel.getByRole("link", { name: "Review a stage" });
  await expect(primary).toBeVisible();
  await expect(primary).toHaveAttribute("href", "/question/hm-calc-diff-chain-f-001");
  await expect(secondary).toBeVisible();
  const [primaryBox, secondaryBox] = await panel.getByRole("link").evaluateAll((links) => {
    const boxFor = (label: string) => {
      const link = links.find((candidate) => candidate.textContent?.trim() === label);
      if (!link) return null;
      const box = link.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    return [boxFor("Start learning"), boxFor("Review a stage")];
  });
  expect(primaryBox).not.toBeNull();
  expect(secondaryBox).not.toBeNull();
  expect(secondaryBox!.y).toBeGreaterThan(primaryBox!.y + primaryBox!.height - 1);
  expect(Math.abs(secondaryBox!.x - primaryBox!.x)).toBeLessThanOrEqual(1);
  await expectNoHorizontalOverflow(page);
  await primary.focus();
  await expect(primary).toBeFocused();
});

test("mobile taxonomy and question context remain readable without page overflow", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page.getByRole("heading", { name: "42 matching questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  await expect(page.getByText("Future Higher Maths coverage", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Filters/ }).click();
  const filters = page.getByRole("dialog", { name: "Filters" });
  await filters.getByRole("button", { name: "Skills: All skills" }).click();
  await expect(filters.getByRole("group", { name: "Skills" }).getByLabel("Chain rule")).toBeVisible();
  await filters.getByLabel("Search skills").fill("chain");
  await page.keyboard.press("Escape");
  await expect(filters).toBeVisible();
  await expect(filters.getByRole("button", { name: "Skills: All skills" })).toBeFocused();
  await expect(filters.getByLabel("Sort")).toBeVisible();
  await expect(filters.getByRole("button", { name: "Select all 42 filtered questions" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await page.goto("/question/hm-calc-diff-basic-a-001");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb).toContainText("Differentiating functions");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("mobile question interaction reaches the task early and keeps feedback and support in view", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  const answer = page.getByLabel("Your answer");
  const answerBox = await answer.boundingBox();
  expect(answerBox).not.toBeNull();
  expect(answerBox!.y).toBeLessThan(700);
  const hintBox = await page.getByTestId("hint-control").boundingBox();
  const blockedBox = await page.getByTestId("next-question-locked").boundingBox();
  expect(hintBox).not.toBeNull();
  expect(blockedBox).not.toBeNull();
  expect(hintBox!.y).toBeLessThan(blockedBox!.y);

  await answer.focus();
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  await page.getByRole("group", { name: "Maths keyboard" }).getByRole("button", { name: "Variable x", exact: true }).click();
  await page.getByRole("button", { name: "Power", exact: true }).click();
  await page.getByRole("group", { name: "Maths keyboard" }).getByRole("button", { name: "2", exact: true }).click();
  await expectMathFieldValue(answer, "x^2");
  await page.getByRole("button", { name: "Move left" }).click();
  await expect(answer).toBeFocused();
  await page.getByRole("button", { name: "Move right" }).click();
  await page.getByRole("button", { name: "Backspace" }).click();
  await answer.fill("4x^5");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  const feedback = page.getByTestId("question-status");
  await expect(feedback).toBeVisible();
  const feedbackBox = await feedback.boundingBox();
  expect(feedbackBox).not.toBeNull();
  expect(feedbackBox!.y - await page.evaluate(() => scrollY)).toBeLessThan(844);
  await expect(page.getByTestId("submitted-answer")).toContainText("4x^5");
  await expectNoHorizontalOverflow(page);
});

test("mobile disabled account state remains readable and offers guest continuation", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Accounts are not available" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue as a guest" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("mobile Functional Honesty surfaces remain compact, semantic and error-free", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/practice");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("combobox", { name: "Course" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Path" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Mixed practice/ })).toHaveCount(0);
  await expect(page.getByTestId("quick-practice-action")).toBeVisible();
  await expect(page.getByLabel("Requested questions")).not.toBeVisible();
  await expect(page.getByLabel("Notifications")).toHaveCount(0);
  await expect(page.getByLabel("Profile preview")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/subjects/higher-maths/revision-notes");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Basic Differentiation", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Power rule", exact: true })).toBeVisible();
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("at 320x568 the feedback dock does not obscure the answer input and beta messaging is absent", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openQuestion(page, QUESTION_IDS[0]);
  const dock = page.getByRole("button", { name: "Send feedback" });
  await expect(page.getByLabel("Public beta notice", { exact: true })).toHaveCount(0);
  await expect(dock).toBeVisible();
  const dockBox = await dock.boundingBox();
  expect(dockBox).not.toBeNull();
  const answer = page.getByLabel("Your answer");
  await expect(answer).toBeVisible();
  const answerBox = await answer.boundingBox();
  expect(answerBox).not.toBeNull();
  // The persistent dock must not intersect the answer input.
  const intersects = dockBox!.x < answerBox!.x + answerBox!.width && dockBox!.x + dockBox!.width > answerBox!.x
    && dockBox!.y < answerBox!.y + answerBox!.height && dockBox!.y + dockBox!.height > answerBox!.y;
  expect(intersects).toBe(false);
  await expectNoHorizontalOverflow(page);
});

test("at 320px the app navigation fits without horizontal scrolling and every item stays reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav).toBeVisible();
  const navBox = await nav.boundingBox();
  expect(navBox).not.toBeNull();
  expect(navBox!.width).toBeLessThanOrEqual(320);
  for (const name of ["Dashboard", "Subjects", "Path"]) {
    const link = nav.getByRole("link", { name });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await expectNoHorizontalOverflow(page);
});

test("at 320px practice, questions and resources have no document overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });

  for (const href of [
    "/practice",
    "/subjects/higher-maths/question-bank",
    "/subjects/higher-maths/revision-notes",
    `/question/${QUESTION_IDS[0]}`,
  ]) {
    await page.goto(href);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("the persistent feedback control meets the established 40px mobile touch-target floor", async ({ page }) => {
  await page.goto("/dashboard");
  const feedback = page.getByRole("button", { name: "Send feedback" });
  await expect(feedback).toBeVisible();
  const feedbackBox = await feedback.boundingBox();
  expect(feedbackBox).not.toBeNull();
  expect(feedbackBox!.width).toBeGreaterThanOrEqual(40);
  expect(feedbackBox!.height).toBeGreaterThanOrEqual(40);
});

test("at 390x844 the Question Bank's first result row begins inside the initial viewport", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  const firstRow = page.locator("li").first();
  await expect(firstRow).toBeVisible();
  const box = await firstRow.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(844);
});

test("the mobile filter sheet traps focus, supports Escape, restores focus and exposes Reset/Apply", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  const trigger = page.getByRole("button", { name: "Filters" });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel("Course area")).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Reset filters" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Apply" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("a same-subject skill path pre-scopes the Bank and the broaden action clears it without leaving the route", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank?path=basic-differentiation");
  await expect(page.getByText("Scoped to Basic differentiation")).toBeVisible();
  const resultsHeading = page.getByRole("heading", { name: /matching question/ });
  await expect(resultsHeading).toBeVisible();
  await page.getByRole("button", { name: "Browse all Higher Maths" }).click();
  await expect(page).toHaveURL("/subjects/higher-maths/question-bank");
  await expect(page.getByText("Scoped to")).toHaveCount(0);
});

async function expectMathFieldValue(field: import("@playwright/test").Locator, expected: string) {
  await expect.poll(() => field.evaluate((element) => (element as HTMLElement & { getValue(format: string): string }).getValue("latex"))).toBe(expected);
}
