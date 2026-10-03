import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/landing/product-visual";

export function Hero() {
  return (
    <section className="border-b border-line px-4 pb-[clamp(48px,7vw,76px)] pt-[clamp(48px,7vw,76px)] sm:px-5">
      <div className="mx-auto w-[min(1060px,100%)]">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forge">Academic practice for Scottish learners</p>
          <h1 className="mt-4 text-[clamp(40px,6vw,68px)] font-bold leading-[1.02] tracking-[-0.045em]">Master Higher Maths, one skill at a time.</h1>
          <p className="mx-auto mt-5 max-w-[650px] text-[clamp(16px,1.7vw,19px)] leading-relaxed text-muted">
            Clear notes, deliberate practice, complete worked solutions and timely Review — connected in one focused learning route.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="orthic-primary-action inline-flex min-h-[50px] items-center justify-center gap-2 rounded-md bg-forge px-6 text-sm font-bold text-white">Start Learning <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
            <Link href="/subjects/higher-maths" className="orthic-secondary-link inline-flex min-h-[50px] items-center justify-center gap-2 rounded-md border border-line bg-white px-6 text-sm font-semibold text-ink">Explore Higher Maths <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
          </div>
          <p className="mt-4 text-sm text-muted">No account needed. Progress can stay on this browser.</p>
        </div>

        <div className="mx-auto mt-[clamp(36px,5vw,56px)] min-w-0 max-w-[900px]">
          <ProductVisual />
        </div>
      </div>
    </section>
  );
}
