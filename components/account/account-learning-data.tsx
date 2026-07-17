"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { downloadCurrentBrowserExport } from "@/lib/account-data/browser-export";
import { ERASURE_CONFIRMATION_TEXT, type SafeErasureRequest } from "@/lib/account-data/types";

type StatusResponse = { request: SafeErasureRequest | null; state: { generation: string } };

export function CurrentBrowserExportButton() {
  const [message, setMessage] = useState<string | null>(null);
  return <div className="mt-5 rounded-xl border border-line bg-paper p-4">
    <h2 className="m-0 text-base font-extrabold">This browser&apos;s data</h2>
    <p className="mb-0 mt-2 text-sm">Download progress and account-related information stored on this browser.</p>
    <button className={secondaryButton} type="button" onClick={() => {
      try { downloadCurrentBrowserExport(window.localStorage); setMessage("This browser's data export is ready."); }
      catch { setMessage("This browser's data could not be exported safely."); }
    }}>Download this browser&apos;s data</button>
    {message ? <p role="status" className="mb-0 mt-2 text-sm">{message}</p> : null}
  </div>;
}

export function AccountLearningData() {
  const sync = useProgressSync();
  const [request, setRequest] = useState<SafeErasureRequest | null>(null);
  const [generation, setGeneration] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [browserClean, setBrowserClean] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/account-data/erasure", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json() as StatusResponse;
    setRequest(body.request);
    setGeneration(body.state.generation);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (request?.status !== "scheduled" && request?.status !== "processing") return;
    const interval = window.setInterval(() => void refresh(), 2_000);
    return () => window.clearInterval(interval);
  }, [refresh, request?.status]);
  useEffect(() => { if (request?.status === "awaiting_reauthentication") passwordRef.current?.focus(); }, [request?.status]);

  async function mutate(path: string, body: unknown) {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => null) as { request?: SafeErasureRequest; message?: string } | null;
      if (!response.ok || !result?.request) throw new Error(result?.message ?? "The request could not be completed.");
      setRequest(result.request); setPassword(""); setConfirmation(""); return result.request;
    } catch (error) { setMessage(error instanceof Error ? error.message : "The request could not be completed."); return null; }
    finally { setBusy(false); }
  }

  async function exportRemote() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/account-data/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? "Export failed."); }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "stem-forge-account-data.json";
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
      setPassword(""); setMessage("Your remote learning-data export is ready.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(false); }
  }

  async function reconcile() {
    if (!request?.generationBefore || !request.generationAfter) return;
    setBusy(true); setMessage(null);
    try {
      const removed = await sync.reconcileRemoteErasure(request.generationBefore, request.generationAfter);
      setBrowserClean(true); setMessage(`${removed} older account-attributable browser record${removed === 1 ? " was" : "s were"} removed. Anonymous progress never acknowledged remotely was preserved.`);
    } catch { setMessage("Remote learning progress was deleted, but this browser could not be verified as clean. Export its data, retry, or clear all browser progress."); }
    finally { setBusy(false); }
  }

  const scheduledSeconds = request?.status === "scheduled" && request.cancellationDeadline
    ? Math.max(0, Math.ceil((Date.parse(request.cancellationDeadline) - Date.now()) / 1000)) : null;

  return (
    <section className="mt-5 rounded-xl border border-line bg-white p-4" data-testid="account-learning-data">
      <h2 className="m-0 text-lg font-extrabold">Your data</h2>
      <div className="mt-4 grid gap-4">
        <div className="rounded-lg border border-line bg-paper p-4">
          <h3 className="m-0 text-base font-extrabold">Export</h3>
          <p className="mb-0 mt-2 text-sm">Download a copy of the learning data stored in your STEM Forge account.</p>
          <label className="mt-3 block text-sm font-bold">Current password<input className={inputClass} ref={request?.status === "awaiting_reauthentication" ? passwordRef : undefined} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className={secondaryButton} type="button" disabled={busy || !password} onClick={() => void exportRemote()}>Download remote account learning data</button>
          <p className="mb-0 mt-4 text-sm">Download progress and account-related information stored on this browser.</p>
          <button className={secondaryButton} type="button" onClick={() => downloadCurrentBrowserExport(window.localStorage)}>Download this browser&apos;s data</button>
          <p className="mb-0 mt-2 text-xs text-muted">The account export covers remotely stored learning evidence. The browser export contains only this browser&apos;s local data and works in guest mode.</p>
        </div>

        <div className="rounded-lg border border-danger/30 bg-danger-soft p-4">
          <h3 className="m-0 text-base font-extrabold">Delete learning progress stored in your STEM Forge account.</h3>
          <p className="mb-0 mt-2 text-sm">This deletes remotely stored attempts, support activity, achievement records and retained progress conflicts. Your login account will remain active.</p>
          <p className="mb-0 mt-2 text-sm">Progress created without an account may remain on this browser unless you clear it separately. Offline browsers may need reconciliation.</p>
          <p className="mb-0 mt-2 text-xs">Deleted data may remain in restricted backups until those backups expire. The provisional target is a 30-day rolling retention and depends on deployment configuration.</p>
          {!request || request.status === "cancelled" ? <button className={dangerButton} type="button" disabled={busy} onClick={() => void mutate("/api/account-data/erasure", {})}>Start deletion</button> : null}
          {request?.status === "awaiting_reauthentication" ? <div><p className="text-sm font-bold">Confirm your identity again before continuing.</p><button className={dangerButton} disabled={busy || !password} onClick={() => void mutate("/api/account-data/erasure/reauthenticate", { requestId: request.requestId, password })}>Confirm password</button></div> : null}
          {request?.status === "awaiting_confirmation" ? <div><p className="text-sm">Review: remote learning progress is deleted; the login remains active; offline browsers may need reconciliation; anonymous local progress may remain; processing is irreversible.</p><label className="block text-sm font-bold">Type DELETE MY LEARNING DATA to confirm.<input className={inputClass} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><button className={dangerButton} disabled={busy || confirmation !== ERASURE_CONFIRMATION_TEXT} onClick={() => void mutate("/api/account-data/erasure/confirm", { requestId: request.requestId, confirmation })}>Schedule deletion</button></div> : null}
          {request?.status === "scheduled" ? <div role="status"><p className="text-sm font-bold">Deletion will begin in 10 minutes. You can cancel until processing starts.</p><p className="text-sm">Approximately {scheduledSeconds} seconds remain. After processing begins, this cannot be undone.</p><button className={secondaryButton} disabled={busy || scheduledSeconds === 0} onClick={() => void mutate("/api/account-data/erasure/cancel", { requestId: request.requestId })}>Cancel deletion</button></div> : null}
          {request?.status === "processing" ? <p role="status" className="text-sm font-bold">Deletion is being processed. Synchronization is paused on every device.</p> : null}
          {request?.status === "failed_retryable" ? <p role="alert" className="text-sm font-bold">Deletion could not finish safely. Synchronization remains paused; retry status processing or contact support.</p> : null}
          {request?.status === "cancelled" ? <p role="status" className="text-sm font-bold">Deletion was cancelled before processing began.</p> : null}
          {request?.status === "completed" ? <div><p role="status" className="text-sm font-bold">Remote learning progress was deleted.</p>{!browserClean ? <><p className="text-sm">This browser still contains older local copies. Review and clean them before syncing again.</p><button className={dangerButton} disabled={busy} onClick={() => void reconcile()}>Reconcile this browser</button></> : <p className="text-sm font-bold">Remote deletion and this browser&apos;s cleanup are complete.</p>}</div> : null}
        </div>
      </div>
      {message ? <p role="status" className="mt-4 rounded-lg border border-line bg-paper p-3 text-sm">{message}</p> : null}
      {generation ? <p className="mb-0 mt-3 text-xs text-muted">Account data generation {generation}. Old browser generations cannot synchronize until reviewed.</p> : null}
    </section>
  );
}

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-line bg-white px-3 text-base";
const secondaryButton = "mt-3 min-h-11 w-full rounded-md border border-ink bg-white px-4 text-sm font-extrabold";
const dangerButton = "mt-3 min-h-11 w-full rounded-md bg-danger px-4 text-sm font-extrabold text-white disabled:opacity-50";
