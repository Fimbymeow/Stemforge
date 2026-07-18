import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3084";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results-internal-real",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: { baseURL, trace: "off", screenshot: "off", video: "off" },
  projects: [
    { name: "internal-desktop-chromium", testMatch: /internal-beta-report-dashboard\.spec\.ts$/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "internal-mobile-chromium", testMatch: /internal-beta-report-dashboard-mobile\.spec\.ts$/, use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
});
