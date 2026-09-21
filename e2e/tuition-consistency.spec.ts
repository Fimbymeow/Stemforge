import { expect, test } from "./fixtures/test";

const routes = [
  ["/tuition", "Home"],
  ["/tuition/subjects", "Subjects"],
  ["/tuition/about", "About"],
  ["/tuition/pricing", "Pricing"],
] as const;

for (const [route, activeLabel] of routes) {
  test(`${activeLabel} uses the shared Tuition shell without overflow`, async ({ page, seriousBrowserErrors }) => {
    await page.goto(route);
    const navigation = page.getByRole("navigation", { name: "Tuition", exact: true });
    await expect(navigation.getByRole("link", { name: activeLabel, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "Back to Orthic" })).toHaveAttribute("href", "/");
    await expect(navigation.getByRole("link", { name: "Free first session" })).toHaveAttribute("href", "/tuition#contact");
    await expect(page.getByRole("contentinfo")).toContainText("not affiliated with or endorsed by Qualifications Scotland");

    for (const width of [390, 375, 320]) {
      await page.setViewportSize({ width, height: 760 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${route} at ${width}px`).toBe(0);
    }
    expect(seriousBrowserErrors).toEqual([]);
  });
}

test("Subjects tabs preserve real course content and accessible state", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/tuition/subjects");
  const higherMaths = page.getByRole("tab", { name: "Higher Maths" });
  await higherMaths.click();
  await expect(higherMaths).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { level: 2, name: "Higher Maths" })).toBeVisible();
  await expect(page.getByText("£25/hour", { exact: false })).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});

test("Pricing FAQ remains keyboard-operable", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/tuition/pricing");
  const disclosure = page.getByRole("button", { name: "Who teaches the lessons?" });
  await disclosure.focus();
  await disclosure.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/Finlay Kennedy — achieved A grades/)).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});
