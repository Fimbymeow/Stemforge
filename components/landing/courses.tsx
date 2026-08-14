import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveSubject, getAvailableSkillPaths } from "@/lib/learning-paths";

export function Courses() {
  const availableSkills = getAvailableSkillPaths(getActiveSubject());
  const names = availableSkills.map((skill) => skill.name).join(" and ");

  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 border-b border-line px-5 py-[clamp(56px,7vw,84px)]">
      <div className="mx-auto w-[min(980px,100%)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-forge">Flagship course</p>
        <h2 id="courses-title" className="mt-3 text-[clamp(34px,5vw,54px)] font-extrabold tracking-[-0.03em]">Start with Higher Maths.</h2>
        <div className="mt-9 border-y border-line">
          <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 py-6 max-sm:grid-cols-1">
            <div><p className="text-xs font-extrabold uppercase text-forge">Learn now</p><h3 className="mt-2 text-2xl font-extrabold">Higher Maths</h3><p className="mt-2 text-sm leading-relaxed text-muted">Begin with {names}. Every skill connects clear teaching, purposeful practice and complete worked solutions.</p></div>
            <Link href="/subjects/higher-maths" className="inline-flex min-h-11 items-center gap-2 font-extrabold text-forge">Explore course <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </article>
        </div>
      </div>
    </section>
  );
}
