import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LearnerCourse } from "@/lib/learner-preferences";
import { selectDashboardCourses } from "@/lib/dashboard-courses";

export function DashboardCourses({ courses, focusCourseSlug, attentionCourseSlugs, selectedCourseSlugs, progressCourseSlug, completedPathCount, availablePathCount, reviewSummary, reviewDue }: {
  courses: readonly LearnerCourse[];
  focusCourseSlug: string | null;
  attentionCourseSlugs: readonly string[];
  selectedCourseSlugs: readonly string[];
  progressCourseSlug: string;
  completedPathCount: number;
  availablePathCount: number;
  reviewSummary: string;
  reviewDue: boolean;
}) {
  return <section aria-labelledby="your-courses-title" data-testid="dashboard-courses-section" className="pt-1">
    <div className="mb-3 flex flex-wrap items-start gap-3 xl:justify-between">
      <h2 id="your-courses-title" className="text-lg font-semibold uppercase tracking-wide">Your courses</h2>
      <Link href="/subjects" className="orthic-secondary-link inline-flex min-h-11 items-center gap-2 text-sm text-secondary">View all courses <span aria-hidden="true" className="orthic-arrow">→</span></Link>
    </div>
    <div className="divide-y divide-rule border-y border-rule" data-testid="dashboard-courses">
      {selectDashboardCourses(courses, focusCourseSlug, attentionCourseSlugs).map((course) => <div key={course.slug} data-testid="dashboard-course-row" className="orthic-course-row flex flex-wrap items-center gap-3 border-b border-rule px-1 py-4">
        <Link href={course.href} aria-label={`Open ${course.name}`} className="orthic-secondary-link min-w-0 basis-full">
          <span className="flex flex-wrap items-center gap-2 text-lg font-medium">{course.name}<span className="rounded-sm bg-academic-blue px-2 py-1 font-mono text-[10px] uppercase tracking-wide">{selectedCourseSlugs.includes(course.slug) ? "Selected" : "Available"}</span></span>
          {course.slug === progressCourseSlug ? <span className="mt-1 block text-sm text-secondary">{completedPathCount} of {availablePathCount} skills learned · <span className={reviewDue ? "text-amber-800" : undefined}>{reviewSummary}</span></span> : null}
        </Link>
        <Link href={course.href} aria-label={`${course.name} course hub`} className="orthic-secondary-link inline-flex min-h-11 items-center px-2 text-sm text-secondary">Course hub</Link>
        <Link href={`/subjects/${course.slug}/course-tracker`} aria-label={`${course.name} course tracker`} className="orthic-course-action inline-flex min-h-11 items-center gap-2 rounded-sm border border-rule px-3 text-sm text-navy">Course Tracker <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
      </div>)}
    </div>
  </section>;
}
