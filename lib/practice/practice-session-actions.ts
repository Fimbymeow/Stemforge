"use client";

import { withPracticeSessionTransaction } from "@/lib/practice/practice-activation";
import { loadPracticeSessionStore, savePracticeSessionStore } from "@/lib/practice/practice-storage";
import type { PracticeSession } from "@/lib/practice/practice-types";
import { ProgressCoordinationUnavailableError } from "@/lib/progress/local-progress-transaction";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { derivePracticeQuestionStatuses } from "@/lib/practice/practice-question-status";

export type PracticeSessionActionResult =
  | { status: "updated" | "already_completed"; session: PracticeSession }
  | { status: "not_found" | "not_active" | "write_failed" | "coordination_unavailable" };

export function setPracticeQuestionIndex(sessionId: string, index: number, storage: Storage | null = browserStorage()) {
  return updateActiveSession(sessionId, storage, (session, now) => ({
    ...session,
    currentQuestionIndex: Math.max(0, Math.min(session.questionReferences.length - 1, index)),
    updatedAt: now,
  }));
}

export function setPracticeQuestionSkipped(
  sessionId: string,
  questionId: string,
  skipped: boolean,
  storage: Storage | null = browserStorage(),
) {
  return updateActiveSession(sessionId, storage, (session, now) => {
    if (!session.questionReferences.some((reference) => reference.questionId === questionId)) return session;
    const skippedQuestionIds = skipped
      ? [...new Set([...session.skippedQuestionIds, questionId])]
      : session.skippedQuestionIds.filter((id) => id !== questionId);
    return { ...session, skippedQuestionIds, updatedAt: now };
  });
}

export async function completePracticeSession(
  sessionId: string,
  elapsedSeconds: number | null,
  storage: Storage | null = browserStorage(),
): Promise<PracticeSessionActionResult> {
  try {
    return await withPracticeSessionTransaction(() => {
      const current = loadPracticeSessionStore(storage).store;
      const session = current.sessions.find((item) => item.sessionId === sessionId);
      if (!session) return { status: "not_found" as const };
      if (session.status === "completed") return { status: "already_completed" as const, session };
      if (session.status !== "active") return { status: "not_active" as const };
      const now = new Date().toISOString();
      const finalSkippedQuestionIds = derivePracticeQuestionStatuses(
        session,
        getProgressEvidence() ?? getEmptyProgressEvidence(),
      ).filter((status) => status.skipped).map((status) => status.questionId);
      const completed: PracticeSession = {
        ...session,
        status: "completed",
        completedAt: now,
        updatedAt: now,
        skippedQuestionIds: finalSkippedQuestionIds,
        finalSkippedQuestionIds,
        timing: session.timing.type === "timed"
          ? {
              ...session.timing,
              elapsedSeconds: Math.min(
                session.timing.timeLimitSeconds,
                Math.max(session.timing.elapsedSeconds, Math.floor(elapsedSeconds ?? session.timing.elapsedSeconds)),
              ),
            }
          : session.timing,
      };
      const saved = savePracticeSessionStore({
        ...current,
        activeSessionId: current.activeSessionId === sessionId ? null : current.activeSessionId,
        sessions: [completed, ...current.sessions.filter((item) => item.sessionId !== sessionId)],
      }, storage);
      if (!saved) return { status: "write_failed" as const };
      const verified = loadPracticeSessionStore(storage).store.sessions.find((item) => item.sessionId === sessionId);
      return verified?.status === "completed" && verified.completedAt === completed.completedAt
        ? { status: "updated" as const, session: verified }
        : { status: "write_failed" as const };
    });
  } catch (error) {
    return error instanceof ProgressCoordinationUnavailableError
      ? { status: "coordination_unavailable" }
      : { status: "write_failed" };
  }
}

async function updateActiveSession(
  sessionId: string,
  storage: Storage | null,
  update: (session: PracticeSession, now: string) => PracticeSession,
): Promise<PracticeSessionActionResult> {
  try {
    return await withPracticeSessionTransaction(() => {
      const current = loadPracticeSessionStore(storage).store;
      const session = current.sessions.find((item) => item.sessionId === sessionId);
      if (!session) return { status: "not_found" as const };
      if (session.status !== "active") return { status: "not_active" as const };
      const updated = update(session, new Date().toISOString());
      const saved = savePracticeSessionStore({
        ...current,
        activeSessionId: sessionId,
        sessions: [updated, ...current.sessions.filter((item) => item.sessionId !== sessionId)],
      }, storage);
      return saved ? { status: "updated" as const, session: updated } : { status: "write_failed" as const };
    });
  } catch (error) {
    return error instanceof ProgressCoordinationUnavailableError
      ? { status: "coordination_unavailable" }
      : { status: "write_failed" };
  }
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}
