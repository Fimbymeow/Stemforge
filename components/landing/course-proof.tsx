import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { getActiveSubject, getAllSkillPaths, getAvailableSkillPaths } from "@/lib/learning-paths";

export function CourseProof() {
  const subject = getActiveSubject();
  const allSkills = getAllSkillPaths(subject);
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
            <div><p className="text-xs font-extrabold uppercase text-forge">Higher Maths</p><p className="mt-1 text-xl font-extrabold">Calculus</p></div>
            <span className="rounded-full bg-forge-soft px-3 py-1 text-xs font-bold text-forge">{availableSkills.length} of {allSkills.length} skills available</span>
          </div>
          <div className="grid divide-y divide-line">
            {availableSkills.map((skill, index) => (
              <div key={skill.slug} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4">
                <span className="grid size-8 place-items-center rounded-full bg-forge-soft text-forge">{index === 0 ? <Check aria-hidden="true" className="size-4" /> : <Circle aria-hidden="true" className="size-3" />}</span>
                <div><p className="font-extrabold">{skill.name}</p><p className="mt-0.5 text-xs text-muted">Structured learning journey</p></div>
                <span className="text-xs font-bold text-forge">Available</span>
              </div>
            ))}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-muted">
              <span className="grid size-8 place-items-center rounded-full border border-line"><Circle aria-hidden="true" className="size-3" /></span>
              <div><p className="font-extrabold text-ink">Trigonometric differentiation</p><p className="mt-0.5 text-xs">Part of the canonical course map</p></div>
              <span className="text-xs font-bold">Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
