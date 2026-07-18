import type { InternalHealthSnapshot } from "@/lib/operations/internal-health.server";
import Link from "next/link";

const labels: Record<keyof Omit<InternalHealthSnapshot, "checkedAt">, string> = {
  application: "Application", database: "Database", authentication: "Authentication",
  reportingRepository: "Reporting", migration: "Migration", internalReview: "Internal review",
};

export function HealthSummary({ health }: { health: InternalHealthSnapshot }) {
  return (
    <section aria-labelledby="health-heading" className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="health-heading" className="text-lg font-extrabold">Operational readiness</h2>
        <Link href="/internal/beta-reports" className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-bold">Refresh</Link>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        {Object.entries(labels).map(([key, label]) => {
          const state = health[key as keyof typeof labels];
          return <div key={key} className="rounded-xl bg-paper p-3"><dt className="text-xs font-bold text-muted">{label}</dt><dd className="mt-1 font-extrabold capitalize">{state.replaceAll("_", " ")}</dd></div>;
        })}
      </dl>
      <p className="mt-3 text-xs text-muted">Checked {formatDate(health.checkedAt)}. Statuses are sanitized and contain no infrastructure identifiers.</p>
    </section>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)); }
