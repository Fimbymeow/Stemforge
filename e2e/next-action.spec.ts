import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";
import { currentAttempt, QUESTION_IDS, seedStoredProgress, v3Payload } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

const PATH_ROUTE = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";
const HUB_ROUTE = "/subjects/higher-maths";
const BANK_ROUTE = "/subjects/higher-maths/question-bank";

test("new learner receives the same one-click learning entry across major surfaces", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/dashboard");
  await expectHigherMathsCourseAccess(page);
  await expectPrimaryAction(page, "Start learning", `/question/${QUESTION_IDS[0]}`);
  await page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Start learning" }).focus();
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Start learning" })).toBeFocused();

  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expect(page.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);

  await page.goto(HUB_ROUTE);
  await expectPrimaryAction(page, "Start learning", `/question/${QUESTION_IDS[0]}`);
  await expect(page.getByRole("link", { name: "Question bank" })).toBeVisible();

  await page.goto(PATH_ROUTE);
  await expectPrimaryAction(page, "Start learning", `/question/${QUESTION_IDS[0]}`);
  await expect(page.locator('[data-recommended="true"]')).toContainText("Foundations");
  await expect(page.getByRole("link", { name: "Explore Applications" })).toHaveAttribute("href", `/question/${QUESTION_IDS[3]}`);

  await page.goto(BANK_ROUTE);
  await expectPrimaryAction(page, "Start learning", `/question/${QUESTION_IDS[0]}`);
  await expect(page.getByRole("link", { name: "Open Differentiate a power" })).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});

test("an incomplete question is resumed consistently instead of opening generic setup", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[1], 1, { isCorrect: false, answer: "wrong" }),
  ]));

  for (const route of ["/dashboard", HUB_ROUTE, PATH_ROUTE, BANK_ROUTE]) {
    await page.goto(route);
    if (route === "/dashboard") await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Resume question", `/question/${QUESTION_IDS[1]}`);
  }

  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expectPrimaryAction(page, "Resume question", `/question/${QUESTION_IDS[1]}`);
  await page.getByRole("link", { name: "Resume question" }).click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[1]}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a valid unfinished practice session becomes the shared primary action", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const sessionUrl = new URL(page.url()).pathname;
  expect(sessionUrl).toMatch(/^\/practice\/session\//);

  for (const route of ["/dashboard", HUB_ROUTE, PATH_ROUTE, BANK_ROUTE]) {
    await page.goto(route);
    if (route === "/dashboard") await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Resume practice", sessionUrl);
  }

  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expectPrimaryAction(page, "Resume practice", sessionUrl);
});

test("stage completion advances to the next recommended stage without hard-locking exploration", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.slice(0, 3).map((id, index) => currentAttempt(id, index + 1)),
  ));

  await page.goto("/dashboard");
  await expectPrimaryAction(page, "Begin Applications", `/question/${QUESTION_IDS[3]}`);

  await page.goto(HUB_ROUTE);
  await expectPrimaryAction(page, "Begin Applications", `/question/${QUESTION_IDS[3]}`);

  await page.goto(PATH_ROUTE);
  await expectPrimaryAction(page, "Begin Applications", `/question/${QUESTION_IDS[3]}`);
  const recommended = page.locator('[data-recommended="true"]');
  await expect(recommended).toContainText("Applications");
  await expect(page.getByRole("link", { name: "Explore Past Paper-style Questions" })).toHaveAttribute("href", `/question/${QUESTION_IDS[6]}`);
  await expect(page.getByRole("link", { name: "Review Foundations" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("completed guided content recommends practice and never locked inventory", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));

  for (const route of ["/dashboard", HUB_ROUTE, PATH_ROUTE, BANK_ROUTE]) {
    await page.goto(route);
    if (route === "/dashboard") await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Practise again", "/practice");
  }
  await page.goto("/subjects");
  await expectHigherMathsCourseAccess(page);
  await expectPrimaryAction(page, "Practise again", "/practice");
  await expect(page.getByText("Chain rule", { exact: true })).not.toBeVisible();
});

test("review recommendation remains secondary to ordinary Higher Maths access", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: index === 0 })),
  ));

  for (const route of ["/dashboard", "/subjects"]) {
    await page.goto(route);
    await expectHigherMathsCourseAccess(page);
    await expectPrimaryAction(page, "Review 1 question", `/question/${QUESTION_IDS[0]}`);
  }
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
