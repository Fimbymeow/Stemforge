import { expect, test } from "./fixtures/test";
import { EVIDENCE_PROVENANCE_KEY } from "../lib/progress/evidence-provenance";
import { QUESTION_ANSWERS, QUESTION_IDS } from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("auth-disabled learning records anonymous provenance and keeps reset wording truthful", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  const sources = await page.evaluate((key) => {
    const metadata = JSON.parse(localStorage.getItem(key)!);
    return Object.values(metadata.records).map((entry) => (entry as { source: string }).source);
  }, EVIDENCE_PROVENANCE_KEY);
  expect(sources.length).toBeGreaterThan(0);
  expect(sources.every((source) => source === "local_anonymous")).toBe(true);

  await page.goto("/subjects/higher-maths/calculus/differentiation/basic-differentiation");
  await expect(page.getByText(/Historical achievements may remain/)).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Progress already synced to your account is not deleted");
    await dialog.dismiss();
  });
  await page.getByTestId("reset-progress").click();
});
