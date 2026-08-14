import { expect, test } from "./fixtures/test";

test("public privacy and terms pages are reachable and describe current data boundaries", async ({ page, seriousBrowserErrors }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");

  await page.getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { name: "Privacy Notice", level: 1 })).toBeVisible();
  await expect(page.getByText("Signing in alone never imports guest data automatically.", { exact: false })).toBeVisible();
  await expect(page.getByText(/Formal legal review/)).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of Use", level: 1 })).toBeVisible();
  await expect(page.getByText(/designed for school learners/)).toBeVisible();
  await expect(page.getByText(/cannot guarantee grades/)).toBeVisible();
  expect(seriousBrowserErrors).toEqual([]);
});

test("legal and account surfaces remain overflow-free at 320px", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const path of ["/privacy", "/terms", "/account/sign-in", "/account/sign-up"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBe(0);
  }
  expect(seriousBrowserErrors).toEqual([]);
});
