import { contentResolver } from "../lib/content-resolver";
import { PRACTICE_SESSIONS_STORAGE_KEY } from "../lib/practice/practice-types";
import type { ProgressPayload, QuestionAttempt } from "../lib/progress/types";
import { expect, test } from "./fixtures/test";
import {
  currentAttempt,
  QUESTION_IDS,
  QUESTION_VERSIONS,
  seedStoredProgress,
} from "./fixtures/progress";
import {
  expectNoHorizontalOverflow,
  openQuestion,
  openWorkedSolution,
  retryAnswer,
  submitAnswer,
} from "./fixtures/student-actions";

const MISTAKES_HREF = "/subjects/higher-maths/mistakes";
const BASIC_SKILL_HREF = "/subjects/higher-maths/calculus/differentiation/basic-differentiation";
const CHAIN_IDS = contentResolver.getPathQuestions("chain-rule").slice(0, 2).map((question) => question.id);

test("fresh learner sees a calm empty Mistake Log", async ({ page }) => {
  await page.goto(MISTAKES_HREF);
  await expect(page.getByRole("heading", { level: 1, name: "Mistake Log" })).toBeVisible();
  await expect(page.getByTestId("mistake-log-empty-state")).toContainText("No unresolved mistakes right now");
  await expect(page.getByTestId("mistake-item")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Practise .* mistakes/ })).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-mistakes-link")).toHaveCount(0);
});

test("a real Basic Differentiation error appears automatically across bounded discovery surfaces", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");

  await page.goto(MISTAKES_HREF);
  const item = page.getByTestId("mistake-item");
  await expect(item).toHaveCount(1);
  await expect(item).toHaveAttribute("data-mistake-state", "open");
  await expect(item).toContainText("Differentiate a power");
  await expect(item.getByRole("link", { name: "Retry Basic differentiation question 1" })).toHaveAttribute("href", `/question/${QUESTION_IDS[0]}`);

  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-mistakes-link")).toHaveText(/1 unresolved mistake/);
  await page.goto(BASIC_SKILL_HREF);
  await expect(page.getByTestId("skill-mistakes-link")).toHaveText("1 unresolved mistake");
});

test("solution-assisted correctness leaves the mistake unresolved", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");
  await openWorkedSolution(page);
  await page.reload();
  await submitAnswer(page, "5x^4");
  await page.goto(MISTAKES_HREF);
  await expect(page.getByTestId("mistake-item")).toHaveAttribute("data-mistake-state", "open");
});

test("later independent success moves a mistake into resolved history", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");
  await retryAnswer(page, "5x^4");
  await page.goto(MISTAKES_HREF);
  await expect(page.getByTestId("mistake-log-empty-state")).toBeVisible();
  const history = page.getByTestId("mistake-history-disclosure");
  await history.getByText(/Show resolved/).click();
  await expect(history.getByTestId("mistake-item")).toHaveAttribute("data-mistake-state", "resolved");
  await expect(history.getByTestId("mistake-item")).toContainText("Resolved independently");
});

test("a later real error reopens a resolved mistake", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");
  await retryAnswer(page, "5x^4");
  await page.reload();
  await submitAnswer(page, "4x^5");
  await page.goto(MISTAKES_HREF);
  const item = page.getByTestId("mistake-item");
  await expect(item).toHaveAttribute("data-mistake-state", "open");
  await expect(item).toContainText("Reopened after a later incorrect attempt");
});

test("two Chain Rule errors remain two questions in one skill group", async ({ page }) => {
  await seedStoredProgress(page, payload(CHAIN_IDS.map((questionId, index) => canonicalAttempt(questionId, index + 1, false))));
  await page.goto(MISTAKES_HREF);
  const group = page.getByTestId("mistake-skill-group");
  await expect(group).toHaveCount(1);
  await expect(group).toHaveAttribute("data-skill-path-id", "chain-rule");
  await expect(group.getByTestId("mistake-item")).toHaveCount(2);
  await expect(group).toContainText("2 unresolved questions");
  await group.getByRole("button", { name: "Practise Chain rule mistakes" }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const session = await readActiveSession(page);
  expect(session.mode).toBe("retry_incorrect");
  expect(session.origin).toBe("retry_incorrect");
  expect(session.questionIds).toEqual(expect.arrayContaining(CHAIN_IDS));
  expect(session.questionIds).toHaveLength(2);
  expect(new Set(session.pathIds)).toEqual(new Set(["chain-rule"]));
});

test("Practice setup exposes one grouped Retry mistakes mode only while a mistake is open", async ({ page }) => {
  await page.goto("/practice?path=basic-differentiation");
  await page.getByText("Choose practice options", { exact: true }).click();
  await expect(page.getByRole("button", { name: /Retry mistakes/ })).toHaveCount(0);

  await seedStoredProgress(page, payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong" }),
    currentAttempt(QUESTION_IDS[0], 2, { isCorrect: false, answer: "wrong again" }),
  ]));
  await page.goto("/practice?path=basic-differentiation");
  await page.getByText("Choose practice options", { exact: true }).click();
  const retryMode = page.getByRole("button", { name: /Retry mistakes/ });
  await expect(retryMode).toContainText("1 unresolved mistake");
  await retryMode.click();
  await page.getByRole("button", { name: "Start mistake practice" }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  expect((await readActiveSession(page)).questionIds).toEqual([QUESTION_IDS[0]]);
});

