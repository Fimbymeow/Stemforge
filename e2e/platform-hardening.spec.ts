import { expect, test } from "./fixtures/test";
import { QUESTION_ANSWERS, QUESTION_IDS, readStoredProgress } from "./fixtures/progress";
import { openQuestion, submitAnswer } from "./fixtures/student-actions";

test("critical guest journey is accessible, persistent, isolated, and console-clean", async ({ page, seriousBrowserErrors }, testInfo) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page.getByRole("heading", { name: "Forge Your Potential.", level: 1 })).toBeVisible();

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Footer" })).toBeAttached();

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  if (testInfo.project.name === "webkit") await skipLink.focus();
  else await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  const main = page.locator("#main-content");
  await expect(main).toBeFocused();
  await expect(main).toHaveJSProperty("tagName", "MAIN");
  // The skip link must genuinely skip navigation: the next Tab should never move focus
  // back into the navbar it just bypassed. (WebKit only tabs to form controls by default —
  // matching real Safari without "Full Keyboard Access" — so the landing page's first
  // in-main element, a link, is legitimately not reached there; this checks the negative
  // case that holds on every engine instead.)
  await page.keyboard.press("Tab");
  const focusReturnedToNav = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Primary"]');
    return !!(nav && document.activeElement && nav.contains(document.activeElement));
  });
  expect(focusReturnedToNav).toBe(false);
  if (testInfo.project.name !== "webkit") {
    const afterSkipFocusInMain = await page.evaluate(() => {
      const main = document.getElementById("main-content");
      return !!(main && document.activeElement && main.contains(document.activeElement) && document.activeElement !== main);
    });
    expect(afterSkipFocusInMain).toBe(true);
  }
  await page.waitForLoadState("networkidle");

  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, QUESTION_ANSWERS[QUESTION_IDS[0]]);
  await expect(page.getByTestId("question-status")).toContainText("Correct");
  await page.reload();
  await page.waitForLoadState("networkidle");
  const stored = await readStoredProgress(page) as { data?: { attempts?: unknown[] } } | null;
  expect(stored?.data?.attempts).toHaveLength(1);

  await page.goto("/subjects/higher-maths/formula-cards");
  await expect(page.getByRole("heading", { name: "Power rule" })).toBeVisible();
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const afterResource = await readStoredProgress(page) as { data?: { attempts?: unknown[] } } | null;
  expect(afterResource?.data?.attempts).toHaveLength(1);

  await page.goto("/graph-demo");
  await expect(page.getByTestId("linked-derivative-graphs")).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Send feedback" }).last();
  await trigger.focus();
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const closeButton = page.getByRole("button", { name: "Close report form" });
  await expect(closeButton).toBeFocused();
  // Shift+Tab from the first focusable element must wrap to the dialog's last focusable
  // element, not escape into the page behind it — proving the shared trap actually traps.
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByLabel("Contact email (optional)")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Accounts are not available" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue as a guest" })).toHaveAttribute("href", "/dashboard");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  const denied = await page.request.get("/api/internal/health");
  expect(denied.status()).toBe(403);
  expect(seriousBrowserErrors).toEqual([]);
});
