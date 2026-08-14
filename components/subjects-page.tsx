"use client";

import Link from "next/link";
import { ArrowRight, Clock3, GraduationCap, Orbit, Sigma } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import { subjectCatalog } from "@/data/subjects";
import { groupCoursesByQualification } from "@/lib/course-catalog-presentation";
import { getActiveSubject, getAllSkillPaths, getAvailableSkillPaths } from "@/lib/learning-paths";

type SubjectsMode = "empty" | "demo";

const subjectIcons = {
  Maths: Sigma,
  Physics: Orbit,
} as const;

const activeSubject = getActiveSubject();
const higherMathsScope = `${getAvailableSkillPaths(activeSubject).length} of ${getAllSkillPaths(activeSubject).length} skills available`;

export function SubjectsPage({ mode }: { mode: SubjectsMode }) {
  const demo = mode === "demo";
  const qualificationGroups = groupCoursesByQualification(subjectCatalog);

  return (
    <AppShell demo={demo} active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo={demo} />
      </div>
      <div className="mx-auto grid max-w-[1120px] gap-6">
        <header className="flex items-start gap-3">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-forge-soft bg-forge-soft text-forge">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h1 className="m-0 text-[28px] font-extrabold leading-tight">Subjects</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Choose a subject and qualification. Only courses with published learning are available.</p>
          </div>
        </header>

        {demo ? (
          <div className="grid gap-7" data-testid="qualification-course-list">
            {qualificationGroups.map((group) => (
              <section key={group.level} aria-labelledby={`qualification-${slug(group.level)}`} data-testid={`qualification-group-${slug(group.level)}`}>
                <h2 id={`qualification-${slug(group.level)}`} className="mb-2 text-lg font-extrabold">{group.level}</h2>
                <div className="divide-y divide-line border-y border-line">
                  {group.courses.map((course) => <CourseRow key={course.slug} course={course} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <EmptyState title="No subjects available yet" copy="Published Orthic subjects will appear here when course content is ready." />
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function CourseRow({ course }: { course: (typeof subjectCatalog)[number] }) {
  const Icon = course.subject in subjectIcons ? subjectIcons[course.subject as keyof typeof subjectIcons] : GraduationCap;
  const content = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${course.available ? "border-forge/20 bg-forge-soft text-forge" : "border-line bg-paper text-muted"}`}>
        <Icon aria-hidden="true" className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-ink">{course.subject}</span>
        <span className="mt-0.5 block text-xs text-muted">{course.name}{course.slug === "higher-maths" ? ` · ${higherMathsScope}` : ""}</span>
      </span>
      <span className={`shrink-0 text-xs font-extrabold ${course.available ? "text-forge" : "text-muted"}`}>{course.available ? "Available now" : "Coming soon"}</span>
      {course.available ? <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-forge" /> : <Clock3 aria-hidden="true" className="size-4 shrink-0 text-muted" />}
    </>
  );
  const className = "flex min-h-16 items-center gap-3 px-1 py-2.5 transition max-sm:flex-wrap max-sm:gap-x-3";
  const testId = `subject-card-${slug(course.name)}`;

  return course.available ? (
    <Link href={course.href} aria-label={`Open ${course.name}`} data-testid={testId} className={`${className} hover:bg-forge-soft focus-visible:bg-forge-soft`}>
      {content}
    </Link>
  ) : (
    <div data-testid={testId} className={className} aria-label={`${course.name}, Coming soon`}>
      {content}
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-xl border border-dashed border-line bg-paper p-8 text-center">
      <div>
        <GraduationCap className="mx-auto mb-4 size-10 text-forge" />
        <h3 className="text-2xl font-extrabold">{title}</h3>
        <p className="mx-auto mt-3 max-w-xl text-muted">{copy}</p>
      </div>
    </div>
  );
}

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}
