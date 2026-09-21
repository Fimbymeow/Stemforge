import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDemoPathway } from "@/lib/demo/content";
import { InlineMathContent } from "@/components/questions/math-content";

export function DemoPathway({ compact = false, currentStageId }: { compact?: boolean; currentStageId?: string }) {
  return <ol aria-label="Chain Rule curriculum pathway" data-testid="demo-pathway"
    className={`grid min-w-0 grid-cols-4 max-md:grid-cols-1 ${compact ? "gap-3" : "divide-x divide-rule border-y border-rule max-md:divide-x-0 max-md:divide-y"}`}>
    {getDemoPathway().map((stage, index) => <li key={stage.id} className={`min-w-0 ${compact ? "" : "px-5 py-5 first:pl-0 max-md:px-0"}`}>
      <Link href={stage.href} aria-current={stage.id === currentStageId ? "step" : undefined} className={`orthic-plan-action inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${stage.id === currentStageId ? "bg-academic-blue px-2" : ""}`}>
        <span className="font-mono text-[11px] font-normal text-secondary">0{index + 1}</span>{stage.label}{stage.id === currentStageId ? <span className="sr-only"> · Current stage</span> : null}<ArrowRight aria-hidden="true" className="orthic-arrow size-4 text-secondary" />
      </Link>
      {!compact ? <><p className="mt-1 text-[15px] leading-relaxed text-secondary"><InlineMathContent>{stage.description ?? ""}</InlineMathContent></p>
        {stage.label === "Exam practice" ? <p className="mt-2 text-xs leading-relaxed text-secondary">Orthic-authored, not copied from official past papers.</p> : null}
        <p className="mt-3 text-xs text-secondary" data-testid="demo-content-count">{stage.count !== null ? `${stage.count} questions available` : "Complete lesson"}</p></> : null}
    </li>)}
  </ol>;
}
