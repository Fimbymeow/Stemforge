"use client";

import {
  MAX_PRACTICE_HISTORY,
  PRACTICE_SESSIONS_STORAGE_KEY,
  type PracticeSession,
  type PracticeSessionStore,
} from "@/lib/practice/practice-types";
import { isPracticeSessionStore } from "@/lib/practice/practice-validation";

export type PracticeSessionLoadResult = {
  store: PracticeSessionStore;
  status: "current" | "empty" | "malformed-json" | "invalid-structure" | "unavailable";
};

export function createEmptyPracticeSessionStore(): PracticeSessionStore {
  return { schemaVersion: 1, activeSessionId: null, sessions: [] };
}

export function loadPracticeSessionStore(storage: Storage | null = safeStorage()): PracticeSessionLoadResult {
  if (!storage) return { store: createEmptyPracticeSessionStore(), status: "unavailable" };
  let raw: string | null;
  try { raw = storage.getItem(PRACTICE_SESSIONS_STORAGE_KEY); } catch {
    return { store: createEmptyPracticeSessionStore(), status: "unavailable" };
  }
  if (!raw) return { store: createEmptyPracticeSessionStore(), status: "empty" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPracticeSessionStore(parsed)) return { store: createEmptyPracticeSessionStore(), status: "invalid-structure" };
    return { store: trimHistory(parsed), status: "current" };
  } catch {
    return { store: createEmptyPracticeSessionStore(), status: "malformed-json" };
  }
}

export function savePracticeSessionStore(store: PracticeSessionStore, storage: Storage | null = safeStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(PRACTICE_SESSIONS_STORAGE_KEY, JSON.stringify(trimHistory(store)));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("stemforge:practice-session-updated"));
    return true;
  } catch { return false; }
}

export function upsertPracticeSession(session: PracticeSession, storage: Storage | null = safeStorage()) {
  const current = loadPracticeSessionStore(storage).store;
  const sessions = [session, ...current.sessions.filter((item) => item.sessionId !== session.sessionId)];
  return savePracticeSessionStore({
    schemaVersion: 1,
    activeSessionId: session.status === "active" ? session.sessionId : current.activeSessionId === session.sessionId ? null : current.activeSessionId,
    sessions,
  }, storage);
}

export function updatePracticeSession(sessionId: string, update: (session: PracticeSession) => PracticeSession, storage: Storage | null = safeStorage()) {
  const current = loadPracticeSessionStore(storage).store;
  const existing = current.sessions.find((session) => session.sessionId === sessionId);
  if (!existing) return null;
  const updated = update(existing);
  savePracticeSessionStore({
    schemaVersion: 1,
    activeSessionId: updated.status === "active" ? updated.sessionId : current.activeSessionId === sessionId ? null : current.activeSessionId,
    sessions: [updated, ...current.sessions.filter((session) => session.sessionId !== sessionId)],
  }, storage);
  return updated;
}

export function getPracticeSession(sessionId: string, storage: Storage | null = safeStorage()) {
  return loadPracticeSessionStore(storage).store.sessions.find((session) => session.sessionId === sessionId) ?? null;
}

function trimHistory(store: PracticeSessionStore): PracticeSessionStore {
  const active = store.sessions.filter((session) => session.status === "active");
  const inactive = store.sessions
    .filter((session) => session.status !== "active")
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, MAX_PRACTICE_HISTORY);
  return { schemaVersion: 1, activeSessionId: store.activeSessionId, sessions: [...active, ...inactive] };
}

function safeStorage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}
