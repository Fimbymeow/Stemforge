"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PROGRESS_IMPORT_METADATA_KEY } from "@/lib/progress/import-metadata";
import { batchProgressEvidence, countEvidence } from "@/lib/progress/import-batching";
import { inspectLocalProgress } from "@/lib/progress/import-metadata";
import { isProgressImportResponse } from "@/lib/progress/import-protocol";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress/storage";
import {
  PROGRESS_SYNC_METADATA_KEY,
  canRunProgressSync,
  confirmProgressSyncAssociation,
  createDefaultProgressSyncAccount,
  mergeProgressSyncPushResponse,
  markProgressSyncCaughtUp,
  markProgressSyncGenerationMismatch,
  pauseProgressSync,
  pendingProgressSyncEvidence,
  progressSyncRequiresAssociation,
  readProgressSyncMetadata,
  resumeProgressSync,
  type ProgressSyncStatus,
} from "@/lib/progress/sync-metadata";
import {
  isProgressSyncContextResponse,
  isProgressSyncExpectedStateResponse,
  isProgressSyncPullResponse,
} from "@/lib/progress/sync-protocol";
import {
  SYNC_LOCAL_CHANGE_DEBOUNCE_MS,
  SYNC_REQUEST_TIMEOUT_MS,
  SYNC_VISIBLE_INTERVAL_MS,
  SYNC_VISIBILITY_REFRESH_MS,
  nextProgressSyncRetryAt,
  retryAfterDelay,
} from "@/lib/progress/sync-retry";
import {
  applyProgressSyncPullPage,
  inspectBrowserProgressData,
  runBrowserDataControl,
  recordRemoteEvidenceAcknowledgements,
  reconcileAfterRemoteErasure,
  updateProgressSyncMetadata,
} from "@/lib/progress/local-progress-transaction";
import { setActiveBrowserAccountFingerprint, type EvidenceProvenanceSummary } from "@/lib/progress/evidence-provenance";

export type ProgressSyncDiagnostics = {
  lastSuccessfulPushAt: string | null;
  lastSuccessfulPullAt: string | null;
  lastFullyCaughtUpAt: string | null;
  permanentlyRejectedCount: number;
  nextRetryAt: string | null;
  localLoadStatus: string;
  provenanceStatus: string;
  browserData: EvidenceProvenanceSummary;
  coordination: "web_locks" | "indexeddb" | "unavailable";
};

