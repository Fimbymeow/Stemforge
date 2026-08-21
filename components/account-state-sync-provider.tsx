"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { CONFIDENCE_LOCAL_STATE_UPDATED_EVENT } from "@/lib/confidence/local-state";
import { STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT } from "@/lib/study-plan/local-state";
import { normalizeAccountLearnerState, type AccountLearnerState } from "@/lib/account-state/types";
import {
  ACCOUNT_STATE_IMPORT_COMPLETED_EVENT, ACCOUNT_STATE_SYNCED_EVENT, applyAccountStateMutations, applyAccountStateToLocalStorage,
  diffLocalAccountState, hasMeaningfulAccountState, mergePendingMutations, readAccountStateSyncMetadata,
  readLocalAccountState, sameMutationVersion, writeAccountStateSyncMetadata,
} from "@/lib/account-state/client-state";

export function AccountStateSyncProvider({ accountsAvailable, children }: { accountsAvailable: boolean; children: ReactNode }) {
  const authority = useRef<AccountLearnerState | null>(null);
  const fingerprint = useRef<string | null>(null);
  const hydrated = useRef(false);
  const suppress = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (!fingerprint.current || inFlight.current) return inFlight.current;
    const metadata = readAccountStateSyncMetadata(window.localStorage);
    if (metadata.accountFingerprint !== fingerprint.current || metadata.pending.length === 0) return;
    const submitted = metadata.pending;
    const task = (async () => {
      try {
        if (!metadata.accountGeneration) throw new Error("generation_unavailable");
        const response = await fetch("/api/account-state", { method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountGeneration: metadata.accountGeneration, mutations: submitted }) });
        const body: unknown = await response.json().catch(() => null);
        if (response.status === 409) {
          const current = readAccountStateSyncMetadata(window.localStorage);
          current.pending = [];
          current.accountGeneration = null;
          writeAccountStateSyncMetadata(window.localStorage, current);
          window.dispatchEvent(new Event(ACCOUNT_STATE_IMPORT_COMPLETED_EVENT));
          return;
        }
        if (!response.ok || !body || typeof body !== "object" || (body as { authenticated?: unknown }).authenticated !== true) throw new Error("sync_failed");
        const state = normalizeAccountLearnerState((body as { state?: unknown }).state);
        const current = readAccountStateSyncMetadata(window.localStorage);
        current.pending = current.pending.filter((entry) => !submitted.some((sent) => sameMutationVersion(entry, sent)));
        current.retryCount = 0;
        const nextGeneration = (body as { accountGeneration?: unknown }).accountGeneration;
        if (typeof nextGeneration === "string" && /^[1-9]\d*$/.test(nextGeneration)) current.accountGeneration = nextGeneration;
        writeAccountStateSyncMetadata(window.localStorage, current);
        authority.current = state;
        suppress.current = true;
        applyAccountStateToLocalStorage(window.localStorage, applyAccountStateMutations(state, current.pending));
        window.dispatchEvent(new Event(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT));
        window.dispatchEvent(new Event(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT));
        window.dispatchEvent(new Event(ACCOUNT_STATE_SYNCED_EVENT));
        suppress.current = false;
      } catch {
        const current = readAccountStateSyncMetadata(window.localStorage);
        current.retryCount += 1;
        writeAccountStateSyncMetadata(window.localStorage, current);
        const delay = Math.min(60_000, 2_000 * 2 ** Math.min(current.retryCount, 5));
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => void flush(), delay);
      }
    })().finally(() => { inFlight.current = null; const current = readAccountStateSyncMetadata(window.localStorage); if (current.pending.length) void flush(); });
    inFlight.current = task;
    return task;
  }, []);

  const captureChanges = useCallback(() => {
    if (suppress.current || !hydrated.current || !authority.current || !fingerprint.current) return;
    const metadata = readAccountStateSyncMetadata(window.localStorage);
    if (metadata.accountFingerprint !== fingerprint.current) return;
    const effective = applyAccountStateMutations(authority.current, metadata.pending);
    const mutations = diffLocalAccountState(readLocalAccountState(window.localStorage), effective);
    if (!mutations.length) return;
    metadata.pending = mergePendingMutations(metadata.pending, mutations);
    writeAccountStateSyncMetadata(window.localStorage, metadata);
    void flush();
  }, [flush]);

  const hydrate = useCallback(async (captureGuest: boolean, localAtRequestStart?: AccountLearnerState) => {
    const response = await fetch("/api/account-state", { cache: "no-store" });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object" || (body as { authenticated?: unknown }).authenticated !== true) return;
    const accountFingerprint = (body as { accountFingerprint?: unknown }).accountFingerprint;
    const accountGeneration = (body as { accountGeneration?: unknown }).accountGeneration;
    if (typeof accountFingerprint !== "string" || typeof accountGeneration !== "string" || !/^[1-9]\d*$/.test(accountGeneration)) return;
    const state = normalizeAccountLearnerState((body as { state?: unknown }).state);
    const metadata = readAccountStateSyncMetadata(window.localStorage);
    const local = readLocalAccountState(window.localStorage);
    const priorFingerprint = metadata.accountFingerprint;
    if (captureGuest && !metadata.guestCandidate && hasMeaningfulAccountState(local) && metadata.accountFingerprint === null) {
      metadata.guestCandidate = { capturedAt: new Date().toISOString(), associatedFingerprint: null, state: local };
    }
    if (priorFingerprint !== accountFingerprint) metadata.pending = [];
    if (priorFingerprint === accountFingerprint && localAtRequestStart) {
      metadata.pending = mergePendingMutations(metadata.pending, diffLocalAccountState(local, localAtRequestStart));
    }
    metadata.accountFingerprint = accountFingerprint;
    metadata.accountGeneration = accountGeneration;
    writeAccountStateSyncMetadata(window.localStorage, metadata);
    authority.current = state;
    fingerprint.current = accountFingerprint;
    suppress.current = true;
    applyAccountStateToLocalStorage(window.localStorage, applyAccountStateMutations(state, metadata.pending));
    window.dispatchEvent(new Event(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT));
    window.dispatchEvent(new Event(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT));
    suppress.current = false;
    hydrated.current = true;
    window.dispatchEvent(new Event(ACCOUNT_STATE_SYNCED_EVENT));
    void flush();
  }, [flush]);

  useEffect(() => {
    if (!accountsAvailable) return;
    let cancelled = false;
    const localAtRequestStart = readLocalAccountState(window.localStorage);
    void hydrate(true, localAtRequestStart).catch(() => undefined);
    const changed = () => captureChanges();
    const online = () => void flush();
    const imported = () => { if (!cancelled) void hydrate(false).catch(() => undefined); };
    window.addEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, changed);
    window.addEventListener(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT, changed);
    window.addEventListener("online", online);
    window.addEventListener(ACCOUNT_STATE_IMPORT_COMPLETED_EVENT, imported);
    return () => {
      cancelled = true;
      window.removeEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, changed);
      window.removeEventListener(CONFIDENCE_LOCAL_STATE_UPDATED_EVENT, changed);
      window.removeEventListener("online", online);
      window.removeEventListener(ACCOUNT_STATE_IMPORT_COMPLETED_EVENT, imported);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [accountsAvailable, captureChanges, flush, hydrate]);

  return children;
}
