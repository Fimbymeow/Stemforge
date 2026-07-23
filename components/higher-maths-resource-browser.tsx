"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, FileText, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SubjectResourceLinks } from "@/components/learning/subject-resource-links";
import { PracticeEntryCard } from "@/components/practice/practice-entry-card";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import { getActiveSubject, getActiveSkillPath, getAllSkillPaths } from "@/lib/learning-paths";
import type { FormulaCard, NoteBlock, WorkedExample } from "@/data/types";

export function HigherMathsResourceBrowser() {
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const lockedPaths = getAllSkillPaths(subject).filter((path) => !path.isAvailable);
  const notes = skillPath.notes ?? [];
  const formulaCards = skillPath.formulaCards ?? [];
  const workedExamples = skillPath.workedExamples ?? [];
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
            <ArrowRight aria-hidden="true" className="size-4" />
            <span className="font-bold text-forge">Notes</span>
          </nav>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge"><FileText className="size-5" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase text-forge">Available now · {notes.length}</p>
              <h1 className="m-0 mt-1 text-[32px] font-extrabold leading-none">Higher Maths Notes</h1>
              <p className="mt-2 text-muted">Explanations, methods and worked examples for Basic differentiation.</p>
            </div>
          </div>
        </header>

        {returnTo ? (
          <Link href={returnTo} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-line bg-white px-4 font-extrabold text-forge">
            <ArrowLeft className="size-4" />Return to active practice
          </Link>
        ) : null}

        <SubjectResourceLinks
          family="mathematics"
          current="notes"
          hrefs={{
            notes: "/subjects/higher-maths/revision-notes",
            flashcards: "/subjects/higher-maths/flashcards",
            practice: "/practice",
          }}
        />

        <PracticeEntryCard preferredPathId={skillPath.slug} testId="notes-practice" />

        <section aria-labelledby="resource-content-title">
          <h2 id="resource-content-title" className="mb-3 text-2xl font-extrabold">Notes for {skillPath.name}</h2>
          <NotesContent notes={notes} formulaCards={formulaCards} workedExamples={workedExamples} />
        </section>

        {lockedPaths.length ? (
          <details className="group rounded-xl border border-line bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold text-muted">
              <span className="inline-flex items-center gap-2"><Lock className="size-4" />Future Higher Maths notes ({lockedPaths.length} paths)</span>
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

function NotesContent({
  notes,
  formulaCards,
  workedExamples,
}: {
  notes: NoteBlock[];
  formulaCards: FormulaCard[];
  workedExamples: WorkedExample[];
}) {
  if (!notes.length && !formulaCards.length && !workedExamples.length) {
    return <Card className="p-5"><p className="font-bold">No notes are available for this path yet.</p></Card>;
  }

  return (
    <div className="grid gap-3">
      {notes.map((note) => (
        <Card key={note.id} id={note.id} className="scroll-mt-4 p-5">
          <h3 className="mb-2 text-lg font-extrabold">{note.title}</h3>
          <div className="text-sm leading-relaxed text-muted">
            <MathContent>{note.body}</MathContent>
            {note.mathContent ? <MathContent>{note.mathContent}</MathContent> : null}
          </div>
        </Card>
      ))}
      {formulaCards.map((formula) => (
        <Card key={formula.id} id={formula.id} className="scroll-mt-4 p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Method reminder</p>
          <h3 className="mt-1 text-lg font-extrabold">{formula.title}</h3>
          <p className="mt-1 text-sm text-muted">{formula.description}</p>
          <div className="mt-3 rounded-xl border border-line bg-paper p-4 text-center"><MathContent>{formula.formula}</MathContent></div>
          {formula.example ? <div className="mt-3 text-sm text-muted"><MathContent>{formula.example}</MathContent></div> : null}
        </Card>
      ))}
      {workedExamples.map((example) => (
        <Card key={example.id} id={example.id} className="scroll-mt-4 p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Worked example</p>
          <h3 className="mt-1 text-lg font-extrabold">{example.title}</h3>
          <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm"><MathContent>{example.prompt}</MathContent></div>
          <div className="mt-3 grid gap-2">
            {example.steps.map((step, index) => (
              <div key={`${example.id}-${index}`} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3 text-sm text-muted">
                <span className="grid size-5 place-items-center rounded-full bg-forge-soft text-xs font-extrabold text-forge">{index + 1}</span>
                <MathContent>{step}</MathContent>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm"><p className="mb-1 font-bold text-muted">Final answer</p><MathContent>{example.finalAnswer}</MathContent></div>
        </Card>
      ))}
    </div>
  );
}
