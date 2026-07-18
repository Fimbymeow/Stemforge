import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InternalOperationsShell } from "@/components/internal/beta-reports/internal-operations-shell";
import { HealthSummary } from "@/components/internal/beta-reports/health-summary";
import { OperationalSummary } from "@/components/internal/beta-reports/operational-summary";
import { ReportFilters } from "@/components/internal/beta-reports/report-filters";
import { ReportList } from "@/components/internal/beta-reports/report-list";
import { getInternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization.server";
import { PostgresInternalBetaReportRepository } from "@/lib/beta-reports/internal-report-repository.server";
import { internalFiltersToSearchParams, parseInternalReportFilters } from "@/lib/beta-reports/internal-query-types";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { getInternalHealthSnapshot } from "@/lib/operations/internal-health.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Internal beta reports", robots: { index: false, follow: false, nocache: true } };

export default async function InternalBetaReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getInternalOperationsAuthorization();
  if (access.status !== "authorized") notFound();
  const parsed = parseInternalReportFilters(await searchParams);
  if (!parsed.ok) return <SafeInvalidFilter message={parsed.reason} />;
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresInternalBetaReportRepository(pool);
    const [page, summary, health] = await Promise.all([
      repository.listBetaReports(parsed.filters), repository.getOperationalSummary(), getInternalHealthSnapshot(pool),
    ]);
    const nextParams = internalFiltersToSearchParams(parsed.filters, false);
    if (page.nextCursor) nextParams.set("cursor", page.nextCursor);
    const nextHref = page.nextCursor ? `/internal/beta-reports?${nextParams}` : null;
    return (
      <InternalOperationsShell>
        <div className="grid gap-6">
          <header><h1 className="text-3xl font-black sm:text-4xl">Beta report queue</h1><p className="mt-2 max-w-3xl text-muted">Triage explicit learner reports using minimum safe context. This workspace has no learner-evidence browser or account administration.</p></header>
          <HealthSummary health={health} />
          <OperationalSummary summary={summary} />
          <section aria-labelledby="filters-heading"><h2 id="filters-heading" className="mb-3 text-xl font-extrabold">Filter and sort</h2><ReportFilters filters={parsed.filters} /></section>
          <ReportList reports={page.reports} nextHref={nextHref} />
          <WorkflowGuidance />
        </div>
      </InternalOperationsShell>
    );
  } finally { await pool.end(); }
}

function SafeInvalidFilter({ message }: { message: string }) { return <InternalOperationsShell><div className="rounded-2xl border border-line bg-white p-6"><h1 className="text-2xl font-extrabold">Invalid report filter</h1><p className="mt-2 text-muted">{message}</p><Link className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-forge px-5 font-bold text-white" href="/internal/beta-reports">Return to report queue</Link></div></InternalOperationsShell>; }
function WorkflowGuidance() { return <aside className="rounded-2xl border border-line bg-white p-5"><h2 className="text-lg font-extrabold">Safe workflow reminder</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted"><li>Use content IDs and coarse diagnostics; never request passwords, tokens or learner answers.</li><li>Mark security or integrity concerns critical and escalate outside ordinary public discussion.</li><li>Content fixes belong in a future versioned content change, not historical evidence.</li><li>Sync and account issues should use existing export, reconciliation and erasure controls.</li></ul></aside>; }
