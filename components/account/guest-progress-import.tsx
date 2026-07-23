"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { deriveImportPresentation, studentProgressSummary } from "@/lib/account-confidence";
import Link from "next/link";

type ImportState = "checking" | "ready" | "confirming" | "importing" | "success" | "partial" | "failure" | "session_expired";

export function GuestProgressImport({
  accountFingerprint,
  returnDestination,
}: {
  accountFingerprint: string;
  returnDestination?: string | null;
}) {
  const [inspection, setInspection] = useState<LocalImportInspection | null>(null);
  const [metadata, setMetadata] = useState<ProgressImportMetadata | null>(null);
  const [state, setState] = useState<ImportState>("checking");
  const [differentAccountConfirmed, setDifferentAccountConfirmed] = useState(false);
  const importingRef = useRef(false);

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
  const presentation = deriveImportPresentation({
    phase: state,
    localStatus: inspection?.status ?? null,
    localMessage: inspection && "message" in inspection ? inspection.message : null,
    pendingCount: summary?.total ?? 0,
    differentAccount,
    differentAccountConfirmed,
  });

  async function importProgress() {
    if (importingRef.current || !pending || !summary?.total) return;
    importingRef.current = true;
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
    } finally {
      importingRef.current = false;
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

  if (presentation.kind === "checking") return <Panel title={presentation.title} body={presentation.body ?? undefined} />;
  if (presentation.kind === "attention" || presentation.kind === "empty") {
    return <Panel title={presentation.title} body={presentation.body} />;
  }
  if (state === "session_expired") {
    const next = returnDestination ?? "/account";
    return <Panel title={presentation.title} body={presentation.body} action={<Link className={primaryButton} href={`/account/sign-in?next=${encodeURIComponent(next)}`}>Sign in again</Link>} />;
  }
  if (state === "failure") {
    return <Panel title={presentation.title} body={presentation.body} action={<button className={secondaryButton} onClick={() => setState("confirming")}>Try again safely</button>} />;
  }
  if (state === "partial") {
    return <Panel title={presentation.title} body={presentation.body} action={<button className={secondaryButton} onClick={() => setState("confirming")}>Review remaining progress</button>} />;
  }
  if (state === "success") {
    return <Panel title={presentation.title} body={presentation.body} />;
  }
  if (state === "importing") return <Panel title={presentation.title} body={presentation.body ?? undefined} />;
  if (!summary?.total) {
    return <Panel title={presentation.title} body={presentation.body} />;
  }

  const countCopy = `${studentProgressSummary(summary)} saved on this browser.`;
  if (differentAccount && !differentAccountConfirmed) {
    return (
      <Panel
        title={presentation.title}
        body={presentation.body}
        detail={countCopy}
        action={<button className={secondaryButton} onClick={() => setDifferentAccountConfirmed(true)}>Continue to confirmation</button>}
      />
    );
  }
  if (state === "confirming") {
    return (
      <Panel
        title={presentation.title}
        body={presentation.body}
        detail={`${countCopy} Nothing will be deleted, and you can keep learning without importing.`}
        action={<div className="grid gap-2 sm:grid-cols-2"><button className={primaryButton} onClick={importProgress}>Add progress</button><button className={secondaryButton} onClick={() => setState("ready")}>Not now</button></div>}
      />
    );
  }
  return (
    <Panel
      title={presentation.title}
      body={presentation.body}
      detail={`${countCopy} ${inspection && "warning" in inspection && inspection.warning ? `${inspection.warning} ` : ""}Import is a one-off action. Cross-device sync remains a separate choice.`}
      action={<button className={primaryButton} onClick={() => setState("confirming")}>Review and add progress</button>}
    />
  );
}

function Panel({ title, body, detail, action }: { title: string; body?: string; detail?: string; action?: React.ReactNode }) {
  return (
    <section data-testid="guest-progress-import" className="mt-5 rounded-xl border border-line bg-paper p-4" aria-live="polite">
      <h2 className="m-0 text-lg font-extrabold">{title}</h2>
      {body ? <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">{body}</p> : null}
      {detail ? <p className="mb-0 mt-2 text-xs leading-relaxed text-muted">{detail}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

const primaryButton = "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-forge px-5 text-sm font-extrabold uppercase text-white disabled:opacity-60";
const secondaryButton = "min-h-11 w-full rounded-md border border-ink bg-white px-5 text-sm font-extrabold uppercase text-ink";
