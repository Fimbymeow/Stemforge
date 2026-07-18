import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /account-data-safety-real\.spec\.ts/,
  outputDir: "test-results-account-safety-real",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 150_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3083",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "account-safety-desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
