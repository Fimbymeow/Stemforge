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
  await expect(card.getByRole("link", { name: "Start", exact: true })).toHaveAttribute("href", "/subjects/higher-maths/revision-notes?path=basic-differentiation");
  await expect(card.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/subjects/higher-maths/revision-notes?path=basic-differentiation");
  await expect(card.getByRole("link", { name: "Overview" })).toHaveAttribute("href", overview);
  await expect(card.getByRole("link", { name: "Practice" })).toHaveCount(0);
  await expect(page.getByTestId("higher-maths-practice")).toBeVisible();
  await expect(page.getByTestId("review-entry-card")).toBeVisible();
  expect(page.url()).not.toContain("workingContext=");
  await card.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes\?path=basic-differentiation$/);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${hub}$`));
});

test("expanding Current Path on the Question Workspace does not move the question", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`/question/${QUESTION_IDS[0]}`);
  await expect(page.getByTestId("rich-math-field")).toBeVisible();
  const question = page.getByTestId("question-interaction");
  const before = await question.boundingBox();
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  await expect(page.getByTestId("working-context-desktop-panel")).toBeVisible();
  const after = await question.boundingBox();
  expect(after).toEqual(before);
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
  const foundations = page.getByTestId("skill-learning-journey").locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" });
  await expect(foundations).toHaveAttribute("aria-current", "step");
  await expect(foundations).toContainText("1 of 3 complete");

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
  const journey = page.getByTestId("skill-learning-journey");
  const currentStage = journey.locator('[data-journey-kind="stage"][aria-current="step"]');
  await expect(currentStage).toContainText("Applications");
  await expect(currentStage).toContainText("0 of 3 complete");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" })).toHaveAttribute("data-journey-state", "complete");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Exam practice" }).getByRole("link", { name: "Start" })).toHaveAttribute("href", `/question/${QUESTION_IDS[6]}`);
});

test("overview uses one honest compact journey instead of repeated stage cards", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(overview);
  await expect(page.getByTestId("skill-path-compact-header")).toBeVisible();
  await expect(page.getByText("Skill overview", { exact: true })).toHaveCount(0);
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.getByRole("listitem")).toHaveCount(5);
  const notes = journey.locator('[data-journey-kind="notes"]');
  await expect(notes).not.toHaveAttribute("aria-current", "step");
  await expect(notes).toHaveAttribute("data-journey-state", "available");
  await expect(notes).not.toContainText("Complete");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" })).toHaveAttribute("aria-current", "step");
  await expect(journey.locator('[data-journey-kind="review"]')).toContainText("After learning");
  await expect(page.getByRole("progressbar")).toHaveCount(1);
});

test("Chain Rule uses the same truthful journey with its real 34-question progress", async ({ page }) => {
  await page.goto("/subjects/higher-maths/calculus/differentiation/chain-rule");
  await expect(page.getByRole("heading", { name: "Chain rule", level: 1 })).toBeVisible();
  await expect(page.getByTestId("skill-path-hero-progress")).toContainText("0 of 34 questions complete");
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.getByRole("listitem")).toHaveCount(5);
  await expect(journey.locator('[data-journey-kind="notes"]')).toHaveAttribute("data-journey-state", "available");
  await expect(journey.locator('[data-journey-kind="notes"]')).not.toContainText("Complete");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" })).toHaveAttribute("aria-current", "step");
  await expect(journey.locator('[data-journey-kind="stage"]')).toHaveCount(3);
});

test("skill journey stays ordered and overflow-free at 375px and 320px", async ({ page }) => {
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto(overview);
    const journey = page.getByTestId("skill-learning-journey");
    await expect(journey.getByRole("listitem")).toHaveCount(5);
    await expect(journey.getByRole("listitem").first()).toContainText("Notes");
    await expect(journey.getByRole("listitem").last()).toContainText("Review");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }
});

test("completed overview stays compact and renders exactly one primary action", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(recentCompletion()));
  await page.goto(overview);
  await expect(page.getByTestId("completed-path-card")).toBeVisible();
  await expect(page.getByTestId("skill-path-hero-progress")).toContainText("8 of 8 questions complete");
  await expect(page.getByTestId("completed-path-card").getByRole("link", { name: "Start learning" })).toHaveAttribute("href", "/question/hm-calc-diff-chain-f-001");
  await expect(page.getByTestId("skill-learning-journey").locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" }).getByRole("link", { name: "Revisit" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("completed overview links its secondary action to the compact stage list", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(overview);
  const [ids, duplicateIds] = await page.evaluate(() => {
    const allIds = [...document.querySelectorAll("[id]")].map((el) => el.id);
    return [allIds, allIds.filter((id, i) => allIds.indexOf(id) !== i)];
  });
  expect(ids).toContain("stages");
  expect(duplicateIds).toHaveLength(0);
  await expect(page.getByRole("heading", { name: "Your learning journey", level: 2 })).toBeVisible();
  await expect(page.getByTestId("completed-path-card").getByRole("link", { name: "Review a stage" })).toHaveAttribute("href", "#stages");
});

test("completed overview with genuine review due shows one review-aware primary action, not a duplicate CTA", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(overview);
  await expect(page.getByTestId("completed-path-card")).toBeVisible();
  const primaryActions = page.getByRole("link", { name: "Start Review" });
  await expect(primaryActions).toHaveCount(1);
  await expect(primaryActions).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
  const journey = page.getByTestId("skill-learning-journey");
  await expect(journey.locator('[data-journey-kind="review"]')).toHaveAttribute("aria-current", "step");
  await expect(journey.locator('[data-journey-kind="review"]')).toContainText("Review 1 skill due");
  await expect(journey.locator('[data-journey-kind="stage"]').filter({ hasText: "Foundations" }).getByRole("link", { name: "Revisit" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("hub skill title has a visible resting underline and Current Path rows are affordant at rest", async ({ page }) => {
  await page.goto(hub);
  const title = page.getByTestId("working-context-hub").getByRole("link", { name: "Basic differentiation" });
  await expect(title).toHaveCSS("text-decoration-line", "underline");

  await page.goto(`/question/${QUESTION_IDS[0]}`);
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  const panel = page.getByTestId("working-context-desktop-panel");
  const notesRow = panel.getByRole("link", { name: /Notes/ });
  await expect(notesRow).toHaveCSS("background-color", "rgb(245, 244, 240)");
  const box = await notesRow.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const exitRow = panel.getByRole("link", { name: "Leave to Higher Maths" });
  await expect(exitRow).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("mobile Path shows the active rule only on the Current Path surface", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const noModelTab = page.getByRole("link", { name: "Path" });
  await expect(noModelTab).toHaveCSS("border-bottom-width", "0px");

  await page.goto(hub);
  const contextualButInactiveTab = page.getByTestId("working-context-trigger");
  await expect(contextualButInactiveTab).toHaveCSS("border-bottom-width", "0px");
  await expect(contextualButInactiveTab).not.toHaveAttribute("aria-current", "page");

  await page.goto(`/question/${QUESTION_IDS[0]}`);
  const activeTab = page.getByTestId("working-context-trigger");
  await expect(activeTab).toHaveCSS("border-bottom-width", "2px");
});

test("feedback control never intersects overview content at 1366x768, including at document end", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(
    QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, { hintViewedBeforeSubmission: index === 0 })),
  ));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(overview);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const dockBox = await page.locator('[data-global-report-dock]').boundingBox();
  const backLink = page.getByRole("link", { name: "Back to Higher Maths" });
  const backBox = await backLink.boundingBox();
  expect(dockBox && backBox && backBox.y + backBox.height <= dockBox.y).toBeTruthy();
});

test("scheduled Review exposes one contextual Practice Session entry and a recent completion stays calm", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(`/question/${QUESTION_IDS[7]}`);
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  const panel = page.getByTestId("working-context-desktop-panel");
  await expect(panel.getByRole("link", { name: "Review 1 skill due" })).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");
  await page.goto(hub);
  await expect(page.getByTestId("review-entry-card").getByRole("link", { name: "Start Review for 1 skill" })).toHaveAttribute("href", "/practice?review=1");

  await seedStoredProgress(page, v3Payload(recentCompletion()));
  await page.goto(`/question/${QUESTION_IDS[7]}`);
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  await expect(page.getByTestId("working-context-desktop-panel").getByText(/skill due/)).toHaveCount(0);
});

test("scheduled Review count and destination stay coherent across rail, hub and overview", async ({ page }) => {
  await seedStoredProgress(page, v3Payload(QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1))));
  await page.goto(`/question/${QUESTION_IDS[7]}`);
  await page.getByRole("button", { name: "Current Path: Basic differentiation" }).click();
  await expect(page.getByTestId("working-context-desktop-panel").getByRole("link", { name: "Review 1 skill due" })).toHaveAttribute("href", "/practice?review=1&path=basic-differentiation");

  await page.goto(hub);
  await expect(page.getByTestId("review-entry-card").getByRole("link", { name: "Start Review for 1 skill" })).toHaveAttribute("href", "/practice?review=1");

  await page.goto(overview);
  await expect(page.getByRole("link", { name: "Review 1 skill due" })).toBeVisible();
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
  await expect(page.getByTestId("dashboard-progress-summary").getByRole("link", { name: "Start learning" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);
});

test("mobile Current Path opens a trapped modal and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(hub);
  await page.getByTestId("working-context-hub").getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes\?path=basic-differentiation$/);
  await page.getByRole("link", { name: "Continue to Foundations" }).click();
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
  const unavailable = await page.goto("/subjects/higher-maths/calculus/differentiation/not-a-real-path");
  expect(unavailable?.status()).toBe(404);
});

function recentCompletion() {
  const start = Date.now() - 60_000;
  return QUESTION_IDS.map((id, index) => currentAttempt(id, index + 1, {
    attemptedAt: new Date(start + index * 1_000).toISOString(),
  }));
}
