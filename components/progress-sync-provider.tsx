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
  pauseProgressSync,
  pendingProgressSyncEvidence,
  progressSyncRequiresAssociation,
  readProgressSyncMetadata,
  type ProgressSyncStatus,
} from "@/lib/progress/sync-metadata";
import {
  isProgressSyncContextResponse,
  isProgressSyncPullResponse,
} from "@/lib/progress/sync-protocol";
import {
  SYNC_LOCAL_CHANGE_DEBOUNCE_MS,
  SYNC_REQUEST_TIMEOUT_MS,
  SYNC_VISIBLE_INTERVAL_MS,
  SYNC_VISIBILITY_REFRESH_MS,
  nextProgressSyncRetryAt,
} from "@/lib/progress/sync-retry";
import { applyProgressSyncPullPage, updateProgressSyncMetadata } from "@/lib/progress/local-progress-transaction";

type ProgressSyncContextValue = {
  status: ProgressSyncStatus;
  accountFingerprint: string | null;
  pendingCount: number;
  lastSuccessfulSyncAt: string | null;
  differentAccount: boolean;
  confirmAssociation(): Promise<void>;
  pause(): Promise<void>;
  syncNow(): Promise<void>;
  pauseForSignOut(): Promise<void>;
};

const ProgressSyncContext = createContext<ProgressSyncContextValue | null>(null);

