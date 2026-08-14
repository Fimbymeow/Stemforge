import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/landing/product-visual";

export function Hero() {
  return (
    <section className="border-b border-line px-4 py-7 sm:px-5 sm:py-10 lg:py-11">
      <div className="mx-auto grid w-[min(1220px,100%)] items-center gap-6 min-[900px]:grid-cols-[minmax(0,0.43fr)_minmax(0,0.57fr)] min-[900px]:gap-8 lg:gap-14">
        <div className="max-w-[520px]">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-forge">Structured Scottish STEM learning</p>
          <h1 className="m-0 text-[clamp(44px,6.2vw,76px)] font-extrabold leading-[0.96] tracking-[-0.045em]">Learn with Precision.</h1>
          <p className="mt-6 max-w-[520px] text-[clamp(17px,1.7vw,20px)] leading-relaxed text-muted">
            Build Higher Maths one skill at a time through clear notes, deliberate practice, worked solutions and timely Review.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/dashboard" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-forge px-7 text-sm font-extrabold text-white">Start Learning <ArrowRight aria-hidden="true" className="size-4" /></Link>
            <Link href="/subjects/higher-maths" className="inline-flex min-h-11 items-center font-bold text-forge underline-offset-4 hover:underline">Explore Higher Maths</Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-muted">No account needed. Progress can stay on this browser.</p>
        </div>

        <div className="min-w-0 sm:w-full sm:max-w-[700px] sm:justify-self-center min-[900px]:max-w-none">
          <ProductVisual />
        </div>
      </div>
    </section>
  );
}
