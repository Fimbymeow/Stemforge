"use client";

import {
  MAX_PRACTICE_HISTORY,
  PRACTICE_SESSIONS_STORAGE_KEY,
  PRACTICE_SESSION_SCHEMA_VERSION,
  type PracticeSession,
  type PracticeSessionStore,
} from "@/lib/practice/practice-types";
import { decodePracticeSessionStore } from "@/lib/practice/practice-migration";
import {
  repairPracticeSessionStore,
  type PracticeSessionRepairIssue,
} from "@/lib/practice/practice-repair";

export type PracticeSessionLoadResult = {
  store: PracticeSessionStore;
  status: "current" | "empty" | "malformed-json" | "invalid-structure" | "unavailable";
  changed: boolean;
  issues: PracticeSessionRepairIssue[];
};

export function createEmptyPracticeSessionStore(): PracticeSessionStore {
  return { schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION, activeSessionId: null, sessions: [] };
}

export function loadPracticeSessionStore(storage: Storage | null = safeStorage()): PracticeSessionLoadResult {
  if (!storage) return loadFailure("unavailable");
  let raw: string | null;
  try { raw = storage.getItem(PRACTICE_SESSIONS_STORAGE_KEY); } catch {
    return loadFailure("unavailable");
  }
  if (!raw) return loadFailure("empty");
  try {
    const decoded = decodePracticeSessionStore(JSON.parse(raw) as unknown);
    if (!decoded) return loadFailure("invalid-structure");
    return { ...decoded, status: "current" };
  } catch {
    return loadFailure("malformed-json");
  }
}

export function savePracticeSessionStore(store: PracticeSessionStore, storage: Storage | null = safeStorage()) {
  if (!storage) return false;
  const repaired = repairPracticeSessionStore({
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    activeSessionId: store.activeSessionId,
    sessions: store.sessions,
  });
  try {
    storage.setItem(PRACTICE_SESSIONS_STORAGE_KEY, JSON.stringify(trimHistory(repaired.store)));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("stemforge:practice-session-updated"));
    return true;
  } catch { return false; }
}

export function upsertPracticeSession(session: PracticeSession, storage: Storage | null = safeStorage()) {
  const current = loadPracticeSessionStore(storage).store;
  const sessions = [session, ...current.sessions.filter((item) => item.sessionId !== session.sessionId)];
  return savePracticeSessionStore({
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
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
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
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
  return {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    activeSessionId: store.activeSessionId,
    sessions: [...active, ...inactive],
  };
}

function loadFailure(status: Exclude<PracticeSessionLoadResult["status"], "current">): PracticeSessionLoadResult {
  return { store: createEmptyPracticeSessionStore(), status, changed: false, issues: [] };
}

function safeStorage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}
