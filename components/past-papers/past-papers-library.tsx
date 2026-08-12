import Link from "next/link";
import { ArrowLeft, ExternalLink, FileCheck2, Files } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import type { PastPaperRecord, PastPaperResource } from "@/lib/past-papers/types";

function OfficialResourceLink({ resource, label, accessibleLabel }: { resource: PastPaperResource; label: string; accessibleLabel: string }) {
  if (resource.status !== "available") {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-2 text-sm text-muted">
        <span className="font-bold">{label}</span>
        <span>{resource.status === "pending" ? "Pending" : "Unavailable"}</span>
        <span className="sr-only">{resource.note}</span>
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${accessibleLabel} (opens in a new tab)`}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 py-2 text-center text-sm font-extrabold text-forge transition-colors hover:bg-forge-soft"
    >
      {label} <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
    </a>
  );
}

export function PastPapersLibrary({ records }: { records: readonly PastPaperRecord[] }) {
  const years = [...new Set(records.map((record) => record.year))];

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1240px] justify-end"><AppTopbar demo /></div>
      <main className="mx-auto grid max-w-[1240px] gap-7" data-testid="past-papers-library">
        <header className="grid gap-4">
          <Link href="/subjects/higher-maths" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg text-sm font-extrabold text-forge">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Higher Maths
          </Link>
          <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge"><Files aria-hidden="true" className="size-6" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Higher Maths</p>
              <h1 className="mt-1 text-[32px] font-extrabold leading-tight">Past Papers</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Official question papers and marking instructions, grouped by exam year.</p>
            </div>
          </div>
          <aside className="rounded-xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-muted">
            Links open official PDFs from Qualifications Scotland (formerly SQA) in a new tab. Orthic does not store copies of these documents.
          </aside>
        </header>

        {years.map((year) => {
          const yearRecords = records.filter((record) => record.year === year);
          const note = yearRecords.find((record) => record.note)?.note;
          return (
            <section key={year} aria-labelledby={`past-papers-${year}`} className="grid gap-3">
              <div>
                <h2 id={`past-papers-${year}`} className="text-2xl font-extrabold">{year}</h2>
                {note ? <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{note}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {yearRecords.map((record) => (
                  <Card key={record.id} className="flex min-w-0 flex-col p-5" data-testid={`past-paper-${record.year}-${record.paperNumber}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold leading-snug">Paper {record.paperNumber}</h3>
                      </div>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge"><FileCheck2 aria-hidden="true" className="size-5" /></span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{record.calculatorPolicy === "non-calculator" ? "Non-calculator" : "Calculator permitted"}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 max-sm:grid-cols-1">
                      <OfficialResourceLink
                        resource={record.paper}
                        label="Open paper"
                        accessibleLabel={`Open ${record.year} Higher Mathematics Paper ${record.paperNumber} question paper on Qualifications Scotland`}
                      />
                      <OfficialResourceLink
                        resource={record.markingInstructions}
                        label="Marking instructions"
                        accessibleLabel={`Open ${record.year} Higher Mathematics Paper ${record.paperNumber} marking instructions on Qualifications Scotland`}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </AppShell>
  );
}
