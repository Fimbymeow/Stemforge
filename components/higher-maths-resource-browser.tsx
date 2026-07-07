"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, ChevronDown, FileText, Layers3, Lock, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import { getActiveSubject, getActiveSkillPath, getResourceSummaryForSkillPath, getResourcesForSkillPath, getSkillPathHref } from "@/lib/learning-paths";

import type { Flashcard, FormulaCard, NoteBlock, SkillPath, WorkedExample } from "@/data/types";

export type ResourceBrowserType = "revision-notes" | "formula-cards" | "worked-examples" | "flashcards";

const config = {
  "revision-notes": {
    title: "Higher Maths Revision Notes",
    crumb: "Revision Notes",
    icon: FileText,
    description: "Concise explanations for SQA Higher Maths skills.",
  },
  "formula-cards": {
    title: "Higher Maths Formula Cards",
    crumb: "Formula Cards",
    icon: BookOpen,
    description: "Key rules and formulae for the active Higher Maths path.",
  },
  "worked-examples": {
    title: "Higher Maths Worked Examples",
    crumb: "Worked Examples",
    icon: Sparkles,
    description: "Step-by-step examples using existing Basic differentiation content.",
  },
  flashcards: {
    title: "Higher Maths Flashcards",
    crumb: "Flashcards",
    icon: Layers3,
    description: "Quick active-recall cards for core facts and rules.",
  },
} satisfies Record<ResourceBrowserType, { title: string; crumb: string; icon: typeof FileText; description: string }>;

export function HigherMathsResourceBrowser({ resourceType }: { resourceType: ResourceBrowserType }) {
  const resource = config[resourceType];
  const Icon = resource.icon;
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const skillPaths = subject.courseAreas.flatMap((area) => area.specAreas.flatMap((topic) => topic.skillPaths ?? []));
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const visiblePaths = skillPaths.filter((path) => !search || path.name.toLowerCase().includes(search) || path.description.toLowerCase().includes(search));

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-5 flex max-w-[1180px] justify-end">
        <AppTopbar demo />
      </div>
      <main className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-5 max-lg:grid-cols-1">
        <section className="grid content-start gap-4">
          <header>
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/subjects/higher-maths">Higher Maths</Link>
              <ArrowRight className="size-4" />
              <span>Learn</span>
              <ArrowRight className="size-4" />
              <span className="font-bold text-forge">{resource.crumb}</span>
            </nav>
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">
                <Icon className="size-6" />
              </span>
              <div>
                <h1 className="m-0 text-[clamp(32px,4vw,48px)] font-extrabold leading-none">{resource.title}</h1>
                <p className="mt-2 text-lg text-muted">Browse available resources by topic.</p>
              </div>
            </div>
          </header>
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics..."
              className="min-h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm outline-none focus:border-forge"
            />
          </label>
          <Card className="overflow-hidden p-0">
            <TopicRow icon={<Calculator className="size-5" />} title="Calculus" meta={`${skillPaths.filter((path) => path.isAvailable).length} available path`} />
            <TopicRow icon={<BookOpen className="size-5" />} title="Differentiation" meta={`${skillPaths.length} paths`} depth />
            <div className="divide-y divide-line">
              {visiblePaths.map((path) => <PathRow key={path.slug} path={path} resourceType={resourceType} />)}
            </div>
          </Card>
        </section>
        <section className="grid content-start gap-4">
          <Card className="p-4">
            <p className="mb-1 text-xs font-extrabold uppercase text-forge">Available now</p>
            <h2 className="m-0 text-2xl font-extrabold">{skillPath.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{resource.description}</p>
          </Card>
          <ResourceContent resourceType={resourceType} skillPath={skillPath} />
        </section>
      </main>
    </AppShell>
  );
}

