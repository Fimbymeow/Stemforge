import type { Locator, Page } from "@playwright/test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import { contentResolver } from "../lib/content-resolver";
import { expect, test } from "./fixtures/test";
import { ELEMENTARY_EXPRESSION_E2E_QUESTION_ID } from "./fixtures/elementary-expression-question";

const fixtureHref = (caseId: string) => `/question/${ELEMENTARY_EXPRESSION_E2E_QUESTION_ID}?case=${caseId}`;
const elementaryControls = [
  "Insert sine", "Insert cosine", "Insert tangent", "Insert pi", "Insert e",
  "Insert natural logarithm", "Insert logarithm",
] as const;

test("the synthetic contract exposes its complete structured keyboard through the real workspace", async ({ page }) => {
  await page.goto(fixtureHref("sin"));
  await richField(page);
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const keyboard = page.getByRole("group", { name: "Maths keyboard" });
  await expect(keyboard).toBeVisible();
  for (const group of ["basic", "structures", "functions", "editing"]) {
    await expect(page.getByTestId(`maths-keyboard-group-${group}`)).toBeVisible();
  }
  for (const name of [
    ...elementaryControls,
    "Power", "Negative power", "Negative half power", "Fraction", "Insert square root",
    "Move left", "Move right", "Backspace", "Undo", "Redo",
  ]) {
    await expect(keyboard.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(keyboard.getByRole("button", { name: "(", exact: true })).toBeVisible();
  await expect(keyboard.getByRole("button", { name: ")", exact: true })).toBeVisible();
});

test("the variable x is grouped separately from multiplication with distinct accessible names", async ({ page }) => {
  await page.goto(fixtureHref("sin"));
  await richField(page);
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const keyboard = page.getByRole("group", { name: "Maths keyboard" });

  // Still exactly 4 top-level sections (Basic, Structures, Functions, Editing) — the variable
  // lives inside Basic as a labelled sub-cluster, not a new competing top-level section.
  await expect(keyboard.locator("section")).toHaveCount(4);

  const variableGroup = page.getByTestId("maths-keyboard-variables");
  await expect(variableGroup).toBeVisible();
  await expect(variableGroup.getByText("Variable", { exact: true })).toBeVisible();

  const variableKey = keyboard.getByRole("button", { name: "Variable x", exact: true });
  await expect(variableKey).toBeVisible();
  await expect(variableKey).toHaveText("x");

  const multiplyKey = keyboard.getByRole("button", { name: "Multiply", exact: true });
  await expect(multiplyKey).toBeVisible();
  await expect(multiplyKey).toHaveText("×");

  // The two keys must not be the same element and must not share an accessible name.
  expect(await variableKey.evaluate((node) => node.outerHTML)).not.toEqual(await multiplyKey.evaluate((node) => node.outerHTML));

  const field = await richField(page);
  await variableKey.click();
  await expect.poll(() => field.evaluate((node) => (node as HTMLElement & { getValue(format: string): string }).getValue("latex"))).toContain("x");
});

test("elementary expressions normalize and mark through the real rich editor", async ({ page }) => {
  const cases = [
    { caseId: "sin", correct: "3\\sin(x)", canonical: "3sin(x)", wrong: "3\\cos(x)" },
    { caseId: "cos", correct: "\\cos(2x)", canonical: "cos(2x)", wrong: "\\cos(3x)" },
    { caseId: "tan", correct: "\\tan(x+\\frac{\\pi}{4})", canonical: "tan(x+pi/4)", wrong: "\\tan(x+\\frac{\\pi}{3})" },
    { caseId: "exponential", correct: "e^x", canonical: "e^x", wrong: "e^{2x}" },
    { caseId: "logarithm", correct: "\\ln(x)", canonical: "ln(x)", wrong: "\\log_{10}(x)" },
    { caseId: "baseLogarithm", correct: "\\log_{2}(x)", canonical: "log_2(x)", wrong: "\\log_{10}(x)" },
  ] as const;

  for (const example of cases) {
    await page.goto(fixtureHref(example.caseId));
    const field = await richField(page);
    await setLatex(field, example.wrong);
    await page.getByRole("button", { name: "Submit Answer" }).click();
    await expect(page.getByTestId("question-status")).toContainText("Not quite yet");
    await page.getByRole("button", { name: "Try again" }).click();
    await setLatex(field, example.correct);
    await page.getByRole("button", { name: "Submit Answer" }).click();
    await expect(page.getByTestId("question-status")).toContainText("Correct");
    await expect(page.getByTestId("submitted-answer")).toContainText(example.canonical);
  }

  await page.goto(fixtureHref("sin"));
  const field = await richField(page);
  await setLatex(field, "\\sec(x)");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("not supported");
});

test("real algebraic questions remain gated while the synthetic contract receives elementary controls", async ({ page }) => {
  for (const href of ["/question/hm-calc-diff-basic-f-001", "/question/hm-calc-diff-chain-f-008"]) {
    await page.goto(href);
    await richField(page);
    await page.getByRole("button", { name: "Show maths keyboard" }).click();
    const keyboard = page.getByRole("group", { name: "Maths keyboard" });
    await expect(page.getByTestId("maths-keyboard-group-functions")).toHaveCount(0);
    for (const name of elementaryControls) {
      await expect(keyboard.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
  }

  await page.goto(fixtureHref("sin"));
  await richField(page);
  await page.getByRole("button", { name: "Show maths keyboard" }).click();
  const fixtureKeyboard = page.getByRole("group", { name: "Maths keyboard" });
  await expect(page.getByTestId("maths-keyboard-group-functions")).toBeVisible();
  for (const name of elementaryControls) {
    await expect(fixtureKeyboard.getByRole("button", { name, exact: true })).toBeVisible();
  }
});

test("elementary controls remain touch-sized and overflow-free at 375px and 320px", async ({ page }) => {
  for (const viewport of [{ width: 375, height: 812 }, { width: 320, height: 700 }]) {
    await page.setViewportSize(viewport);
    await page.goto(fixtureHref("sin"));
    await richField(page);
    await page.getByRole("button", { name: "Show maths keyboard" }).click();
    const keyboard = page.getByRole("group", { name: "Maths keyboard" });
    await expect(keyboard.locator("section")).toHaveCount(4);
    for (const name of elementaryControls) {
      const button = keyboard.getByRole("button", { name, exact: true });
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    const geometry = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
  }
});

test("the fixture remains outside production content and learner persistence", async ({ page }) => {
  expect(contentResolver.getAllPathContexts()).toHaveLength(49);
  expect(higherMathsDifferentiationQuestions).toHaveLength(8);
  expect(higherMathsChainRuleQuestions).toHaveLength(34);
  expect(contentResolver.getQuestions()).toHaveLength(42);
  expect(contentResolver.getQuestion(`${ELEMENTARY_EXPRESSION_E2E_QUESTION_ID}-sin`)).toBeUndefined();

  await page.goto(fixtureHref("sin"));
  const field = await richField(page);
  await setLatex(field, "3\\sin(x)");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const browserStorage = await page.evaluate(() => Object.values(localStorage).join("\n"));
  expect(browserStorage).not.toContain(ELEMENTARY_EXPRESSION_E2E_QUESTION_ID);

  for (const href of ["/subjects/higher-maths", "/subjects/higher-maths/question-bank", "/practice"]) {
    await page.goto(href);
    await expect(page.getByText("Elementary expression test fixture", { exact: true })).toHaveCount(0);
  }
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
