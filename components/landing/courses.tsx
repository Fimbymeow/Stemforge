import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { getPastPapersForSubject } from "@/lib/past-papers/catalog";

export function Courses() {
  const records = getPastPapersForSubject("higher-maths");
  const years = Array.from(new Set(records.map((record) => record.year)));

  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 px-5 py-[clamp(36px,5vw,64px)]">
      <div className="mx-auto grid w-[min(1120px,100%)] items-center gap-[clamp(36px,6vw,76px)] lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <h2 id="courses-title" className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.035em]">Official past papers &amp; marking instructions</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">Open official Higher Maths papers and their marking instructions from one clear archive, organised by exam year and paper.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Resources open from the official source. Orthic does not host or relabel copies of these documents.</p>
          <Link href="/subjects/higher-maths/past-papers" className="orthic-secondary-link mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-forge">Browse Higher Maths past papers <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
        </div>

        <div aria-label="Higher Maths past papers archive preview" className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Archive ledger</p>
              <h3 className="mt-1 text-lg font-bold">Higher Mathematics</h3>
            </div>
            <span className="text-xs text-muted">Official source links</span>
          </div>
          <div className="grid sm:grid-cols-2">
            {years.map((year, index) => {
              const papers = records.filter((record) => record.year === year);
              return (
                <div key={year} className={`px-5 py-5 sm:px-6 ${index < 2 ? "border-b border-line" : ""} ${index % 2 === 0 ? "sm:border-r sm:border-line" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xl font-bold">{year}</p>
                    <Check aria-label="Available" className="size-4 text-success" />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-muted">
                    {papers.map((paper) => <p key={paper.id}>Paper {paper.paperNumber} · Marking instructions</p>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
