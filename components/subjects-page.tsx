import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Link from "next/link";
import { ArrowRight, Check, GraduationCap, Lock, Orbit, Sigma } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ButtonLink, Card, ProgressBar } from "@/components/ui";
import { LockedCard } from "@/components/locked-card";
import { higherMathsSubject, subjectCatalog, subjectRoadmap } from "@/data/subjects";

type SubjectsMode = "empty" | "demo";

const subjectIcons = {
  "Higher Maths": Sigma,
  "Higher Physics": Orbit,
} as const;

export function SubjectsPage({ mode }: { mode: SubjectsMode }) {
  const demo = mode === "demo";

  return (
    <AppShell demo={demo} active="Subjects">
      <div className="mx-auto mb-6 flex max-w-[1240px] justify-end">
        <AppTopbar demo={demo} />
      </div>
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1">
        <section className="grid gap-6">
          <PageIntro />
          <FeaturedSubjectCard demo={demo} />
          <AvailableSubjects demo={demo} />
          <LearningCard demo={demo} />
        </section>
        <aside className="grid content-start gap-5">
          <RecommendationCard demo={demo} />
          <ProgressOverviewCard demo={demo} />
          <RoadmapCard demo={demo} />
        </aside>
      </div>
    </AppShell>
  );
}

function PageIntro() {
  return (
    <header>
      <h1 className="m-0 text-[clamp(38px,4vw,56px)] font-extrabold leading-none">Subjects</h1>
      <p className="mt-4 text-xl text-muted">Start with Higher Maths. Higher Physics is coming soon.</p>
    </header>
  );
}

