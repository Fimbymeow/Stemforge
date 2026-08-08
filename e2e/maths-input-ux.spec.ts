import { expect, test } from "./fixtures/test";
import type { Locator, Page } from "@playwright/test";

test("Basic Differentiation renders structured maths, supports physical typing and submits canonical evidence", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const field = await richField(page);
  await field.click();
  await field.pressSequentially("5x^4");
  await expect.poll(() => latex(field)).toMatch(/5x\^\{?4/);
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const stored = await page.evaluate(() => Object.values(localStorage).join("\n"));
  expect(stored).toContain('"answer":"5x^4"');
  expect(stored).not.toContain('"answer":"5x^{4}"');
});

test("Chain Rule V1 keeps course access bounded and marks a rendered composite answer", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-chain-f-003");
  const field = await richField(page);
  await setLatex(field, "15\\left(3x+2\\right)^{4}");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const keyboard = page.getByRole("group", { name: "Maths keyboard" });
  await expect(keyboard.getByRole("button", { name: "Negative power" })).toHaveCount(0);
  await expect(keyboard.getByRole("button", { name: "Reciprocal square root" })).toHaveCount(0);
  for (const name of ["Insert sine", "Insert cosine", "Insert tangent", "Insert pi", "Insert e", "Insert natural logarithm", "Insert logarithm"]) {
    await expect(keyboard.getByRole("button", { name, exact: true })).toHaveCount(0);
  }
});

for (const example of [
  { id: "hm-calc-diff-chain-f-009", latex: "\\frac{-6x}{\\left(x^{2}+1\\right)^{4}}" },
  { id: "hm-calc-diff-chain-f-008", latex: "\\left(2x+7\\right)^{-\\frac{1}{2}}" },
  { id: "hm-calc-diff-chain-a-006", latex: "\\frac{7}{2\\sqrt{7x-3}}" },
]) {
  test(`Chain Rule V2 safely normalizes ${example.id}`, async ({ page }) => {
    await page.goto(`/question/${example.id}`);
    const field = await richField(page);
    await setLatex(field, example.latex);
    await page.getByRole("button", { name: "Submit Answer" }).click();
    await expect(page.getByTestId("question-status")).toContainText("Correct");
  });
}

test("partial structured maths drafts survive refresh without becoming attempts", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const field = await richField(page);
  await setLatex(field, "5x^{#0}");
  await page.reload();
  const restored = await richField(page);
  await expect.poll(() => latex(restored)).toContain("5x");
  const stored = await page.evaluate(() => localStorage.getItem("stemforge.answerDrafts.v1"));
  expect(stored).toContain('"version":2');
  expect(stored).toContain('"kind":"rich-math"');
  expect(stored).toContain('"sourceFormat":"mathlive-latex-v1"');
});

test("incomplete and unsupported source fails closed before marking", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const field = await richField(page);
  await setLatex(field, "5x^{#0}");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Finish the expression");
  await setLatex(field, "\\sin{x}");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("not supported");
  const stored = await page.evaluate(() => Object.values(localStorage).join("\n"));
  expect(stored).not.toContain('"attempted":true');
});

test("plain-input fallback remains usable and still normalizes before marking", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001?mathInputFallback=1");
  const input = page.getByLabel("Your answer");
  await expect(page.getByTestId("rich-math-fallback")).toBeVisible();
  await input.fill("5x^4");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
});

test("rich maths keyboard is accessible, non-submitting and overflow-free at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/question/hm-calc-diff-chain-f-008");
  await richField(page);
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const keyboard = page.getByRole("group", { name: "Maths keyboard" });
  await expect(keyboard).toBeVisible();
  for (const name of ["Power", "Negative power", "Negative half power", "Fraction", "Reciprocal square root", "Move left", "Move right", "Backspace", "Undo", "Redo"]) {
    const button = keyboard.getByRole("button", { name, exact: true });
    await expect(button).toHaveAttribute("type", "button");
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await keyboard.getByRole("button", { name: "Power", exact: true }).click();
  await expect(page.getByTestId("question-status")).toHaveCount(0);
  const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
});

test("rich maths keyboard remains overflow-free at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/question/hm-calc-diff-chain-f-008");
  await richField(page);
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const keyboard = page.getByRole("group", { name: "Maths keyboard" });
  await expect(keyboard).toBeVisible();
  const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
  const keyboardGeometry = await keyboard.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(keyboardGeometry.scroll).toBeLessThanOrEqual(keyboardGeometry.client);
  for (const name of ["0", "x", "Minus", "Multiply"]) {
    const box = await keyboard.getByRole("button", { name, exact: true }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
});

test("maths keyboard groups structure and editing controls without affecting Submit or canonical marking", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const field = await richField(page);
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const keyboard = page.getByRole("group", { name: "Maths keyboard" });
  const structures = page.getByTestId("maths-keyboard-group-structures");
  const editing = page.getByTestId("maths-keyboard-group-editing");
  await expect(structures.getByRole("button", { name: "Power" })).toHaveAttribute("data-key-tier", "structure");
  await expect(editing.getByRole("button", { name: "Move left" })).toHaveAttribute("data-key-tier", "utility");
  await expect(page.getByTestId("maths-keyboard-group-functions")).toHaveCount(0);
  await keyboard.getByRole("button", { name: "5", exact: true }).click();
  await keyboard.getByRole("button", { name: "x", exact: true }).click();
  await keyboard.getByRole("button", { name: "Power", exact: true }).click();
  await keyboard.getByRole("button", { name: "4", exact: true }).click();
  await editing.getByRole("button", { name: "Move left" }).click();
  await editing.getByRole("button", { name: "Move right" }).click();
  await editing.getByRole("button", { name: "Hide maths keyboard" }).click();
  await expect(keyboard).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show maths keyboard" })).toBeVisible();
  await expect.poll(() => latex(field)).toMatch(/5x\^\{?4/);
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const stored = await page.evaluate(() => Object.values(localStorage).join("\n"));
  expect(stored).toContain('"answer":"5x^4"');
});

test("rich maths surface stays absent for numerical and multiple-choice answers", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-003");
  await expect(page.getByLabel("Your answer")).toBeVisible();
  await expect(page.getByTestId("rich-math-input")).toHaveCount(0);
  await page.goto("/question/hm-calc-diff-chain-f-001");
  await expect(page.getByRole("radiogroup")).toBeVisible();
  await expect(page.getByTestId("rich-math-input")).toHaveCount(0);
});

async function richField(page: Page) {
  const field = page.getByTestId("rich-math-field");
  await expect(field).toBeVisible();
  return field;
}

async function setLatex(field: Locator, value: string) {
  await field.evaluate((element, source) => {
    const mathfield = element as HTMLElement & { setValue(value: string, options?: object): void };
    mathfield.setValue(source, { selectionMode: "after" });
    mathfield.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function latex(field: Locator) {
  return field.evaluate((element) => (element as HTMLElement & { getValue(format: string): string }).getValue("latex"));
}
