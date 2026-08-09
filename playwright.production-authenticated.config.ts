import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.STEMFORGE_PRODUCTION_BASE_URL;
if (!baseURL) throw new Error("STEMFORGE_PRODUCTION_BASE_URL is required.");
const parsed = new URL(baseURL);
if (parsed.protocol !== "https:" || parsed.origin !== baseURL.replace(/\/$/, "")) throw new Error("The production base URL must be a path-free HTTPS origin.");
if (process.env.STEMFORGE_PRODUCTION_AUTH_CONFIRM_DISPOSABLE !== "YES") throw new Error("Set STEMFORGE_PRODUCTION_AUTH_CONFIRM_DISPOSABLE=YES only for a dedicated disposable test account.");

export default defineConfig({
  testDir: "./e2e",
  testMatch: /production-authenticated-smoke\.spec\.ts/,
  outputDir: "test-results-production-authenticated-smoke",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  reporter: [["list"]],
  use: { baseURL: parsed.origin, trace: "retain-on-failure", screenshot: "only-on-failure", video: "off" },
  projects: [{ name: "production-authenticated-chromium", use: { ...devices["Desktop Chrome"] } }],
});
