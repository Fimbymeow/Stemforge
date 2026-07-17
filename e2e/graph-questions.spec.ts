import { expect, test } from "./fixtures/test";
import { readStoredProgress, STORAGE_KEY } from "./fixtures/progress";
import { expectNoHorizontalOverflow } from "./fixtures/student-actions";

test("interactive graph demo renders linked graphs and records one structured attempt on submit", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/graph-demo");

  await expect(page.getByRole("heading", { name: "Complete a nature table from linked graphs" })).toBeVisible();
  await expect(page.getByTestId("linked-derivative-graphs")).toBeVisible();
  await expect(page.getByTestId("graph-curve-f").first()).toBeVisible();
  await expect(page.getByTestId("graph-tangent")).toBeVisible();
  await expect(page.getByTestId("nature-table")).toBeVisible();
  expect(await readStoredProgress(page)).toBeNull();

  await page.getByLabel("sign:interval-0").selectOption("positive");
  await page.getByLabel("sign:interval-1").selectOption("negative");
  await page.getByLabel("sign:interval-2").selectOption("positive");
  await page.getByLabel("nature:critical-0").selectOption("maximum");
  await page.getByLabel("nature:critical-1").selectOption("minimum");
  await page.getByRole("button", { name: "Submit Answer" }).click();

  await expect(page.getByTestId("question-status")).toContainText("Correct");
  const stored = await readStoredProgress(page) as { data?: { attempts?: Array<{ questionId: string; answer: string; isCorrect: boolean }> } };
  expect(stored?.data?.attempts).toHaveLength(1);
  expect(stored?.data?.attempts?.[0].questionId).toBe("internal-graph-demo-nature-table");
  expect(stored?.data?.attempts?.[0].isCorrect).toBe(true);
  expect(stored?.data?.attempts?.[0].answer).toContain("\"nature-table\"");

  await page.reload();
  await expect(page.getByTestId("linked-derivative-graphs")).toBeVisible();
  const refreshed = await readStoredProgress(page) as { data?: { attempts?: unknown[] } };
  expect(refreshed?.data?.attempts).toHaveLength(1);
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("incorrect nature-table cells give useful feedback without recording pointer movement", async ({ page }) => {
  await page.goto("/graph-demo");
  await page.getByLabel("sign:interval-0").selectOption("negative");
  await page.getByLabel("sign:interval-1").selectOption("negative");
  await page.getByLabel("sign:interval-2").selectOption("positive");
  await page.getByLabel("nature:critical-0").selectOption("minimum");
  await page.getByLabel("nature:critical-1").selectOption("minimum");
  await page.getByRole("button", { name: "Submit Answer" }).click();

  await expect(page.getByTestId("question-status")).toContainText("Not quite");
  const stored = await readStoredProgress(page) as { data?: { attempts?: Array<{ answer: string; isCorrect: boolean }> } };
  expect(stored?.data?.attempts).toHaveLength(1);
  expect(stored?.data?.attempts?.[0].isCorrect).toBe(false);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).not.toContain("sampled");
});

test("mobile graph demo stacks without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/graph-demo");
  await expect(page.getByTestId("linked-derivative-graphs")).toBeVisible();
  await expect(page.getByTestId("nature-table")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
