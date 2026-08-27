import { expect, test } from "./fixtures/test";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";
import { GRAPH_IMPORT_PILOT_PRACTICE_SESSION_ID, GRAPH_IMPORT_PILOT_QUESTION_ID } from "./fixtures/graph-import-question";

for (const destination of [
  `/question/${GRAPH_IMPORT_PILOT_QUESTION_ID}`,
  `/practice/session/${GRAPH_IMPORT_PILOT_PRACTICE_SESSION_ID}`,
]) {
  test(`the imported pilot renders and marks correctly at ${destination}`, async ({ page, seriousBrowserErrors }) => {
    await page.goto(destination);
    await expect(page.getByRole("heading", { name: "Exact area under a curve" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Area under a quadratic curve/ })).toBeVisible();
    await expect(page.getByTestId("graph-curve-f").first()).toBeVisible();
    await expect(page.getByTestId("graph-boundary-lower-bound")).toBeVisible();
    await expect(page.getByTestId("graph-boundary-upper-bound")).toBeVisible();
    await expect(page.getByTestId("graph-region-shaded-area")).toBeVisible();
    await page.getByLabel("Your answer").fill("38/3");
    await page.getByRole("button", { name: "Submit Answer" }).click();
    await expect(page.getByTestId("question-status")).toContainText("Correct");
    await expectNoHorizontalOverflow(page);
    expect(seriousBrowserErrors).toEqual([]);
  });
}

test("the imported pilot graph remains responsive at 320 and 375 pixels", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/practice/session/${GRAPH_IMPORT_PILOT_PRACTICE_SESSION_ID}`);
    await expect(page.getByTestId("math-graph")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
