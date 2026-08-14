import Link from "next/link";
import { ArrowRight, BookOpen, Check, PenLine } from "lucide-react";
import { getActiveSubject, getAvailableSkillPaths } from "@/lib/learning-paths";

export function CourseProof() {
  const subject = getActiveSubject();
  const availableSkills = getAvailableSkillPaths(subject);

  return (
    <section aria-labelledby="course-proof-title" className="border-b border-line px-5 py-[clamp(56px,7vw,88px)]">
      <div className="mx-auto grid w-[min(1180px,100%)] grid-cols-[minmax(0,0.72fr)_minmax(520px,1.28fr)] items-center gap-[clamp(40px,7vw,90px)] max-lg:grid-cols-1">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-forge">Built around the course</p>
          <h2 id="course-proof-title" className="mt-3 text-[clamp(34px,5vw,58px)] font-extrabold leading-[1.02] tracking-[-0.035em]">Know where each skill fits.</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">Orthic follows the Higher Maths course structure, so learning, practice and progress stay connected to real curriculum skills.</p>
          <Link href="/subjects/higher-maths/course-tracker" className="mt-6 inline-flex min-h-11 items-center gap-2 font-extrabold text-forge">Open Course Tracker <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>

        <div aria-label="Higher Maths Course Tracker preview" className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div><p className="text-xs font-extrabold uppercase text-forge">Higher Maths</p><p className="mt-1 text-xl font-extrabold">Calculus · Differentiation</p></div>
            <span className="rounded-full bg-forge-soft px-3 py-1 text-xs font-bold text-forge">Structured by skill</span>
          </div>
          <div className="grid divide-y divide-line">
            {availableSkills.map((skill, index) => (
              <div key={skill.slug} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4">
                <span className="grid size-8 place-items-center rounded-full bg-forge-soft text-forge">{index === 0 ? <BookOpen aria-hidden="true" className="size-4" /> : <PenLine aria-hidden="true" className="size-4" />}</span>
                <div><p className="font-extrabold">{skill.name}</p><p className="mt-0.5 text-xs text-muted">Notes, staged practice and worked solutions</p></div>
                <Check aria-label="Ready to learn" className="size-4 text-success" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
