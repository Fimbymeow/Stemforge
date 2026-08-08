import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CourseTracker } from "@/components/learning/course-tracker";
import { getActiveSubject } from "@/lib/learning-paths";

export default function HigherMathsCourseTrackerPage() {
  const subject = getActiveSubject();
  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1240px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid max-w-[1240px] gap-6">
        <header className="grid gap-4">
          <Link href="/subjects/higher-maths" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg text-sm font-extrabold text-forge">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Higher Maths
          </Link>
          <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge"><ListChecks aria-hidden="true" className="size-6" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Higher Maths</p>
              <h1 className="mt-1 text-[32px] font-extrabold leading-tight">Course Tracker</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Explore the full course, official requirements and your progress through the skills available now.</p>
            </div>
          </div>
        </header>
        <CourseTracker subject={subject} />
      </div>
    </AppShell>
  );
}
