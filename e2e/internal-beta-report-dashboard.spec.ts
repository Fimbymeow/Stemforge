import { test, expect } from "./fixtures/test";

const primaryReport = "SF-OPS0000001";
const duplicateReport = "SF-OPS0000002";

test("allowlisted operator triages synthetic reports through the protected dashboard", async ({ page }) => {
  await signIn(page);
  await page.goto("/internal/beta-reports");
  await expect(page.getByRole("heading", { name: "Beta report queue" })).toBeVisible();
  await expect(page.getByText("Operational readiness")).toBeVisible();
  await expect(page.getByText("healthy", { exact: true }).first()).toBeVisible();

  await page.getByLabel("Status").selectOption("all");
  await page.getByLabel("Severity", { exact: true }).selectOption("critical");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/severity=critical/);
  await expect(page.getByRole("cell", { name: "critical", exact: true })).toBeVisible();

  await page.goto("/internal/beta-reports?status=all&pageSize=10");
  await expect(page.getByRole("link", { name: "Next page" })).toBeVisible();
  await page.getByRole("link", { name: "Next page" }).click();
  await expect(page).toHaveURL(/cursor=/);

  await page.goto(`/internal/beta-reports/${primaryReport}`);
  await expect(page.getByText("<script>synthetic marker</script>", { exact: true })).toBeVisible();
  expect(await page.locator("script").allTextContents()).not.toContain("synthetic marker");
  await expect(page.getByText("Safe diagnostic context")).toBeVisible();
  await expect(page.getByText("Auth state")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("owner_");
  await expect(page.locator("body")).not.toContainText("learner answer");

  await page.getByLabel("Status").selectOption("triaged");
  await page.getByLabel("Severity").selectOption("high");
  await page.getByLabel("Reproduction").selectOption("reproduced");
  await page.getByRole("button", { name: "Save workflow" }).click();
  await expect(page.getByText("high severity", { exact: true })).toBeVisible();

  await page.getByLabel("Status").selectOption("resolved");
  await page.getByRole("button", { name: "Save workflow" }).click();
  await expect(page.getByRole("status")).toContainText("resolution summary is required");
  await page.getByLabel("Resolution or closure summary").fill("Resolved through the synthetic Sprint 22 operator workflow.");
  await page.getByRole("button", { name: "Save workflow" }).click();
  await expect(page.getByText("resolved", { exact: true }).first()).toBeVisible();

  const stale = await page.request.patch(`/api/internal/beta-reports/${primaryReport}`, {
    headers: { Origin: "http://127.0.0.1:3084" },
    data: { expectedVersion: 1, severity: "critical" },
  });
  expect(stale.status()).toBe(409);
  expect((await stale.json()).error).toBe("stale_update");
  const crossSite = await page.request.patch(`/api/internal/beta-reports/${primaryReport}`, {
    headers: { Origin: "https://invalid.example" }, data: { expectedVersion: 3, severity: "critical" },
  });
  expect(crossSite.status()).toBe(403);

  await page.goto(`/internal/beta-reports/${duplicateReport}`);
  await page.getByLabel("Status").selectOption("closed");
  await page.getByLabel("Duplicate of").fill(primaryReport);
  await page.getByRole("button", { name: "Save workflow" }).click();
  await expect(page.getByLabel("Status")).toHaveValue("closed");

  await page.goto("/account");
  await expect(page.getByText(primaryReport)).toBeVisible();
  await expect(page.getByText("Resolved through the synthetic Sprint 22 operator workflow.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("high severity");
  await expect(page.locator("body")).not.toContainText("reproduced");
});

async function signIn(page: import("@playwright/test").Page) {
  const email = process.env.STEMFORGE_AUTH_TEST_EMAIL;
  const password = process.env.STEMFORGE_AUTH_TEST_PASSWORD;
  if (!email || !password) throw new Error("Dedicated authentication test credentials are required.");
  await page.goto("/account/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname === "/account" || (url.pathname === "/account/sign-in" && url.searchParams.has("result")), { timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe("/account");
}
