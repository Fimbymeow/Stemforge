import { expect, test } from "./fixtures/test";

test("public homepage presents truthful product-led Orthic positioning", async ({ page, seriousBrowserErrors }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await expect(page).toHaveTitle(/Orthic.*Learn with Precision/);
  await expect(page.getByRole("heading", { level: 1, name: "Learn with Precision." })).toBeVisible();
  await expect(page.getByTestId("homepage-product-visual")).toHaveAccessibleName("Orthic Basic differentiation learning journey");
  await expect(page.getByText("Mechanics", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Kinematics", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Chemistry", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Biology", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Higher Maths", level: 3 })).toBeVisible();
  await expect(page.getByText("Higher Physics", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/public beta/i)).toHaveCount(0);
  await expect(page.getByText("Premium", { exact: false })).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const headingBox = await page.getByRole("heading", { level: 1, name: "Learn with Precision." }).boundingBox();
  const proofBox = await page.getByTestId("homepage-product-visual").boundingBox();
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
  await expect(primary.getByRole("link", { name: "Tuition" })).toHaveAttribute("href", "/tuition");
  await expect(primary.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account");
  await expect(page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Orthic Tuition" })).toHaveAttribute("href", "/tuition");
  await expect(page.getByRole("link", { name: "Start Learning" }).first()).toHaveAttribute("href", "/dashboard");
  await expect(page.getByRole("link", { name: "Explore Higher Maths" })).toHaveAttribute("href", "/subjects/higher-maths");

  await page.goto("/tuition");
  await expect(page.getByRole("link", { name: "Back to Orthic" })).toHaveAttribute("href", "/");
});

test("mobile navigation and product proof remain compact, accessible and overflow-free", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 320, height: 760 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(0);
    await expect(page.getByRole("heading", { level: 1, name: "Learn with Precision." })).toBeVisible();
    const mobileHeading = page.getByRole("heading", { level: 1, name: "Learn with Precision." });
    const mobileProof = page.getByTestId("homepage-product-visual");
    await expect(mobileProof).toBeVisible();
    if (viewport.width < 900) {
      expect((await mobileProof.boundingBox())!.y).toBeGreaterThan((await mobileHeading.boundingBox())!.y);
    }
    if (viewport.width < 768) {
      const trigger = page.getByRole("button", { name: "Open navigation" });
      await trigger.click();
      const mobileMenu = page.locator("#mobile-primary-menu");
      await expect(mobileMenu.getByRole("link", { name: "How it works" })).toBeFocused();
      await expect(mobileMenu.getByRole("link", { name: "Tuition" })).toHaveAttribute("href", "/tuition");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
    } else {
      const primary = page.getByRole("navigation", { name: "Primary" });
      await expect(primary.getByRole("link", { name: "Tuition" })).toBeVisible();
      await expect(primary.getByRole("link", { name: "Start Learning" })).toBeVisible();
    }
  }
});

test("hero product proof is a static composition without animated brand construction", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".orthic-construction")).toHaveCount(0);
  await expect(page.getByTestId("homepage-product-visual")).toBeVisible();
  const animatedDescendants = await page.getByTestId("homepage-product-visual").locator("*").evaluateAll((elements) => elements.filter((element) => getComputedStyle(element).animationName !== "none").length);
  expect(animatedDescendants).toBe(0);
});
