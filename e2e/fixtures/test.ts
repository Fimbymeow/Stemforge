import { expect, test as base } from "@playwright/test";

type OrthicFixtures = {
  seriousBrowserErrors: string[];
  newLearner: boolean;
  onboardingBaseline: void;
};

export const test = base.extend<OrthicFixtures>({
  newLearner: [false, { option: true }],
  onboardingBaseline: [async ({ page, newLearner }, use) => {
    if (!newLearner) {
      await page.addInitScript(() => {
        const key = "orthic.onboarding.v1";
        if (!window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, JSON.stringify({ version: 1, status: "completed", step: 3 }));
        }
      });
    }
    await use();
  }, { auto: true }],
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
