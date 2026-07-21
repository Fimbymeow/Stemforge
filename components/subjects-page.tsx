"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Lock, Orbit, Sigma } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import { subjectCatalog } from "@/data/subjects";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import type { LearnerNextAction } from "@/lib/learning/next-action";

type SubjectsMode = "empty" | "demo";

const subjectIcons = {
  "Higher Maths": Sigma,
  "Higher Physics": Orbit,
} as const;

export function SubjectsPage({ mode }: { mode: SubjectsMode }) {
  const demo = mode === "demo";
  const nextAction = useLearnerNextAction();

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
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Structured Qualifications Scotland learning for Scottish students. Choose a subject to get started.</p>
            </div>
          </div>
        </header>

        {demo ? (
          <section>
            <h2 className="mb-2 text-lg font-extrabold">Choose a subject</h2>
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
              {subjectCatalog.map((subject) => (
                <SubjectCard key={subject.name} subject={subject} nextAction={nextAction} />
              ))}
              <EmptySubjectCard />
              <EmptySubjectCard />
            </div>
          </section>
        ) : (
          <Card className="p-8">
            <EmptyState title="No subjects available yet" copy="Published STEM Forge subjects will appear here when course content is ready." />
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function SubjectCard({ subject, nextAction }: { subject: (typeof subjectCatalog)[number]; nextAction: LearnerNextAction }) {
  const Icon = subject.name in subjectIcons ? subjectIcons[subject.name as keyof typeof subjectIcons] : GraduationCap;
  const recommended = subject.name === "Higher Maths" && nextAction.href && nextAction.subjectId === "higher-maths";

  return (
    <Card className="p-4">
      <span className="mb-3 grid size-10 place-items-center rounded-xl bg-forge-soft text-forge">
        <Icon className="size-5" />
      </span>
      <h3 className="m-0 text-lg font-extrabold">{subject.name}</h3>
      <p className="mt-2 min-h-[54px] text-sm text-muted">{subject.description}</p>
      <p className={`mt-3 text-xs font-bold ${subject.available ? "text-forge" : "text-muted"}`}>{subject.status}</p>
      {subject.available ? (
        <Link href={recommended ? nextAction.href! : subject.href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-forge text-sm font-extrabold text-white">
          {recommended ? nextAction.label : "Open subject"}
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-line bg-paper text-sm font-extrabold text-muted">
          <Lock className="size-4" />
          Locked
        </span>
      )}
    </Card>
  );
}

function EmptySubjectCard() {
  return (
    <Card className="grid place-items-center border-dashed p-4 text-center opacity-70">
      <div>
        <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-[#f4f1eb] text-muted">
          <GraduationCap className="size-5" />
        </span>
        <p className="text-sm font-bold text-muted">More subjects coming soon</p>
      </div>
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