type ProgressSyncContextValue = {
  status: ProgressSyncStatus;
  accountFingerprint: string | null;
  pendingCount: number;
  lastSuccessfulSyncAt: string | null;
  differentAccount: boolean;
  diagnostics: ProgressSyncDiagnostics;
  confirmAssociation(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  syncNow(): Promise<void>;
  removeAssociation(): Promise<void>;
  removeCurrentAccountData(): Promise<number>;
  reconcileRemoteErasure(erasedGeneration: string, currentGeneration: string): Promise<number>;
  clearAllBrowserProgress(): Promise<void>;
  prepareForSignOut(removeAccountData: boolean): Promise<void>;
};

const ProgressSyncContext = createContext<ProgressSyncContextValue | null>(null);

export function ProgressSyncProvider({ accountsAvailable, children }: { accountsAvailable: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<ProgressSyncStatus>(accountsAvailable ? "checking" : "saved_locally");
  const [accountFingerprint, setAccountFingerprint] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(null);
  const [differentAccount, setDifferentAccount] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ProgressSyncDiagnostics>(emptyDiagnostics);
  const inFlight = useRef<Promise<void> | null>(null);
  const fingerprintRef = useRef<string | null>(null);
  const accountGenerationRef = useRef<string | null>(null);
  const suspendedRef = useRef(false);
  const authenticationRequiredRef = useRef(false);
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastAttemptRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inspect = useCallback((fingerprint: string) => {
    const metadata = readMetadata();
    const account = metadata.accounts[fingerprint];
    const local = inspectLocalProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
    const pending = local.status === "importable" ? countEvidence(pendingProgressSyncEvidence(local.payload, metadata, fingerprint)) : 0;
    setPendingCount(pending);
    setLastSuccessfulSyncAt(latestTimestamp(account?.lastSuccessfulPushAt ?? null, account?.lastSuccessfulPullAt ?? null));
    const changedAccount = metadata.lastAssociatedAccountFingerprint !== null && metadata.lastAssociatedAccountFingerprint !== fingerprint;
    setDifferentAccount(changedAccount);
    const browser = inspectBrowserProgressData(fingerprint);
    setDiagnostics({
      lastSuccessfulPushAt: account?.lastSuccessfulPushAt ?? null,
      lastSuccessfulPullAt: account?.lastSuccessfulPullAt ?? null,
      lastFullyCaughtUpAt: account?.lastFullyCaughtUpAt ?? null,
      permanentlyRejectedCount: Object.keys(account?.permanentlyRejected ?? {}).length,
      nextRetryAt: account?.retry.nextRetryAt ?? null,
      localLoadStatus: browser.loadStatus,
      provenanceStatus: browser.provenanceStatus,
      browserData: browser.summary,
      coordination: typeof navigator !== "undefined" && navigator.locks ? "web_locks" : typeof indexedDB !== "undefined" ? "indexeddb" : "unavailable",
    });
    if (account?.cleanupRequired) setStatus("cleanup_required");
    else if (progressSyncRequiresAssociation(metadata, fingerprint)) setStatus("association_required");
    else if (!account?.syncEnabled) setStatus("paused");
    else if (pending > 0) setStatus("pending_upload");
    return { metadata, local, pending };
  }, []);

  const scheduleRetry = useCallback(async (fingerprint: string, kind: string, serverDelayMs: number | null = null) => {
    const metadata = await updateProgressSyncMetadata((latest) => {
      const next = structuredClone(latest);
      const account = next.accounts[fingerprint] ?? createDefaultProgressSyncAccount();
      account.retry.consecutiveFailures += 1;
      account.retry.nextRetryAt = nextProgressSyncRetryAt(account.retry.consecutiveFailures, Date.now(), Math.random(), serverDelayMs);
      account.retry.lastFailureKind = kind;
      next.accounts[fingerprint] = account;
      return next;
    });
    const nextRetryAt = metadata.accounts[fingerprint]?.retry.nextRetryAt;
    if (retryRef.current) clearTimeout(retryRef.current);
    if (nextRetryAt) {
      retryRef.current = setTimeout(() => void runForFingerprint(fingerprint), Math.max(0, Date.parse(nextRetryAt) - Date.now()));
    }
  // runForFingerprint is stable through the ref-backed single-flight boundary.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performCycle = useCallback(async (fingerprint: string, generation: number, signal: AbortSignal) => {
    assertCurrentCycle(fingerprint, generation, signal);
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    const state = inspect(fingerprint);
    if (!canRunProgressSync(state.metadata, fingerprint)) return;
    const accountGeneration = state.metadata.accounts[fingerprint]?.accountGeneration;
    if (!accountGeneration) { setStatus("cleanup_required"); return; }
    if (state.local.status === "invalid" || state.local.status === "unsupported") {
      setStatus("paused");
      return;
    }
    const contextResponse = await fetchWithTimeout("/api/progress/sync/context", undefined, signal);
    if (contextResponse.status === 401) throw new SyncAuthenticationError();
    const contextBody: unknown = await contextResponse.json().catch(() => null);
    if (!contextResponse.ok || !isProgressSyncContextResponse(contextBody)) throw new Error("context_failed");
    if (!contextBody.authenticated || contextBody.accountFingerprint !== fingerprint) throw new SyncAuthenticationError();
    if (contextBody.accountDataStatus !== "active") {
      setStatus("paused");
      throw new SyncCancelledError();
    }
    if (contextBody.accountGeneration !== accountGeneration) {
      accountGenerationRef.current = contextBody.accountGeneration;
      await updateProgressSyncMetadata((latest) => markProgressSyncGenerationMismatch(latest, fingerprint, contextBody.accountGeneration));
      setStatus("cleanup_required");
      throw new SyncCancelledError();
    }
    setStatus("syncing");
    if (state.local.status === "importable") {
      const pending = pendingProgressSyncEvidence(state.local.payload, state.metadata, fingerprint);
      for (const evidence of batchProgressEvidence(pending)) {
        const response = await fetchWithTimeout("/api/progress/sync/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ protocolVersion: 1, expectedGeneration: accountGeneration, evidence }),
        }, signal);
        if (response.status === 401) throw new SyncAuthenticationError();
        if (response.status === 409) throw new SyncGenerationError();
        if (response.status === 429) throw new SyncTemporaryError("rate_limited", retryAfterDelay(response.headers.get("Retry-After")));
        assertCurrentCycle(fingerprint, generation, signal);
        const body: unknown = await response.json().catch(() => null);
        if (isProgressSyncExpectedStateResponse(body)) throw new SyncGenerationError();
        if (!response.ok || !isProgressImportResponse(body) || body.accountFingerprint !== fingerprint) throw new Error("push_failed");
        await updateProgressSyncMetadata((latest) => mergeProgressSyncPushResponse(latest, body, evidence));
        await recordRemoteEvidenceAcknowledgements(fingerprint, accountGeneration, [
          ...body.accepted, ...body.alreadyPresent, ...body.conflictRetained,
        ].map((item) => `${item.kind}:${item.eventId}`));
      }
    }

    let hasMore = true;
    for (let page = 0; page < 20 && hasMore; page += 1) {
      const latest = readMetadata();
      const cursor = latest.accounts[fingerprint]?.lastPulledCursor;
      const generationQuery = `generation=${encodeURIComponent(accountGeneration)}`;
      const url = cursor ? `/api/progress/sync/pull?${generationQuery}&after=${encodeURIComponent(cursor)}` : `/api/progress/sync/pull?${generationQuery}`;
      const response = await fetchWithTimeout(url, undefined, signal);
      if (response.status === 401) throw new SyncAuthenticationError();
      if (response.status === 409) throw new SyncGenerationError();
      if (response.status === 429) throw new SyncTemporaryError("rate_limited", retryAfterDelay(response.headers.get("Retry-After")));
      assertCurrentCycle(fingerprint, generation, signal);
      const body: unknown = await response.json().catch(() => null);
      if (isProgressSyncExpectedStateResponse(body)) throw new SyncGenerationError();
      if (!response.ok || !isProgressSyncPullResponse(body) || body.accountFingerprint !== fingerprint) throw new Error("pull_failed");
      await applyProgressSyncPullPage(body);
      assertCurrentCycle(fingerprint, generation, signal);
      hasMore = body.hasMore;
    }
    const final = inspect(fingerprint);
    if (final.pending > 0 || hasMore) setStatus("pending_upload");
    else {
      const caughtUpAt = new Date().toISOString();
      await updateProgressSyncMetadata((latest) => markProgressSyncCaughtUp(latest, fingerprint, caughtUpAt));
      inspect(fingerprint);
      setStatus("caught_up");
    }
  }, [inspect]);

  function assertCurrentCycle(fingerprint: string, generation: number, signal: AbortSignal) {
    if (signal.aborted || generationRef.current !== generation || fingerprintRef.current !== fingerprint || suspendedRef.current) {
      throw new SyncCancelledError();
    }
  }

  function runForFingerprint(fingerprint: string) {
    if (suspendedRef.current || authenticationRequiredRef.current || fingerprintRef.current !== fingerprint) return Promise.resolve();
    if (inFlight.current) return inFlight.current;
    const generation = generationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const run = async () => {
      lastAttemptRef.current = Date.now();
      try {
        if (navigator.locks) {
          await navigator.locks.request("stemforge-progress-sync-network", { mode: "exclusive", ifAvailable: true }, async (lock) => {
            if (lock) await performCycle(fingerprint, generation, controller.signal);
          });
        } else {
          await performCycle(fingerprint, generation, controller.signal);
        }
      } catch (error) {
        if (error instanceof SyncCancelledError) return;
        if (error instanceof SyncAuthenticationError) {
          authenticationRequiredRef.current = true;
          suspendedRef.current = true;
          setActiveBrowserAccountFingerprint(null);
          if (retryRef.current) clearTimeout(retryRef.current);
          setStatus("authentication_required");
          return;
        }
        if (error instanceof SyncGenerationError) {
          const currentGeneration = accountGenerationRef.current;
          if (currentGeneration) await updateProgressSyncMetadata((latest) => markProgressSyncGenerationMismatch(latest, fingerprint, currentGeneration));
          setStatus("cleanup_required");
          return;
        }
        setStatus(navigator.onLine ? "temporary_error" : "offline");
        const temporary = error instanceof SyncTemporaryError ? error : null;
        await scheduleRetry(
          fingerprint,
          navigator.onLine ? temporary?.kind ?? "temporary_error" : "offline",
          temporary?.retryAfterMs ?? null,
        ).catch(() => undefined);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        inFlight.current = null;
      }
    };
    inFlight.current = run();
    return inFlight.current;
  }

  const resolveContext = useCallback(async () => {
    if (!accountsAvailable) return;
    try {
      const response = await fetchWithTimeout("/api/progress/sync/context");
      if (response.status === 401) {
        await suspendAndAwait();
        authenticationRequiredRef.current = true;
        setActiveBrowserAccountFingerprint(null);
        setStatus("authentication_required");
        return;
      }
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isProgressSyncContextResponse(body)) throw new Error("context_failed");
      if (!body.authenticated) {
        await suspendAndAwait();
        fingerprintRef.current = null;
        setActiveBrowserAccountFingerprint(null);
        setAccountFingerprint(null);
        authenticationRequiredRef.current = true;
        setStatus("authentication_required");
        return;
      }
      if (fingerprintRef.current && fingerprintRef.current !== body.accountFingerprint) await suspendAndAwait();
      fingerprintRef.current = body.accountFingerprint;
      accountGenerationRef.current = body.accountGeneration;
      setActiveBrowserAccountFingerprint(body.accountFingerprint);
      setAccountFingerprint(body.accountFingerprint);
      authenticationRequiredRef.current = false;
      if (body.accountDataStatus !== "active") {
        await suspendAndAwait();
        setStatus("paused");
        return;
      }
      const before = readMetadata().accounts[body.accountFingerprint];
      if (before && before.accountGeneration !== body.accountGeneration) {
        await updateProgressSyncMetadata((latest) => markProgressSyncGenerationMismatch(latest, body.accountFingerprint, body.accountGeneration));
        setStatus("cleanup_required");
        return;
      }
      const state = inspect(body.accountFingerprint);
      suspendedRef.current = false;
      if (canRunProgressSync(state.metadata, body.accountFingerprint)) void runForFingerprint(body.accountFingerprint);
    } catch {
      setStatus(navigator.onLine ? "temporary_error" : "offline");
    }
  // runForFingerprint uses refs for its single-flight state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsAvailable, inspect]);

  useEffect(() => {
    void resolveContext();
  }, [pathname, resolveContext]);

  useEffect(() => {
    if (!accountsAvailable) return;
    const schedule = () => {
      const fingerprint = fingerprintRef.current;
      if (!fingerprint) return;
      inspect(fingerprint);
      if (!navigator.onLine) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setStatus("offline");
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void runForFingerprint(fingerprint), SYNC_LOCAL_CHANGE_DEBOUNCE_MS);
    };
    const online = () => { const fingerprint = fingerprintRef.current; if (fingerprint) void runForFingerprint(fingerprint); };
    const offline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      setStatus("offline");
    };
    const visible = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastAttemptRef.current < SYNC_VISIBILITY_REFRESH_MS) return;
      const fingerprint = fingerprintRef.current;
      if (fingerprint) void runForFingerprint(fingerprint);
    };
    window.addEventListener("stemforge:local-progress-updated", schedule);
    window.addEventListener("stemforge:progress-import-updated", schedule);
    window.addEventListener("storage", schedule);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visible);
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      const fingerprint = fingerprintRef.current;
      if (fingerprint) void runForFingerprint(fingerprint);
    }, SYNC_VISIBLE_INTERVAL_MS);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", schedule);
      window.removeEventListener("stemforge:progress-import-updated", schedule);
      window.removeEventListener("storage", schedule);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
      clearInterval(interval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  // runForFingerprint deliberately remains a ref-backed single-flight function.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsAvailable, inspect]);

  async function confirmAssociation() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return;
    authenticationRequiredRef.current = false;
    suspendedRef.current = false;
    const accountGeneration = accountGenerationRef.current;
    if (!accountGeneration) return;
    await updateProgressSyncMetadata((metadata) => confirmProgressSyncAssociation(metadata, fingerprint, accountGeneration));
    inspect(fingerprint);
    await runForFingerprint(fingerprint);
  }

  async function pause() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return;
    await suspendAndAwait();
    await updateProgressSyncMetadata((metadata) => pauseProgressSync(metadata, fingerprint));
    suspendedRef.current = false;
    setStatus("paused");
  }

  async function resume() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return;
    authenticationRequiredRef.current = false;
    suspendedRef.current = false;
    await updateProgressSyncMetadata((metadata) => resumeProgressSync(metadata, fingerprint));
    inspect(fingerprint);
    await runForFingerprint(fingerprint);
  }

  async function syncNow() {
    const fingerprint = fingerprintRef.current;
    if (fingerprint) await runForFingerprint(fingerprint);
  }

  async function removeAssociation() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return;
    await suspendAndAwait();
    await runBrowserDataControl("remove_association", fingerprint);
    inspect(fingerprint);
    setStatus("association_required");
  }

  async function removeCurrentAccountData() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return 0;
    await suspendAndAwait();
    const result = await runBrowserDataControl("remove_account_progress", fingerprint);
    inspect(fingerprint);
    setStatus("association_required");
    return result.removedEvidenceCount;
  }

  async function reconcileRemoteErasure(erasedGeneration: string, currentGeneration: string) {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return 0;
    await suspendAndAwait();
    const result = await reconcileAfterRemoteErasure(fingerprint, erasedGeneration, currentGeneration);
    inspect(fingerprint);
    setStatus("association_required");
    return result.removedEvidenceCount;
  }

  async function clearAllBrowserProgress() {
    await suspendAndAwait();
    await runBrowserDataControl("clear_all", null);
    const fingerprint = fingerprintRef.current;
    if (fingerprint) inspect(fingerprint);
    setStatus(fingerprint ? "association_required" : "saved_locally");
  }

  async function prepareForSignOut(removeAccountData: boolean) {
    const fingerprint = fingerprintRef.current;
    await suspendAndAwait();
    if (removeAccountData && fingerprint) await runBrowserDataControl("remove_account_progress", fingerprint);
    fingerprintRef.current = null;
    setActiveBrowserAccountFingerprint(null);
    setAccountFingerprint(null);
    authenticationRequiredRef.current = true;
    setStatus("authentication_required");
  }

  async function suspendAndAwait() {
    suspendedRef.current = true;
    generationRef.current += 1;
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (retryRef.current) clearTimeout(retryRef.current);
    await inFlight.current?.catch(() => undefined);
  }

  return (
    <ProgressSyncContext.Provider value={{
      status, accountFingerprint, pendingCount, lastSuccessfulSyncAt, differentAccount, diagnostics,
      confirmAssociation, pause, resume, syncNow, removeAssociation, removeCurrentAccountData,
      reconcileRemoteErasure, clearAllBrowserProgress, prepareForSignOut,
    }}>
      {children}
    </ProgressSyncContext.Provider>
  );
}

