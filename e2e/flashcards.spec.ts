import { expect, test } from "./fixtures/test";
import { readStoredProgress } from "./fixtures/progress";

test("synthetic science proves the complete basic, typed, cloze and relearning loop", async ({ page }) => {
  await page.goto("/subjects/synthetic-science");
  await expect(page.getByRole("heading", { name: "Synthetic Science", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Flashcards" }).click();
  await expect(page).toHaveURL(/\/subjects\/synthetic-science\/flashcards$/);
  await expect(page.getByText("3 new", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Learn new cards" }).click();

  await expect(page.getByText("Card 1 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What is activation energy?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remembered" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(page.getByText("The minimum energy needed for a reaction to occur.")).toBeVisible();
  await page.getByRole("button", { name: "Forgot" }).click();
  await page.getByRole("button", { name: "Next card" }).click();

  await expect(page.getByRole("heading", { name: "What is the SI unit of force?" })).toBeVisible();
  await page.getByLabel("Your answer").fill("Newton.");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toContainText("Remembered");
  await page.getByRole("button", { name: "Next card" }).click();

  await expect(page.getByRole("heading", { name: "Complete the statement" })).toBeVisible();
  await expect(page.getByText(/site of aerobic respiration/)).toBeVisible();
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(page.getByText("mitochondrion", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remembered" }).click();
  await page.getByRole("button", { name: "Next card" }).click();

  await expect(page.getByText("Card 4 of 4", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What is activation energy?" })).toBeVisible();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: "Remembered" }).click();
  await page.getByRole("button", { name: "Next card" }).click();

  await expect(page.getByRole("heading", { name: "You're done for now." })).toBeVisible();
  await expect(page.getByText("3 cards reviewed", { exact: true })).toBeVisible();
  await expect(page.getByText("0 will come back sooner", { exact: true })).toBeVisible();

  const payload = await readStoredProgress(page) as { version: number; data: { flashcardReviews: Array<{ cardId: string; outcome: string; outcomeSource: string }> } };
  expect(payload.version).toBe(7);
  expect(payload.data.flashcardReviews).toHaveLength(4);
  expect(payload.data.flashcardReviews.filter((event) => event.cardId === "test-activation-energy").map((event) => event.outcome)).toEqual(["forgot", "remembered"]);
  expect(payload.data.flashcardReviews.find((event) => event.cardId === "test-si-force")?.outcomeSource).toBe("graded");

  await page.reload();
  await expect(page.getByText("Nothing due right now.")).toBeVisible();
  await page.goto("/activity");
  await expect(page.getByTestId("activity-history")).toBeVisible();
  await expect(page.getByRole("button", { name: /3 flashcards reviewed/i })).toBeVisible();
});

test("typed incorrect answers are graded Forgot without manual self-rating", async ({ page }) => {
  await page.goto("/subjects/synthetic-science/flashcards");
  await page.getByRole("button", { name: "Learn new cards" }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: "Remembered" }).click();
  await page.getByRole("button", { name: "Next card" }).click();
  await page.getByLabel("Your answer").fill("joule");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toContainText("Forgot");
  await expect(page.getByText("Accepted answer: newton")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remembered" })).toHaveCount(0);
});

test("Higher Maths remains free of Flashcards discovery and uses only its legacy redirect", async ({ page }) => {
  await page.goto("/subjects/higher-maths");
  await expect(page.getByRole("link", { name: "Flashcards" })).toHaveCount(0);
  await page.goto("/subjects/higher-maths/flashcards");
  await expect(page).toHaveURL(/\/subjects\/higher-maths\/revision-notes/);
  await expect(page.getByRole("heading", { name: "Flashcards" })).toHaveCount(0);
});
