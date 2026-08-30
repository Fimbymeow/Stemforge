"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Orbit, Sigma } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card, PageHeaderIconChip } from "@/components/ui";
import { subjectCatalog } from "@/data/subjects";
import { groupCoursesByQualification } from "@/lib/course-catalog-presentation";

type SubjectsMode = "empty" | "demo";

const subjectIcons = {
  Maths: Sigma,
  Physics: Orbit,
} as const;

export function SubjectsPage({ mode }: { mode: SubjectsMode }) {
  const demo = mode === "demo";
  const qualificationGroups = groupCoursesByQualification(subjectCatalog.filter((course) => course.available));

  return (
    <AppShell demo={demo} active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo={demo} />
      </div>
      <div className="mx-auto grid max-w-[1120px] gap-6">
        <header className="flex items-start gap-3">
          <PageHeaderIconChip>
            <GraduationCap aria-hidden="true" className="size-5" />
          </PageHeaderIconChip>
          <div>
            <h1 className="m-0 text-[28px] font-extrabold leading-tight">Subjects</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Choose a course and start with the skill that suits you.</p>
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
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-forge/20 bg-forge-soft text-forge">
        <Icon aria-hidden="true" className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <h3 className="text-base font-extrabold leading-tight text-ink">{course.name}</h3>
        {course.slug === "higher-maths" ? <span className="mt-1 block text-xs font-medium text-muted">Structured notes, practice and Review</span> : null}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-extrabold text-forge">Open course</span>
        <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-forge transition-transform group-hover:translate-x-0.5" />
      </span>
    </>
  );
  const className = "group grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-3 transition-colors";
  const testId = `subject-card-${slug(course.name)}`;

  return (
    <Link href={course.href} aria-label={`Open ${course.name}`} data-testid={testId} className={`${className} hover:bg-forge-soft/70 focus-visible:bg-forge-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge`}>
      {content}
    </Link>
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
