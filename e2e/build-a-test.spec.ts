import { expect, test } from "./fixtures/test";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";

const chainRuleRequirement = "differentiating a composite function using the chain rule";
const powerRuleRequirement = "differentiating an algebraic function which is, or can be simplified to, an expression in powers of x";
const tangentRequirement = "determining the equation of a tangent to a curve at a given point by differentiation";

test("Practice exposes Build a Test without adding a new global destination", async ({ page }) => {
  await page.goto("/practice");

  const mainNavigation = page.getByRole("navigation", { name: "Main" });
  await expect(mainNavigation.getByRole("link", { name: /Build a Test|Test/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Build a Test" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Choose test content" })).toHaveAttribute("href", "/practice/test");

  await page.getByRole("link", { name: "Choose test content" }).click();
  await expect(page).toHaveURL("/practice/test");
  await expect(page.getByRole("heading", { name: "Build a Test", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Choose questions manually" })).toHaveAttribute("href", "/subjects/higher-maths/question-bank");
  await expect(page.getByTestId("test-availability-status")).toContainText("Choose at least one");
  await expect(page.getByRole("button", { name: /Build test/i })).toBeDisabled();
});

test("requirement tree keeps official scope visible while making live coverage easy to scan", async ({ page }) => {
  await page.goto("/practice/test");

  await expect(page.getByTestId("area-availability-calculus")).toHaveText("2 of 19 available");
  await openArea(page, "Calculus");
  await expect(page.getByTestId("strand-availability-differentiating-functions")).toHaveText("2 of 3 available");

  const calculus = page.getByTestId("requirement-area-calculus");
  const requirements = calculus.locator('label[data-availability]');
  await expect(requirements).toHaveCount(19);
  await expect(calculus.locator('label[data-availability="available"]')).toHaveCount(2);
  await expect(calculus.locator('label[data-availability="unavailable"]')).toHaveCount(17);

  const tangent = requirementCheckbox(page, tangentRequirement);
  await expect(tangent).toBeEnabled();
  await tangent.check();
  await expect(tangent).toBeChecked();
  await expect(page.getByTestId("area-availability-calculus")).toContainText("1 selected");
  await expect(calculus.locator('label[data-availability="unavailable"]').filter({ has: tangent })).toContainText("No questions available yet");
});

test("Chain Rule builds an exact normal Practice Session without widening evidence ownership", async ({ page }) => {
  await page.goto("/practice/test");
  await openArea(page, "Calculus");
  await requirementCheckbox(page, chainRuleRequirement).check();

  await expect(page.getByTestId("test-availability-status")).toHaveText("34 questions available for this scope · 5 will be selected.");
  await expect(page.getByTestId("test-scope-summary")).toContainText("assessed content: Chain rule");
  await expect(page.getByTestId("test-scope-summary")).not.toContainText("Basic Differentiation");

  await page.getByRole("button", { name: /Build test/i }).click();
  await expect(page).toHaveURL(/\/practice\/session\/practice_test_/);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Question 1 of 5");
  await expect(page.getByText("Built test", { exact: true })).toBeVisible();

  const stored = await page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    const session = store.sessions.find((candidate: { sessionId: string }) => candidate.sessionId === store.activeSessionId);
    return {
      origin: session.origin,
      selectedPathIds: session.selectedPathIds,
      questionIds: session.questionReferences.map((reference: { questionId: string }) => reference.questionId),
      pathIds: session.questionReferences.map((reference: { pathId: string }) => reference.pathId),
    };
  }, PRACTICE_SESSIONS_STORAGE_KEY);

  expect(stored.origin).toBe("build_a_test");
  expect(stored.selectedPathIds).toEqual(["chain-rule"]);
  expect(stored.questionIds).toHaveLength(5);
  expect(new Set(stored.questionIds).size).toBe(5);
  expect(new Set(stored.pathIds)).toEqual(new Set(["chain-rule"]));
});

test("Build a Test reports insufficient and partially available selections honestly", async ({ page }) => {
  await page.goto("/practice/test");
  await openArea(page, "Calculus");
  await requirementCheckbox(page, powerRuleRequirement).check();
  await page.getByRole("button", { name: /^Standard/ }).click();
  await expect(page.getByTestId("test-availability-status")).toHaveText("Only 8 questions currently match this scope. Choose a smaller test or alter the selection.");
  await expect(page.getByRole("button", { name: /Build test/i })).toBeDisabled();

  await page.getByRole("button", { name: "Clear all" }).click();
  await openArea(page, "Calculus");
  await requirementCheckbox(page, chainRuleRequirement).check();
  await requirementCheckbox(page, tangentRequirement).check();
  await page.getByRole("button", { name: /^Short/ }).click();

  await expect(page.getByTestId("test-availability-status")).toHaveText("34 questions available for this scope · 5 will be selected.");
  await expect(page.getByText(/1 selected requirement does not yet have live questions/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Build test/i })).toBeEnabled();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 900 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 760 },
]) test(`the builder remains keyboard-operable and overflow-free at ${viewport.width}px`, async ({ page }) => {
  await page.setViewportSize(viewport);
  await page.goto("/practice/test");
  await openArea(page, "Calculus");

  const chainRule = requirementCheckbox(page, chainRuleRequirement);
  await chainRule.focus();
  await chainRule.press("Space");
  await expect(chainRule).toBeChecked();
  await page.getByRole("button", { name: /^Short/ }).focus();
  await expect(page.getByRole("button", { name: /^Short/ })).toBeFocused();

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await expect(page.getByRole("button", { name: /Build test/i })).toBeVisible();
});

async function openArea(page: import("@playwright/test").Page, name: string) {
  const summary = page.locator("summary").filter({ hasText: name }).first();
  await summary.click();
}

function requirementCheckbox(page: import("@playwright/test").Page, wording: string) {
  return page.getByRole("checkbox", { name: new RegExp(`^${escapeRegex(wording)}`) });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
