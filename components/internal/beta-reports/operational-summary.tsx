import type { InternalOperationalSummary } from "@/lib/beta-reports/internal-report-repository.server";

export function OperationalSummary({ summary }: { summary: InternalOperationalSummary }) {
  const items = [
    ["New", summary.newReports], ["High or critical unresolved", summary.urgentUnresolved],
    ["Awaiting triage", summary.awaitingTriage], ["In progress", summary.inProgress],
    ["Resolved in 7 days", summary.resolvedLastSevenDays],
  ] as const;
  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-xl font-extrabold">Operational summary</h2>
      <p className="mt-1 text-sm text-muted">Explicit reports only; most counts use a {summary.windowDays}-day window.</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-white p-4"><dt className="text-sm font-bold text-muted">{label}</dt><dd className="mt-2 text-3xl font-black">{value}</dd></div>)}
      </dl>
    </section>
  );
}
