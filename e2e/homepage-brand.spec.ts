import { expect, test } from "./fixtures/test";

test("public homepage presents truthful product-led Orthic positioning", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await expect(page).toHaveTitle(/Orthic.*Learn with Precision/);
  await expect(page.getByRole("heading", { level: 1, name: "Learn with Precision." })).toBeVisible();
  await expect(page.getByRole("img", { name: /Orthic Higher Maths Basic differentiation page/ })).toBeVisible();
  await expect(page.getByText("Mechanics", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Kinematics", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Chemistry", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Biology", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Higher Maths", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Higher Physics", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Higher Physics", level: 3 }).locator("xpath=parent::*").getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByText("Premium", { exact: false })).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const headingBox = await page.getByRole("heading", { level: 1, name: "Learn with Precision." }).boundingBox();
  const proofBox = await page.getByRole("img", { name: /Orthic Higher Maths Basic differentiation page/ }).locator("xpath=ancestor::figure").boundingBox();
  const nextSectionBox = await page.locator("#how-it-works").boundingBox();
  expect(headingBox).not.toBeNull();
  expect(proofBox).not.toBeNull();
  expect(nextSectionBox).not.toBeNull();
  expect(headingBox!.x + headingBox!.width).toBeLessThan(proofBox!.x);
  expect(proofBox!.y).toBeLessThan(headingBox!.y + headingBox!.height + 260);
  expect(nextSectionBox!.y).toBeLessThan(760);
  expect(seriousBrowserErrors).toEqual([]);
});

test("public navigation keeps course actions focused and routes real CTAs", async ({ page }) => {
  await page.goto("/");
  const primary = page.getByRole("navigation", { name: "Primary" });
  await expect(primary.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "#how-it-works");
  await expect(primary.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "#courses");
  await expect(primary.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
  await expect(primary.getByRole("link", { name: "Tuition" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Orthic Tuition" })).toHaveAttribute("href", "/tuition");
  await expect(page.getByRole("link", { name: "Start Learning" }).first()).toHaveAttribute("href", "/dashboard");
  await expect(page.getByRole("link", { name: "Explore Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");
});

test("mobile navigation and product proof remain compact, accessible and overflow-free", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 768, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(0);
    await expect(page.getByRole("heading", { level: 1, name: "Learn with Precision." })).toBeVisible();
    const mobileHeading = page.getByRole("heading", { level: 1, name: "Learn with Precision." });
    const mobileProof = page.getByRole("img", { name: /Orthic Higher Maths Basic differentiation page/ });
    await expect(mobileProof).toBeVisible();
    expect((await mobileProof.boundingBox())!.y).toBeGreaterThan((await mobileHeading.boundingBox())!.y);
    if (viewport.width < 768) {
      const trigger = page.getByRole("button", { name: "Open navigation" });
      await trigger.click();
      await expect(page.getByRole("link", { name: "How it works" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
    }
  }
});

test("reduced motion resolves the hero construction directly to the static mark", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const state = await page.locator(".orthic-construction").evaluate((svg) => ({
    lines: getComputedStyle(svg.querySelector(".orthic-construction-lines")!).display,
    fill: getComputedStyle(svg.querySelector(".orthic-construction-fill")!).opacity,
  }));
  expect(state).toEqual({ lines: "none", fill: "1" });
});
