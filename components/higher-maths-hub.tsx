"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, ClipboardList, FileText, Layers3, Lock, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card, ProgressBar } from "@/components/ui";
import { getActiveSkillPath, getQuestionBankHref, getQuestionHref, getResourceHref, getSkillPathHref } from "@/lib/learning-paths";
import { getNextQuestionId, getSkillPathProgress } from "@/lib/local-progress";

export function HigherMathsHub() {
  const skillPath = getActiveSkillPath();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const update = () => setVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  void version;
  const progress = getSkillPathProgress(skillPath);
  const nextQuestionId = getNextQuestionId(skillPath);
  const continueHref = nextQuestionId ? getQuestionHref(nextQuestionId) : getSkillPathHref(skillPath);

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-5 flex max-w-[1180px] justify-end">
        <AppTopbar demo />
      </div>
      <main className="mx-auto grid max-w-[1180px] gap-7">
        <header>
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Subjects</Link>
            <ArrowRight className="size-4" />
            <span className="font-bold text-forge">Higher Maths</span>
          </nav>
          <div className="grid grid-cols-[56px_1fr] items-center gap-4 max-md:grid-cols-1">
            <span className="grid size-14 place-items-center rounded-2xl border border-[#f3d8c5] bg-[#fff4ec] text-forge">
              <Calculator className="size-7" />
            </span>
            <div>
              <h1 className="m-0 text-[clamp(34px,4vw,52px)] font-extrabold leading-none">Higher Maths</h1>
              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">Structured SQA learning for Scottish students.</p>
              <p className="mt-2 text-sm font-bold text-muted">{skillPath.name} is available now. More Higher Maths paths are coming soon.</p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-3 text-xl font-extrabold">Start here</h2>
          <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)] gap-4 max-lg:grid-cols-1">
            <GuidedPathCard progress={progress} href={continueHref} skillPathName={skillPath.name} />
            <QuestionBankCard />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-extrabold">Learn</h2>
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
            <ResourceCard icon={<FileText className="size-5" />} title="Revision Notes" copy="Concise explanations for SQA Higher Maths skills." href={getResourceHref("revision-notes")} />
            <ResourceCard icon={<BookOpen className="size-5" />} title="Formula Cards" copy="Key formulae and rules at your fingertips." href={getResourceHref("formula-cards")} />
            <ResourceCard icon={<Sparkles className="size-5" />} title="Worked Examples" copy="Step-by-step solutions to build understanding." href={getResourceHref("worked-examples")} />
            <ResourceCard icon={<Layers3 className="size-5" />} title="Flashcards" copy="Quick active-recall cards for core facts and rules." href={getResourceHref("flashcards")} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-extrabold">Practice</h2>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <LockedModeCard icon={<ClipboardList className="size-5" />} title="Worksheets" badge="Coming soon" copy="Curated practice sets for topic fluency." />
            <ModeCard icon={<Target className="size-5" />} title="Past Paper-style Questions" badge={`Available in ${skillPath.name}`} copy="Original exam-style questions organised by learning stage." href={getSkillPathHref(skillPath)} cta="Open practice" />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-extrabold">Exam prep</h2>
          <LockedModeCard icon={<Lock className="size-5" />} title="Mock Exam Builder" badge="Coming soon" copy="Build custom SQA-style practice sessions when more topics are available." />
        </section>

        <Card className="bg-[#fffaf5] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-extrabold">Current beta focus</h2>
              <p className="mt-1 text-sm text-muted">Higher Maths is available through {skillPath.name}. Higher Physics remains locked while its learning paths are prepared.</p>
            </div>
            <Link href={getSkillPathHref(skillPath)} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-4 text-sm font-extrabold text-white max-md:w-full">
              Open {skillPath.name}
            </Link>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}

function GuidedPathCard({ progress, href, skillPathName }: { progress: ReturnType<typeof getSkillPathProgress>; href: string; skillPathName: string }) {
  return (
    <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-5">
      <div className="grid grid-cols-[88px_1fr_auto] items-center gap-5 max-lg:grid-cols-[72px_1fr] max-md:grid-cols-1">
        <div className="grid size-[88px] place-items-center rounded-2xl border border-[#f3d8c5] bg-[#fff4ec] text-forge max-md:h-24 max-md:w-full">
          <Target className="size-10" />
        </div>
        <div>
          <p className="mb-1 text-xs font-extrabold uppercase text-forge">Recommended</p>
          <h3 className="m-0 text-2xl font-extrabold max-md:text-xl">Guided Learning Path</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Follow a structured route through Higher Maths skills, starting with {skillPathName}.</p>
          <div className="mt-4 grid max-w-lg gap-2">
            <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-muted">
              <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} attempted</span>
              <span>{progress.completionPercentage}% complete</span>
            </div>
            <ProgressBar value={progress.completionPercentage} />
          </div>
        </div>
        <Link href={href} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-lg:col-span-2 max-md:col-span-1 max-md:w-full">
          Continue
        </Link>
      </div>
    </Card>
  );
}

function QuestionBankCard() {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">
          <ClipboardList className="size-6" />
        </span>
        <div>
          <h3 className="m-0 text-xl font-extrabold">Question Bank</h3>
          <p className="mt-1 text-xs font-bold text-muted">{getActiveSkillPath().name} available now.</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted">Topic-by-topic original SQA-style questions with worked solutions.</p>
      <Link href={getQuestionBankHref()} className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-line bg-white text-sm font-extrabold transition hover:border-forge hover:text-forge">
        Open question bank
      </Link>
    </Card>
  );
}

function ResourceCard({ icon, title, copy, href }: { icon: ReactNode; title: string; copy: string; href: string }) {
  return (
    <Card className="p-4">
      <span className="mb-3 grid size-10 place-items-center rounded-xl bg-[#fff4ec] text-forge">{icon}</span>
      <h3 className="m-0 text-lg font-extrabold">{title}</h3>
      <p className="mt-2 min-h-[54px] text-sm text-muted">{copy}</p>
      <p className="mt-3 text-xs font-bold text-forge">{getActiveSkillPath().name} available.</p>
      <Link href={href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-line bg-white text-sm font-extrabold transition hover:border-forge hover:text-forge">
        Open
      </Link>
    </Card>
  );
}

function ModeCard({ icon, title, badge, copy, href, cta }: { icon: ReactNode; title: string; badge: string; copy: string; href: string; cta: string }) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 max-md:grid-cols-1">
        <span className="grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">{icon}</span>
        <div>
          <span className="mb-1 inline-flex rounded-full bg-[#fff4ec] px-2.5 py-1 text-xs font-extrabold text-forge">{badge}</span>
          <h3 className="m-0 text-xl font-extrabold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{copy}</p>
        </div>
        <Link href={href} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-4 text-sm font-extrabold text-white max-md:w-full">
          {cta}
        </Link>
      </div>
    </Card>
  );
}

function LockedModeCard({ icon, title, badge, copy }: { icon: ReactNode; title: string; badge: string; copy: string }) {
  return (
    <Card className="p-4 opacity-75">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 max-md:grid-cols-1">
        <span className="grid size-12 place-items-center rounded-xl bg-[#f4f1eb] text-muted">{icon}</span>
        <div>
          <span className="mb-1 inline-flex rounded-full bg-[#f4f1eb] px-2.5 py-1 text-xs font-extrabold text-muted">{badge}</span>
          <h3 className="m-0 text-xl font-extrabold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{copy}</p>
        </div>
        <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-[#f4f1eb] px-4 text-sm font-extrabold text-muted max-md:w-full">
          Locked
        </span>
      </div>
    </Card>
  );
}


