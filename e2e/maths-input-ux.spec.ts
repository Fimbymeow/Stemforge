import { expect, test } from "./fixtures/test";

test("Basic Differentiation supports native typing and selection-aware toolbar editing without changing marking", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const input = page.getByLabel("Your answer");
  const toolbar = page.getByRole("group", { name: "Maths input toolbar" });
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Insert square root text" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "Insert pi text" })).toHaveCount(0);

  await input.pressSequentially("5x4");
  await setSelection(input, 2, 2);
  const exponent = toolbar.getByRole("button", { name: "Insert exponent" });
  await exponent.focus();
  await expect(exponent).toBeFocused();
  await exponent.press("Enter");
  await expect(input).toHaveValue("5x^4");
  await expect(input).toBeFocused();
  await expectSelection(input, 3, 3);

  await toolbar.getByRole("button", { name: "Move cursor left" }).click();
  await expectSelection(input, 2, 2);
  await toolbar.getByRole("button", { name: "Move cursor right" }).click();
  await expectSelection(input, 3, 3);

  await toolbar.getByRole("button", { name: "Clear answer" }).click();
  await input.fill("2x+1");
  await setSelection(input, 1, 4);
  await toolbar.getByRole("button", { name: "Insert opening bracket or wrap selection" }).click();
  await expect(input).toHaveValue("2(x+1)");
  await expectSelection(input, 2, 5);
  await toolbar.getByRole("button", { name: "Delete previous character" }).click();
  await expect(input).toHaveValue("2()");

  await toolbar.getByRole("button", { name: "Clear answer" }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("question-status")).toHaveCount(0);
  await expect(page).toHaveURL(/hm-calc-diff-basic-f-001/);

  await input.pressSequentially("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
});

test("Chain Rule composite answers remain plain strings and mark exactly as before", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-chain-f-003");
  const input = page.getByLabel("Your answer");
  const toolbar = page.getByRole("group", { name: "Maths input toolbar" });
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Insert square root text" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "Insert pi text" })).toHaveCount(0);
  await input.fill("15(3x+2)4");
  await setSelection(input, 8, 8);
  await page.getByRole("button", { name: "Insert exponent" }).click();
  await expect(input).toHaveValue("15(3x+2)^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
});

test("square root appears only when an executable correct fixture supports it", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-chain-f-008");
  const toolbar = page.getByRole("group", { name: "Maths input toolbar" });
  await expect(toolbar.getByRole("button", { name: "Insert square root text" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Insert pi text" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "Insert exponent" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Move cursor left" })).toBeVisible();
});

test("maths toolbar is accessible, non-submitting and mobile-safe at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const input = page.getByLabel("Your answer");
  const toolbar = page.getByRole("group", { name: "Maths input toolbar" });
  const buttons = toolbar.getByRole("button");
  await expect(buttons).toHaveCount(15);
  for (const name of ["Insert exponent", "Insert opening bracket or wrap selection", "Insert closing bracket", "Move cursor left", "Move cursor right", "Delete previous character", "Clear answer"]) {
    const button = toolbar.getByRole("button", { name });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("type", "button");
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await input.fill("x");
  await toolbar.getByRole("button", { name: "Move cursor left" }).click();
  await expect(input).toBeFocused();
  await toolbar.getByRole("button", { name: "Insert opening bracket or wrap selection" }).click();
  await expect(input).toHaveValue("(x");
  await toolbar.getByRole("button", { name: "Delete previous character" }).click();
  await toolbar.getByRole("button", { name: "Clear answer" }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("question-status")).toHaveCount(0);
  const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
});

test("the algebraic toolbar stays hidden for numerical and multiple-choice answers", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-003");
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.getByRole("group", { name: "Maths input toolbar" })).toHaveCount(0);

  await page.goto("/question/hm-calc-diff-chain-f-001");
  await expect(page.getByRole("radiogroup")).toBeVisible();
  await expect(page.getByRole("group", { name: "Maths input toolbar" })).toHaveCount(0);
});

async function setSelection(input: import("@playwright/test").Locator, start: number, end: number) {
  await input.evaluate((element, selection) => (element as HTMLInputElement).setSelectionRange(selection.start, selection.end), { start, end });
}

async function expectSelection(input: import("@playwright/test").Locator, start: number, end: number) {
  await expect.poll(() => input.evaluate((element) => ({ start: (element as HTMLInputElement).selectionStart, end: (element as HTMLInputElement).selectionEnd }))).toEqual({ start, end });
}
