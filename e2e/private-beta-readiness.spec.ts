import { test, expect } from "./fixtures/test";

test("homepage states the bounded private-beta promise and all primary actions are real", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Forge Your Potential.", level: 1 })).toBeVisible();
  await expect(page.getByText("The private beta starts with Higher Maths Basic differentiation", { exact: false })).toBeVisible();
  await expect(page.getByText("No account needed. Progress is saved locally on this browser.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exam Questions", level: 3 })).toBeVisible();
  await expect(page.getByText("Higher Physics is coming soon.", { exact: false })).toBeVisible();
  await expect(page.getByText("not affiliated with or endorsed by SQA", { exact: false })).toBeVisible();
  await expect(page.locator('a[href="#"]')).toHaveCount(0);

  const startLinks = page.getByRole("link", { name: "Start Learning" });
  await expect(startLinks).toHaveCount(3);
  await startLinks.first().focus();
  await expect(startLinks.first()).toBeFocused();
  await expect(startLinks.first()).toHaveAttribute("href", "/subjects/higher-maths/calculus/differentiation/basic-differentiation");
});

test("Higher Physics is clearly unavailable and offers a valid Higher Maths recovery action", async ({ page }) => {
  await page.goto("/subjects/higher-physics");
  await expect(page.getByRole("heading", { name: "Higher Physics", level: 1 })).toBeVisible();
  await expect(page.getByText("Coming soon", { exact: true }).first()).toBeVisible();
  const recovery = page.getByRole("link", { name: "Open Basic differentiation" });
  await expect(recovery).toBeVisible();
  await expect(recovery).toHaveAttribute("href", "/subjects/higher-maths/calculus/differentiation/basic-differentiation");
});

test("a fresh student can complete the primary answer action using the keyboard", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const answer = page.getByLabel("Your answer");
  await answer.focus();
  await expect(answer).toBeFocused();
  await answer.fill("5x^4");
  await answer.press("Enter");
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await expect(page.getByTestId("next-question-action")).toBeVisible();
});
