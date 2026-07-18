"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BetaReportSeverity, BetaReportStatus, ReproductionStatus } from "@/lib/beta-reports/report-types";
import { validateWorkflowChange, type UpdateBetaReportWorkflowRequest } from "@/lib/beta-reports/report-workflow";

type Workflow = { reportId: string; status: BetaReportStatus; severity: BetaReportSeverity; reproductionStatus: ReproductionStatus; duplicateOf: string | null; resolutionSummary: string | null; stateVersion: number };

export function ReportWorkflowForm({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const update: UpdateBetaReportWorkflowRequest = {
      expectedVersion: workflow.stateVersion, status: data.get("status"), severity: data.get("severity"),
      reproductionStatus: data.get("reproductionStatus"), duplicateOf: String(data.get("duplicateOf") ?? "").trim() || null,
      resolutionSummary: String(data.get("resolutionSummary") ?? "").trim() || null,
    } as UpdateBetaReportWorkflowRequest;
    const validationError = validateWorkflowChange(workflow, update);
    if (validationError) { setMessage(validationError); setSubmitting(false); return; }
    const response = await fetch(`/api/internal/beta-reports/${workflow.reportId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body.message ?? "The workflow update could not be saved."); setSubmitting(false); if (response.status === 409) router.refresh(); return; }
    setMessage("Workflow updated."); setSubmitting(false); router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-4" aria-label="Report workflow">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select name="status" label="Status" value={workflow.status} values={["new","triaged","in_progress","resolved","closed"]} />
        <Select name="severity" label="Severity" value={workflow.severity} values={["low","normal","high","critical"]} />
        <Select name="reproductionStatus" label="Reproduction" value={workflow.reproductionStatus} values={["not_checked","unable_to_reproduce","reproduced","needs_more_information"]} />
      </div>
      <label className="grid gap-1 text-sm font-bold">Duplicate of<input name="duplicateOf" defaultValue={workflow.duplicateOf ?? ""} pattern="SF-[A-Z0-9]{10}" placeholder="SF-XXXXXXXXXX" className="min-h-11 rounded-lg border border-line px-3 font-normal uppercase" /></label>
      <label className="grid gap-1 text-sm font-bold">Resolution or closure summary<textarea name="resolutionSummary" defaultValue={workflow.resolutionSummary ?? ""} maxLength={2000} rows={5} className="rounded-lg border border-line p-3 font-normal" /></label>
      <p className="text-xs text-muted">Resolving requires a summary. Closing requires a summary or valid duplicate. Learner messages and diagnostics cannot be changed.</p>
      <div className="flex flex-wrap items-center gap-3"><button disabled={submitting} className="inline-flex min-h-11 items-center rounded-lg bg-forge px-5 font-extrabold text-white disabled:opacity-50">{submitting ? "Saving..." : "Save workflow"}</button><span role="status" aria-live="polite" className="text-sm font-bold">{message}</span></div>
    </form>
  );
}

function Select({ name, label, value, values }: { name: string; label: string; value: string; values: string[] }) { return <label className="grid gap-1 text-sm font-bold">{label}<select name={name} defaultValue={value} className="min-h-11 rounded-lg border border-line bg-white px-3 font-normal">{values.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>; }
