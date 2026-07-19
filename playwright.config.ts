import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3070";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /(auth-enabled-navigation|guest-progress-import-real|progress-sync-real|account-data-safety-real|internal-beta-report-dashboard|internal-beta-report-dashboard-mobile|platform-hardening|production-smoke)\.spec\.ts/,
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /(mobile|auth-enabled-navigation|guest-progress-import-real|progress-sync-real|account-data-safety-real|internal-beta-report-dashboard|internal-beta-report-dashboard-mobile|platform-hardening|production-smoke)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true },
    },
  ],
});
