import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow, openHint, openWorkedSolution, retryAnswer, submitAnswer } from "./fixtures/student-actions";

const skillRoute = "/subjects/higher-maths/calculus/differentiation/tangents-and-normals";
const notesRoute = "/subjects/higher-maths/revision-notes?path=tangents-and-normals";
const questionIds = [
  "hm-calc-tangent-q-001",
  "hm-calc-tangent-q-019",
  "hm-calc-tangent-q-028",
  "hm-calc-tangent-q-030",
] as const;

test("published Tangents exposes honest Notes, Practice and dependency semantics", async ({ page }) => {
  await page.goto(skillRoute);
  await expect(page.getByRole("heading", { name: "Tangents", level: 1 })).toBeVisible();
  await expect(page.getByText("Basic differentiation", { exact: true })).toBeVisible();
  await expect(page.getByText("Chain rule", { exact: true })).toBeVisible();
  await expect(page.getByText(/0 of 30 questions completed/i)).toBeVisible();
  await expect(page.getByText(/No review due/i)).toBeVisible();
  await expect(page.getByText(/Foundations|Applications|Past Paper-style Questions/i)).toHaveCount(0);

  await page.goto(notesRoute);
  await expect(page.getByRole("heading", { name: "Tangents", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue to Practice/i })).toHaveAttribute(
    "href",
    "/question/hm-calc-tangent-q-001",
  );
  await expect(page.getByText(/Foundations|Applications|Past Paper-style Questions/i)).toHaveCount(0);

  await page.goto("/question/hm-calc-tangent-q-001");
  await expect(page.getByTestId("stage-question-position")).toContainText("Question 1 of 30");
  await expect(page.getByText(/Chain rule/i)).toHaveCount(0);

  await page.goto("/question/hm-calc-tangent-q-019");
  await expect(page.getByTestId("stage-question-position")).toContainText("Question 19 of 30");
  await expect(page.getByText(/Chain rule/i)).toBeVisible();

  await page.goto("/question/hm-calc-tangent-q-028");
  await expect(page.getByTestId("stage-question-position")).toContainText("Question 28 of 30");

  await page.goto("/question/hm-calc-tangent-q-030");
  await expect(page.getByTestId("stage-question-position")).toContainText("Question 30 of 30");
});

test("Tangents hint, solution, wrong-answer and retry interactions use the normal workspace", async ({ page }) => {
  await page.goto("/question/hm-calc-tangent-q-001");
  await openHint(page);
  await expect(page.getByTestId("hint-content")).toBeVisible();
  await submitAnswer(page, "y=-8x+2");
  await expect(page.getByTestId("question-status")).not.toContainText(/correct/i);
  await openWorkedSolution(page);
  await expect(page.getByRole("heading", { name: "Worked solution" })).toBeVisible();
  await retryAnswer(page, "y=-8x-2");
  await expect(page.getByTestId("question-status")).toContainText(/correct/i);
});

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
  test(`Tangents learner surfaces remain overflow-free at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    for (const route of [skillRoute, notesRoute, ...questionIds.map((id) => `/question/${id}`)]) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
      await expect(page.locator("main")).toBeVisible();
    }
  });
}
