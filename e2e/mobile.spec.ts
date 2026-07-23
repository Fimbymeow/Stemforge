import { test, expect } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, currentAttempt, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow, openQuestion, openWorkedSolution, submitAnswer } from "./fixtures/student-actions";

test("mobile student can navigate, answer, use support and continue without overflow", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("0 / 8 completed");
  await expect(page.getByRole("link", { name: "Start learning" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course progress" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole("link", { name: "Subjects" })).toBeVisible();

  await page.goto("/subjects/higher-maths");
  await expect(page.getByRole("heading", { name: "Higher Maths", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByTestId("path-mastery-status")).toContainText("Not Started");
  await expect(page.getByTestId("reset-progress")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.getByText("Optional keypad")).toBeVisible();
  await expect(page.getByTestId("hint-control")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await submitAnswer(page, "wrong");
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
  const primary = panel.getByRole("button", { name: "Practise again" });
  const secondary = panel.getByRole("link", { name: "Review a stage" });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const primaryBox = await primary.boundingBox();
  const secondaryBox = await secondary.boundingBox();
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
  await expect(page.getByRole("heading", { name: "8 matching questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  await expect(page.getByText("Future Higher Maths coverage", { exact: true })).toBeVisible();
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
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
  await page.getByRole("button", { name: "insert x squared" }).click();
  await expect(answer).toHaveValue("x^2");
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
  await expect(page.getByRole("heading", { name: "Higher Maths Notes", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Power rule", exact: true })).toBeVisible();
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("at 320x568 the beta notice and feedback dock never visually overlap each other or obscure the answer input", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openQuestion(page, QUESTION_IDS[0]);
  const notice = page.getByLabel("Private beta notice", { exact: true });
  const dock = page.getByRole("button", { name: "Send feedback" });
  await expect(notice).toBeVisible();
  await expect(dock).toBeVisible();
  const noticeBox = await notice.boundingBox();
  const dockBox = await dock.boundingBox();
  expect(noticeBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  // The dock must sit entirely below the notice's bottom edge (or vice versa) — never overlapping.
  const verticallySeparate = dockBox!.y >= noticeBox!.y + noticeBox!.height - 1 || noticeBox!.y >= dockBox!.y + dockBox!.height - 1;
  expect(verticallySeparate).toBe(true);
  const answer = page.getByLabel("Your answer");
  await expect(answer).toBeVisible();
  const answerBox = await answer.boundingBox();
  expect(answerBox).not.toBeNull();
  // Neither fixed element's bounding box may intersect the answer input's bounding box.
  for (const box of [noticeBox!, dockBox!]) {
    const intersects = box.x < answerBox!.x + answerBox!.width && box.x + box.width > answerBox!.x
      && box.y < answerBox!.y + answerBox!.height && box.y + box.height > answerBox!.y;
    expect(intersects).toBe(false);
  }
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

test("dismiss controls meet the established 40px mobile touch-target floor", async ({ page }) => {
  await page.goto("/dashboard");
  const dismissNotice = page.getByRole("button", { name: "Dismiss private beta notice" });
  await expect(dismissNotice).toBeVisible();
  const noticeBox = await dismissNotice.boundingBox();
  expect(noticeBox).not.toBeNull();
  expect(noticeBox!.width).toBeGreaterThanOrEqual(40);
  expect(noticeBox!.height).toBeGreaterThanOrEqual(40);
});
