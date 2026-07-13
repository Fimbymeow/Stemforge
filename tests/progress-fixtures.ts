import type { ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";

export const QUESTION_ID = "hm-calc-diff-basic-f-001";
export const PATH_ID = "basic-differentiation";
export const STAGE_ID = "basic-diff-stage-foundations";

export function attempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return {
    questionId: QUESTION_ID,
    skillPathId: PATH_ID,
    stageId: STAGE_ID,
    isCorrect: false,
    answer: "wrong",
    attemptedAt: "2026-07-12T10:00:00.000Z",
    sequence: 1,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: "attempt_test_1",
    ...overrides,
  };
}

export function supportEvent(overrides: Partial<QuestionSupportEvent> = {}): QuestionSupportEvent {
  return {
    questionId: QUESTION_ID,
    skillPathId: PATH_ID,
    stageId: STAGE_ID,
    type: "hint_viewed",
    occurredAt: "2026-07-12T10:01:00.000Z",
    sequence: 2,
    afterGenuineAttempt: true,
    versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: "support_test_1",
    ...overrides,
  };
}

export function evidence(attempts: QuestionAttempt[] = [], supportEvents: QuestionSupportEvent[] = []): ProgressEvidence {
  return { attempts, supportEvents, achievementSnapshots: [] };
}
