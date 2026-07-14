import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3079";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /auth-enabled-navigation\.spec\.ts/,
  outputDir: "test-results-auth-enabled",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-auth-enabled-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "auth-enabled-desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
