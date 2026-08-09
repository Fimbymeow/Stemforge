export const FLASHCARD_CONTENT_VERSION = 1 as const;

type FlashcardBase = {
  id: string;
  version: number;
  skillPathId: string;
  resourceHref?: string;
  curriculumReference?: string;
};

export type BasicFlashcard = FlashcardBase & {
  type: "basic";
  front: string;
  back: string;
};

export type TypedFlashcard = FlashcardBase & {
  type: "typed";
  front: string;
  acceptedAnswers: readonly string[];
};

export type ClozeFlashcard = FlashcardBase & {
  type: "cloze";
  textBefore: string;
  answer: string;
  textAfter: string;
};

export type Flashcard = BasicFlashcard | TypedFlashcard | ClozeFlashcard;

export type FlashcardOutcome = "remembered" | "forgot";
export type FlashcardOutcomeSource = "self_rated" | "graded";
export type FlashcardStage = "relearning" | 0 | 1 | 2 | 3 | 4 | 5;

export type FlashcardReviewEvent = {
  eventId: string;
  cardId: string;
  cardVersion: number;
  outcome: FlashcardOutcome;
  outcomeSource: FlashcardOutcomeSource;
  occurredAt: string;
  sequence: number;
  schedulerVersion: number;
};

export type FlashcardDueState = {
  cardId: string;
  cardVersion: number;
  status: "unseen" | "relearning" | "review";
  stage: FlashcardStage | null;
  lastReviewedAt: string | null;
  nextDueAt: string | null;
  due: boolean;
  sameSessionRequeue: boolean;
  schedulerVersion: number;
  appliedEventIds: string[];
  ignoredEventIds: string[];
};
