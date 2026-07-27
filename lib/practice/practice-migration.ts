import {
  PRACTICE_SESSION_SCHEMA_VERSION,
  type PracticeSession,
  type PracticeSessionOrigin,
} from "@/lib/practice/practice-types";
import {
  repairPracticeSessionStore,
  type PracticeSessionRepairIssue,
  type PracticeSessionRepairResult,
  type PracticeSessionStoreCandidate,
} from "@/lib/practice/practice-repair";
import { isLegacyPracticeSession } from "@/lib/practice/practice-validation";

type LegacyPracticeSession = Omit<
  PracticeSession,
  | "schemaVersion"
  | "origin"
  | "subjectId"
  | "parentSessionId"
  | "skippedQuestionIds"
  | "finalSkippedQuestionIds"
> & { schemaVersion: 1 };

export function decodePracticeSessionStore(value: unknown): PracticeSessionRepairResult | null {
  if (!isStoreEnvelope(value)) return null;
  if (value.schemaVersion === PRACTICE_SESSION_SCHEMA_VERSION) {
    return repairPracticeSessionStore(value as PracticeSessionStoreCandidate);
  }
  if (value.schemaVersion !== 1) return null;

  const migrationIssues: PracticeSessionRepairIssue[] = [{ code: "legacy_store_migrated" }];
  const migratedSessions: unknown[] = value.sessions.map((entry, index) => {
    if (!isLegacyPracticeSession(entry)) {
      migrationIssues.push({
        code: "invalid_session_dropped",
        sessionId: readSessionId(entry),
        index,
      });
      return null;
    }
    const migrated = migrateLegacyPracticeSession(entry);
    if (!migrated) {
      migrationIssues.push({
        code: "invalid_session_dropped",
        sessionId: readSessionId(entry),
        index,
      });
    }
    return migrated;
  }).filter((entry): entry is PracticeSession => entry !== null);

  const repaired = repairPracticeSessionStore({
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    activeSessionId: value.activeSessionId,
    sessions: migratedSessions,
  });
  return {
    store: repaired.store,
    changed: true,
    issues: [...migrationIssues, ...repaired.issues],
  };
}

export function migrateLegacyPracticeSession(value: unknown): PracticeSession | null {
  if (!isLegacyPracticeSession(value)) return null;
  const legacy = value as LegacyPracticeSession;
  const subjectIds = [...new Set(legacy.questionReferences.map((reference) => reference.subjectId))];
  if (subjectIds.length !== 1) return null;
  return {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    sessionId: legacy.sessionId,
    origin: inferLegacyOrigin(legacy),
    subjectId: subjectIds[0],
    mode: legacy.mode,
    courseId: legacy.courseId,
    selectedPathIds: [...legacy.selectedPathIds],
    questionReferences: legacy.questionReferences.map((reference) => ({ ...reference })),
    currentQuestionIndex: legacy.currentQuestionIndex,
    startedAt: legacy.startedAt,
    updatedAt: legacy.updatedAt,
    completedAt: legacy.completedAt,
    status: legacy.status,
    timing: legacy.timing.type === "timed" ? { ...legacy.timing } : { type: "untimed" },
    selectionMetadata: {
      ...legacy.selectionMetadata,
      excludedByReason: { ...legacy.selectionMetadata.excludedByReason },
      includedPathIds: [...legacy.selectionMetadata.includedPathIds],
    },
    skippedQuestionIds: [],
  };
}

function inferLegacyOrigin(legacy: LegacyPracticeSession): PracticeSessionOrigin {
  if (legacy.selectionMetadata.seed === "question-bank:custom") return "question_bank_custom";
  if (legacy.mode === "retry_incorrect") return "retry_incorrect";
  if (legacy.selectionMetadata.seed.startsWith("quick-practice:")) return "quick_practice";
  return "configured_practice";
}

function isStoreEnvelope(value: unknown): value is {
  schemaVersion: number;
  activeSessionId: string | null;
  sessions: unknown[];
} {
  if (!value || typeof value !== "object") return false;
  const store = value as { schemaVersion?: unknown; activeSessionId?: unknown; sessions?: unknown };
  return typeof store.schemaVersion === "number" &&
    (store.activeSessionId === null ||
      (typeof store.activeSessionId === "string" && store.activeSessionId.trim().length > 0)) &&
    Array.isArray(store.sessions);
}

function readSessionId(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const sessionId = (value as { sessionId?: unknown }).sessionId;
  return typeof sessionId === "string" && sessionId.trim().length > 0 ? sessionId : null;
}
