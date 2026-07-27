import {
  PRACTICE_SESSION_SCHEMA_VERSION,
  type PracticeSession,
  type PracticeSessionStore,
} from "@/lib/practice/practice-types";
import { isPracticeSession } from "@/lib/practice/practice-validation";

export type PracticeSessionRepairIssue =
  | { code: "legacy_store_migrated" }
  | { code: "invalid_session_dropped"; sessionId: string | null; index: number }
  | { code: "active_pointer_cleared"; sessionId: string; reason: "missing" | "not_active" }
  | { code: "active_session_abandoned"; sessionId: string; winnerSessionId: string };

export type PracticeSessionRepairResult = {
  store: PracticeSessionStore;
  changed: boolean;
  issues: PracticeSessionRepairIssue[];
};

export type PracticeSessionStoreCandidate = {
  schemaVersion: typeof PRACTICE_SESSION_SCHEMA_VERSION;
  activeSessionId: string | null;
  sessions: unknown[];
};

export function repairPracticeSessionStore(candidate: PracticeSessionStoreCandidate): PracticeSessionRepairResult {
  const issues: PracticeSessionRepairIssue[] = [];
  const sessions: PracticeSession[] = [];

  candidate.sessions.forEach((entry, index) => {
    if (isPracticeSession(entry)) {
      sessions.push(structuredClone(entry));
      return;
    }
    issues.push({
      code: "invalid_session_dropped",
      sessionId: readSessionId(entry),
      index,
    });
  });

  let activeSessionId = candidate.activeSessionId;
  const pointerTarget = activeSessionId
    ? sessions.find((session) => session.sessionId === activeSessionId)
    : undefined;
  if (activeSessionId && !pointerTarget) {
    issues.push({ code: "active_pointer_cleared", sessionId: activeSessionId, reason: "missing" });
    activeSessionId = null;
  } else if (activeSessionId && pointerTarget?.status !== "active") {
    issues.push({ code: "active_pointer_cleared", sessionId: activeSessionId, reason: "not_active" });
    activeSessionId = null;
  }

  const activeSessions = sessions.filter((session) => session.status === "active");
  if (activeSessions.length > 1) {
    const validPointerTarget = activeSessionId
      ? activeSessions.find((session) => session.sessionId === activeSessionId)
      : undefined;
    const winner = validPointerTarget ?? [...activeSessions].sort(compareActiveSessionPrecedence)[0];
    activeSessionId = winner.sessionId;
    for (const session of activeSessions) {
      if (session.sessionId === winner.sessionId) continue;
      session.status = "abandoned";
      issues.push({
        code: "active_session_abandoned",
        sessionId: session.sessionId,
        winnerSessionId: winner.sessionId,
      });
    }
  }

  return {
    store: {
      schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
      activeSessionId,
      sessions,
    },
    changed: issues.length > 0,
    issues,
  };
}

function compareActiveSessionPrecedence(left: PracticeSession, right: PracticeSession) {
  const timestampDifference = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  return timestampDifference || left.sessionId.localeCompare(right.sessionId);
}

function readSessionId(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const sessionId = (value as { sessionId?: unknown }).sessionId;
  return typeof sessionId === "string" && sessionId.trim().length > 0 ? sessionId : null;
}
