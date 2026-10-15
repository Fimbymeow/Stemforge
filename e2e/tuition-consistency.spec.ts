import { expect, test } from "./fixtures/test";

const routes = [
  ["/tuition", "Home"],
  ["/tuition/about", "About"],
  ["/tuition/pricing", "Pricing"],
] as const;

for (const [route, activeLabel] of routes) {
  test(`${activeLabel} uses the shared Tuition shell without overflow`, async ({ page, seriousBrowserErrors }) => {
    await page.goto(route);
    const navigation = page.getByRole("navigation", { name: "Tuition", exact: true });
    await expect(navigation.getByRole("link", { name: activeLabel, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "Back to Orthic" })).toHaveAttribute("href", "https://orthic.co.uk/");
    await expect(navigation.getByRole("link", { name: "Free first session" })).toHaveAttribute("href", "/tuition#contact");
    await expect(page.getByRole("contentinfo")).toContainText("not affiliated with or endorsed by Qualifications Scotland");

    for (const width of [768, 430, 390, 375, 320]) {
      await page.setViewportSize({ width, height: 760 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${route} at ${width}px`).toBe(0);
    }
    expect(seriousBrowserErrors).toEqual([]);
  });
}

test("Tuition exposes only the three canonical pages", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/tuition");
  const navigation = page.getByRole("navigation", { name: "Tuition", exact: true });
  await expect(navigation.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "About", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Subjects", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View pricing", exact: true }).first()).toHaveAttribute("href", "/tuition/pricing");
  expect(seriousBrowserErrors).toEqual([]);
});

test("Pricing FAQ remains keyboard-operable", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/tuition/pricing");
  const disclosure = page.getByRole("button", { name: "Who teaches the lessons?" });
  await disclosure.focus();
  await disclosure.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/Finlay Kennedy has 2\+ years of tutoring experience/)).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});
