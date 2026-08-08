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
  await expect(page.getByText("2 Higher Maths skills", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Higher Physics is coming soon/)).toHaveCount(0);
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
  await page.getByTestId("course-tracker-destination").getByRole("link", { name: "Open Course Tracker" }).click();
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
      await expect(page.getByTestId("working-context-trigger").or(nav.getByRole("link", { name: "Path", exact: true }))).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
  }
});