test("solution-assisted success in remediation remains open and independently correct work resolves it", async ({ page }) => {
  await openQuestion(page, QUESTION_IDS[0]);
  await submitAnswer(page, "4x^5");
  await page.goto(MISTAKES_HREF);
  await page.getByRole("button", { name: "Practise Basic differentiation mistakes" }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  await openWorkedSolution(page);
  await page.reload();
  await submitAnswer(page, "5x^4");
  await page.goto(MISTAKES_HREF);
  await expect(page.getByTestId("mistake-item")).toHaveAttribute("data-mistake-state", "open");
  await expect(page.getByRole("button", { name: "Practise Basic differentiation mistakes" })).toBeVisible();

  await page.getByRole("link", { name: "Retry Basic differentiation question 1" }).click();
  await submitAnswer(page, "5x^4");
  await page.goto(MISTAKES_HREF);
  await expect(page.getByTestId("mistake-log-empty-state")).toBeVisible();
  await expect(page.getByRole("button", { name: /Practise .* mistakes/ })).toHaveCount(0);
});

test("Basic-scoped remediation excludes an open Chain Rule mistake", async ({ page }) => {
  await seedStoredProgress(page, payload([
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong" }),
    canonicalAttempt(CHAIN_IDS[0], 2, false),
  ]));
  await page.goto(MISTAKES_HREF);
  await page.getByRole("button", { name: "Practise Basic differentiation mistakes" }).click();
  await expect(page).toHaveURL(/\/practice\/session\//);
  const session = await readActiveSession(page);
  expect(session.questionIds).toEqual([QUESTION_IDS[0]]);
  expect(session.pathIds).toEqual(["basic-differentiation"]);
});

test("Basic and Chain mistakes are separated by skill and remain clean at 375px and 320px", async ({ page }) => {
  const attempts = [
    currentAttempt(QUESTION_IDS[0], 1, { isCorrect: false, answer: "wrong" }),
    canonicalAttempt(CHAIN_IDS[0], 2, false),
  ];
  await seedStoredProgress(page, payload(attempts));
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(MISTAKES_HREF);
    await expect(page.getByTestId("mistake-skill-group")).toHaveCount(2);
    await expect(page.getByRole("link", { name: /^Retry / })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /Practise .* mistakes/ })).toHaveCount(2);
    await expectNoHorizontalOverflow(page);
  }
});

test("an older question-version error stays history and does not appear unresolved", async ({ page }) => {
  const oldVersion = currentAttempt(QUESTION_IDS[1], 1, {
    isCorrect: false,
    answer: "wrong",
    versionEvidence: { kind: "known", questionVersion: QUESTION_VERSIONS[QUESTION_IDS[1]] - 1 },
  });
  await seedStoredProgress(page, payload([oldVersion]));
  await page.goto(MISTAKES_HREF);
  await expect(page.getByTestId("mistake-log-empty-state")).toBeVisible();
  await page.getByTestId("mistake-history-disclosure").getByText(/Show resolved/).click();
  const item = page.getByTestId("mistake-item");
  await expect(item).toHaveAttribute("data-mistake-state", "historical");
  await expect(item).toContainText("Previous version");
  await expect(page.getByRole("button", { name: /Practise .* mistakes/ })).toHaveCount(0);
});

test("malformed evidence cannot substitute an unavailable or different skill", async ({ page }) => {
  const malformed = currentAttempt(QUESTION_IDS[0], 1, {
    isCorrect: false,
    answer: "wrong",
    skillPathId: "trigonometric-differentiation",
    stageId: "invented-stage",
  });
  await seedStoredProgress(page, payload([malformed]));
  await page.goto(MISTAKES_HREF);
  await expect(page.getByTestId("mistake-log-empty-state")).toBeVisible();
  await expect(page.getByTestId("mistake-item")).toHaveCount(0);
});

function payload(attempts: QuestionAttempt[]): ProgressPayload {
  return {
    version: 6,
    data: { attempts, supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] },
  };
}

function canonicalAttempt(questionId: string, sequence: number, isCorrect: boolean): QuestionAttempt {
  const context = contentResolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    isCorrect,
    answer: isCorrect ? context.question.correctAnswer : "wrong",
    attemptedAt: `2026-08-02T10:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    eventId: `attempt_mistake_e2e_${questionId}_${sequence}`,
  };
}

async function readActiveSession(page: import("@playwright/test").Page) {
  return page.evaluate((key) => {
    const store = JSON.parse(localStorage.getItem(key)!);
    const session = store.sessions.find((item: { sessionId: string }) => item.sessionId === store.activeSessionId);
    return {
      mode: session.mode as string,
      origin: session.origin as string,
      questionIds: session.questionReferences.map((reference: { questionId: string }) => reference.questionId) as string[],
      pathIds: session.questionReferences.map((reference: { pathId: string }) => reference.pathId) as string[],
    };
  }, PRACTICE_SESSIONS_STORAGE_KEY);
}