export function useProgressSync() {
  return useContext(ProgressSyncContext) ?? disabledContext;
}

const emptyBrowserData: EvidenceProvenanceSummary = {
  total: 0,
  anonymous: 0,
  legacyUnknown: 0,
  currentAccount: 0,
  otherAccounts: 0,
  remotePulledForCurrentAccount: 0,
};

const emptyDiagnostics: ProgressSyncDiagnostics = {
  lastSuccessfulPushAt: null,
  lastSuccessfulPullAt: null,
  lastFullyCaughtUpAt: null,
  permanentlyRejectedCount: 0,
  nextRetryAt: null,
  localLoadStatus: "empty",
  provenanceStatus: "current",
  browserData: emptyBrowserData,
  coordination: "unavailable",
};

const disabledContext: ProgressSyncContextValue = {
  status: "saved_locally",
  accountFingerprint: null,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  differentAccount: false,
  diagnostics: emptyDiagnostics,
  confirmAssociation: async () => undefined,
  pause: async () => undefined,
  resume: async () => undefined,
  syncNow: async () => undefined,
  removeAssociation: async () => undefined,
  removeCurrentAccountData: async () => 0,
  reconcileRemoteErasure: async () => 0,
  clearAllBrowserProgress: async () => undefined,
  prepareForSignOut: async () => undefined,
};

function readMetadata() {
  return readProgressSyncMetadata(
    window.localStorage.getItem(PROGRESS_SYNC_METADATA_KEY),
    window.localStorage.getItem(PROGRESS_IMPORT_METADATA_KEY),
  );
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, cancellation?: AbortSignal) {
  const timeout = AbortSignal.timeout(SYNC_REQUEST_TIMEOUT_MS);
  const signal = cancellation ? AbortSignal.any([timeout, cancellation]) : timeout;
  return fetch(input, { ...init, cache: "no-store", signal });
}

function latestTimestamp(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

class SyncAuthenticationError extends Error {}
class SyncGenerationError extends Error {}
class SyncCancelledError extends Error {}
class SyncTemporaryError extends Error {
  constructor(readonly kind: string, readonly retryAfterMs: number | null) {
    super(kind);
  }
}
