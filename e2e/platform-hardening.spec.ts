import { expect, test } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, readStoredProgress } from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("critical guest journey is accessible, persistent, isolated, and console-clean", async ({ page, seriousBrowserErrors }, testInfo) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page.getByRole("heading", { name: "Forge Your Potential.", level: 1 })).toBeVisible();

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  if (testInfo.project.name === "webkit") await skipLink.focus();
  else await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.waitForLoadState("networkidle");

  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.reload();
  await page.waitForLoadState("networkidle");
  const stored = await readStoredProgress(page) as { data?: { attempts?: unknown[] } } | null;
  expect(stored?.data?.attempts).toHaveLength(1);

  await page.goto("/graph-demo");
  await expect(page.getByTestId("linked-derivative-graphs")).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Send feedback" }).last();
  await trigger.focus();
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close report form" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  const denied = await page.request.get("/api/internal/health");
  expect(denied.status()).toBe(403);
  expect(seriousBrowserErrors).toEqual([]);
});
