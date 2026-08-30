import { expect, test } from "./fixtures/test";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";
import { getStudentResourceCapabilities } from "../lib/resource-capabilities";

test("Higher Maths keeps continuation above compact course destinations responsively", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/subjects/higher-maths");
  const learn = page.getByTestId("working-context-hub");
  const destinations = page.getByTestId("higher-maths-destinations");
  const practice = destinations.getByRole("link", { name: "Practice" });
  const questionBank = page.getByTestId("question-bank-destination");
  const review = page.getByTestId("review-entry-card");
  const tracker = page.getByTestId("course-tracker-destination");
  const pastPapers = page.getByTestId("past-papers-destination");
  await expect(learn).toBeVisible();
  await expect(practice).toBeVisible();
  await expect(questionBank).toHaveAttribute("href", "/subjects/higher-maths/question-bank");
  await expect(review).toBeVisible();
  await expect(tracker).toHaveAttribute("href", "/subjects/higher-maths/course-tracker");
  await expect(pastPapers).toHaveAttribute("href", "/subjects/higher-maths/past-papers");
  await expect(pastPapers.getByRole("button")).toHaveCount(0);
  const wide = await cardBoxes(learn, practice, review);
  expect(wide.practice.y).toBeGreaterThanOrEqual(wide.learn.y + wide.learn.height);
  expect(Math.abs(wide.practice.y - wide.review.y)).toBeLessThan(8);
  const questionBankBox = await questionBank.boundingBox();
  expect(Math.abs(wide.practice.y - questionBankBox!.y)).toBeLessThan(8);
  expect(Math.abs(wide.practice.y - wide.review.y)).toBeLessThan(8);
  const trackerBox = await tracker.boundingBox();
  const pastPapersBox = await pastPapers.boundingBox();
  expect(Math.abs(trackerBox!.y - pastPapersBox!.y)).toBeLessThan(8);
  expect(Math.abs(trackerBox!.width - pastPapersBox!.width)).toBeLessThan(2);
  await expectNoDocumentOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/subjects/higher-maths");
  const stacked = await cardBoxes(
    page.getByTestId("working-context-hub"),
    page.getByTestId("higher-maths-destinations").getByRole("link", { name: "Practice" }),
    page.getByTestId("review-entry-card"),
  );
  expect(stacked.practice.y).toBeGreaterThanOrEqual(stacked.learn.y + stacked.learn.height);
  expect(stacked.review.y).toBeGreaterThanOrEqual(stacked.practice.y + stacked.practice.height);
  await expect(page.getByTestId("course-tracker-destination")).toBeVisible();
  await expect(page.getByTestId("past-papers-destination")).toBeVisible();
  await expect(page.getByTestId("question-bank-destination")).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("Higher Maths opens an unscoped Question Bank from its course actions", async ({ page }) => {
  await page.goto("/subjects/higher-maths");
  await page.getByTestId("question-bank-destination").click();
  await expect(page).toHaveURL("/subjects/higher-maths/question-bank");
  await expect(page.getByRole("heading", { name: "42 matching questions" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Remove .* filter/ })).toHaveCount(0);
});

test("Course tracker distinguishes official requirements within its selected unit", async ({ page }) => {
  await page.goto("/subjects/higher-maths/course-tracker");
  const tracker = page.getByTestId("course-tracker");
  await expect(tracker.getByRole("heading", { name: "Calculus", exact: true })).toBeVisible();
  await expect(page.getByTestId("course-tracker-coverage")).toHaveCount(0);
  const basic = page.getByTestId("tracker-skill-basic-differentiation");
  const chain = page.getByTestId("tracker-skill-chain-rule");
  await expect(basic.getByRole("link", { name: "Open Basic differentiation skill overview" })).toBeVisible();
  await expect(chain.getByRole("link", { name: "Open Chain rule skill overview" })).toBeVisible();
  await expect(tracker.locator("[data-mastery-status]")).toHaveCount(0);
  const unavailable = page.getByTestId("tracker-skill-trigonometric-differentiation");
  await expect(unavailable).toContainText("official requirement");
  await expect(unavailable.getByRole("link")).toHaveCount(0);
  await expect(page.getByTestId("tracker-requirements-basic-differentiation")).toHaveCount(0);
  const disclosure = page.getByTestId("course-wide-requirements").getByText("Reasoning across the course", { exact: true });
  await disclosure.focus();
  await disclosure.press("Enter");
  await expect(disclosure.locator("xpath=parent::details")).toHaveAttribute("open", "");
  await expectNoDocumentOverflow(page);
  await expect(page.getByRole("link", { name: "Back to Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
  await page.goto("/subjects/higher-maths");
  await expect(page.getByTestId("course-tracker")).toHaveCount(0);
});

test("Dashboard reaches the focused Practice setup without a competing chooser", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/dashboard");
  const trigger = page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Practise your way" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page).toHaveURL("/practice");
  await expect(page.getByTestId("quick-practice-action")).toBeVisible();
  await expect(page.getByText("Choose practice options", { exact: true })).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("Practice destinations reuse Quick Practice and preserve Question Bank access", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Practise your way" }).click();
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const quick = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    const session = store.sessions.find((item: { sessionId: string }) => item.sessionId === store.activeSessionId);
    return { mode: session.mode, timing: session.timing.type, count: session.questionReferences.length };
  }, PRACTICE_SESSIONS_STORAGE_KEY);
  expect(quick).toEqual({ mode: "targeted", timing: "untimed", count: 4 });

  await page.evaluate((key) => localStorage.removeItem(key), PRACTICE_SESSIONS_STORAGE_KEY);
  await page.goto("/subjects/higher-maths");
  await page.getByTestId("higher-maths-destinations").getByRole("link", { name: "Practice" }).click();
  await page.goto("/subjects/higher-maths/question-bank");
  await expect(page).toHaveURL("/subjects/higher-maths/question-bank", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Question Bank", exact: true })).toBeVisible();
});

test("Maths exposes Notes and Practice without standalone resource destinations", async ({ page }) => {
  await page.goto("/subjects/higher-maths/calculus/differentiation");
  await expect(page.getByRole("link", { name: "Notes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Practice" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Formula cards/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Worked examples/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Flashcards/i })).toHaveCount(0);

  await page.goto("/subjects/higher-maths/revision-notes");
  await expect(page.getByRole("heading", { name: "Basic differentiation", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Power rule", exact: true })).toBeVisible();
  await expect(page.getByText("Worked example", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Differentiate a polynomial" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Flashcards/i })).toHaveCount(0);

  for (const legacy of ["formula-cards", "worked-examples", "flashcards"]) {
    await page.goto(`/subjects/higher-maths/${legacy}`);
    await expect(page).toHaveURL("/subjects/higher-maths/revision-notes");
  }
});

test("isolated science capability navigation exposes Notes, Flashcards and Practice only", async ({ page }) => {
  const labels = { notes: "Notes", flashcards: "Flashcards", practice: "Practice" } as const;
  const capabilities = getStudentResourceCapabilities("science");
  const links = capabilities.map((capability) => `<a href="/fixture/${capability}">${labels[capability]}</a>`).join("");
  await page.setContent(`<main><nav aria-label="Learning resources" data-subject-family="science">${links}</nav></main>`);
  const navigation = page.getByRole("navigation", { name: "Learning resources" });
  await expect(navigation.getByRole("link")).toHaveText(["Notes", "Flashcards", "Practice"]);
  await expect(navigation.getByText(/Worked Examples|Formula/i)).toHaveCount(0);
});

test("official formula sheet opens in structured, Quick and custom Higher Maths workspaces", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  await verifyFormulaDrawer(page);

  await page.goto("/dashboard");
  await page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Practise your way" }).click();
  await page.getByTestId("quick-practice-action").click();
  await verifyFormulaDrawer(page);

  await page.goto("/subjects/higher-maths/question-bank");
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
  await page.getByRole("button", { name: "Start selected practice" }).click();
  const conflict = page.getByRole("dialog", { name: "You already have active practice" });
  await expect(conflict).toBeVisible();
  await conflict.getByRole("button", { name: "Replace and start" }).click();
  await verifyFormulaDrawer(page);
});

test("formula sheet is mobile-safe and absent from the unrelated legacy Physics workspace", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const trigger = page.getByRole("button", { name: "Formula sheet" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Higher Maths formula sheet" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(320);
  await expectNoDocumentOverflow(page);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  await page.goto("/question/demo");
  await expect(page.getByRole("button", { name: "Formula sheet" })).toHaveCount(0);
});

test("Sprint D surfaces have no document overflow at required widths or 200% zoom equivalent", async ({ page }) => {
  test.setTimeout(90_000);
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 720, height: 450 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 320, height: 568 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of ["/dashboard", "/subjects/higher-maths", "/subjects/higher-maths/course-tracker", "/subjects/higher-maths/revision-notes"]) {
      await page.goto(route);
      await expectNoDocumentOverflow(page);
    }
    await page.goto("/question/hm-calc-diff-basic-f-001");
    const interactionBefore = await page.getByTestId("question-interaction").boundingBox();
    await page.getByRole("button", { name: "Formula sheet" }).click();
    await expectNoDocumentOverflow(page);
    if (viewport.width >= 1024) {
      const interactionAfter = await page.getByTestId("question-interaction").boundingBox();
      expect(interactionAfter?.width).toBe(interactionBefore?.width);
    }
    await page.keyboard.press("Escape");
    await expectNoDocumentOverflow(page);
  }
});

async function verifyFormulaDrawer(page: import("@playwright/test").Page) {
  const trigger = page.getByRole("button", { name: "Formula sheet" });
  await expect(trigger).toHaveCount(1);
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Higher Maths formula sheet" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Circle" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Table of standard integrals" })).toBeVisible();
  await expect(dialog.getByText(/power rule/i)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

async function cardBoxes(
  learn: import("@playwright/test").Locator,
  practice: import("@playwright/test").Locator,
  review: import("@playwright/test").Locator,
) {
  const learnBox = await learn.boundingBox();
  const practiceBox = await practice.boundingBox();
  const reviewBox = await review.boundingBox();
  expect(learnBox).not.toBeNull();
  expect(practiceBox).not.toBeNull();
  expect(reviewBox).not.toBeNull();
  return { learn: learnBox!, practice: practiceBox!, review: reviewBox! };
}

async function expectNoDocumentOverflow(page: import("@playwright/test").Page) {
  const geometry = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
}
