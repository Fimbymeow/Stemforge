import type { Page } from "@playwright/test";
import type {
  LegacyQuestionAttempt,
  ProgressPayload,
  ProgressPayloadV1,
  ProgressPayloadV2,
  ProgressPayloadV3,
  QuestionAttempt,
  QuestionSupportEvent,
} from "../../lib/progress/types";

export const STORAGE_KEY = "stemforge.localProgress.v1";
export const CELEBRATION_STORAGE_KEY = "stemforge.pathCelebration.v1";
export const STAGE_CELEBRATION_STORAGE_KEY = "stemforge.stageCelebration.v1";
export const PATH_ID = "basic-differentiation";
export const FOUNDATION_STAGE_ID = "basic-diff-stage-foundations";
export const APPLICATION_STAGE_ID = "basic-diff-stage-applications";
export const PPQ_STAGE_ID = "basic-diff-stage-past-paper-style";
export const QUESTION_IDS = [
  "hm-calc-diff-basic-f-001",
  "hm-calc-diff-basic-f-002",
  "hm-calc-diff-basic-f-003",
  "hm-calc-diff-basic-a-001",
  "hm-calc-diff-basic-a-002",
  "hm-calc-diff-basic-a-003",
  "hm-calc-diff-basic-ppq-001",
  "hm-calc-diff-basic-ppq-002",
] as const;

export const QUESTION_ANSWERS: Record<(typeof QUESTION_IDS)[number], string> = {
  "hm-calc-diff-basic-f-001": "5x^4",
  "hm-calc-diff-basic-f-002": "12x^3-4x",
  "hm-calc-diff-basic-f-003": "14",
  "hm-calc-diff-basic-a-001": "4",
  "hm-calc-diff-basic-a-002": "29",
  "hm-calc-diff-basic-a-003": "3",
  "hm-calc-diff-basic-ppq-001": "8",
  "hm-calc-diff-basic-ppq-002": "2",
};

export function stageForQuestion(questionId: string) {
  if (questionId.includes("-ppq-")) return PPQ_STAGE_ID;
  if (questionId.includes("-a-")) return APPLICATION_STAGE_ID;
  return FOUNDATION_STAGE_ID;
}

export function currentAttempt(
  questionId: string,
  sequence: number,
  overrides: Partial<QuestionAttempt> = {},
): QuestionAttempt {
  return {
    questionId,
    skillPathId: PATH_ID,
    stageId: stageForQuestion(questionId),
    isCorrect: true,
    answer: QUESTION_ANSWERS[questionId as keyof typeof QUESTION_ANSWERS] ?? "correct",
    attemptedAt: `2026-07-12T10:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: `attempt_e2e_${sequence}`,
    ...overrides,
  };
}

export function supportEvent(
  questionId: string,
  sequence: number,
  type: QuestionSupportEvent["type"],
  overrides: Partial<QuestionSupportEvent> = {},
): QuestionSupportEvent {
  return {
    questionId,
    skillPathId: PATH_ID,
    stageId: stageForQuestion(questionId),
    type,
    occurredAt: `2026-07-12T11:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    afterGenuineAttempt: type === "solution_viewed",
    versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: `support_e2e_${sequence}`,
    ...overrides,
  };
}

export function v3Payload(
  attempts: QuestionAttempt[] = [],
  supportEvents: QuestionSupportEvent[] = [],
): ProgressPayloadV3 {
  return {
    version: 3,
    data: {
      attempts: attempts.map(({ eventId: _eventId, ...item }) => item),
      supportEvents: supportEvents.map(({ eventId: _eventId, ...item }) => item),
    },
  };
}

export function v2Payload(
  attempts: QuestionAttempt[] = [],
  supportEvents: QuestionSupportEvent[] = [],
): ProgressPayloadV2 {
  return {
    version: 2,
    data: {
      attempts: attempts.map(({ versionEvidence: _versionEvidence, ...attempt }) => attempt),
      supportEvents: supportEvents.map(({ versionEvidence: _versionEvidence, ...event }) => event),
    },
  };
}

export function legacyAttempt(overrides: Partial<LegacyQuestionAttempt> = {}): LegacyQuestionAttempt {
  return {
    questionId: QUESTION_IDS[0],
    skillPathId: PATH_ID,
    stageId: FOUNDATION_STAGE_ID,
    isCorrect: true,
    answer: QUESTION_ANSWERS[QUESTION_IDS[0]],
    attemptedAt: "2026-07-11T10:00:00.000Z",
    ...overrides,
  };
}

export function v1Payload(attempts: LegacyQuestionAttempt[]): ProgressPayloadV1 {
  return { version: 1, data: { attempts } };
}

export async function seedStoredProgress(page: Page, value: unknown) {
  await page.goto("/");
  await page.evaluate(
    ({ key, stored }) => window.localStorage.setItem(key, stored),
    { key: STORAGE_KEY, stored: typeof value === "string" ? value : JSON.stringify(value) },
  );
}

export async function readStoredProgress(page: Page): Promise<unknown> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }, STORAGE_KEY);
}

export async function seedStoredCelebrations(page: Page, value: unknown) {
  await page.goto("/");
  await page.evaluate(
    ({ key, stored }) => window.localStorage.setItem(key, stored),
    { key: CELEBRATION_STORAGE_KEY, stored: typeof value === "string" ? value : JSON.stringify(value) },
  );
}

export async function readStoredCelebrations(page: Page): Promise<unknown> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }, CELEBRATION_STORAGE_KEY);
}
