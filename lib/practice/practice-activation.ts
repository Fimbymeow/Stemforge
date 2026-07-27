"use client";

import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import {
  loadPracticeSessionStore,
  savePracticeSessionStore,
} from "@/lib/practice/practice-storage";
import type { PracticeSession } from "@/lib/practice/practice-types";
import { isPracticeSession } from "@/lib/practice/practice-validation";
import {
  ProgressCoordinationUnavailableError,
  withBrowserStorageTransaction,
} from "@/lib/progress/local-progress-transaction";

export const PRACTICE_SESSION_LOCK_NAME = "stemforge-practice-session-v1";

export type PracticeActivationConflict = {
  status: "conflict";
  activeSession: PracticeSession;
  resolvable: boolean;
};

export type PracticeActivationResult =
  | { status: "activated"; session: PracticeSession }
  | { status: "resumed"; session: PracticeSession }
  | PracticeActivationConflict
  | { status: "invalid_candidate" }
  | { status: "no_active_session" }
  | { status: "write_failed" }
  | { status: "coordination_unavailable" };

export async function requestPracticeSessionActivation(
  candidate: PracticeSession,
  storage: Storage | null = browserStorage(),
): Promise<PracticeActivationResult> {
  if (!isPracticeSession(candidate) || candidate.status !== "active") return { status: "invalid_candidate" };
  return coordinated(async () => {
    const loaded = loadPracticeSessionStore(storage);
    const current = loaded.store;
    if (loaded.changed && !savePracticeSessionStore(current, storage)) return { status: "write_failed" };
    const active = findEffectiveActiveSession(current.sessions, current.activeSessionId);
    if (active?.sessionId === candidate.sessionId) {
      if (!savePracticeSessionStore({ ...current, activeSessionId: active.sessionId }, storage)) return { status: "write_failed" };
      return verifiedActivation(candidate.sessionId, storage);
    }
    if (active) return conflict(active);
    return persistCandidate(current.sessions, candidate, storage);
  });
}

export async function replaceActivePracticeSession(
  candidate: PracticeSession,
  expectedActiveSessionId: string,
  storage: Storage | null = browserStorage(),
  now = new Date(),
): Promise<PracticeActivationResult> {
  if (!isPracticeSession(candidate) || candidate.status !== "active") return { status: "invalid_candidate" };
  return coordinated(async () => {
    const loaded = loadPracticeSessionStore(storage);
    const current = loaded.store;
    if (loaded.changed && !savePracticeSessionStore(current, storage)) return { status: "write_failed" };
    const active = findEffectiveActiveSession(current.sessions, current.activeSessionId);
    if (active && active.sessionId !== expectedActiveSessionId) return conflict(active);
    const timestamp = now.toISOString();
    const sessions = current.sessions.map((session) =>
      session.sessionId === expectedActiveSessionId && session.status === "active"
        ? { ...session, status: "abandoned" as const, updatedAt: timestamp }
        : session);
    return persistCandidate(sessions, candidate, storage);
  });
}

export async function resumeActivePracticeSession(
  expectedActiveSessionId: string,
  storage: Storage | null = browserStorage(),
): Promise<PracticeActivationResult> {
  return coordinated(async () => {
    const loaded = loadPracticeSessionStore(storage);
    const current = loaded.store;
    if (loaded.changed && !savePracticeSessionStore(current, storage)) return { status: "write_failed" };
    const active = findEffectiveActiveSession(current.sessions, current.activeSessionId);
    if (!active) return { status: "no_active_session" };
    if (active.sessionId !== expectedActiveSessionId) return conflict(active);
    if (!savePracticeSessionStore({ ...current, activeSessionId: active.sessionId }, storage)) return { status: "write_failed" };
    const verified = loadPracticeSessionStore(storage).store;
    const resumed = verified.sessions.find((session) =>
      session.sessionId === expectedActiveSessionId && session.status === "active");
    return resumed && verified.activeSessionId === resumed.sessionId
      ? { status: "resumed", session: resumed }
      : { status: "write_failed" };
  });
}

function persistCandidate(
  existingSessions: PracticeSession[],
  candidate: PracticeSession,
  storage: Storage | null,
): PracticeActivationResult {
  const store = {
    schemaVersion: candidate.schemaVersion,
    activeSessionId: candidate.sessionId,
    sessions: [candidate, ...existingSessions.filter((session) => session.sessionId !== candidate.sessionId)],
  };
  if (!savePracticeSessionStore(store, storage)) return { status: "write_failed" };
  return verifiedActivation(candidate.sessionId, storage);
}

function verifiedActivation(sessionId: string, storage: Storage | null): PracticeActivationResult {
  const verified = loadPracticeSessionStore(storage).store;
  const activeSessions = verified.sessions.filter((session) => session.status === "active");
  const session = activeSessions.find((item) => item.sessionId === sessionId);
  return session && verified.activeSessionId === sessionId && activeSessions.length === 1
    ? { status: "activated", session }
    : { status: "write_failed" };
}

function findEffectiveActiveSession(sessions: PracticeSession[], activeSessionId: string | null) {
  return (activeSessionId
    ? sessions.find((session) => session.sessionId === activeSessionId && session.status === "active")
    : undefined) ?? sessions.find((session) => session.status === "active");
}

function conflict(activeSession: PracticeSession): PracticeActivationConflict {
  return {
    status: "conflict",
    activeSession,
    resolvable: activeSession.questionReferences.some((reference) =>
      resolvePracticeReference(reference).status === "resolved"),
  };
}

async function coordinated(operation: () => Promise<PracticeActivationResult> | PracticeActivationResult) {
  try {
    return await withPracticeSessionTransaction(operation);
  } catch (error) {
    return error instanceof ProgressCoordinationUnavailableError
      ? { status: "coordination_unavailable" as const }
      : { status: "write_failed" as const };
  }
}

export function withPracticeSessionTransaction<T>(operation: () => Promise<T> | T) {
  return withBrowserStorageTransaction(PRACTICE_SESSION_LOCK_NAME, operation, true);
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}
