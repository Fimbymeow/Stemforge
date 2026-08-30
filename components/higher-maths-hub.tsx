"use client";

import Link from "next/link";
import { ArrowRight, Calculator, Files, ListChecks, Search, Shuffle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getActiveSubject } from "@/lib/learning-paths";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { ReviewEntryCard } from "@/components/review/review-entry-card";
import { WorkingContextHubCard } from "@/components/working-context/working-context-hub-card";
import { SubjectRoadmapNavigator } from "@/components/learning/subject-roadmap-navigator";
import { PageHeaderIconChip } from "@/components/ui";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const nextAction = useLearnerNextAction();

  return (
    <AppShell demo active="Subjects" workingContextPathId={nextAction.pathId}>
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid min-w-0 max-w-[1120px] grid-cols-[minmax(0,1fr)] gap-5">
        <header className="min-w-0">
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Courses</Link><ArrowRight aria-hidden="true" className="size-4" /><span aria-current="page" className="font-bold text-forge">Higher Maths</span>
          </nav>
          <div className="flex items-start gap-3">
            <PageHeaderIconChip><Calculator aria-hidden="true" className="size-5" /></PageHeaderIconChip>
            <div>
              <h1 className="text-[28px] font-extrabold leading-tight">Higher Maths</h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Learn through focused stages, practise deliberately and revisit skills when Review recommends it.</p>
            </div>
          </div>
        </header>

        <section aria-labelledby="continue-learning-title" className="min-w-0">
          <h2 id="continue-learning-title" className="sr-only">Continue learning</h2>
          <WorkingContextHubCard pathId={nextAction.pathId} />
        </section>

        <section aria-labelledby="course-actions-title" className="min-w-0">
          <h2 id="course-actions-title" className="mb-2 text-base font-extrabold">Course actions</h2>
          <div className="grid min-w-0 grid-cols-5 gap-x-3 border-y border-line max-lg:grid-cols-1" data-testid="higher-maths-destinations">
            <Destination href="/practice" label="Practice" detail="Choose how to practise" icon={Shuffle} testId="practice-destination" />
            <Destination href="/subjects/higher-maths/question-bank" label="Question Bank" detail="Choose exact questions" icon={Search} testId="question-bank-destination" />
            <ReviewEntryCard headingLevel={3} compact />
            <Destination href="/subjects/higher-maths/course-tracker" label="Course Tracker" detail="Explore all 49 skills" icon={ListChecks} testId="course-tracker-destination" />
            <Destination href="/subjects/higher-maths/past-papers" label="Past Papers" detail="Official exam materials" icon={Files} testId="past-papers-destination" />
          </div>
        </section>

        <section aria-labelledby="unit-navigation-title" className="min-w-0">
          <div className="mb-3">
            <div>
              <h2 id="unit-navigation-title" className="text-lg font-extrabold">Course units</h2>
              <p className="mt-1 text-sm text-muted">Select a unit to see its skills.</p>
            </div>
          </div>
          <SubjectRoadmapNavigator subject={subject} />
        </section>
      </div>
    </AppShell>
  );
}

function Destination({ href, label, detail, icon: Icon, testId }: { href: string; label: string; detail: string; icon: typeof Shuffle; testId?: string }) {
  return (
    <Link href={href} aria-label={label} data-testid={testId} className="flex min-h-16 items-center gap-3 px-2 py-2 text-ink transition hover:bg-forge-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-forge">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
      <span className="min-w-0"><span className="block text-sm font-extrabold">{label}</span><span className="block truncate text-xs text-muted">{detail}</span></span>
      <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" />
    </Link>
  );
}