function FeaturedSubjectCard({ demo }: { demo: boolean }) {
  return (
    <Card className="overflow-hidden p-8">
      {demo ? (
        <div className="grid grid-cols-[1fr_auto] gap-8 max-md:grid-cols-1">
          <div>
            <span className="inline-flex rounded-lg bg-[#fff4ec] px-4 py-2 text-sm font-extrabold text-forge">
              Available Now
            </span>
            <h2 className="mb-4 mt-5 text-[clamp(32px,4vw,52px)] font-extrabold leading-none">
              {higherMathsSubject.name}
            </h2>
            <p className="max-w-2xl text-xl leading-relaxed text-muted">
              Structured SQA learning paths for Scottish STEM students. The first proof-of-concept is Higher Maths / Calculus / Differentiation.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-4 max-md:grid-cols-1">
              <MiniStat label="Course Area" value="Calculus" />
              <MiniStat label="Spec Area" value="Differentiation" />
              <MiniStat label="Questions" value="8" />
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink href="/subjects/higher-maths">Open Higher Maths</ButtonLink>
              <ButtonLink href={getActiveSkillPathHref()} variant="secondary">
                Try Basic differentiation
              </ButtonLink>
            </div>
          </div>
          <div className="grid min-w-[260px] content-center gap-3 rounded-2xl border border-line bg-[#fffaf5] p-6">
            <p className="m-0 text-sm font-bold uppercase text-forge">Proof of concept</p>
            {["Foundations", "Applications", "Past Paper-style Questions"].map((stage) => (
              <div key={stage} className="flex items-center gap-3 rounded-xl bg-white p-3">
                <Check className="size-5 text-forge" />
                <span className="font-bold">{stage}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No subjects available yet" copy="Published STEM Forge subjects will appear here when course content is ready." />
      )}
    </Card>
  );
}

function AvailableSubjects({ demo }: { demo: boolean }) {
  return (
    <section>
      <h2 className="mb-5 text-2xl font-extrabold">Subjects</h2>
      {demo ? (
        <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
          {subjectCatalog.map((subject) => (
            <SubjectCard key={subject.name} subject={subject} />
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <EmptyState title="Subject catalogue is empty" copy="Subjects will appear here once they are added to STEM Forge." />
        </Card>
      )}
    </section>
  );
}

function SubjectCard({ subject }: { subject: (typeof subjectCatalog)[number] }) {
  const Icon = subject.name in subjectIcons ? subjectIcons[subject.name as keyof typeof subjectIcons] : GraduationCap;
  const content = (
    <Card
      className={`h-full p-6 transition ${
        subject.available ? "border-forge/40 bg-gradient-to-br from-forge/10 to-white hover:-translate-y-0.5" : "bg-white opacity-75"
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">
          <Icon className="size-6" />
        </span>
        <span className={`rounded-lg px-3 py-1 text-xs font-extrabold ${subject.available ? "bg-[#fff4ec] text-forge" : "bg-[#f4f1eb] text-muted"}`}>
          {subject.status}
        </span>
      </div>
      <h3 className="mb-3 text-2xl font-extrabold">{subject.name}</h3>
      <p className="min-h-[72px] text-muted">{subject.description}</p>
      {subject.available ? (
        <ButtonLink href={subject.href} className="mt-5">Open Higher Maths</ButtonLink>
      ) : (
        <div className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-[#fffdf9] px-5 text-sm font-extrabold uppercase text-muted">
          <Lock className="size-4" />
          Coming Soon
        </div>
      )}
    </Card>
  );

  return content;
}

function LearningCard({ demo }: { demo: boolean }) {
  return (
    <Card className="p-7">
      <h2 className="mb-6 text-2xl font-extrabold">Your Learning</h2>
      {demo ? (
        <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
          <MiniStat label="Current subject" value="Higher Maths" />
          <div>
            <p className="mb-3 text-sm font-bold uppercase text-muted">Path status</p>
            <div className="grid gap-2">
              {["Basic differentiation", "0 / 8 questions", "Not started"].map((item) => (
                <span key={item} className="rounded-lg border border-line bg-[#fffdf9] px-3 py-2 font-semibold">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-sm font-bold uppercase text-muted">Continue Learning</p>
            <strong className="block text-2xl">Basic differentiation</strong>
            <p className="mb-4 mt-2 text-sm text-muted">0% complete</p>
            <ButtonLink href={getActiveSkillPathHref()}>Continue</ButtonLink>
          </div>
        </div>
      ) : (
        <EmptyState title="No learning activity yet" copy="Recently studied topics and current progress will appear here." />
      )}
    </Card>
  );
}

function RecommendationCard({ demo }: { demo: boolean }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Recommended Next</h2>
        <span className="grid size-8 place-items-center rounded-full bg-forge text-white">
          <ArrowRight className="size-5" />
        </span>
      </div>
      {demo ? (
        <>
          <p className="mb-2 text-sm font-bold uppercase text-muted">Start</p>
          <h3 className="text-2xl font-extrabold">Basic differentiation</h3>
          <div className="my-5">
            <div className="mb-2 flex justify-between font-bold">
              <span>Progress</span>
              <span>0%</span>
            </div>
            <ProgressBar value={0} />
          </div>
          <ButtonLink href={getActiveSkillPathHref()}>Continue Path</ButtonLink>
        </>
      ) : (
        <p className="text-muted">A recommendation will appear when a subject is selected.</p>
      )}
    </Card>
  );
}

function ProgressOverviewCard({ demo }: { demo: boolean }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Progress Overview</h2>
      <div className="grid gap-4">
        <SideStat label="Questions Completed" value={demo ? String(higherMathsSubject.questionsCompleted) : "0"} />
        <SideStat label="Basic differentiation" value={demo ? "0 / 8" : "0 / 8"} />
        <SideStat label="Accuracy" value="Not started" />
      </div>
    </Card>
  );
}

function RoadmapCard({ demo }: { demo: boolean }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Roadmap</h2>
      <div className="grid gap-3">
        {subjectRoadmap.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <span className={`grid size-6 place-items-center rounded-full border ${index === 0 && demo ? "border-forge bg-forge text-white" : "border-line text-muted"}`}>
              {index === 0 && demo ? <Check className="size-4" /> : null}
            </span>
            <span className={index === 0 && demo ? "font-extrabold" : "text-muted"}>{item}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="mb-2 text-sm font-bold uppercase text-muted">{label}</p>
      <strong className="text-2xl">{value}</strong>
    </div>
  );
}

function SideStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-[#fffdf9] p-4">
      <span className="text-muted">{label}</span>
      <strong className="text-xl">{value}</strong>
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






