"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, FileText, Layers3, Lock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import { getActiveSubject, getActiveSkillPath, getAllSkillPaths, getQuestionBankHref, getResourceHref, getResourcesForSkillPath } from "@/lib/learning-paths";
import type { Flashcard, FormulaCard, NoteBlock, SkillPath, WorkedExample } from "@/data/types";

export type ResourceBrowserType = "revision-notes" | "formula-cards" | "worked-examples" | "flashcards";

const config = {
  "revision-notes": { title: "Revision Notes", crumb: "Revision Notes", icon: FileText, description: "Concise explanations for Basic differentiation." },
  "formula-cards": { title: "Formula Cards", crumb: "Formula Cards", icon: BookOpen, description: "The key rule used by the available Basic differentiation questions." },
  "worked-examples": { title: "Worked Examples", crumb: "Worked Examples", icon: Sparkles, description: "A step-by-step example using the same available skill." },
  flashcards: { title: "Flashcards", crumb: "Flashcards", icon: Layers3, description: "Short active-recall prompts for the available skill." },
} satisfies Record<ResourceBrowserType, { title: string; crumb: string; icon: typeof FileText; description: string }>;

const resourceOrder: ResourceBrowserType[] = ["revision-notes", "formula-cards", "worked-examples", "flashcards"];

export function HigherMathsResourceBrowser({ resourceType }: { resourceType: ResourceBrowserType }) {
  const resource = config[resourceType];
  const Icon = resource.icon;
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const lockedPaths = getAllSkillPaths(subject).filter((path) => !path.isAvailable);
  const resources = getResourcesForSkillPath(skillPath, resourceType);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("returnTo");
    if (requested?.startsWith("/") && !requested.startsWith("//")) setReturnTo(requested);
  }, []);

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[980px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid max-w-[980px] gap-4">
        <header>
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects/higher-maths">Higher Maths</Link>
            <ArrowRight className="size-4" />
            <span>Resources</span>
            <ArrowRight className="size-4" />
            <span className="font-bold text-forge">{resource.crumb}</span>
          </nav>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge"><Icon className="size-5" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase text-forge">Available now · {resources.length}</p>
              <h1 className="m-0 mt-1 text-[32px] font-extrabold leading-none">Higher Maths {resource.title}</h1>
              <p className="mt-2 text-muted">{resource.description}</p>
            </div>
          </div>
        </header>

        {returnTo ? (
          <Link href={returnTo} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-line bg-white px-4 font-extrabold text-forge">
            <ArrowLeft className="size-4" />Return to active practice
          </Link>
        ) : null}

        <nav aria-label="Resource types" className="grid grid-cols-4 gap-2 max-md:grid-cols-2">
          {resourceOrder.map((type) => {
            const item = config[type];
            const ItemIcon = item.icon;
            return (
              <Link key={type} href={getResourceHref(type)} aria-current={type === resourceType ? "page" : undefined} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold ${type === resourceType ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-ink"}`}>
                <ItemIcon className="size-4" />{item.title}
              </Link>
            );
          })}
        </nav>

        <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-4">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 max-md:grid-cols-1">
            <div>
              <p className="text-xs font-extrabold uppercase text-forge">{skillPath.name}</p>
              <h2 className="mt-1 text-xl font-extrabold">Ready to apply this?</h2>
              <p className="mt-1 text-sm text-muted">Start a short untimed session using only available questions from this skill.</p>
            </div>
            <div className="flex flex-wrap gap-2 max-md:grid">
              <QuickPracticeAction preferredPathId={skillPath.slug} label={`Practise ${skillPath.name}`} />
              <Link href={getQuestionBankHref()} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 font-bold">View related questions</Link>
            </div>
          </div>
        </Card>

        <section aria-labelledby="resource-content-title">
          <h2 id="resource-content-title" className="mb-3 text-2xl font-extrabold">{resource.title} for {skillPath.name}</h2>
          <ResourceContent resourceType={resourceType} skillPath={skillPath} />
        </section>

        {lockedPaths.length ? (
          <details className="group rounded-xl border border-line bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold text-muted">
              <span className="inline-flex items-center gap-2"><Lock className="size-4" />Future Higher Maths resources ({lockedPaths.length} paths)</span>
              <ChevronDown className="size-4 transition group-open:rotate-180" />
            </summary>
            <div className="grid gap-2 border-t border-line p-4">
              {lockedPaths.map((path) => <div key={path.slug} className="flex justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm"><strong>{path.name}</strong><span className="text-muted">Coming soon</span></div>)}
            </div>
          </details>
        ) : null}
      </div>
    </AppShell>
  );
}

