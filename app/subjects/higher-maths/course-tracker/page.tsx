import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CourseTracker } from "@/components/learning/course-tracker";
import { CourseHubProgress } from "@/components/learning/course-hub-progress";
import { getActiveSubject } from "@/lib/learning-paths";

export default function HigherMathsCourseTrackerPage() {
  const subject = getActiveSubject();
  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-8 flex max-w-[1040px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid min-w-0 max-w-[1040px] grid-cols-[minmax(0,1fr)] gap-8">
        <header className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
          <Link href="/subjects/higher-maths" className="orthic-secondary-link inline-flex min-h-11 w-fit items-center gap-2 rounded text-sm font-medium text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Higher Maths
          </Link>
          <div className="grid gap-2"><CourseHubProgress subject={subject} /><div aria-hidden="true" className="h-px bg-rule" /></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded bg-forge-soft text-forge"><ListChecks aria-hidden="true" className="size-4" /></span>
            <div>
              <h1 className="text-[32px] font-bold leading-tight tracking-tight max-sm:text-[28px]">Course Tracker</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-secondary">Explore the full course, official requirements and your progress through each skill.</p>
            </div>
          </div>
        </header>
        <CourseTracker subject={subject} />
      </div>
    </AppShell>
  );
}
