import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="border-t border-line px-5 py-[clamp(48px,7vw,76px)]">
      <div className="mx-auto grid w-[min(1120px,100%)] justify-items-center rounded-lg bg-ink px-5 py-[clamp(44px,6vw,70px)] text-center text-white sm:px-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Deliberate practice, ready when you are</p>
        <h2 className="mt-3 max-w-[720px] text-[clamp(32px,5vw,52px)] font-bold leading-[1.08] tracking-[-0.04em]">Begin your Higher Maths learning route.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">Choose a skill and move from focused explanation to independent practice. No account is required to begin.</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="orthic-course-action inline-flex min-h-[50px] items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-bold text-ink">Start Learning <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
          <Link href="/subjects/higher-maths" className="orthic-secondary-link inline-flex min-h-[50px] items-center justify-center gap-2 px-3 text-sm font-semibold text-white">View Higher Maths <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
        </div>
      </div>
    </section>
  );
}