function ResourceContent({ resourceType, skillPath }: { resourceType: ResourceBrowserType; skillPath: SkillPath }) {
  const resources = getResourcesForSkillPath(skillPath, resourceType);
  if (!resources.length) return <Card className="p-5"><p className="font-bold">No {config[resourceType].title.toLowerCase()} are available for this path yet.</p><Link href={skillPath.href} className="mt-3 inline-flex min-h-10 items-center font-bold text-forge">Continue {skillPath.name}</Link></Card>;
  if (resourceType === "revision-notes") return <NotesContent notes={resources as NoteBlock[]} />;
  if (resourceType === "formula-cards") return <FormulaContent formulaCards={resources as FormulaCard[]} />;
  if (resourceType === "worked-examples") return <WorkedExamplesContent examples={resources as WorkedExample[]} />;
  return <FlashcardsContent flashcards={resources as Flashcard[]} />;
}

function NotesContent({ notes }: { notes: NoteBlock[] }) {
  return <div className="grid gap-3">{notes.map((note) => <Card key={note.id} id={note.id} className="scroll-mt-4 p-5"><h3 className="mb-2 text-lg font-extrabold">{note.title}</h3><div className="text-sm leading-relaxed text-muted"><MathContent>{note.body}</MathContent>{note.mathContent ? <MathContent>{note.mathContent}</MathContent> : null}</div></Card>)}</div>;
}

function FormulaContent({ formulaCards }: { formulaCards: FormulaCard[] }) {
  return <div className="grid gap-3">{formulaCards.map((formula) => <Card key={formula.id} id={formula.id} className="scroll-mt-4 p-5"><h3 className="text-lg font-extrabold">{formula.title}</h3><p className="mt-1 text-sm text-muted">{formula.description}</p><div className="mt-3 rounded-xl border border-line bg-paper p-4 text-center"><MathContent>{formula.formula}</MathContent></div>{formula.example ? <div className="mt-3 text-sm text-muted"><MathContent>{formula.example}</MathContent></div> : null}</Card>)}</div>;
}

function WorkedExamplesContent({ examples }: { examples: WorkedExample[] }) {
  return <div className="grid gap-3">{examples.map((example) => <Card key={example.id} id={example.id} className="scroll-mt-4 p-5"><h3 className="text-lg font-extrabold">{example.title}</h3><div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm"><MathContent>{example.prompt}</MathContent></div><div className="mt-3 grid gap-2">{example.steps.map((step, index) => <div key={`${example.id}-${index}`} className="grid grid-cols-[26px_1fr] gap-3 text-sm text-muted"><span className="grid size-5 place-items-center rounded-full bg-forge-soft text-xs font-extrabold text-forge">{index + 1}</span><MathContent>{step}</MathContent></div>)}</div><div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm"><p className="mb-1 font-bold text-muted">Final answer</p><MathContent>{example.finalAnswer}</MathContent></div></Card>)}</div>;
}

function FlashcardsContent({ flashcards }: { flashcards: Flashcard[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  return <div className="grid gap-3">{flashcards.map((card) => { const isRevealed = Boolean(revealed[card.id]); return <Card key={card.id} id={card.id} className="scroll-mt-4 p-5"><div className="font-extrabold"><MathContent>{card.front}</MathContent></div>{isRevealed ? <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm text-muted"><MathContent>{card.back}</MathContent></div> : null}<button type="button" aria-expanded={isRevealed} onClick={() => setRevealed((current) => ({ ...current, [card.id]: !isRevealed }))} className="mt-3 min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-extrabold hover:border-forge hover:text-forge">{isRevealed ? "Hide answer" : "Reveal answer"}</button></Card>; })}</div>;
}