export function ProgressSyncProvider({ accountsAvailable, children }: { accountsAvailable: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<ProgressSyncStatus>(accountsAvailable ? "checking" : "saved_locally");
  const [accountFingerprint, setAccountFingerprint] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(null);
  const [differentAccount, setDifferentAccount] = useState(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const fingerprintRef = useRef<string | null>(null);
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
    if (progressSyncRequiresAssociation(metadata, fingerprint)) setStatus("association_required");
    else if (!account?.syncEnabled) setStatus("paused");
    else if (pending > 0) setStatus("pending_upload");
    return { metadata, local, pending };
  }, []);

  const scheduleRetry = useCallback(async (fingerprint: string, kind: string) => {
    const metadata = await updateProgressSyncMetadata((latest) => {
      const next = structuredClone(latest);
      const account = next.accounts[fingerprint] ?? createDefaultProgressSyncAccount();
      account.retry.consecutiveFailures += 1;
      account.retry.nextRetryAt = nextProgressSyncRetryAt(account.retry.consecutiveFailures);
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

  const performCycle = useCallback(async (fingerprint: string) => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    const state = inspect(fingerprint);
    if (!canRunProgressSync(state.metadata, fingerprint)) return;
    if (state.local.status === "invalid" || state.local.status === "unsupported") {
      setStatus("paused");
      return;
    }
    setStatus("syncing");
    if (state.local.status === "importable") {
      const pending = pendingProgressSyncEvidence(state.local.payload, state.metadata, fingerprint);
      for (const evidence of batchProgressEvidence(pending)) {
        const response = await fetchWithTimeout("/api/progress/sync/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ protocolVersion: 1, evidence }),
        });
        if (response.status === 401) throw new SyncAuthenticationError();
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok || !isProgressImportResponse(body) || body.accountFingerprint !== fingerprint) throw new Error("push_failed");
        await updateProgressSyncMetadata((latest) => mergeProgressSyncPushResponse(latest, body, evidence));
      }
    }

    let hasMore = true;
    for (let page = 0; page < 20 && hasMore; page += 1) {
      const latest = readMetadata();
      const cursor = latest.accounts[fingerprint]?.lastPulledCursor;
      const url = cursor ? `/api/progress/sync/pull?after=${encodeURIComponent(cursor)}` : "/api/progress/sync/pull";
      const response = await fetchWithTimeout(url);
      if (response.status === 401) throw new SyncAuthenticationError();
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isProgressSyncPullResponse(body) || body.accountFingerprint !== fingerprint) throw new Error("pull_failed");
      await applyProgressSyncPullPage(body);
      hasMore = body.hasMore;
    }
    const final = inspect(fingerprint);
    setStatus(final.pending > 0 || hasMore ? "pending_upload" : "caught_up");
  }, [inspect]);

  function runForFingerprint(fingerprint: string) {
    if (inFlight.current) return inFlight.current;
    const run = async () => {
      lastAttemptRef.current = Date.now();
      try {
        if (navigator.locks) {
          await navigator.locks.request("stemforge-progress-sync-network", { mode: "exclusive", ifAvailable: true }, async (lock) => {
            if (lock) await performCycle(fingerprint);
          });
        } else {
          await performCycle(fingerprint);
        }
      } catch (error) {
        if (error instanceof SyncAuthenticationError) {
          setStatus("authentication_required");
          return;
        }
        setStatus(navigator.onLine ? "temporary_error" : "offline");
        await scheduleRetry(fingerprint, navigator.onLine ? "temporary_error" : "offline").catch(() => undefined);
      } finally {
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
        setStatus("authentication_required");
        return;
      }
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isProgressSyncContextResponse(body)) throw new Error("context_failed");
      if (!body.authenticated) {
        fingerprintRef.current = null;
        setAccountFingerprint(null);
        setStatus("authentication_required");
        return;
      }
      fingerprintRef.current = body.accountFingerprint;
      setAccountFingerprint(body.accountFingerprint);
      const state = inspect(body.accountFingerprint);
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void runForFingerprint(fingerprint), SYNC_LOCAL_CHANGE_DEBOUNCE_MS);
    };
    const online = () => { const fingerprint = fingerprintRef.current; if (fingerprint) void runForFingerprint(fingerprint); };
    const visible = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastAttemptRef.current < SYNC_VISIBILITY_REFRESH_MS) return;
      const fingerprint = fingerprintRef.current;
      if (fingerprint) void runForFingerprint(fingerprint);
    };
    window.addEventListener("stemforge:local-progress-updated", schedule);
    window.addEventListener("stemforge:progress-import-updated", schedule);
    window.addEventListener("storage", schedule);
    window.addEventListener("online", online);
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
    await updateProgressSyncMetadata((metadata) => confirmProgressSyncAssociation(metadata, fingerprint));
    inspect(fingerprint);
    await runForFingerprint(fingerprint);
  }

  async function pause() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return;
    await updateProgressSyncMetadata((metadata) => pauseProgressSync(metadata, fingerprint));
    setStatus("paused");
  }

  async function syncNow() {
    const fingerprint = fingerprintRef.current;
    if (fingerprint) await runForFingerprint(fingerprint);
  }

  async function pauseForSignOut() {
    const fingerprint = fingerprintRef.current;
    if (!fingerprint) return;
    await updateProgressSyncMetadata((metadata) => pauseProgressSync(metadata, fingerprint, true), false);
    setStatus("authentication_required");
  }

  return (
    <ProgressSyncContext.Provider value={{
      status, accountFingerprint, pendingCount, lastSuccessfulSyncAt, differentAccount,
      confirmAssociation, pause, syncNow, pauseForSignOut,
    }}>
      {children}
    </ProgressSyncContext.Provider>
  );
}

export function useProgressSync() {
  return useContext(ProgressSyncContext) ?? disabledContext;
}

const disabledContext: ProgressSyncContextValue = {
  status: "saved_locally",
  accountFingerprint: null,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  differentAccount: false,
  confirmAssociation: async () => undefined,
  pause: async () => undefined,
  syncNow: async () => undefined,
  pauseForSignOut: async () => undefined,
};

function readMetadata() {
  return readProgressSyncMetadata(
    window.localStorage.getItem(PROGRESS_SYNC_METADATA_KEY),
    window.localStorage.getItem(PROGRESS_IMPORT_METADATA_KEY),
  );
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(SYNC_REQUEST_TIMEOUT_MS) });
}

function latestTimestamp(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

class SyncAuthenticationError extends Error {}
