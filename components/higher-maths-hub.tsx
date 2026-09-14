"use client";

import Link from "next/link";
import { Files, ListChecks, Search, Shuffle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getActiveSubject } from "@/lib/learning-paths";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { ReviewEntryCard } from "@/components/review/review-entry-card";
import { WorkingContextHubCard } from "@/components/working-context/working-context-hub-card";
import { SubjectRoadmapNavigator } from "@/components/learning/subject-roadmap-navigator";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const nextAction = useLearnerNextAction();

  return (
    <AppShell demo active="Subjects" workingContextPathId={nextAction.pathId} feedbackPlacement="inline-mobile" className="!px-10 py-8 max-md:!px-4 max-lg:pt-5">
      <div className="-mx-4 -mt-8 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-rule bg-white px-4 py-4 text-secondary md:-mx-10 md:px-10 max-lg:-mt-5">
        <nav className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.12em]" aria-label="Breadcrumb">
          <Link href="/subjects" className="orthic-secondary-link inline-flex min-h-11 items-center">Courses</Link><span aria-hidden="true" className="text-rule">/</span><span aria-current="page">Higher Maths</span>
        </nav>
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid min-w-0 max-w-[1220px] grid-cols-[minmax(0,1fr)] gap-7 pb-8 pt-8 max-sm:pt-6" data-testid="course-hub-page">
        <header className="min-w-0 border-b border-rule pb-6">
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-navy max-sm:text-[28px]">Higher Maths</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-secondary">Learn through focused stages, practise deliberately and revisit skills when Review recommends it.</p>
        </header>

        <section aria-labelledby="continue-learning-title" className="min-w-0">
          <h2 id="continue-learning-title" className="sr-only">Continue learning</h2>
          <WorkingContextHubCard pathId={nextAction.pathId} />
        </section>

        <section aria-labelledby="course-actions-title" className="min-w-0">
          <h2 id="course-actions-title" className="sr-only">Course tools</h2>
          <div className="grid min-w-0 grid-cols-1 overflow-hidden rounded-sm border border-rule min-[375px]:grid-cols-2 lg:grid-cols-5" data-testid="higher-maths-destinations">
            <Destination href="/practice" label="Practice" detail="Choose how to practise" icon={Shuffle} testId="practice-destination" />
            <Destination href="/subjects/higher-maths/question-bank" label="Question Bank" detail="Choose exact questions" icon={Search} testId="question-bank-destination" />
            <ReviewEntryCard headingLevel={3} compact />
            <Destination href="/subjects/higher-maths/course-tracker" label="Course Tracker" detail="Curriculum and progress" icon={ListChecks} testId="course-tracker-destination" />
            <Destination href="/subjects/higher-maths/past-papers" label="Past Papers" detail="Official exam materials" icon={Files} testId="past-papers-destination" />
          </div>
        </section>

        <section aria-labelledby="unit-navigation-title" className="min-w-0">
          <div className="mb-3">
            <div>
              <h2 id="unit-navigation-title" className="text-2xl font-semibold tracking-tight text-navy">Course units</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">Select a curriculum area to see its skills.</p>
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
    <Link href={href} aria-label={label} data-testid={testId} className="orthic-course-action flex min-h-20 items-center gap-3 border-b border-r border-rule bg-white px-4 py-4 text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-secondary" />
      <span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-relaxed text-secondary">{detail}</span></span>
    </Link>
  );
}
