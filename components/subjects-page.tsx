"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { presentSubjectCourses } from "@/lib/subjects-presentation";

type SubjectsMode = "empty" | "demo";

export function SubjectsPage({ mode }: { mode: SubjectsMode }) {
  const demo = mode === "demo";
  const { preferences } = useLearnerPreferences();
  const [evidence, setEvidence] = useState(getEmptyProgressEvidence);
  useEffect(() => {
    const update = () => setEvidence(getProgressEvidence());
    update();
    const events = ["stemforge:local-progress-updated", "stemforge:progress-sync-updated", "storage"];
    events.forEach((event) => window.addEventListener(event, update));
    return () => events.forEach((event) => window.removeEventListener(event, update));
  }, []);
  const courses = useMemo(() => presentSubjectCourses(preferences, evidence), [preferences, evidence]);

  return <AppShell demo={demo} active="Subjects" feedbackPlacement="inline-mobile" className="!px-10 py-8 max-md:!px-4 max-lg:pt-5">
    <div className="-mx-4 -mt-8 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-rule bg-white px-4 py-4 text-secondary md:-mx-10 md:px-10 max-lg:-mt-5">
      <p className="font-mono text-xs uppercase tracking-[0.12em]">Orthic <span aria-hidden="true" className="mx-2 text-rule">/</span> Courses</p>
      <div className="flex items-center gap-4">
        {preferences.firstName ? <span className="flex items-center gap-3 text-sm">{preferences.firstName}<span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-rule bg-academic-blue text-xs">{preferences.firstName.charAt(0)}</span></span> : null}
        <AppTopbar demo={demo} />
      </div>
    </div>
    <div className="mx-auto grid min-w-0 max-w-[1220px] gap-10 pb-10 pt-8 max-sm:gap-7 max-sm:pt-6" data-testid="courses-discovery-page">
      <header>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-navy max-sm:text-[28px]">Courses</h1>
        <p className="mt-2 text-base leading-relaxed text-secondary">Your courses and available Scottish curriculum tracks.</p>
      </header>
      {demo ? <div className="grid gap-10" data-testid="qualification-course-list">
        {courses.yourCourses.length > 0 ? <CourseSection title="Your courses" id="your-courses" courses={courses.yourCourses} /> : null}
        {courses.exploreCourses.length > 0 ? <CourseSection title="Explore courses" id="explore-courses" courses={courses.exploreCourses} /> : null}
      </div> : <section aria-labelledby="courses-empty-title" className="border-t border-rule pt-6">
        <h2 id="courses-empty-title" className="text-lg font-semibold">No courses available yet</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Published Orthic courses will appear here when course content is ready.</p>
      </section>}
    </div>
  </AppShell>;
}

type Course = ReturnType<typeof presentSubjectCourses>["yourCourses"][number];

function CourseSection({ title, id, courses }: { title: string; id: string; courses: Course[] }) {
  return <section aria-labelledby={id} data-testid={id}>
    <h2 id={id} className="mb-5 border-b border-rule pb-3 text-lg font-semibold">{title}</h2>
    <div className="divide-y divide-rule rounded-sm border border-rule bg-white">
      {courses.map((course) => <article key={course.slug} data-testid={`subject-card-${course.slug}`} className="orthic-course-row flex min-w-0 flex-col gap-5 border-rule p-5 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold leading-tight tracking-tight text-navy">{course.name}</h3>
            <span className="rounded-sm bg-academic-blue px-2 py-1 text-xs text-navy">{course.selected ? "Enrolled" : "Available"}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm leading-relaxed text-secondary">
            {course.progress && course.progress.availablePathCount > 0 ? <p>{course.progress.completedPathCount} of {course.progress.availablePathCount} skills learned</p> : null}
            {course.dueSkillCount > 0 ? <span className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">{course.dueSkillCount} {course.dueSkillCount === 1 ? "review" : "reviews"} due</span> : null}
          </div>
        </div>
        <Link href={course.href} aria-label={`Open ${course.name}`} className="orthic-primary-action inline-flex min-h-11 shrink-0 items-center justify-center gap-3 self-start rounded-sm border border-navy bg-navy px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy max-sm:w-full">Open course <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
      </article>)}
    </div>
  </section>;
}
