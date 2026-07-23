import { expect, test } from "./fixtures/test";
import { QUESTION_IDS } from "./fixtures/progress";
import { expectNoHorizontalOverflow, openQuestion, submitAnswer } from "./fixtures/student-actions";

test("beta notice stays in flow beside desktop question feedback and mobile dashboard content", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "wrong");
  await expectSeparated(
    page.getByLabel("Private beta notice", { exact: true }),
    page.getByTestId("question-status"),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expectSeparated(
    page.getByLabel("Private beta notice", { exact: true }),
    page.getByTestId("dashboard-progress-summary"),
  );
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

test("Question Bank filters keep a direct question action visible at desktop size", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/subjects/higher-maths/question-bank");
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  const firstQuestion = page.getByRole("link", { name: "Open Differentiate a power" });
  await expect(firstQuestion).toBeInViewport();
  await firstQuestion.focus();
  await expect(firstQuestion).toBeFocused();
});

test("practice summary retains the app shell and exact-session retry priority", async ({ page }) => {
  await page.goto("/practice");
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  await page.getByLabel("Your answer").fill("wrong");
  await page.getByRole("button", { name: "Submit Answer" }).click();
  await page.getByRole("button", { name: "Finish session" }).click();

  await expect(page.getByRole("heading", { name: "Practice summary" })).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("img", { name: "STEM Forge" })).toBeVisible();
  const retry = page.getByRole("button", { name: "Retry incorrect" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
});

test("course roadmap fits desktop and preserves intentional narrow scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/subjects/higher-maths");
  const desktopOverflow = await roadmapOverflow(page);
  expect(desktopOverflow).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOverflow = await roadmapOverflow(page);
  expect(mobileOverflow).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
});

test("focused recovery shell keeps brand, landmark, headings, skip link and mobile geometry", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/missing-p10-route");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page could not be found.");
  await expect(page.getByRole("img", { name: "STEM Forge" })).toBeVisible();
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await skip.focus();
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await expectNoHorizontalOverflow(page);
  expect(seriousBrowserErrors).toEqual([]);
});

async function expectSeparated(
  first: import("@playwright/test").Locator,
  second: import("@playwright/test").Locator,
) {
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  const intersects = firstBox!.x < secondBox!.x + secondBox!.width
    && firstBox!.x + firstBox!.width > secondBox!.x
    && firstBox!.y < secondBox!.y + secondBox!.height
    && firstBox!.y + firstBox!.height > secondBox!.y;
  expect(intersects).toBe(false);
}

async function roadmapOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((item) => item.textContent === "Roadmap");
    const scroller = heading?.parentElement?.querySelector(".overflow-x-auto");
    if (!scroller) throw new Error("Roadmap scroller was not found.");
    return scroller.scrollWidth - scroller.clientWidth;
  });
}
