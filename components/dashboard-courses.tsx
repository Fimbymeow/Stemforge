import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LearnerCourse } from "@/lib/learner-preferences";
import { selectDashboardCourses } from "@/lib/dashboard-courses";

export function DashboardCourses({ courses, focusCourseSlug, attentionCourseSlugs, progressCourseSlug, completedPathCount, availablePathCount, reviewSummary, reviewDue }: {
  courses: readonly LearnerCourse[];
  focusCourseSlug: string | null;
  attentionCourseSlugs: readonly string[];
  progressCourseSlug: string;
  completedPathCount: number;
  availablePathCount: number;
  reviewSummary: string;
  reviewDue: boolean;
}) {
  return <section aria-labelledby="your-courses-title" data-testid="dashboard-courses-section" className="pt-1">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-2">
      <h2 id="your-courses-title" className="text-sm font-semibold uppercase tracking-[0.04em]">Your courses</h2>
      <Link href="/subjects" className="orthic-secondary-link inline-flex min-h-11 items-center gap-2 text-xs text-secondary">View all <span aria-hidden="true" className="orthic-arrow">→</span></Link>
    </div>
    <div className="mt-2 grid gap-3" data-testid="dashboard-courses">
      {selectDashboardCourses(courses, focusCourseSlug, attentionCourseSlugs).map((course) => <div key={course.slug} data-testid="dashboard-course-row" className="orthic-course-row flex flex-wrap items-center gap-3 rounded border border-rule bg-surface p-4">
        <Link href={course.href} aria-label={`Open ${course.name}`} className="orthic-secondary-link min-w-0 basis-full">
          <span className="text-base font-semibold">{course.name}</span>
          {course.slug === progressCourseSlug ? <span className="mt-1 block text-sm text-secondary">{completedPathCount} of {availablePathCount} skills learned · <span className={reviewDue ? "text-amber-800" : undefined}>{reviewSummary}</span></span> : null}
        </Link>
        <Link href={`/subjects/${course.slug}/course-tracker`} aria-label={`${course.name} course tracker`} className="orthic-course-action inline-flex min-h-11 items-center gap-2 rounded-sm bg-academic-blue px-3 text-sm text-navy">Course Tracker <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
      </div>)}
    </div>
  </section>;
}
