import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3081";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /guest-progress-import-real\.spec\.ts/,
  outputDir: "test-results-import-real",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "import-desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "import-mobile-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
});
