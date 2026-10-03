import Link from "next/link";
import { ArrowRight, Clock3, RotateCcw } from "lucide-react";
import { CONFIDENCE_LABEL } from "@/components/confidence/confidence-presentation";
import { CONFIDENCE_LEVELS } from "@/lib/confidence/types";

export function ConfidenceReview() {
  return (
    <section aria-labelledby="confidence-review-title" className="px-5 pb-[clamp(64px,8vw,104px)] pt-[clamp(36px,5vw,64px)]">
      <div className="mx-auto grid w-[min(1120px,100%)] items-center gap-[clamp(36px,6vw,76px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div aria-label="Confidence and Review interface preview" className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Basic differentiation</p>
            <h3 className="mt-1 text-lg font-bold">Keep the skill current</h3>
          </div>
          <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Your confidence</p>
                <span className="text-xs text-muted">Not rated</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {CONFIDENCE_LEVELS.map((level) => <span key={level} className="grid min-h-11 place-items-center rounded-md border border-line bg-paper px-2 text-center text-xs font-medium text-muted">{CONFIDENCE_LABEL[level]}</span>)}
              </div>
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-t border-line pt-5">
              <span className="grid size-9 place-items-center rounded-md bg-forge-soft text-forge"><RotateCcw aria-hidden="true" className="size-4" /></span>
              <div>
                <p className="text-sm font-semibold">Review after learning</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">Review uses completed learning and later evidence to show when a skill is useful to revisit.</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-forge"><Clock3 aria-hidden="true" className="size-3.5" />Review timing follows real learning history</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 id="confidence-review-title" className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.035em]">Self-rated confidence &amp; spaced Review</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">Record how secure a skill feels without confusing confidence with evidence. Orthic keeps that self-rating separate from progress and Review scheduling.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Once a skill is learned, Review uses genuine practice history to help bring it back at a useful time.</p>
          <Link href="/practice?review=1" className="orthic-secondary-link mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-forge">Open Review <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
        </div>
      </div>
    </section>
  );
}
