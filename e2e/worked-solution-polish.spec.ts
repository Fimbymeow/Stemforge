import { expect, test } from "./fixtures/test";
import { QUESTION_IDS } from "./fixtures/progress";
import {
  expectNoHorizontalOverflow,
  openHint,
  openQuestion,
  openWorkedSolution,
  submitAnswer,
} from "./fixtures/student-actions";

test("worked solution supersedes an opened hint and remains authoritative after reload", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await expect(page.getByTestId("hint-control")).toBeVisible();
  await expect(page.getByTestId("worked-solution-control")).toHaveCount(0);
  await submitAnswer(page, "wrong");
  await expect(page.getByTestId("hint-control")).toBeVisible();
  await expect(page.getByTestId("worked-solution-control")).toBeVisible();

  await openHint(page);
  await expect(page.getByTestId("hint-content")).toBeFocused();
  await openWorkedSolution(page);
  await expectSolutionSupersession(page);
  await expect(page.getByRole("button", { name: "Formula sheet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Report this question" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("region", { name: "Worked solution content" })).toBeVisible();
  await expectSolutionSupersession(page);
});

test("worked solution directly supersedes the unused hint in Quick Practice", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await submitAnswer(page, "wrong");
  await openWorkedSolution(page);
  await expectSolutionSupersession(page);
  await expect(page.getByTestId("practice-session-panel")).toBeVisible();
});

test("worked solution supersession is identical in custom Question Bank practice", async ({ page }) => {
  await page.goto("/subjects/higher-maths/question-bank");
  await page.getByLabel("Select Basic differentiation, Foundations, Question 1").check();
  await page.getByRole("button", { name: "Start practice" }).click();
  await submitAnswer(page, "wrong");
  await openHint(page);
  await openWorkedSolution(page);
  await expectSolutionSupersession(page);
  await expect(page.getByTestId("practice-session-panel")).toContainText("Custom practice");
});

test("keyboard and mobile users reach a long solution without empty or overflowing support UI", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openQuestion(page, QUESTION_IDS.at(-1)!);
  await submitAnswer(page, "wrong");
  const hint = page.getByTestId("hint-control");
  await hint.focus();
  await hint.press("Enter");
  await expect(page.getByTestId("hint-content")).toBeFocused();
  const solution = page.getByTestId("worked-solution-control");
  await solution.focus();
  await solution.press("Enter");
  await expect(page.getByRole("heading", { name: "Worked solution" })).toBeFocused();
  await expectSolutionSupersession(page);
  await expectNoHorizontalOverflow(page);
});

async function expectSolutionSupersession(page: import("@playwright/test").Page) {
  await expect(page.getByRole("region", { name: "Worked solution content" })).toBeVisible();
  await expect(page.getByTestId("question-hint-panel")).toHaveCount(0);
  await expect(page.getByTestId("hint-control")).toHaveCount(0);
  await expect(page.getByTestId("hint-content")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Common mistake" })).toHaveCount(0);
  await expect(page.getByText(/A common mistake is writing/)).toHaveCount(0);
}
