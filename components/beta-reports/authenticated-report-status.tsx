import { PostgresInternalBetaReportRepository } from "@/lib/beta-reports/internal-report-repository.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export async function AuthenticatedBetaReportStatus({ ownerId }: { ownerId: string }) {
  const pool = createRemoteEvidencePool();
  try {
    const reports = await new PostgresInternalBetaReportRepository(pool).listLearnerReports(ownerId, 10);
    if (!reports.length) return null;
    return <section className="rounded-xl border border-line bg-white p-4"><h2 className="text-lg font-extrabold">Reports linked to your account</h2><p className="mt-1 text-sm text-muted">Only your reference, category, dates and safe outcome are shown. Internal priority and triage details stay private.</p><ul className="mt-3 grid gap-3">{reports.map((report) => <li key={report.reportId} className="rounded-lg bg-paper p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{report.reportId}</strong><span className="capitalize">{report.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-sm text-muted">{report.kind.replaceAll("_", " ")} · submitted {formatDate(report.createdAt)}</p>{report.closedAsDuplicate ? <p className="mt-2 text-sm">Closed as a duplicate of an existing issue.</p> : null}{report.resolutionSummary ? <p className="mt-2 whitespace-pre-wrap text-sm"><strong>Outcome:</strong> {report.resolutionSummary}</p> : null}</li>)}</ul></section>;
  } catch { return null; } finally { await pool.end(); }
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)); }
