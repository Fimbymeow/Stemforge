import { expect, test } from "@playwright/test";

async function setDemoAnswer(page: import("@playwright/test").Page, value: string) {
  const field = page.getByLabel("Your answer");
  await expect(field).toBeVisible();
  if (await field.evaluate((element) => element.tagName.toLowerCase() === "math-field")) {
    await field.evaluate((element, answer) => {
      const mathField = element as HTMLElement & { setValue(value: string): void };
      mathField.setValue(answer);
      mathField.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
  } else {
    await field.fill(value);
  }
}

test("isolated public surface is truthful, accessible and links only to canonical Tuition", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Orthic — Scottish STEM Learning");
  await expect(page.getByRole("heading", { level: 1, name: "Master Scottish STEM, one skill at a time." })).toBeVisible();
  await expect(page.getByText("Launching soon. Starting with Higher Maths.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tuition", exact: true })).toHaveAttribute("href", "https://stemforge-6an8.vercel.app/tuition");
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

test("the canonical-backed Chain Rule demo uses real equivalence marking and remains ephemeral", async ({ page }) => {
  const backgroundRequests: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) backgroundRequests.push(request.url());
  });
  await page.goto("/");
  const demo = page.locator("[data-chain-rule-demo]");
  await expect(demo).toHaveAttribute("data-question-id", "orthic-public-chain-rule-square-v1");
  await expect(demo).toContainText("Differentiate");
  await expect(demo).toContainText("Chain Rule");
  await expect(demo.getByRole("link", { name: /Join the Orthic waitlist/ })).toBeHidden();

  await setDemoAnswer(page, "2(3x+2)");
  await page.getByLabel("Your answer").press("Enter");
  await expect(demo.getByText("Not quite", { exact: true })).toBeVisible();

  await setDemoAnswer(page, "6(3x+2)");
  await demo.getByRole("button", { name: /Check answer/ }).click();
  await expect(demo.getByText("Correct", { exact: true })).toBeVisible();

  await setDemoAnswer(page, "18x+12");
  await demo.getByRole("button", { name: /Check answer/ }).click();
  await expect(demo.getByText("Correct", { exact: true })).toBeVisible();

  await demo.getByRole("button", { name: "Show hint" }).click();
  await expect(demo.locator("[data-demo-hint]")).toContainText("Bring down the outside power 2");
  await demo.getByRole("button", { name: "Show worked solution" }).click();
  await expect(demo.locator("[data-demo-solution]")).toContainText("multiply by the derivative of the bracket");
  await expect(demo.getByRole("link", { name: /Join the Orthic waitlist/ })).toHaveAttribute("href", "/#join-waitlist");

  expect(backgroundRequests.filter((url) => /\/(?:api|auth|account|progress|evidence|premium)(?:\/|\?|$)/.test(new URL(url).pathname))).toEqual([]);
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });

  await page.reload();
  await expect(page.locator("[data-demo-feedback]")).toBeHidden();
  await expect(page.locator("[data-demo-hint]")).toBeHidden();
  await expect(page.locator("[data-demo-solution]")).toBeHidden();
  await expect(page.getByLabel("Your answer")).toHaveJSProperty("value", "");
});

for (const width of [320, 375, 390, 430, 768, 1440]) {
  test(`Chain Rule demo remains usable without overflow at ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "One deterministic responsive pass is sufficient.");
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto("/");
    const demo = page.locator("[data-chain-rule-demo]");
    await expect(demo).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    for (const control of await demo.locator("button, input, math-field, a").all()) {
      if (await control.isVisible()) expect((await control.evaluate((element) => element.getBoundingClientRect().height))).toBeGreaterThanOrEqual(44);
    }
    await demo.getByRole("button", { name: "Show hint" }).click();
    await demo.getByRole("button", { name: "Show worked solution" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
