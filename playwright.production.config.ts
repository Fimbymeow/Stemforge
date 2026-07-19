import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.STEMFORGE_PRODUCTION_BASE_URL;
if (!baseURL) throw new Error("STEMFORGE_PRODUCTION_BASE_URL is required for production smoke tests.");
const parsed = new URL(baseURL);
if (parsed.protocol !== "https:" || parsed.origin !== baseURL.replace(/\/$/, "")) {
  throw new Error("STEMFORGE_PRODUCTION_BASE_URL must be a path-free HTTPS origin.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: /production-smoke\.spec\.ts/,
  outputDir: "test-results-production-smoke",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: parsed.origin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "production-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "production-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "production-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
