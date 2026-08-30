import { expect, test } from "./fixtures/test";
import { QUESTION_IDS } from "./fixtures/progress";

const hub = "/subjects/higher-maths";
const overview = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";

test("the quiet shell preserves global navigation and removes duplicated promotion", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Main" });

  await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("href", "/dashboard");
  await expect(nav.getByRole("link", { name: "Subjects", exact: true })).toHaveAttribute("href", "/subjects");
  await expect(nav.getByRole("link", { name: "Current Path", exact: true })).toHaveAttribute("href", overview);
  await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Tuition" })).toHaveCount(0);
  await expect(page.getByText("2 Higher Maths skills", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Higher Physics is coming soon/)).toHaveCount(0);
});

test("the full sidebar remains usable at common laptop widths and collapses below lg", async ({ page }) => {
  for (const width of [1280, 1152, 1024]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : 864 });
    await page.goto(hub);
    const sidebar = page.locator("[data-app-sidebar]");
    await expect(sidebar).toBeVisible();
    expect(await sidebar.evaluate((element) => getComputedStyle(element).position)).toBe("fixed");
    expect(Math.round((await sidebar.boundingBox())!.width)).toBe(240);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/subjects/higher-maths/course-tracker");
  expect((await page.getByTestId("course-tracker").boundingBox())!.width).toBeGreaterThan(680);
  await page.goto(`/question/${QUESTION_IDS[0]}`);
  expect((await page.getByTestId("question-interaction").boundingBox())!.width).toBeGreaterThan(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.getByTestId("working-context-trigger").click();
  await expect(page.getByTestId("working-context-desktop-panel")).toBeVisible();
  await expect(page.getByTestId("working-context-sheet")).toHaveCount(0);

  await page.setViewportSize({ width: 1023, height: 768 });
  await page.goto(hub);
  const condensed = page.locator("[data-app-sidebar]");
  expect(await condensed.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
  expect(Math.round((await condensed.boundingBox())!.width)).toBeGreaterThan(1000);
});

test("active shell state follows the actual surface and contextual Path remains truthful", async ({ page }) => {
  await page.goto(hub);
  const hubNav = page.getByRole("navigation", { name: "Main" });
  await expect(hubNav.getByRole("link", { name: "Subjects", exact: true })).toHaveAttribute("aria-current", "page");
  const hubPath = page.getByRole("button", { name: "Current Path: Basic differentiation" });
  await expect(hubPath).not.toHaveAttribute("aria-current", "page");
  await expect(hubPath).toBeVisible();

  await page.goto(`/question/${QUESTION_IDS[0]}`);
  const workspacePath = page.getByRole("button", { name: "Current Path: Basic differentiation" });
  await expect(workspacePath).toHaveAttribute("aria-current", "page");
  await workspacePath.click();
  await expect(page.getByTestId("working-context-desktop-panel")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}$`));
});

test("shell destinations load and Course Tracker remains reachable through Higher Maths", async ({ page }) => {
  for (const route of ["/dashboard", hub, "/subjects/higher-maths/question-bank", "/practice?review=1"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  }

  await page.goto(hub);
  await page.getByTestId("course-tracker-destination").click();
  await expect(page).toHaveURL("/subjects/higher-maths/course-tracker");
  await expect(page.getByTestId("course-tracker")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Subjects", exact: true })).toHaveAttribute("aria-current", "page");
});

test("responsive shell keeps navigation and learning surfaces overflow-free", async ({ page }) => {
  for (const width of [1024, 768, 390, 375, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 700 : 800 });
    for (const route of ["/dashboard", "/subjects/higher-maths/course-tracker", "/subjects/higher-maths/question-bank", `/question/${QUESTION_IDS[0]}`]) {
      await page.goto(route);
      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Subjects", exact: true })).toBeVisible();
      const pathLabel = width >= 1024 ? "Current Path" : "Path";
      await expect(page.getByTestId("working-context-trigger").or(nav.getByRole("link", { name: pathLabel, exact: true }))).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
  }
});
