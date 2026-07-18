import { expect, type Page } from "@playwright/test";

export async function openQuestion(page: Page, questionId: string) {
  await page.goto(`/question/${questionId}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

export async function submitAnswer(page: Page, answer: string, expectPersisted = true) {
  const field = page.getByLabel("Your answer");
  await expect(field).toBeVisible();
  await field.fill(answer);
  await page.getByRole("button", { name: "Submit Answer" }).click();
  if (expectPersisted) await expect(page.getByTestId("question-status")).toBeVisible();
}

export async function retryAnswer(page: Page, answer: string) {
  await page.getByRole("button", { name: "Try again" }).click();
  await submitAnswer(page, answer);
}

export async function openHint(page: Page) {
  await page.getByTestId("hint-control").click();
}

export async function openWorkedSolution(page: Page) {
  const control = page.getByTestId("worked-solution-control");
  await control.click();
  await expect(control).toBeHidden();
}

export async function expectNoHorizontalOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
}
