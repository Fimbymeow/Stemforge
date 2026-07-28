import {
  MAX_PRACTICE_QUESTIONS,
  MAX_TIME_LIMIT_SECONDS,
  PRACTICE_SESSION_SCHEMA_VERSION,
  type PracticeQuestionReference,
  type PracticeSelectionMetadata,
  type PracticeSession,
  type PracticeSessionOrigin,
  type PracticeSessionStore,
} from "@/lib/practice/practice-types";
import { isReviewTargetAssignment } from "@/lib/review/validation";

const PRACTICE_MODES = ["targeted", "mixed", "needs_work", "retry_incorrect", "review"] as const;
const PRACTICE_STATUSES = ["active", "completed", "abandoned"] as const;
const PRACTICE_ORIGINS = [
  "question_bank_custom",
  "subject_review",
  "quick_practice",
  "configured_practice",
  "working_context_practice",
  "retry_incorrect",
  "retry_skipped",
  "scheduled_review",
] as const satisfies readonly PracticeSessionOrigin[];

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!isPracticeSessionBase(value, PRACTICE_SESSION_SCHEMA_VERSION)) return false;
  const session = value as PracticeSession;
  const questionIds = new Set(session.questionReferences.map((item) => item.questionId));
  return isOneOf(session.origin, PRACTICE_ORIGINS) &&
    isNonEmptyString(session.subjectId) &&
    session.questionReferences.every((reference) => reference.subjectId === session.subjectId) &&
    (session.parentSessionId === undefined || isNonEmptyString(session.parentSessionId)) &&
    isCanonicalQuestionIdArray(session.skippedQuestionIds, questionIds) &&
    (session.finalSkippedQuestionIds === undefined ||
      isCanonicalQuestionIdArray(session.finalSkippedQuestionIds, questionIds)) &&
    validReviewMetadata(session, questionIds);
}

export function isLegacyPracticeSession(value: unknown): value is Record<string, unknown> {
  return isPracticeSessionBase(value, 1);
}

export function isVersionTwoPracticeSession(value: unknown): value is Record<string, unknown> {
  return isPracticeSessionBase(value, 2);
}

export function isPracticeSessionStore(value: unknown): value is PracticeSessionStore {
  if (!value || typeof value !== "object") return false;
  const store = value as Partial<PracticeSessionStore>;
  return store.schemaVersion === PRACTICE_SESSION_SCHEMA_VERSION &&
    (store.activeSessionId === null || isNonEmptyString(store.activeSessionId)) &&
    Array.isArray(store.sessions) &&
    store.sessions.every(isPracticeSession);
}

export function serializePracticeSession(session: PracticeSession) {
  const stable: PracticeSession = {
    schemaVersion: session.schemaVersion,
    sessionId: session.sessionId,
    origin: session.origin,
    subjectId: session.subjectId,
    ...(session.parentSessionId === undefined ? {} : { parentSessionId: session.parentSessionId }),
    mode: session.mode,
    courseId: session.courseId,
    selectedPathIds: [...session.selectedPathIds].sort(),
    questionReferences: session.questionReferences.map((reference) => ({ ...reference })),
    currentQuestionIndex: session.currentQuestionIndex,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt,
    status: session.status,
    timing: session.timing.type === "timed" ? { ...session.timing } : { type: "untimed" },
    selectionMetadata: {
      ...session.selectionMetadata,
      excludedByReason: Object.fromEntries(Object.entries(session.selectionMetadata.excludedByReason).sort(([left], [right]) => left.localeCompare(right))),
      includedPathIds: [...session.selectionMetadata.includedPathIds].sort(),
    },
    skippedQuestionIds: [...session.skippedQuestionIds],
    ...(session.finalSkippedQuestionIds === undefined ? {} : {
      finalSkippedQuestionIds: [...session.finalSkippedQuestionIds],
    }),
    ...(session.reviewTargets === undefined ? {} : {
      reviewTargets: session.reviewTargets.map((assignment) => ({
        target: { ...assignment.target },
        questionIds: [...assignment.questionIds],
      })),
    }),
  };
  return JSON.stringify(stable);
}

function validReviewMetadata(session: PracticeSession, questionIds: ReadonlySet<string>) {
  if (session.mode !== "review") {
    return session.origin !== "scheduled_review" && session.reviewTargets === undefined;
  }
  if (session.origin !== "scheduled_review" ||
      !Array.isArray(session.reviewTargets) ||
      session.reviewTargets.length < 1 ||
      session.questionReferences.length > 12) return false;
  const targets = new Set<string>();
  const assigned = new Set<string>();
  for (const assignment of session.reviewTargets) {
    if (!isReviewTargetAssignment(assignment) ||
        targets.has(assignment.target.targetId) ||
        assignment.questionIds.some((questionId) =>
          !questionIds.has(questionId) || assigned.has(questionId))) return false;
    targets.add(assignment.target.targetId);
    assignment.questionIds.forEach((questionId) => assigned.add(questionId));
  }
  return assigned.size === questionIds.size &&
    session.reviewTargets.every((assignment) =>
      assignment.questionIds.every((questionId) =>
        session.questionReferences.some((reference) =>
          reference.questionId === questionId && reference.pathId === assignment.target.targetId)));
}

