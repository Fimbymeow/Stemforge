import type { Flashcard, FlashcardReviewEvent } from "@/lib/flashcards/types";

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const MAX_CONTENT_LENGTH = 10_000;
const MAX_ACCEPTED_ANSWERS = 32;

export function isFlashcard(value: unknown): value is Flashcard {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const card = value as Partial<Flashcard>;
  const common = safeId(card.id) && Number.isInteger(card.version) && (card.version as number) > 0 &&
    safeId(card.skillPathId) && optionalBoundedText(card.resourceHref) && optionalBoundedText(card.curriculumReference);
  if (!common) return false;
  if (card.type === "basic") return boundedText(card.front) && boundedText(card.back);
  if (card.type === "typed") {
    return boundedText(card.front) && Array.isArray(card.acceptedAnswers) && card.acceptedAnswers.length > 0 &&
      card.acceptedAnswers.length <= MAX_ACCEPTED_ANSWERS && card.acceptedAnswers.every(boundedText);
  }
  return card.type === "cloze" && boundedText(card.textBefore) && boundedText(card.answer) && boundedText(card.textAfter);
}

export function isFlashcardReviewEvent(value: unknown, exactKeys = false): value is FlashcardReviewEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Partial<FlashcardReviewEvent>;
  if (exactKeys && !hasExactKeys(event, [
    "eventId", "cardId", "cardVersion", "outcome", "outcomeSource", "occurredAt", "sequence", "schedulerVersion",
  ])) return false;
  return safeId(event.eventId) && safeId(event.cardId) && Number.isInteger(event.cardVersion) && (event.cardVersion as number) > 0 &&
    (event.outcome === "remembered" || event.outcome === "forgot") &&
    (event.outcomeSource === "self_rated" || event.outcomeSource === "graded") &&
    isCanonicalTimestamp(event.occurredAt) && Number.isInteger(event.sequence) && (event.sequence as number) >= 0 &&
    Number.isInteger(event.schedulerVersion) && (event.schedulerVersion as number) > 0;
}

function safeId(value: unknown): value is string { return typeof value === "string" && SAFE_ID.test(value); }
function boundedText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_CONTENT_LENGTH; }
function optionalBoundedText(value: unknown) { return value === undefined || boundedText(value); }
function isCanonicalTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function hasExactKeys(value: object, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
