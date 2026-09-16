import Link from "next/link";
import { ArrowLeft, ExternalLink, Files } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { PageHeaderIconChip } from "@/components/ui";
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
      className="orthic-course-action inline-flex min-h-11 items-center justify-center gap-2 rounded border border-rule bg-white px-3 py-2 text-center text-sm font-medium text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      {label} <ExternalLink aria-hidden="true" className="orthic-arrow size-3.5 shrink-0" />
    </a>
  );
}

export function PastPapersLibrary({ records }: { records: readonly PastPaperRecord[] }) {
  const years = [...new Set(records.map((record) => record.year))];

  return (
    <AppShell demo active="Subjects" feedbackPlacement="inline-mobile">
      <div className="mx-auto mb-3 flex max-w-[1240px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid min-w-0 max-w-[1240px] gap-6" data-testid="past-papers-library">
        <header className="grid gap-4">
          <Link href="/subjects/higher-maths" className="orthic-secondary-link inline-flex min-h-11 w-fit items-center gap-2 rounded text-sm font-medium text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Higher Maths
          </Link>
          <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-1">
            <PageHeaderIconChip><Files aria-hidden="true" className="size-5" /></PageHeaderIconChip>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Higher Maths</p>
              <div className="mt-1 flex flex-wrap items-center gap-3"><h1 className="text-[32px] font-bold leading-tight tracking-tight">Past Papers</h1><span className="rounded border border-rule bg-forge-soft px-2 py-1 text-xs text-forge">{years.length} exam diets</span></div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Official question papers and marking instructions, grouped by exam year.</p>
            </div>
          </div>
          <p className="w-fit justify-self-end rounded border border-rule bg-white px-3 py-2 text-xs leading-relaxed text-secondary max-sm:justify-self-start">Source: <span>Qualifications Scotland (formerly SQA)</span></p>
          <aside className="rounded border border-rule bg-white px-4 py-3 text-sm leading-relaxed text-secondary">
            Links open official PDFs in a new tab. Orthic does not store copies of these documents.
          </aside>
        </header>

        <div role="table" aria-label="Official Higher Maths past papers" className="min-w-0 overflow-hidden rounded-lg border border-rule bg-white" data-testid="past-papers-ledger">
        <div role="row" className="hidden grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_minmax(160px,.8fr)] gap-5 border-b border-rule bg-canvas px-6 py-4 text-xs font-semibold uppercase tracking-wide text-secondary xl:grid">
          <span role="columnheader">Exam diet</span><span role="columnheader">Paper 1 (Non-calculator)</span><span role="columnheader">Paper 2 (Calculator permitted)</span><span role="columnheader">Specification notes</span>
        </div>
        {years.map((year) => {
          const yearRecords = records.filter((record) => record.year === year);
          const note = yearRecords.find((record) => record.note)?.note;
          return (
            <div key={year} role="row" className="grid min-w-0 gap-5 border-b border-rule p-5 last:border-b-0 sm:grid-cols-2 xl:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_minmax(160px,.8fr)] xl:items-center xl:px-6 xl:py-7">
              <div role="rowheader" className="sm:col-span-2 xl:col-span-1"><h2 className="text-xl font-bold" data-testid={`past-papers-year-${year}`}>{year}</h2></div>
                {[1, 2].map((paperNumber) => {
                  const record = yearRecords.find((item) => item.paperNumber === paperNumber);
                  return <div role="cell" key={paperNumber} className="min-w-0" data-testid={`past-paper-${year}-${paperNumber}`}>
                    <h3 className="mb-1 text-sm font-semibold xl:sr-only">Paper {paperNumber}</h3>
                    <p className="mb-3 text-xs text-secondary xl:sr-only">{record?.calculatorPolicy === "non-calculator" ? "Non-calculator" : "Calculator permitted"}</p>
                    {record ? <div className="flex flex-wrap gap-2">
                      <OfficialResourceLink
                        resource={record.paper}
                        label="Open paper"
                        accessibleLabel={`Open ${record.year} Higher Mathematics Paper ${record.paperNumber} question paper on Qualifications Scotland`}
                      />
                      <OfficialResourceLink
                        resource={record.markingInstructions}
                        label="Marking guide"
                        accessibleLabel={`Open ${record.year} Higher Mathematics Paper ${record.paperNumber} marking instructions on Qualifications Scotland`}
                      />
                    </div> : <p className="text-sm text-secondary">Unavailable</p>}
                  </div>;
                })}
              <div role="cell" className="text-sm leading-relaxed text-secondary sm:col-span-2 xl:col-span-1">{note ?? "No additional specification notes supplied."}</div>
            </div>
          );
        })}
        </div>
        <p className="border-t border-rule pt-4 text-sm text-secondary">Showing {years.length} of {years.length} available exam diets.</p>
      </div>
    </AppShell>
  );
}
