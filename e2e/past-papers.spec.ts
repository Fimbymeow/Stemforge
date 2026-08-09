import { expect, test } from "./fixtures/test";

test("Higher Maths exposes the official Past Papers library without confusing it with learning-stage PPQs", async ({ page }) => {
  await page.goto("/subjects/higher-maths");
  const destination = page.getByTestId("past-papers-destination");
  await expect(destination.getByRole("link", { name: "Open Past Papers" })).toBeVisible();
  await destination.getByRole("link", { name: "Open Past Papers" }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/past-papers$/);
  await expect(page.getByRole("heading", { name: "Past Papers", level: 1 })).toBeVisible();
  await expect(page.getByText("Qualifications Scotland (formerly SQA)")).toBeVisible();
  await expect(page.getByText("Past Paper-style Questions")).toHaveCount(0);

  await expect(page.locator("section > div > h2")).toHaveText(["2025", "2024", "2023", "2022"]);
  await expect(page.getByTestId(/^past-paper-/)).toHaveCount(8);
  await expect(page.getByRole("link", { name: /question paper on Qualifications Scotland \(opens in a new tab\)$/ })).toHaveCount(8);
  await expect(page.getByRole("link", { name: /marking instructions on Qualifications Scotland \(opens in a new tab\)$/ })).toHaveCount(8);

  const officialLinks = page.locator('a[target="_blank"]');
  await expect(officialLinks).toHaveCount(16);
  for (let index = 0; index < 16; index += 1) {
    const link = officialLinks.nth(index);
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAttribute("href", /^https:\/\/sqa\.org\.uk\/pastpapers\/papers\/(papers|instructions)\/.*\.pdf$/);
  }
});

test("subjects without an approved catalogue do not receive an empty Past Papers surface", async ({ page }) => {
  await page.goto("/subjects/higher-physics/past-papers");
  await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
});
