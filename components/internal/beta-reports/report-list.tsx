import Link from "next/link";
import type { InternalBetaReportListItem } from "@/lib/beta-reports/internal-report-repository.server";

export function ReportList({ reports, nextHref }: { reports: InternalBetaReportListItem[]; nextHref: string | null }) {
  if (!reports.length) return <div className="rounded-2xl border border-line bg-white p-8 text-center"><h2 className="text-xl font-extrabold">No matching reports</h2><p className="mt-2 text-muted">Adjust the filters or return to the default new-report queue.</p></div>;
  return (
    <section aria-labelledby="report-list-heading">
      <h2 id="report-list-heading" className="sr-only">Beta reports</h2>
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left text-sm"><thead className="bg-paper"><tr><Header>Reference</Header><Header>Kind</Header><Header>Severity</Header><Header>Status</Header><Header>Source</Header><Header>Context</Header><Header>Updated</Header></tr></thead>
          <tbody>{reports.map((report) => <tr key={report.reportId} className="border-t border-line align-top"><Cell><Link className="font-extrabold text-forge underline" href={`/internal/beta-reports/${report.reportId}`}>{report.reportId}</Link><p className="mt-1 max-w-xs text-xs text-muted">{report.messagePreview}</p></Cell><Cell>{label(report.kind)}</Cell><Cell><strong>{label(report.severity)}</strong></Cell><Cell>{label(report.status)}</Cell><Cell>{label(report.source)}</Cell><Cell>{report.pageArea ?? "General"}<br/><span className="text-xs text-muted">{label(report.reproductionStatus)}</span></Cell><Cell>{formatDate(report.updatedAt)}</Cell></tr>)}</tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden">{reports.map((report) => <li key={report.reportId} className="rounded-2xl border border-line bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Link className="font-extrabold text-forge underline" href={`/internal/beta-reports/${report.reportId}`}>{report.reportId}</Link><strong>{label(report.severity)} severity</strong></div><p className="mt-2 text-sm">{report.messagePreview}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><Item label="Status" value={label(report.status)} /><Item label="Kind" value={label(report.kind)} /><Item label="Source" value={label(report.source)} /><Item label="Reproduction" value={label(report.reproductionStatus)} /></dl></li>)}</ul>
      <nav aria-label="Report pagination" className="mt-4 flex justify-end">{nextHref ? <Link href={nextHref} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-5 font-extrabold">Next page</Link> : <span className="text-sm text-muted">End of results</span>}</nav>
    </section>
  );
}

function Header({ children }: { children: React.ReactNode }) { return <th scope="col" className="px-3 py-3 font-extrabold">{children}</th>; }
function Cell({ children }: { children: React.ReactNode }) { return <td className="px-3 py-4">{children}</td>; }
function Item({ label: itemLabel, value }: { label: string; value: string }) { return <div><dt className="font-bold text-muted">{itemLabel}</dt><dd>{value}</dd></div>; }
function label(value: string) { return value.replaceAll("_", " "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)); }