function TopicRow({ icon, title, meta, depth = false }: { icon: ReactNode; title: string; meta: string; depth?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-4 py-3 ${depth ? "pl-8" : ""}`}>
      <div className="flex items-center gap-3">
        <ChevronDown className="size-4 text-muted" />
        <span className="grid size-9 place-items-center rounded-xl bg-[#fff4ec] text-forge">{icon}</span>
        <strong>{title}</strong>
      </div>
      <span className="text-xs font-bold text-muted">{meta}</span>
    </div>
  );
}

function PathRow({ path, resourceType }: { path: SkillPath; resourceType: ResourceBrowserType }) {
  const resourceSummary = getResourceSummaryForSkillPath(path, resourceType);
  if (path.isAvailable) {
    return (
      <Link href={getSkillPathHref(path)} className="grid grid-cols-[1fr_auto] items-center gap-3 bg-forge/5 px-4 py-3 pl-12 transition hover:bg-forge/10">
        <div>
          <h3 className="m-0 font-extrabold">{path.name}</h3>
          <p className="mt-1 text-sm text-[#188246]">{resourceSummary.count} available</p>
        </div>
        <span className="text-sm font-bold text-forge">Open</span>
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 pl-12 opacity-70">
      <div className="flex items-center gap-3">
        <Lock className="size-4 text-muted" />
        <div>
          <h3 className="m-0 font-extrabold">{path.name}</h3>
          <p className="mt-1 text-sm text-muted">Coming soon</p>
        </div>
      </div>
      <span className="text-xs font-bold text-muted">Locked</span>
    </div>
  );
}

function ResourceContent({ resourceType, skillPath }: { resourceType: ResourceBrowserType; skillPath: SkillPath }) {
  const resources = getResourcesForSkillPath(skillPath, resourceType);
  if (resourceType === "revision-notes") return <NotesContent notes={resources as NoteBlock[]} />;
  if (resourceType === "formula-cards") return <FormulaContent formulaCards={resources as FormulaCard[]} />;
  if (resourceType === "worked-examples") return <WorkedExamplesContent examples={resources as WorkedExample[]} />;
  return <FlashcardsContent flashcards={resources as Flashcard[]} />;
}

function NotesContent({ notes }: { notes: NoteBlock[] }) {
  return <div className="grid gap-3">{notes.map((note) => <Card key={note.id} className="p-4"><h3 className="mb-2 font-extrabold">{note.title}</h3><div className="text-sm text-muted"><MathContent>{note.body}</MathContent>{note.mathContent ? <MathContent>{note.mathContent}</MathContent> : null}</div></Card>)}</div>;
}

function FormulaContent({ formulaCards }: { formulaCards: FormulaCard[] }) {
  return <div className="grid gap-3">{formulaCards.map((formula) => <Card key={formula.id} className="p-4"><h3 className="font-extrabold">{formula.title}</h3><p className="mt-1 text-sm text-muted">{formula.description}</p><div className="mt-3 rounded-xl border border-line bg-[#fffdf9] p-3 text-center"><MathContent>{formula.formula}</MathContent></div>{formula.example ? <div className="mt-3 text-sm text-muted"><MathContent>{formula.example}</MathContent></div> : null}</Card>)}</div>;
}

function WorkedExamplesContent({ examples }: { examples: WorkedExample[] }) {
  return <div className="grid gap-3">{examples.map((example) => <Card key={example.id} className="p-4"><h3 className="font-extrabold">{example.title}</h3><div className="mt-3 rounded-xl border border-line bg-[#fffdf9] p-3 text-sm"><MathContent>{example.prompt}</MathContent></div><div className="mt-3 grid gap-2">{example.steps.map((step, index) => <div key={`${example.id}-${index}`} className="grid grid-cols-[26px_1fr] gap-3 text-sm text-muted"><span className="grid size-6 place-items-center rounded-full bg-[#fff4ec] text-xs font-extrabold text-forge">{index + 1}</span><MathContent>{step}</MathContent></div>)}</div><div className="mt-3 rounded-xl border border-line bg-[#fffdf9] p-3 text-sm"><p className="mb-1 font-bold text-muted">Final answer</p><MathContent>{example.finalAnswer}</MathContent></div></Card>)}</div>;
}

function FlashcardsContent({ flashcards }: { flashcards: Flashcard[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  return <div className="grid gap-3">{flashcards.map((card) => { const isRevealed = Boolean(revealed[card.id]); return <Card key={card.id} className="p-4"><div className="font-extrabold"><MathContent>{card.front}</MathContent></div>{isRevealed ? <div className="mt-3 rounded-xl border border-line bg-[#fffdf9] p-3 text-sm text-muted"><MathContent>{card.back}</MathContent></div> : null}<button type="button" onClick={() => setRevealed((current) => ({ ...current, [card.id]: !isRevealed }))} className="mt-3 min-h-9 rounded-lg border border-line bg-white px-3 text-sm font-extrabold hover:border-forge hover:text-forge">{isRevealed ? "Hide answer" : "Reveal answer"}</button></Card>; })}</div>;
}