function isPracticeSessionBase(value: unknown, schemaVersion: number) {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<PracticeSession> & { schemaVersion?: unknown };
  return session.schemaVersion === schemaVersion &&
    isNonEmptyString(session.sessionId) &&
    isOneOf(session.mode, PRACTICE_MODES) &&
    isNonEmptyString(session.courseId) &&
    Array.isArray(session.selectedPathIds) &&
    session.selectedPathIds.every(isNonEmptyString) &&
    Array.isArray(session.questionReferences) &&
    session.questionReferences.length > 0 &&
    session.questionReferences.length <= MAX_PRACTICE_QUESTIONS &&
    session.questionReferences.every(isPracticeQuestionReference) &&
    new Set(session.questionReferences.map((item) => item.questionId)).size === session.questionReferences.length &&
    typeof session.currentQuestionIndex === "number" &&
    Number.isInteger(session.currentQuestionIndex) &&
    session.currentQuestionIndex >= 0 &&
    session.currentQuestionIndex < session.questionReferences.length &&
    isTimestamp(session.startedAt) &&
    isTimestamp(session.updatedAt) &&
    (session.completedAt === null || isTimestamp(session.completedAt)) &&
    isOneOf(session.status, PRACTICE_STATUSES) &&
    isPracticeTiming(session.timing) &&
    isSelectionMetadata(session.selectionMetadata, session.questionReferences.length);
}

function isPracticeQuestionReference(value: unknown): value is PracticeQuestionReference {
  if (!value || typeof value !== "object") return false;
  const reference = value as Partial<PracticeQuestionReference>;
  return isNonEmptyString(reference.subjectId) &&
    isNonEmptyString(reference.courseId) &&
    isNonEmptyString(reference.pathId) &&
    isNonEmptyString(reference.stageId) &&
    isNonEmptyString(reference.questionId) &&
    typeof reference.questionVersion === "number" &&
    Number.isInteger(reference.questionVersion) &&
    reference.questionVersion > 0 &&
    typeof reference.contentRevision === "number" &&
    Number.isInteger(reference.contentRevision) &&
    reference.contentRevision > 0;
}

function isSelectionMetadata(value: unknown, questionCount: number): value is PracticeSelectionMetadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Partial<PracticeSelectionMetadata>;
  return isNonEmptyString(metadata.seed) &&
    isBoundedCount(metadata.requestedCount, 1) &&
    isNonNegativeInteger(metadata.availableCount) &&
    metadata.availableCount >= questionCount &&
    metadata.selectedCount === questionCount &&
    typeof metadata.fullySatisfied === "boolean" &&
    (metadata.shortageReason === null || typeof metadata.shortageReason === "string") &&
    isCountRecord(metadata.excludedByReason) &&
    Array.isArray(metadata.includedPathIds) &&
    metadata.includedPathIds.every(isNonEmptyString) &&
    isTimestamp(metadata.createdAt);
}

function isPracticeTiming(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const timing = value as { type?: string; timeLimitSeconds?: unknown; elapsedSeconds?: unknown };
  if (timing.type === "untimed") return true;
  return timing.type === "timed" &&
    typeof timing.timeLimitSeconds === "number" &&
    Number.isInteger(timing.timeLimitSeconds) &&
    timing.timeLimitSeconds > 0 &&
    timing.timeLimitSeconds <= MAX_TIME_LIMIT_SECONDS &&
    typeof timing.elapsedSeconds === "number" &&
    Number.isInteger(timing.elapsedSeconds) &&
    timing.elapsedSeconds >= 0 &&
    timing.elapsedSeconds <= timing.timeLimitSeconds;
}

function isCanonicalQuestionIdArray(value: unknown, sessionQuestionIds: ReadonlySet<string>) {
  return Array.isArray(value) &&
    value.every(isNonEmptyString) &&
    new Set(value).size === value.length &&
    value.every((questionId) => sessionQuestionIds.has(questionId));
}

function isCountRecord(value: unknown) {
  return Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value as Record<string, unknown>).every((count) =>
      typeof count === "number" && Number.isInteger(count) && count >= 0);
}

function isBoundedCount(value: unknown, minimum: number): value is number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= MAX_PRACTICE_QUESTIONS;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}
