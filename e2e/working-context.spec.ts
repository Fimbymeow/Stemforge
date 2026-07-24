import { expect, test } from "./fixtures/test";
import {
  QUESTION_IDS,
  currentAttempt,
  seedStoredProgress,
  v3Payload,
} from "./fixtures/progress";

const hub = "/subjects/higher-maths";
const overview = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";

test("fresh learner gets real production entry points with no activation query", async ({ page }) => {
  await page.goto(hub);
  const card = page.getByTestId("working-context-hub");
  await expect(card).toContainText("Basic differentiation");
  await expect(card.getByRole("link", { name: "Basic differentiation" })).toHaveAttribute("href", overview);
  await expect(card.getByRole("link", { name: "Start", exact: true })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await expect(card.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/subjects/higher-maths/revision-notes");
  await expect(card.getByRole("link", { name: "Practice" })).toHaveAttribute("href", "/practice?path=basic-differentiation");
  expect(page.url()).not.toContain("workingContext=");
  await card.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}$`));
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${hub}$`));
});

test("real evidence drives Continue and stage progress across hub, overview and question", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[0], 1),
    currentAttempt(QUESTION_IDS[1], 2, { isCorrect: false, answer: "wrong" }),
  ]));

  await page.goto(hub);
  await expect(page.getByTestId("working-context-hub").getByRole("link", { name: "Continue", exact: true })).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);

  await page.goto(overview);
  await expect(page.getByRole("link", { name: "Continue", exact: true }).first()).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
  await expect(page.getByText("1 / 3 complete", { exact: true })).toBeVisible();

  await page.goto(`/question/${QUESTION_IDS[1]}`);
  const trigger = page.getByRole("button", { name: "Current Path: Basic differentiation" });
  await trigger.click();
  await expect(page.getByTestId("working-context-desktop-panel")).toContainText("Foundations");
  await expect(page.getByTestId("working-context-desktop-panel").getByRole("link", { name: "Continue", exact: true })).toHaveAttribute("href", `/question/${QUESTION_IDS[1]}`);
});

test("stage transition is deterministic and stage rows remain directly explorable", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.slice(0, 3).map((id, index) => currentAttempt(id, index + 1)),
  ));
  await page.goto(overview);
  await expect(page.getByText("Applications · 0 of 3 complete")).toBeVisible();
  await expect(page.locator('[data-recommended="true"]')).toContainText("Applications");
  await expect(page.getByRole("link", { name: "Explore Past Paper-style Questions" })).toHaveAttribute("href", `/question/${QUESTION_IDS[6]}`);
});

test("genuine review evidence exposes one contextual re-attempt and no fake queue", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: index === 0 })),
  ));
  await page.goto(`/question/${QUESTION_IDS[7]}`);
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  const panel = page.getByTestId("working-context-desktop-panel");
  await expect(panel.getByRole("link", { name: "Review 1 question due" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
  await page.goto(hub);
  await expect(page.getByTestId("working-context-hub").getByRole("link", { name: "Review 1 question due" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);

  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(`/question/${QUESTION_IDS[7]}`);
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  await expect(page.getByTestId("working-context-desktop-panel").getByText(/question due/)).toHaveCount(0);
});

test("question-to-Notes continuity returns to the exact production question URL", async ({ page }) => {
  await page.goto("/subjects/higher-maths/revision-notes");
  await expect(page.getByRole("button", { name: /Back to Question/ })).toHaveCount(0);
  await page.goto(`/question/${QUESTION_IDS[0]}`);
  await page.getByRole("link", { name: /Notes:/ }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes\?fromQuestion=/);
  await page.reload();
  await page.getByRole("button", { name: "Back to Question 1" }).click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}$`));
});

test("path-scoped Practice uses canonical context and a clean session URL", async ({ page }) => {
  await page.goto("/practice?path=basic-differentiation");
  await expect(page.getByRole("button", { name: "Current Path: Basic differentiation" })).toBeVisible();
  await page.getByTestId("quick-practice-action").click();
  await expect(page).toHaveURL(/\/practice\/session\/[^?]+$/);
  await expect(page.getByRole("button", { name: "Current Path: Basic differentiation" })).toBeVisible();
});

test("dashboard does not duplicate the contextual navigation surface", async ({ page }) => {
  await seedStoredProgress(page, v3Payload([
    currentAttempt(QUESTION_IDS[1], 1, { isCorrect: false, answer: "wrong" }),
  ]));
  await page.goto("/dashboard");
  await expect(page.getByTestId("working-context-trigger")).toHaveCount(0);
  await expect(page.getByText("Isolated resume")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("Resume question");
  await page.evaluate(() => localStorage.clear());
  await page.goto(overview);
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-progress-summary")).toContainText("Start Basic differentiation");
});

test("mobile Current Path opens a trapped modal and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(hub);
  await page.getByTestId("working-context-hub").getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}$`));
  const trigger = page.getByRole("button", { name: "Current Path: Basic differentiation" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Basic differentiation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close working context" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.evaluate(() => history.back());
  await expect(page.getByRole("dialog", { name: "Basic differentiation" })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/question/${QUESTION_IDS[0]}$`));
});

test("working routes remain production URLs and unavailable paths still return 404", async ({ page }) => {
  for (const route of [overview, `/question/${QUESTION_IDS[0]}`, "/subjects/higher-maths/revision-notes", "/practice?path=basic-differentiation"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(page.url()).not.toContain("workingContext=");
  }
  const unavailable = await page.goto("/subjects/higher-maths/calculus/differentiation/chain-rule");
  expect(unavailable?.status()).toBe(404);
});
