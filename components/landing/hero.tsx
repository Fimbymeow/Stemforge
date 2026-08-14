import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrthicConstructionMark } from "@/components/brand/orthic-mark";

export function Hero() {
  return (
    <section className="border-b border-line px-4 py-8 sm:px-5 sm:py-10 lg:py-12">
      <div className="mx-auto grid w-[min(1180px,100%)] items-center gap-7 min-[900px]:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] min-[900px]:gap-8 lg:gap-12">
        <div className="max-w-[520px]">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-forge">Structured Scottish STEM learning</p>
          <h1 className="m-0 text-[clamp(44px,6.2vw,76px)] font-extrabold leading-[0.96] tracking-[-0.045em]">Learn with Precision.</h1>
          <p className="mt-6 max-w-[520px] text-[clamp(17px,1.7vw,20px)] leading-relaxed text-muted">
            Build Higher Maths one skill at a time through clear notes, deliberate practice, worked solutions and timely Review.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link href="/dashboard" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-forge px-7 text-sm font-extrabold text-white">Start Learning <ArrowRight aria-hidden="true" className="size-4" /></Link>
            <Link href="/subjects/higher-maths" className="inline-flex min-h-11 items-center font-bold text-forge underline-offset-4 hover:underline">Explore Higher Maths</Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-muted">No account needed. Progress can stay on this browser.</p>
        </div>

        <div className="relative min-w-0 pt-9 sm:w-full sm:max-w-[660px] sm:justify-self-center min-[900px]:max-w-none">
          <OrthicConstructionMark className="absolute right-1 top-0 z-10 size-10 text-forge sm:size-11 min-[900px]:right-0 min-[900px]:size-12" />
          <figure className="overflow-hidden rounded-xl border border-line bg-white shadow-hero">
            <div className="relative aspect-[1.28] overflow-hidden sm:aspect-[1.5]">
              <Image
                src="/assets/orthic-skill-page.png"
                alt="Orthic Higher Maths Basic differentiation page showing its structured learning journey"
                width={1160}
                height={760}
                priority
                sizes="(max-width: 899px) calc(100vw - 32px), 660px"
                className="absolute right-0 top-0 h-auto w-[126%] max-w-none"
              />
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs font-bold text-muted">
              <span>Real product: Basic differentiation</span>
              <span>Notes · Foundations · Applications · Exam practice · Review</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
