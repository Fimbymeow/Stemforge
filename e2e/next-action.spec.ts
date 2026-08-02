import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const PATH_ROUTE = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";
const HUB_ROUTE = "/subjects/higher-maths";
const BANK_ROUTE = "/subjects/higher-maths/question-bank";

test("new learner gets calm course access before the one-click learning entry", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Start learning" })).toHaveCount(0);
  await page.getByRole("link", { name: "Open Higher Maths", exact: true }).focus();
  await expect(page.getByRole("link", { name: "Open Higher Maths", exact: true })).toBeFocused();

  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByRole("link", { name: "Start learning" })).toHaveCount(0);

  await page.goto(HUB_ROUTE);
  await expectPrimaryAction(page, "Start", "/subjects/higher-maths/revision-notes");
  await expect(page.getByTestId("working-context-hub").getByRole("link", { name: "Overview" })).toBeVisible();

  await page.goto(PATH_ROUTE);
  await expectPrimaryAction(page, "Start", `/question/${QUESTION_IDS[0]}`);
  await expect(page.locator('[data-recommended="true"]')).toContainText("Foundations");
  await expect(page.locator("article").filter({ hasText: "Applications" }).getByRole("link", { name: "Start" })).toHaveAttribute("href", `/question/${QUESTION_IDS[3]}`);

  await page.goto(BANK_ROUTE);
  await expect(page.getByText("Best next step")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});

test("an incomplete question is resumed consistently instead of opening generic setup", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[1], 1, { isCorrect: false, answer: "wrong" }),
  ]));

  for (const route of ["/dashboard"]) {
    await page.goto(route);
    if (route === "/dashboard") await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Resume question", `/question/${QUESTION_IDS[1]}`);
  }
  for (const route of [HUB_ROUTE, PATH_ROUTE]) {
    await page.goto(route);
    await expectPrimaryAction(page, "Continue", `/question/${QUESTION_IDS[1]}`);
  }

  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByRole("link", { name: "Resume question" })).toHaveCount(0);
});

test("a valid unfinished practice session becomes the shared primary action", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const sessionUrl = new URL(page.url()).pathname;
  expect(sessionUrl).toMatch(/^\/practice\/session\//);

  for (const route of ["/dashboard"]) {
    await page.goto(route);
    if (route === "/dashboard") await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Resume practice", sessionUrl);
  }
  for (const route of [HUB_ROUTE, PATH_ROUTE]) {
    await page.goto(route);
    await expectPrimaryAction(page, "Resume practice", sessionUrl);
  }

  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByRole("link", { name: "Resume practice" })).toHaveCount(0);
});

test("stage completion advances to the next recommended stage without hard-locking exploration", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.slice(0, 3).map((id, index) => currentAttempt(id, index + 1)),
  ));

  await page.goto("/dashboard");
  await expectPrimaryAction(page, "Begin Applications", `/question/${QUESTION_IDS[3]}`);

  await page.goto(HUB_ROUTE);
  await expectPrimaryAction(page, "Continue", `/question/${QUESTION_IDS[3]}`);

  await page.goto(PATH_ROUTE);
  await expectPrimaryAction(page, "Continue", `/question/${QUESTION_IDS[3]}`);
  const recommended = page.locator('[data-recommended="true"]');
  await expect(recommended).toContainText("Applications");
  await expect(page.locator("article").filter({ hasText: "Exam practice (PPQ)" }).getByRole("link", { name: "Start" })).toHaveAttribute("href", `/question/${QUESTION_IDS[6]}`);
  await expect(page.locator("article").filter({ hasText: "Foundations" }).getByRole("link", { name: "Revisit" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("completed guided content recommends due Review before practice and never locked inventory", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));

  for (const route of ["/dashboard"]) {
    await page.goto(route);
    if (route === "/dashboard") await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Practise again", "/practice");
  }
  for (const route of [HUB_ROUTE, PATH_ROUTE]) {
    await page.goto(route);
    await expectPrimaryAction(page, "Start Review", "/practice?review=1&path=basic-differentiation");
  }
  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByRole("link", { name: "Practise again" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Practise again" })).toHaveCount(0);
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
});

test("review recommendation stays on learning surfaces rather than the course catalogue", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: index === 0 })),
  ));

  await page.goto("/dashboard");
  await expectHigherMathsCourseAccess(page);
  await expectPrimaryAction(page, "Review 1 question", `/question/${QUESTION_IDS[0]}`);
  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByRole("link", { name: "Review 1 question" })).toHaveCount(0);
});

test("question completion uses the shared next action and mobile hierarchy stays usable", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/question/${QUESTION_IDS[0]}`);
  await page.getByLabel("Your answer").fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  const next = page.getByTestId("next-question-action");
  await expect(next).toHaveText(/Continue Foundations/);
  await expect(next).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
  await next.focus();
  await expect(next).toBeFocused();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

async function expectPrimaryAction(page: Page, name: string, href: string) {
  if (href === "/practice") {
    const link = page.getByRole("link", { name, exact: true });
    if (await link.count()) {
      await expect(link.first()).toBeVisible();
      await expect(link.first()).toHaveAttribute("href", href);
      return;
    }
    await expect(page.getByRole("button", { name, exact: true }).first()).toBeVisible();
    return;
  }
  const action = page.getByRole("link", { name, exact: true }).first();
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", href);
}

async function expectHigherMathsCourseAccess(page: Page) {
  const access = page.getByRole("link", { name: "Open Higher Maths", exact: true });
  await expect(access).toHaveCount(1);
  await expect(access).toBeVisible();
  await expect(access).toHaveAttribute("href", HUB_ROUTE);
}
