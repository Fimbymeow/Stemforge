"use client";

import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SubjectRoadmapNavigator } from "@/components/learning/subject-roadmap-navigator";
import { getActiveSkillPath, getActiveSubject } from "@/lib/learning-paths";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { PracticeEntryCard } from "@/components/practice/practice-entry-card";
import { WorkingContextHubCard } from "@/components/working-context/working-context-hub-card";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const nextAction = useLearnerNextAction();

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid max-w-[1120px] gap-5">
        <header>
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Subjects</Link><ArrowRight className="size-4" /><span className="font-bold text-forge">Higher Maths</span>
          </nav>
          <div className="grid grid-cols-[48px_1fr] items-center gap-3 max-md:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge"><Calculator className="size-6" /></span>
            <div>
              <h1 className="m-0 text-[32px] font-extrabold leading-none">Higher Maths</h1>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Structured Qualifications Scotland learning for Scottish students.</p>
              <p className="mt-2 text-sm font-bold text-muted">Calculus is partially available now. More Higher Maths areas are being added.</p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-lg font-extrabold">Start here</h2>
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(240px,1fr)] items-stretch gap-4 max-[900px]:grid-cols-1">
            <WorkingContextHubCard pathId={skillPath.slug} />
            <PracticeEntryCard preferredPathId={nextAction.pathId} testId="higher-maths-practice" />
          </div>
        </section>

        <section aria-labelledby="course-coverage-title" className="min-w-0 max-w-full">
          <h2 id="course-coverage-title" className="mb-2 text-lg font-extrabold">Full course coverage</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted">Browse all four course areas. Progress is measured only across published questions in available content.</p>
          <SubjectRoadmapNavigator subject={subject} />
        </section>
      </div>
    </AppShell>
  );
}
