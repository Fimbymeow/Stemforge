import {
  MAX_PRACTICE_QUESTIONS,
  MAX_TIME_LIMIT_SECONDS,
  PRACTICE_SESSION_SCHEMA_VERSION,
  type PracticeQuestionReference,
  type PracticeSession,
  type PracticeSessionStore,
} from "@/lib/practice/practice-types";

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<PracticeSession>;
  return session.schemaVersion === PRACTICE_SESSION_SCHEMA_VERSION &&
    typeof session.sessionId === "string" &&
    ["targeted", "mixed", "needs_work", "retry_incorrect"].includes(session.mode ?? "") &&
    typeof session.courseId === "string" &&
    Array.isArray(session.selectedPathIds) &&
    session.selectedPathIds.every((id) => typeof id === "string") &&
    Array.isArray(session.questionReferences) &&
    session.questionReferences.length > 0 &&
    session.questionReferences.length <= MAX_PRACTICE_QUESTIONS &&
    session.questionReferences.every(isPracticeQuestionReference) &&
    new Set(session.questionReferences.map((item) => item.questionId)).size === session.questionReferences.length &&
    typeof session.currentQuestionIndex === "number" &&
    Number.isInteger(session.currentQuestionIndex) &&
    session.currentQuestionIndex >= 0 &&
    session.currentQuestionIndex < session.questionReferences.length &&
    typeof session.startedAt === "string" &&
    typeof session.updatedAt === "string" &&
    (session.completedAt === null || typeof session.completedAt === "string") &&
    ["active", "completed", "abandoned"].includes(session.status ?? "") &&
    isPracticeTiming(session.timing);
}

export function isPracticeSessionStore(value: unknown): value is PracticeSessionStore {
  if (!value || typeof value !== "object") return false;
  const store = value as Partial<PracticeSessionStore>;
  return store.schemaVersion === 1 &&
    (store.activeSessionId === null || typeof store.activeSessionId === "string") &&
    Array.isArray(store.sessions) &&
    store.sessions.every(isPracticeSession);
}

export function serializePracticeSession(session: PracticeSession) {
  const stable: PracticeSession = {
    schemaVersion: session.schemaVersion,
    sessionId: session.sessionId,
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
  };
  return JSON.stringify(stable);
}

function isPracticeQuestionReference(value: unknown): value is PracticeQuestionReference {
  if (!value || typeof value !== "object") return false;
  const reference = value as Partial<PracticeQuestionReference>;
  return typeof reference.subjectId === "string" &&
    typeof reference.courseId === "string" &&
    typeof reference.pathId === "string" &&
    typeof reference.stageId === "string" &&
    typeof reference.questionId === "string" &&
    typeof reference.questionVersion === "number" &&
    Number.isInteger(reference.questionVersion) &&
    reference.questionVersion > 0 &&
    typeof reference.contentRevision === "number" &&
    Number.isInteger(reference.contentRevision) &&
    reference.contentRevision > 0;
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
    timing.elapsedSeconds >= 0;
}
