"use client";

import Link from "next/link";
import { ArrowRight, Clock3, GraduationCap, Orbit, Sigma } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import { subjectCatalog } from "@/data/subjects";
import { getQualificationPresentation } from "@/lib/qualification-presentation";

type SubjectsMode = "empty" | "demo";

const subjectIcons = {
  "Higher Maths": Sigma,
  "Higher Physics": Orbit,
} as const;

export function SubjectsPage({ mode }: { mode: SubjectsMode }) {
  const demo = mode === "demo";

  return (
    <AppShell demo={demo} active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo={demo} />
      </div>
      <div className="mx-auto grid max-w-[1120px] gap-5">
        <header>
          <div className="grid grid-cols-[48px_1fr] items-center gap-3 max-md:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge">
              <GraduationCap className="size-6" />
            </span>
            <div>
              <h1 className="m-0 text-[32px] font-extrabold leading-none">Subjects</h1>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Choose a subject and qualification. Only courses with published learning are available.</p>
            </div>
          </div>
        </header>

        {demo ? (
          <section>
            <h2 className="mb-2 text-lg font-extrabold">Courses</h2>
            <div className="grid max-w-[920px] auto-rows-fr grid-cols-2 items-stretch gap-4 max-md:grid-cols-1">
              {subjectCatalog.map((subject) => (
                <SubjectCard key={subject.name} subject={subject} />
              ))}
            </div>
          </section>
        ) : (
          <Card className="p-8">
            <EmptyState title="No subjects available yet" copy="Published Orthic subjects will appear here when course content is ready." />
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function SubjectCard({ subject }: { subject: (typeof subjectCatalog)[number] }) {
  const Icon = subject.name in subjectIcons ? subjectIcons[subject.name as keyof typeof subjectIcons] : GraduationCap;
  const qualification = getQualificationPresentation(subject.level);

  return (
    <Card data-testid={`subject-card-${subject.name.toLowerCase().replaceAll(" ", "-")}`} className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-xl ${subject.available ? "bg-forge-soft text-forge" : "bg-[#ebe7df] text-muted"}`}>
          <Icon className="size-5" />
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${qualification.className}`}>{qualification.label}</span>
      </div>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-muted">{subject.subject}</p>
      <h3 className="mt-1 text-xl font-extrabold">{subject.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{subject.description}</p>
      <p className={`mt-3 text-xs font-bold ${subject.available ? "text-forge" : "text-muted"}`}>{subject.status}</p>
      {subject.available ? (
        <div className="mt-4">
          <Link href={subject.href} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-forge px-4 text-center text-sm font-extrabold text-white">
            {subject.name === "Higher Maths" ? "Open Higher Maths" : "Open subject"}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <span className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-line bg-paper text-sm font-extrabold text-muted">
          <Clock3 className="size-4" />
          Coming soon
        </span>
      )}
    </Card>
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
