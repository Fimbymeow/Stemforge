"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { DialogShell } from "@/components/dialog-shell";
import { useProgressSync } from "@/components/progress-sync-provider";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { downloadCurrentBrowserExport } from "@/lib/account-data/browser-export";
import { ERASURE_CONFIRMATION_TEXT, type SafeErasureRequest } from "@/lib/account-data/types";

type StatusResponse = { request: SafeErasureRequest | null; state: { generation: string } };

export function CurrentBrowserExportButton() {
  const [message, setMessage] = useState<string | null>(null);
  return <div className="mt-5 rounded-xl border border-line bg-paper p-4">
    <h2 className="m-0 text-base font-extrabold">This browser&apos;s data</h2>
    <p className="mb-0 mt-2 text-sm">Download progress and account-related information stored on this browser.</p>
    <button className={legacySecondaryButton} type="button" onClick={() => {
      try { downloadCurrentBrowserExport(window.localStorage); setMessage("This browser's data export is ready."); }
      catch { setMessage("This browser's data could not be exported safely."); }
    }}>Download this browser&apos;s data</button>
    {message ? <p role="status" className="mb-0 mt-2 text-sm">{message}</p> : null}
  </div>;
}

export function AccountLearningData({ mode }: { mode: "exports" | "danger" }) {
  const sync = useProgressSync();
  const [request, setRequest] = useState<SafeErasureRequest | null>(null);
  const [generation, setGeneration] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [browserClean, setBrowserClean] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useModalFocusTrap({ open: dialogOpen, containerRef: dialogRef, initialFocusRef: cancelRef, onClose: () => setDialogOpen(false) });

  const refresh = useCallback(async () => {
    const response = await fetch("/api/account-data/erasure", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json() as StatusResponse;
    setRequest(body.request);
    setGeneration(body.state.generation);
  }, []);

  useEffect(() => { if (mode === "danger") void refresh(); }, [mode, refresh]);
  useEffect(() => {
    if (mode !== "danger" || (request?.status !== "scheduled" && request?.status !== "processing")) return;
    const interval = window.setInterval(() => void refresh(), 2_000);
    return () => window.clearInterval(interval);
  }, [mode, refresh, request?.status]);
  useEffect(() => { if (dialogOpen && request?.status === "awaiting_reauthentication") passwordRef.current?.focus(); }, [dialogOpen, request?.status]);

  async function mutate(path: string, body: unknown) {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => null) as { request?: SafeErasureRequest; message?: string } | null;
      if (!response.ok || !result?.request) throw new Error(result?.message ?? "The request could not be completed.");
      setRequest(result.request); setPassword(""); setConfirmation("");
      setDialogOpen(result.request.status === "awaiting_reauthentication" || result.request.status === "awaiting_confirmation");
      return result.request;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be completed.");
      return null;
    } finally { setBusy(false); }
  }

  async function exportRemote() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/account-data/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? "Export failed."); }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "orthic-account-data.json";
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
      setPassword(""); setMessage("Your account data export is ready.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(false); }
  }

  async function reconcile() {
    if (!request?.generationBefore || !request.generationAfter) return;
    setBusy(true); setMessage(null);
    try {
      const removed = await sync.reconcileRemoteErasure(request.generationBefore, request.generationAfter);
      setBrowserClean(true); setMessage(`${removed} older item${removed === 1 ? " belonging" : "s belonging"} to this account ${removed === 1 ? "was" : "were"} removed from this browser. Progress never added to your account was left alone.`);
    } catch { setMessage("Your account's learning progress was deleted, but this browser couldn't be confirmed clean. Export its data, retry, or clear all browser progress."); }
    finally { setBusy(false); }
  }

  if (mode === "exports") return (
    <section className="p-4 sm:p-5" data-testid="account-data-exports">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-sm font-extrabold">Export data</h3>
          <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">Download account learning data or a separate copy of information stored only in this browser.</p>
        </div>
        <div className="grid w-full max-w-sm gap-3">
          <label className="text-sm font-bold">Current password<input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <Button variant="secondary" disabled={busy || !password} onClick={() => void exportRemote()}>Download remote account learning data</Button>
          <Button variant="secondary" onClick={() => downloadCurrentBrowserExport(window.localStorage)}>Download this browser&apos;s data</Button>
        </div>
      </div>
      {message ? <p role="status" className="mb-0 mt-4 rounded-lg bg-paper p-3 text-sm">{message}</p> : null}
    </section>
  );

  const scheduledSeconds = request?.status === "scheduled" && request.cancellationDeadline
    ? Math.max(0, Math.ceil((Date.parse(request.cancellationDeadline) - Date.now()) / 1000)) : null;
  const needsConfirmation = request?.status === "awaiting_reauthentication" || request?.status === "awaiting_confirmation";

  return (
    <section className="p-4 sm:p-5" data-testid="account-learning-data">
      <h3 className="m-0 text-sm font-extrabold text-danger">Account learning data</h3>
      <p className="mb-0 mt-1 text-sm leading-relaxed text-muted">Permanently delete learning progress and learner preferences stored in your Orthic account. Your login remains active.</p>
      <p className="mb-0 mt-2 text-xs leading-relaxed text-muted">Deleted data may remain in secure backups for up to 30 days before those backups expire. This is a provisional target and may change.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!request || request.status === "cancelled" ? <Button variant="destructive" disabled={busy} onClick={() => void mutate("/api/account-data/erasure", {})}>Start deletion</Button> : null}
        {needsConfirmation && !dialogOpen ? <Button variant="destructive" disabled={busy} onClick={() => setDialogOpen(true)}>Continue deletion</Button> : null}
      </div>
      {request?.status === "scheduled" ? <div role="status" className="mt-4 rounded-lg bg-danger-soft p-3"><p className="m-0 text-sm font-bold">Deletion will begin in 10 minutes. You can cancel until processing starts.</p><p className="mb-0 mt-1 text-sm">Approximately {scheduledSeconds} seconds remain. After processing begins, this cannot be undone.</p><Button className="mt-3" variant="secondary" disabled={busy || scheduledSeconds === 0} onClick={() => void mutate("/api/account-data/erasure/cancel", { requestId: request.requestId })}>Cancel deletion</Button></div> : null}
      {request?.status === "processing" ? <p role="status" className="mt-4 text-sm font-bold">Deletion is being processed. Sync is paused on every device.</p> : null}
      {request?.status === "failed_retryable" ? <p role="alert" className="mt-4 text-sm font-bold text-danger">Deletion couldn&apos;t finish safely. Sync remains paused — retry, or contact support.</p> : null}
      {request?.status === "cancelled" ? <p role="status" className="mt-4 text-sm font-bold">Deletion was cancelled before processing began.</p> : null}
      {request?.status === "completed" ? <div className="mt-4"><p role="status" className="text-sm font-bold">Remote learning progress and preferences were deleted.</p>{!browserClean ? <><p className="text-sm">This browser still contains older local copies. Review and clean them before syncing again.</p><Button variant="destructive" disabled={busy} onClick={() => void reconcile()}>Reconcile this browser</Button></> : <p className="text-sm font-bold">Remote deletion and this browser&apos;s cleanup are complete.</p>}</div> : null}
      {message ? <p role="status" className="mb-0 mt-4 rounded-lg bg-paper p-3 text-sm">{message}</p> : null}
      {generation && request?.status === "completed" && !browserClean ? <p className="mb-0 mt-3 text-xs text-muted">Review this browser before turning cross-device sync on again.</p> : null}

      {dialogOpen && needsConfirmation ? <DialogShell ref={dialogRef} role="alertdialog" labelledBy="account-erasure-title" describedBy="account-erasure-description" size="sm">
        <h2 id="account-erasure-title" className="m-0 text-xl font-extrabold">Delete account learning data?</h2>
        <p id="account-erasure-description" className="mb-0 mt-3 text-sm leading-relaxed text-muted">Your login will remain active. Offline browsers may need cleanup, guest data may remain locally, and processing cannot be undone once it begins.</p>
        {request.status === "awaiting_reauthentication" ? <label className="mt-4 block text-sm font-bold">Current password<input ref={passwordRef} className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label> : null}
        {request.status === "awaiting_confirmation" ? <label className="mt-4 block text-sm font-bold">Type DELETE MY LEARNING DATA to confirm.<input className={inputClass} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" disabled={busy} onClick={() => setDialogOpen(false)}>Cancel</Button>
          {request.status === "awaiting_reauthentication" ? <Button variant="destructive" disabled={busy || !password} onClick={() => void mutate("/api/account-data/erasure/reauthenticate", { requestId: request.requestId, password })}>Confirm password</Button> : null}
          {request.status === "awaiting_confirmation" ? <Button variant="destructive" disabled={busy || confirmation !== ERASURE_CONFIRMATION_TEXT} onClick={() => void mutate("/api/account-data/erasure/confirm", { requestId: request.requestId, confirmation })}>Schedule deletion</Button> : null}
        </div>
      </DialogShell> : null}
    </section>
  );
}

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-forge focus:ring-2 focus:ring-forge/20";
const legacySecondaryButton = "mt-3 min-h-11 w-full rounded-lg border border-ink bg-white px-4 text-sm font-extrabold";
