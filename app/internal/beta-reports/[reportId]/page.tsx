import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InternalOperationsShell } from "@/components/internal/beta-reports/internal-operations-shell";
import { ReportWorkflowForm } from "@/components/internal/beta-reports/report-workflow-form";
import { getInternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization.server";
import { PostgresInternalBetaReportRepository } from "@/lib/beta-reports/internal-report-repository.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Internal beta report detail", robots: { index: false, follow: false, nocache: true } };

export default async function InternalBetaReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const access = await getInternalOperationsAuthorization();
  if (access.status !== "authorized") notFound();
  const { reportId } = await params;
  if (!/^SF-[A-Z0-9]{10}$/.test(reportId)) notFound();
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresInternalBetaReportRepository(pool);
    const [report, audit] = await Promise.all([repository.getBetaReport(reportId), repository.listAuditEvents(reportId)]);
    if (!report) notFound();
    const diagnostic = report.diagnosticContext;
    return (
      <InternalOperationsShell>
        <Link href="/internal/beta-reports" className="inline-flex min-h-11 items-center font-bold text-forge underline">Back to report queue</Link>
        <header className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-sm font-bold text-forge">{report.reportId}</p><h1 className="mt-1 text-3xl font-black">{label(report.kind)}</h1></div><div className="flex flex-wrap gap-2"><Badge value={`${label(report.severity)} severity`} strong={report.severity === "critical" || report.severity === "high"} /><Badge value={label(report.status)} /><Badge value={label(report.reproductionStatus)} /></div></header>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <div className="grid gap-6">
            <Section title="Learner submission"><dl className="grid gap-3 sm:grid-cols-2"><Field label="Source" value={report.ownerId ? "Authenticated" : "Guest"} /><Field label="Created" value={formatDate(report.createdAt)} /><Field label="Page" value={report.pagePath} /><Field label="Page area" value={report.pageArea ?? "General"} /></dl><div className="mt-4"><h3 className="text-sm font-bold text-muted">Message</h3><p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-paper p-4">{report.userMessage}</p></div>{report.contactEmail ? <div className="mt-4"><h3 className="text-sm font-bold text-muted">User-provided contact email</h3><p className="mt-1 break-all">{report.contactEmail}</p></div> : null}</Section>
            <Section title="Safe diagnostic context"><dl className="grid gap-3 sm:grid-cols-2"><Field label="App version" value={diagnostic.appVersion} /><Field label="Build" value={diagnostic.buildCommit ?? "Not supplied"} /><Field label="Environment" value={diagnostic.environmentLabel} /><Field label="Viewport" value={diagnostic.viewportCategory} /><Field label="Browser" value={[diagnostic.browserName, diagnostic.browserVersion].filter(Boolean).join(" ") || "Not supplied"} /><Field label="Operating system" value={diagnostic.operatingSystem ?? "Not supplied"} /><Field label="Online" value={diagnostic.online ? "Yes" : "No"} /><Field label="Auth state" value={diagnostic.authState} /><Field label="Sync state" value={diagnostic.syncState ?? "Not supplied"} /><Field label="Account generation" value={diagnostic.accountGenerationState ?? "Not supplied"} /><Field label="Error code" value={diagnostic.errorCode ?? "None"} /><Field label="Practice mode" value={diagnostic.practiceSessionMode ?? "None"} /><Field label="Component" value={diagnostic.component ?? "Not supplied"} /><Field label="Locale / timezone" value={[diagnostic.locale, diagnostic.timezone].filter(Boolean).join(" / ") || "Not supplied"} /></dl>{report.contentContext ? <div className="mt-4"><h3 className="text-sm font-bold text-muted">Safe content references</h3><dl className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(report.contentContext).map(([key, value]) => <Field key={key} label={label(key)} value={String(value)} />)}</dl></div> : null}</Section>
          </div>
          <aside className="grid content-start gap-6"><Section title="Internal workflow"><ReportWorkflowForm workflow={{ reportId: report.reportId, status: report.status, severity: report.severity, reproductionStatus: report.reproductionStatus, duplicateOf: report.duplicateOf, resolutionSummary: report.resolutionSummary, stateVersion: report.stateVersion }} /></Section><Section title="Triage timestamps"><dl className="grid gap-3"><Field label="Last updated" value={formatDate(report.updatedAt)} /><Field label="First triaged" value={report.triagedAt ? formatDate(report.triagedAt) : "Not triaged"} /><Field label="Last reviewed" value={report.lastReviewedAt ? formatDate(report.lastReviewedAt) : "Not reviewed"} /><Field label="Resolved" value={report.resolvedAt ? formatDate(report.resolvedAt) : "Not resolved"} /><Field label="Workflow version" value={String(report.stateVersion)} /></dl></Section><Section title="Recent workflow history">{audit.length ? <ol className="grid gap-3">{audit.map((event, index) => <li key={`${event.createdAt}-${index}`} className="rounded-xl bg-paper p-3 text-sm"><strong>{label(event.nextState.status)} · {label(event.nextState.severity)}</strong><p className="mt-1 text-muted">Version {event.previousState.stateVersion} → {event.nextState.stateVersion} · {formatDate(event.createdAt)}</p></li>)}</ol> : <p className="text-sm text-muted">No workflow changes recorded yet.</p>}</Section></aside>
        </div>
      </InternalOperationsShell>
    );
  } finally { await pool.end(); }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-line bg-white p-5"><h2 className="mb-4 text-xl font-extrabold">{title}</h2>{children}</section>; }
function Field({ label: fieldLabel, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold text-muted">{fieldLabel}</dt><dd className="mt-1 break-words">{value}</dd></div>; }
function Badge({ value, strong = false }: { value: string; strong?: boolean }) { return <span className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-extrabold ${strong ? "border-danger/30 bg-danger-soft" : "border-line bg-white"}`}>{value}</span>; }
function label(value: string) { return value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2"); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)); }
