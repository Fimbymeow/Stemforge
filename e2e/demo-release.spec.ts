import { expect, test } from "@playwright/test";
import { WALKTHROUGH_IDS } from "../lib/demo/walkthrough";

const previewRoutes = [
  "/demo",
  "/demo/chain-rule",
  "/demo/chain-rule/notes",
  `/demo/question/${WALKTHROUGH_IDS[0]}`,
];

test("public preview metadata is accurate and noindex is confined to demo routes", async ({ page }) => {
  for (const route of previewRoutes) {
    await page.goto(route);
    await expect(page).toHaveTitle("Orthic Preview — Higher Maths");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /one complete Higher Maths skill: Chain Rule/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Orthic Preview — Higher Maths");
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /Chain Rule Notes, interactive practice/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  }

  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test("all public preview deep links survive document reload and remain contained", async ({ page }) => {
  for (const route of previewRoutes) {
    await page.goto(route);
    await page.reload();
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.getByRole("link", { name: "Orthic preview overview" })).toHaveAttribute("href", "/demo");
    await expect(page.getByText("No account required · Activity resets on refresh")).toBeVisible();
    await expect(page.locator("main#main-content")).not.toContainText("Question unavailable in this demo");
  }

  await page.goto("/demo/question/hm-calc-diff-basic-f-001");
  await expect(page.getByRole("heading", { name: "Question unavailable in this demo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Chain Rule" })).toHaveAttribute("href", "/demo/chain-rule");
});
