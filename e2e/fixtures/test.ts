import { expect, test as base } from "@playwright/test";

export const test = base.extend<{ seriousBrowserErrors: string[] }>({
  seriousBrowserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        const text = message.text();
        const isExpectedNotFoundNoise = text === "Failed to load resource: the server responded with a status of 404 (Not Found)";
        if (message.type() === "error" && !isExpectedNotFoundNoise) errors.push(`console: ${text}`);
      });
      await use(errors);
      expect(errors, "unexpected browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
