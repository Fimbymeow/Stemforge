"use client";

import Link from "next/link";
import { ArrowRight, Calculator, FileClock, ListChecks } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import { getActiveSubject, getAllSkillPaths, getAvailableSkillPaths } from "@/lib/learning-paths";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { PracticeEntryCard } from "@/components/practice/practice-entry-card";
import { ReviewEntryCard } from "@/components/review/review-entry-card";
import { WorkingContextHubCard } from "@/components/working-context/working-context-hub-card";
import { getQualificationPresentation } from "@/lib/qualification-presentation";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const nextAction = useLearnerNextAction();
  const qualification = getQualificationPresentation(subject.level);
  const availableSkillCount = getAvailableSkillPaths(subject).length;
  const totalSkillCount = getAllSkillPaths(subject).length;

  return (
    <AppShell demo active="Subjects" workingContextPathId={nextAction.pathId}>
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
              <p className="mt-1 text-xs font-bold text-muted" data-testid="higher-maths-coverage">{availableSkillCount} of {totalSkillCount} Higher Maths skills available</p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-lg font-extrabold">Start here</h2>
          <WorkingContextHubCard pathId={nextAction.pathId} />
        </section>

        <section aria-labelledby="course-destinations-title">
          <h2 id="course-destinations-title" className="mb-2 text-lg font-extrabold">Course destinations</h2>
          <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-4 max-md:grid-cols-1" data-testid="higher-maths-destinations">
            <PracticeEntryCard preferredPathId={nextAction.pathId} testId="higher-maths-practice" headingLevel={3} />
            <ReviewEntryCard headingLevel={3} />
            <Card aria-label="Course Tracker" className="flex h-full flex-col p-5" data-testid="course-tracker-destination">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Course Tracker</p>
                  <h3 className="mt-1 text-xl font-extrabold">Explore the full course</h3>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge"><ListChecks aria-hidden="true" className="size-5" /></span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">See all 49 skills, official requirements and your current progress.</p>
              <Link href="/subjects/higher-maths/course-tracker" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 text-sm font-extrabold text-forge">
                Open Course Tracker <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Card>
            <Card aria-label="Past Papers, coming soon" className="flex h-full flex-col border-line/80 bg-paper/60 p-5 text-muted" data-testid="past-papers-destination">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide">Past Papers</p>
                  <h3 className="mt-1 text-xl font-extrabold text-ink">Exam practice</h3>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white"><FileClock aria-hidden="true" className="size-5" /></span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed">Past-paper practice is planned, but it is not available yet.</p>
              <span className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold" aria-label="Past Papers coming soon">Coming soon</span>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
