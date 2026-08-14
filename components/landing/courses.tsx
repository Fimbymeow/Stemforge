import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveSubject, getAvailableSkillPaths } from "@/lib/learning-paths";

export function Courses() {
  const availableSkills = getAvailableSkillPaths(getActiveSubject());
  const names = availableSkills.map((skill) => skill.name).join(" and ");

  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 border-b border-line px-5 py-[clamp(56px,7vw,84px)]">
      <div className="mx-auto w-[min(980px,100%)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-forge">Available courses</p>
        <h2 id="courses-title" className="mt-3 text-[clamp(34px,5vw,54px)] font-extrabold tracking-[-0.03em]">Start with Higher Maths.</h2>
        <div className="mt-9 divide-y divide-line border-y border-line">
          <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 py-6 max-sm:grid-cols-1">
            <div><p className="text-xs font-extrabold uppercase text-forge">Available now</p><h3 className="mt-2 text-2xl font-extrabold">Higher Maths</h3><p className="mt-2 text-sm leading-relaxed text-muted">{names} are live now, with more canonical skills being added.</p></div>
            <Link href="/subjects/higher-maths" className="inline-flex min-h-11 items-center gap-2 font-extrabold text-forge">Explore course <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </article>
          <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 py-6 text-muted max-sm:grid-cols-1">
            <div><p className="text-xs font-extrabold uppercase">Coming soon</p><h3 className="mt-2 text-2xl font-extrabold text-ink">Higher Physics</h3><p className="mt-2 text-sm">The course catalogue exists, but learner content is not yet available.</p></div>
            <span className="text-sm font-bold">Not yet available</span>
          </article>
        </div>
      </div>
    </section>
  );
}
