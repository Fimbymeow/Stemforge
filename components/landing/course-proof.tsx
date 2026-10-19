import Link from "next/link";
import { ArrowRight, BookOpen, PenLine } from "lucide-react";
import { getActiveSubject, getAvailableSkillPaths } from "@/lib/learning-paths";

export function CourseProof() {
  const skills = getAvailableSkillPaths(getActiveSubject()).slice(0, 2);

  return (
    <section aria-labelledby="course-proof-title" className="px-5 py-[clamp(36px,5vw,64px)]">
      <div className="mx-auto grid w-[min(1120px,100%)] items-center gap-[clamp(36px,6vw,76px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div aria-label="Higher Maths Course Tracker preview" className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Higher Mathematics</p>
            <h3 className="mt-1 text-lg font-bold">Course Tracker</h3>
          </div>
          <div className="divide-y divide-line">
            {skills.map((skill, index) => (
              <div key={skill.slug} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
                <span className="grid size-9 place-items-center rounded-md bg-forge-soft text-forge">{index === 0 ? <BookOpen aria-hidden="true" className="size-4" /> : <PenLine aria-hidden="true" className="size-4" />}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{skill.name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">Notes · {skill.practiceQuestionIds?.length ?? 0} Practice questions</span>
                </span>
                <span className="hidden text-xs text-muted sm:block">Available</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 id="course-proof-title" className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.035em]">Higher Maths, organised by precise skills</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">Open concise Notes, then build the skill through one continuous bank of authentic Practice questions.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Prior knowledge stays connected to each question, while Review remains a separate return to learning when it is genuinely due.</p>
          <Link href="/subjects/higher-maths/course-tracker" className="orthic-secondary-link mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-forge">Explore the Course Tracker <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
        </div>
      </div>
    </section>
  );
}
