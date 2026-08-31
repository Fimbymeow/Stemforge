import { expect, test } from "@playwright/test";

test("isolated public surface is truthful, accessible and contains no product or Tuition links", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Orthic — Scottish STEM Learning");
  await expect(page.getByRole("heading", { level: 1, name: "Master Scottish STEM, one skill at a time." })).toBeVisible();
  await expect(page.getByText("Launching soon. Starting with Higher Maths.")).toBeVisible();
  await expect(page.getByText("Tuition", { exact: false })).toHaveCount(0);
  await expect(page.locator('a[href^="/dashboard"], a[href^="/subjects"], a[href^="/courses"], a[href^="/practice"], a[href^="/review"], a[href^="/activity"], a[href^="/account"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("real local Worker and D1 persist a normalised email idempotently", async ({ request }) => {
  const email = `Waitlist-${Date.now()}@Example.COM`;
  const first = await request.post("/api/waitlist", { data: { email: ` ${email} `, website: "" } });
  expect(first.status()).toBe(200);
  expect(await first.json()).toEqual({ status: "joined" });
  const duplicate = await request.post("/api/waitlist", { data: { email: email.toLowerCase() } });
  expect(duplicate.status()).toBe(200);
  expect(await duplicate.json()).toEqual({ status: "already_joined" });
});

test("form exposes invalid, loading, success, duplicate, failure and rate-limit states", async ({ page }) => {
  await page.goto("/");
  const form = page.locator(".waitlist-form").first();
  const email = form.getByLabel("Email address");
  await email.fill("invalid");
  await form.getByRole("button", { name: /Join the waitlist/ }).click();
  await expect(form.getByRole("alert")).toHaveText("Enter a valid email address.");
  await expect(email).toBeFocused();

  for (const [status, expected] of [
    ["joined", "You’re on the list. We’ll let you know when Orthic launches."],
    ["already_joined", "You’re already on the list."],
    ["server_error", "We couldn’t add you just now. Please try again."],
    ["rate_limited", "Too many attempts. Try again shortly."],
  ] as const) {
    await page.reload();
    const currentForm = page.locator(".waitlist-form").first();
    await page.route("**/api/waitlist", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status }) });
    }, { times: 1 });
    await currentForm.getByLabel("Email address").fill("learner@example.com");
    await currentForm.getByRole("button", { name: /Join the waitlist/ }).click();
    await expect(currentForm.getByRole("button", { name: /Joining/ })).toBeDisabled();
    await expect(currentForm.getByText(expected)).toBeVisible();
  }
});

test("privacy is public while learner routes and unknown routes return 404", async ({ page, request }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1, name: "Waitlist privacy notice" })).toBeVisible();
  for (const route of ["/dashboard", "/subjects", "/practice", "/account", "/anything-else"]) {
    expect((await request.get(route)).status(), route).toBe(404);
  }
  const method = await request.get("/api/waitlist");
  expect(method.status()).toBe(405);
  expect(method.headers().allow).toBe("POST");
});

