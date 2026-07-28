import type {
  ReviewEvent,
  ReviewEvidenceRef,
  ReviewOutcome,
  ReviewStage,
  ReviewTargetAssignment,
  ReviewTargetRef,
} from "@/lib/review/types";

export const MAX_REVIEW_SESSION_QUESTIONS = 12;
export const MAX_REVIEW_EVIDENCE_REFS = 64;
export const SAFE_REVIEW_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

const REVIEW_OUTCOMES = new Set<ReviewOutcome>([
  "independent_success",
  "hint_assisted",
  "solution_assisted",
  "incorrect",
]);
const REVIEW_STAGES = new Set<ReviewStage>(["recovery", "relearning", 0, 1, 2, 3, 4, 5]);

export function isReviewTargetRef(value: unknown): value is ReviewTargetRef {
  return exactObject(value, ["targetType", "targetId"]) &&
    value.targetType === "skill" &&
    safeId(value.targetId);
}

export function isReviewTargetAssignment(value: unknown): value is ReviewTargetAssignment {
  if (!exactObject(value, ["target", "questionIds"]) ||
      !isReviewTargetRef(value.target) ||
      !Array.isArray(value.questionIds) ||
      value.questionIds.length < 1 ||
      value.questionIds.length > MAX_REVIEW_SESSION_QUESTIONS ||
      !value.questionIds.every(safeId)) return false;
  return new Set(value.questionIds).size === value.questionIds.length;
}

export function isReviewEvent(value: unknown, exactKeys = false): value is ReviewEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ReviewEvent>;
  if (exactKeys && !hasExactKeys(event, [
    "eventId", "source", "target", "targetVersion", "outcome", "occurredAt", "sequence",
    "priorEventId", "schedulerVersion", "stageAfter", "evidenceRefs", "questionIds",
  ])) return false;
  return safeId(event.eventId) &&
    exactObject(event.source, ["sourceType", "sourceId"]) &&
    event.source.sourceType === "practice_session" &&
    safeId(event.source.sourceId) &&
    isReviewTargetRef(event.target) &&
    exactObject(event.targetVersion, ["versionType", "version"]) &&
    event.targetVersion.versionType === "skill_path" &&
    Number.isInteger(event.targetVersion.version) &&
    (event.targetVersion.version as number) > 0 &&
    REVIEW_OUTCOMES.has(event.outcome as ReviewOutcome) &&
    isCanonicalTimestamp(event.occurredAt) &&
    Number.isInteger(event.sequence) &&
    (event.sequence as number) >= 0 &&
    (event.priorEventId === null || safeId(event.priorEventId)) &&
    event.priorEventId !== event.eventId &&
    Number.isInteger(event.schedulerVersion) &&
    (event.schedulerVersion as number) > 0 &&
    REVIEW_STAGES.has(event.stageAfter as ReviewStage) &&
    Array.isArray(event.evidenceRefs) &&
    event.evidenceRefs.length <= MAX_REVIEW_EVIDENCE_REFS &&
    event.evidenceRefs.every((reference) => isReviewEvidenceRef(reference, exactKeys)) &&
    canonicalEvidenceRefs(event.evidenceRefs).length === event.evidenceRefs.length &&
    canonicalEvidenceRefs(event.evidenceRefs).every((reference, index) =>
      sameEvidenceRef(reference, event.evidenceRefs![index])) &&
    Array.isArray(event.questionIds) &&
    event.questionIds.length >= 1 &&
    event.questionIds.length <= MAX_REVIEW_SESSION_QUESTIONS &&
    event.questionIds.every(safeId) &&
    new Set(event.questionIds).size === event.questionIds.length;
}

export function isReviewEvidenceRef(value: unknown, exactKeys = false): value is ReviewEvidenceRef {
  if (!value || typeof value !== "object") return false;
  const reference = value as Partial<ReviewEvidenceRef>;
  if (exactKeys && !hasExactKeys(reference, ["evidenceKind", "eventId"])) return false;
  return (reference.evidenceKind === "attempt" || reference.evidenceKind === "support_event") &&
    safeId(reference.eventId);
}

export function canonicalEvidenceRefs(references: readonly ReviewEvidenceRef[]) {
  const unique = new Map<string, ReviewEvidenceRef>();
  for (const reference of references) {
    unique.set(`${reference.evidenceKind}:${reference.eventId}`, { ...reference });
  }
  return [...unique.values()].sort((left, right) =>
    left.evidenceKind.localeCompare(right.evidenceKind) || left.eventId.localeCompare(right.eventId));
}

export function safeId(value: unknown): value is string {
  return typeof value === "string" && SAFE_REVIEW_ID.test(value);
}

export function isCanonicalTimestamp(value: unknown): value is string {
  return typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

export function hasExactKeys(value: object, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && hasExactKeys(value as object, keys);
}

function sameEvidenceRef(left: ReviewEvidenceRef, right: ReviewEvidenceRef) {
  return left.evidenceKind === right.evidenceKind && left.eventId === right.eventId;
}
