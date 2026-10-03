import Link from "next/link";
import { ArrowRight, BookOpen, FileCheck2, PenLine, ScrollText } from "lucide-react";
import { getActiveSubject, getAvailableSkillPaths } from "@/lib/learning-paths";

const stages = [
  { name: "Notes", description: "Focused explanations and worked examples", icon: BookOpen },
  { name: "Foundations", description: "Build the essential method accurately", icon: PenLine },
  { name: "Applications", description: "Use the method in varied contexts", icon: FileCheck2 },
  { name: "Exam practice", description: "Apply the skill independently", icon: ScrollText },
] as const;

export function CourseProof() {
  const [skill] = getAvailableSkillPaths(getActiveSubject());

  return (
    <section aria-labelledby="course-proof-title" className="px-5 py-[clamp(36px,5vw,64px)]">
      <div className="mx-auto grid w-[min(1120px,100%)] items-center gap-[clamp(36px,6vw,76px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div aria-label="Four-stage Basic differentiation pathway preview" className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Higher Mathematics</p>
            <h3 className="mt-1 text-lg font-bold">{skill?.name ?? "Basic differentiation"}</h3>
          </div>
          <div className="divide-y divide-line">
            {stages.map(({ name, description, icon: Icon }) => (
              <div key={name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
                <span className="grid size-9 place-items-center rounded-md bg-forge-soft text-forge"><Icon aria-hidden="true" className="size-4" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
                </span>
                <span className="hidden text-xs text-muted sm:block">Available</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 id="course-proof-title" className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.035em]">The 4-stage skill pathway</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">Every available skill follows the same purposeful route: learn the method, secure the foundations, apply it in context and finish with original exam-style practice.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">The structure stays visible throughout, so the next useful step is always clear.</p>
          <Link href="/subjects/higher-maths/course-tracker" className="orthic-secondary-link mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-forge">Explore the skill pathway <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
        </div>
      </div>
    </section>
  );
}
