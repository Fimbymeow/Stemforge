"use client";

import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SubjectRoadmapNavigator } from "@/components/learning/subject-roadmap-navigator";
import { getActiveSkillPath, getActiveSubject } from "@/lib/learning-paths";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { PracticeEntryCard } from "@/components/practice/practice-entry-card";
import { ReviewEntryCard } from "@/components/review/review-entry-card";
import { WorkingContextHubCard } from "@/components/working-context/working-context-hub-card";
import { getQualificationPresentation } from "@/lib/qualification-presentation";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const nextAction = useLearnerNextAction();
  const qualification = getQualificationPresentation(subject.level);

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1240px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid max-w-[1240px] gap-6">
        <header>
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Subjects</Link><ArrowRight className="size-4" /><span className="font-bold text-forge">Higher Maths</span>
          </nav>
          <div className="grid grid-cols-[48px_1fr] items-center gap-3 max-md:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge"><Calculator className="size-6" /></span>
            <div>
              <span className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${qualification.className}`}>{qualification.label}</span>
              <h1 className="m-0 text-[32px] font-extrabold leading-none">Higher Maths</h1>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Learn in focused stages, then practise and review when you’re ready. Calculus is available now, with more areas being added.</p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-lg font-extrabold">Start here</h2>
          <WorkingContextHubCard pathId={skillPath.slug} />
        </section>

        <section aria-labelledby="practice-review-title">
          <h2 id="practice-review-title" className="mb-2 text-lg font-extrabold">Practice and Review</h2>
          <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-4 max-md:grid-cols-1">
            <PracticeEntryCard preferredPathId={nextAction.pathId} testId="higher-maths-practice" />
            <ReviewEntryCard pathId={skillPath.slug} />
          </div>
        </section>

        <section aria-labelledby="course-coverage-title" className="min-w-0 max-w-full">
          <h2 id="course-coverage-title" className="mb-2 text-lg font-extrabold">Roadmap</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted">Navigate the course by strand, then choose a topic.</p>
          <SubjectRoadmapNavigator subject={subject} />
        </section>
      </div>
    </AppShell>
  );
}
