"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress/storage";
import { batchProgressEvidence } from "@/lib/progress/import-batching";
import {
  PROGRESS_IMPORT_METADATA_KEY,
  evidenceSummary,
  inspectLocalProgress,
  mergeImportResponse,
  pendingEvidence,
  readProgressImportMetadata,
  wasAcknowledgedForDifferentAccount,
  type LocalImportInspection,
  type ProgressImportMetadata,
} from "@/lib/progress/import-metadata";
import { isProgressImportResponse, type ProgressImportErrorResponse } from "@/lib/progress/import-protocol";
import { isProgressSyncContextResponse } from "@/lib/progress/sync-protocol";
import { recordRemoteEvidenceAcknowledgements } from "@/lib/progress/local-progress-transaction";

type ImportState = "checking" | "ready" | "confirming" | "importing" | "success" | "partial" | "failure" | "session_expired";

export function GuestProgressImport({ accountFingerprint }: { accountFingerprint: string }) {
  const [inspection, setInspection] = useState<LocalImportInspection | null>(null);
  const [metadata, setMetadata] = useState<ProgressImportMetadata | null>(null);
  const [state, setState] = useState<ImportState>("checking");
  const [differentAccountConfirmed, setDifferentAccountConfirmed] = useState(false);

  const refresh = useCallback(() => {
    const nextInspection = inspectLocalProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
    const nextMetadata = readProgressImportMetadata(window.localStorage.getItem(PROGRESS_IMPORT_METADATA_KEY));
    setInspection(nextInspection);
    setMetadata(nextMetadata);
    setState((current) => current === "importing" ? current : "ready");
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROGRESS_STORAGE_KEY || event.key === PROGRESS_IMPORT_METADATA_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("stemforge:local-progress-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("stemforge:local-progress-updated", refresh);
    };
  }, [refresh]);

  const pending = useMemo(() => {
    if (!inspection || inspection.status !== "importable" || !metadata) return null;
    return pendingEvidence(inspection.payload, metadata, accountFingerprint);
  }, [accountFingerprint, inspection, metadata]);
  const summary = pending ? evidenceSummary(pending) : null;
  const differentAccount = metadata ? wasAcknowledgedForDifferentAccount(metadata, accountFingerprint) : false;

  async function importProgress() {
    if (!pending || !summary?.total) return;
    setState("importing");
    let partial = false;
    try {
      const contextResponse = await fetch("/api/progress/sync/context", { cache: "no-store" });
      const contextBody: unknown = await contextResponse.json().catch(() => null);
      if (!contextResponse.ok || !isProgressSyncContextResponse(contextBody) || !contextBody.authenticated || contextBody.accountDataStatus !== "active") {
        throw new Error("account_context_unavailable");
      }
      for (const evidence of batchProgressEvidence(pending)) {
        const response = await fetch("/api/progress/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ protocolVersion: 1, expectedGeneration: contextBody.accountGeneration, evidence }),
        });
        const body: unknown = await response.json().catch(() => null);
        if (response.status === 401) {
          setState("session_expired");
          return;
        }
        if (!response.ok || !isProgressImportResponse(body) || body.accountFingerprint !== accountFingerprint) {
          const message = body as Partial<ProgressImportErrorResponse> | null;
          if (message?.error === "sign_in_required") setState("session_expired");
          else setState("failure");
          return;
        }
        const merged = await persistAcknowledgements(body);
        await recordRemoteEvidenceAcknowledgements(accountFingerprint, contextBody.accountGeneration, [
          ...body.accepted, ...body.alreadyPresent, ...body.conflictRetained,
        ].map((item) => `${item.kind}:${item.eventId}`));
        setMetadata(merged);
        partial ||= body.batchStatus !== "committed" || body.rejected.length > 0 || body.notProcessed.length > 0;
      }
      setState(partial ? "partial" : "success");
    } catch {
      setState("failure");
    }
  }

  async function persistAcknowledgements(response: Parameters<typeof mergeImportResponse>[1]) {
    const write = () => {
      const latest = readProgressImportMetadata(window.localStorage.getItem(PROGRESS_IMPORT_METADATA_KEY));
      const merged = mergeImportResponse(latest, response);
      window.localStorage.setItem(PROGRESS_IMPORT_METADATA_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("stemforge:progress-import-updated"));
      return merged;
    };
    if (navigator.locks) {
      return navigator.locks.request("stemforge-progress-import-metadata", { mode: "exclusive" }, write);
    }
    return write();
  }

  if (state === "checking" || !inspection || !metadata) return <Panel title="Checking browser progress…" />;
  if (inspection.status === "invalid" || inspection.status === "unsupported") {
    return <Panel title="Browser progress needs attention" body={inspection.message} />;
  }
  if (inspection.status === "empty") return <Panel title="No browser progress found" body="No progress is saved in this browser yet." />;
  if (state === "session_expired") {
    return <Panel title="Sign in again" body="Your session has expired. Sign in again to continue; browser progress is still safe." />;
  }
  if (state === "failure") {
    return <Panel title="Progress not added" body="Progress could not be added just now. Nothing was deleted—please try again." action={<button className={secondaryButton} onClick={() => setState("confirming")}>Try again</button>} />;
  }
  if (state === "partial") {
    return <Panel title="Some progress was added" body="Some progress was added. A few records could not be processed and remain safely stored here." action={<button className={secondaryButton} onClick={() => setState("confirming")}>Review remaining progress</button>} />;
  }
  if (state === "success") {
    return <Panel title="Browser progress added" body="Browser progress was added to your account. Your local copy is still available." />;
  }
  if (state === "importing") return <Panel title="Adding browser progress…" body="Your local copy remains safely stored in this browser." />;
  if (!summary?.total) {
    return <Panel title="Browser progress already added" body="All current browser progress has already been added to this account." />;
  }

  const countCopy = `${summary.attempts} attempt${summary.attempts === 1 ? "" : "s"}, ${summary.supportEvents} support event${summary.supportEvents === 1 ? "" : "s"} and ${summary.achievements} achievement record${summary.achievements === 1 ? "" : "s"} are saved here.`;
  if (differentAccount && !differentAccountConfirmed) {
    return (
      <Panel
        title="Check which account should receive this progress"
        body="This browser’s progress was previously added to a different account. Continue only if this progress should also be added to the account currently signed in."
        detail={countCopy}
        action={<button className={secondaryButton} onClick={() => setDifferentAccountConfirmed(true)}>Continue to confirmation</button>}
      />
    );
  }
  if (state === "confirming") {
    return (
      <Panel
        title="Add progress to your account"
        body="Add this browser’s progress to your account? Existing account progress will be kept and matching records will not be duplicated."
        detail={countCopy}
        action={<div className="grid gap-2 sm:grid-cols-2"><button className={primaryButton} onClick={importProgress}>Add progress</button><button className={secondaryButton} onClick={() => setState("ready")}>Not now</button></div>}
      />
    );
  }
  return (
    <Panel
      title="Progress from this browser is ready to add to your account."
      body={countCopy}
      detail={`${"warning" in inspection && inspection.warning ? `${inspection.warning} ` : ""}This adds your progress once. It doesn't turn on automatic updates across devices, and resetting progress on this browser won't remove progress already added to your account.`}
      action={<button className={primaryButton} onClick={() => setState("confirming")}>Review and add progress</button>}
    />
  );
}

function Panel({ title, body, detail, action }: { title: string; body?: string; detail?: string; action?: React.ReactNode }) {
  return (
    <section data-testid="guest-progress-import" className="mt-5 rounded-xl border border-line bg-paper p-4" aria-live="polite">
      <strong>{title}</strong>
      {body ? <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">{body}</p> : null}
      {detail ? <p className="mb-0 mt-2 text-xs leading-relaxed text-muted">{detail}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

const primaryButton = "min-h-11 w-full rounded-md bg-forge px-5 text-sm font-extrabold uppercase text-white disabled:opacity-60";
const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-5 text-sm font-extrabold uppercase text-ink";
