"use client";

import { useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, MessageSquare, X } from "lucide-react";
import { useAuthFeatureAvailable } from "@/components/auth-feature-provider";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { createReportDiagnosticContext } from "@/lib/beta-reports/report-diagnostics";
import { getOrCreateGuestReportSessionId, recordBetaReportReceipt } from "@/lib/beta-reports/report-receipts";
import { BETA_REPORT_SCHEMA_VERSION, type BetaReportKind, type SafeContentReference, type SubmitBetaReportResult } from "@/lib/beta-reports/report-types";

type ReportDialogProps = {
  triggerLabel?: string;
  defaultKind?: BetaReportKind;
  pageArea?: string;
  contentReference?: SafeContentReference | null;
  practiceSessionMode?: string | null;
  component?: string | null;
  className?: string;
};

function formatPageArea(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : value;
}

const kindLabels: Record<BetaReportKind, string> = {
  bug: "Something is broken",
  feedback: "General feedback",
  support_request: "I need support",
  content_issue: "Question/content issue",
  account_issue: "Account or sync issue",
};

export function ReportDialog({
  triggerLabel = "Send feedback",
  defaultKind = "feedback",
  pageArea = "global",
  contentReference = null,
  practiceSessionMode = null,
  component = null,
  className = "",
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<BetaReportKind>(defaultKind);
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "accepted" | "failed">("idle");
  const [resultMessage, setResultMessage] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const accountsAvailable = useAuthFeatureAvailable();
  const descriptionId = useId();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const diagnostics = open ? createReportDiagnosticContext({
    pageArea,
    contentReference,
    practiceSessionMode,
    component,
    authState: accountsAvailable ? "guest" : "disabled",
  }) : null;

  useModalFocusTrap({
    open,
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    triggerRef,
    onClose: () => setOpen(false),
  });

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 3 || state === "submitting") return;
    setState("submitting");
    setResultMessage("");
    const guestSessionId = getOrCreateGuestReportSessionId();
    const diagnosticContext = createReportDiagnosticContext({
      pageArea,
      contentReference,
      practiceSessionMode,
      component,
      authState: accountsAvailable ? "guest" : "disabled",
    });
    try {
      const response = await fetch("/api/beta-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: BETA_REPORT_SCHEMA_VERSION,
          kind,
          userMessage: message,
          contactEmail: contactEmail.trim() || null,
          guestSessionId,
          pagePath: window.location.pathname,
          pageArea,
          diagnosticContext,
          honeypot,
        }),
      });
      const body = await response.json() as SubmitBetaReportResult;
      if (body.status !== "accepted") {
        setState("failed");
        setResultMessage(body.message);
        return;
      }
      setState("accepted");
      setReportId(body.reportId);
      recordBetaReportReceipt({
        reportId: body.reportId,
        kind,
        createdAt: new Date().toISOString(),
        pageArea,
        source: "guest",
        status: "new",
      });
      setMessage("");
      setContactEmail("");
      setResultMessage(`Report ${body.reportId} saved. Thanks — that gives us enough to look into it without sending your answers.`);
    } catch {
      setState("failed");
      setResultMessage("Feedback could not be sent just now. Please try again in a moment.");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen(true);
          setKind(defaultKind);
          setState("idle");
          setResultMessage("");
          setReportId(null);
        }}
        className={className || "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-forge shadow-sm transition hover:border-forge"}
      >
        <MessageSquare className="size-4" />
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4" role="presentation">
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl border border-line bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-extrabold uppercase text-forge">Private beta report</p>
                <h2 id={titleId} className="mt-1 text-2xl font-extrabold">Tell us what happened</h2>
                <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
                  We only attach safe diagnostics like page, device category and content IDs. We do not send your answers, local progress history, passwords, cookies or browser storage.
                </p>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close report form" className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitReport} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                Report type
                <select value={kind} onChange={(event) => setKind(event.target.value as BetaReportKind)} className="min-h-11 rounded-lg border border-line bg-white px-3 font-normal">
                  {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                What should we know?
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={3} maxLength={2000} required rows={5} className="rounded-lg border border-line p-3 font-normal leading-relaxed" placeholder="A short description is enough. Please do not paste passwords or private data." />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Contact email (optional)
                <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="min-h-11 rounded-lg border border-line px-3 font-normal" placeholder="Only if you want us to follow up" />
              </label>
              <label className="hidden">
                Leave this blank
                <input value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" />
              </label>
              {diagnostics ? (
                <div className="rounded-xl border border-line bg-paper p-3 text-xs text-muted">
                  <p className="font-bold text-ink">What we&apos;ll attach</p>
                  <p className="mt-1">Page: {diagnostics.route} · Area: {formatPageArea(diagnostics.pageArea) ?? "general"} · Device: {diagnostics.viewportCategory} · Online: {diagnostics.online ? "yes" : "no"}</p>
                  {diagnostics.contentReference?.questionId ? <p>Question: {diagnostics.contentReference.questionId} (version {diagnostics.contentReference.questionVersion ?? "unknown"})</p> : null}
                </div>
              ) : null}
              {resultMessage ? (
                <div role={state === "failed" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${state === "failed" ? "border-danger/30 bg-danger-soft text-danger" : "border-success/30 bg-success-soft text-ink"}`}>
                  {state === "failed" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />}
                  <span>{resultMessage}</span>
                </div>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                {reportId ? <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-lg border border-line px-4 font-bold">Close</button> : null}
                <button type="submit" disabled={state === "submitting" || message.trim().length < 3} className="inline-flex min-h-10 items-center rounded-lg bg-forge px-5 font-extrabold text-white disabled:opacity-45">
                  {state === "submitting" ? "Sending..." : "Send report"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
