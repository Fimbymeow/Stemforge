import { test, expect } from "./fixtures/test";

test("question report trigger has one accessible control and one decorative icon", async ({ page }) => {
  await page.goto("/question/hm-calc-diff-basic-f-001");
  const trigger = page.getByRole("button", { name: "Report this question", exact: true });
  await expect(trigger).toHaveCount(1);
  await expect(trigger).toBeVisible();
  await expect(trigger.locator("svg")).toHaveCount(1);
  await expect(trigger.locator("svg")).toHaveAttribute("aria-hidden", "true");
});

test("guest can submit an explicit beta report with safe diagnostics and receive a reference", async ({ page }) => {
  let captured: unknown;
  await page.route("**/api/beta-reports", async (route) => {
    captured = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "accepted", reportId: "SF-ABCDE12345" }),
    });
  });

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Send feedback" }).last().click();
  await page.getByLabel("Report type").selectOption("bug");
  await page.getByLabel("What should we know?").fill("The dashboard count looked odd after finishing a question.");
  await page.getByRole("button", { name: "Send report" }).click();

  await expect(page.getByText("Report SF-ABCDE12345 saved")).toBeVisible();
  expect(captured).toMatchObject({
    schemaVersion: 1,
    kind: "bug",
    pagePath: "/dashboard",
    pageArea: "global",
  });
  const payload = captured as { diagnosticContext: Record<string, unknown>; userMessage: string };
  expect(payload.userMessage).toContain("dashboard count");
  expect(payload.diagnosticContext).toMatchObject({ route: "/dashboard", pageArea: "global" });
  expect(JSON.stringify(payload.diagnosticContext)).not.toContain("localStorage");
  expect(JSON.stringify(payload.diagnosticContext)).not.toContain("password");
});

test("question report includes stable content references without sending the learner answer", async ({ page }) => {
  let captured: unknown;
  await page.route("**/api/beta-reports", async (route) => {
    captured = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "accepted", reportId: "SF-QSTN123456" }),
    });
  });

  await page.goto("/question/hm-calc-diff-basic-f-001");
  await page.getByRole("button", { name: "Report this question" }).click();
  await page.getByLabel("What should we know?").fill("This question wording could be clearer.");
  await page.getByRole("button", { name: "Send report" }).click();

  await expect(page.getByText("Report SF-QSTN123456 saved")).toBeVisible();
  const payload = captured as { diagnosticContext: { contentReference?: Record<string, unknown> }; userMessage: string };
  expect(payload.diagnosticContext.contentReference?.questionId).toBeTruthy();
  expect(payload.diagnosticContext.contentReference?.questionVersion).toBeTruthy();
  expect(JSON.stringify(payload)).not.toContain("Your answer");
});

test("internal review route fails closed for ordinary beta users", async ({ page }) => {
  const response = await page.request.get("/api/internal/beta-reports");
  expect(response.status()).toBe(403);
  await expect.poll(async () => (await response.json()).error).toBe("forbidden");
});
