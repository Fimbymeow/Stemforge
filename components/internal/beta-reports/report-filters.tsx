import type { InternalReportFilters } from "@/lib/beta-reports/internal-query-types";
import Link from "next/link";

export function ReportFilters({ filters }: { filters: InternalReportFilters }) {
  return (
    <form method="get" action="/internal/beta-reports" aria-label="Report filters" className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4">
      <FilterSelect id="report-status" label="Status" name="status" value={filters.status ?? "all"} options={["all","new","triaged","in_progress","resolved","closed"]} />
      <FilterSelect id="report-kind" label="Kind" name="kind" value={filters.kind ?? "all"} options={["all","bug","feedback","support_request","content_issue","account_issue"]} />
      <FilterSelect id="report-severity" label="Severity" name="severity" value={filters.severity ?? "all"} options={["all","critical","high","normal","low"]} />
      <FilterSelect id="report-reproduction" label="Reproduction" name="reproduction" value={filters.reproductionStatus ?? "all"} options={["all","not_checked","reproduced","unable_to_reproduce","needs_more_information"]} />
      <FilterSelect id="report-source" label="Source" name="source" value={filters.source ?? "all"} options={["all","authenticated","guest"]} />
      <FilterInput id="report-page-area" label="Page area" name="pageArea" value={filters.pageArea ?? ""} maxLength={80} />
      <FilterInput id="report-search" label="Search" name="search" value={filters.search ?? ""} minLength={3} maxLength={80} placeholder="Exact SF reference, message, content ID or error code" wide />
      <FilterInput id="report-created-from" label="Created from" name="from" value={filters.createdFrom ?? ""} type="date" />
      <FilterInput id="report-created-to" label="Created to" name="to" value={filters.createdTo ?? ""} type="date" />
      <FilterSelect id="report-sort" label="Sort" name="sort" value={filters.sort} options={["newest","oldest","severity","updated"]} />
      <FilterSelect id="report-page-size" label="Page size" name="pageSize" value={String(filters.pageSize)} options={["10","25","50","100"]} />
      <div className="flex flex-wrap items-end gap-2 md:col-span-4"><button className="inline-flex min-h-11 items-center rounded-lg bg-forge px-5 font-extrabold text-white">Apply filters</button><Link href="/internal/beta-reports" className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 font-bold">Reset</Link></div>
    </form>
  );
}

function Options({ values }: { values: string[] }) { return values.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>); }

function FilterSelect({ id, label, name, value, options }: { id: string; label: string; name: string; value: string; options: string[] }) {
  return <div className="grid gap-1 text-sm font-bold"><label htmlFor={id}>{label}</label><select id={id} name={name} defaultValue={value} className="min-h-11 rounded-lg border border-line bg-white px-3 font-normal"><Options values={options} /></select></div>;
}

function FilterInput({ id, label, name, value, type, minLength, maxLength, placeholder, wide }: { id: string; label: string; name: string; value: string; type?: string; minLength?: number; maxLength?: number; placeholder?: string; wide?: boolean }) {
  return <div className={`grid gap-1 text-sm font-bold${wide ? " md:col-span-2" : ""}`}><label htmlFor={id}>{label}</label><input id={id} name={name} defaultValue={value} type={type} minLength={minLength} maxLength={maxLength} placeholder={placeholder} className="min-h-11 rounded-lg border border-line px-3 font-normal" /></div>;
}
