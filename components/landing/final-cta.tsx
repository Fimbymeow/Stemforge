import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="bg-ink px-5 py-[clamp(56px,8vw,96px)] text-white">
      <div className="mx-auto flex w-[min(980px,100%)] items-end justify-between gap-10 max-md:grid">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/65">Free to start</p><h2 className="mt-3 text-[clamp(38px,6vw,68px)] font-extrabold leading-none tracking-[-0.04em]">Start with Higher Maths.</h2><p className="mt-4 max-w-xl text-white/70">Choose a skill and follow a clear route from explanation to independent practice. No account is required.</p></div>
        <Link href="/dashboard" className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-md bg-white px-7 text-sm font-extrabold text-ink">Start Learning <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </div>
    </section>
  );
}
