"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ClipboardList, FileText, Layers3 } from "lucide-react";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import type { Flashcard, FormulaCard, NoteBlock, WorkedExample } from "@/data/types";

type ResourceKey = "notes" | "formula" | "example" | "flashcards";

type QuickRevisionResourcesProps = {
  notes?: NoteBlock[];
  formulaCards?: FormulaCard[];
  workedExamples?: WorkedExample[];
  flashcards?: Flashcard[];
};

export function QuickRevisionResources({ notes, formulaCards, workedExamples, flashcards }: QuickRevisionResourcesProps) {
  const resources = [
    {
      key: "notes" as const,
      title: "Notes",
      subtitle: notes?.length ? `${notes.length} short notes` : "No notes yet",
      icon: FileText,
      hasContent: Boolean(notes?.length),
    },
    {
      key: "formula" as const,
      title: "Formula card",
      subtitle: formulaCards?.[0]?.title ?? "Power rule",
      icon: BookOpen,
      hasContent: Boolean(formulaCards?.length),
    },
    {
      key: "example" as const,
      title: "Worked example",
      subtitle: workedExamples?.[0]?.title ?? "Step-by-step method",
      icon: Layers3,
      hasContent: Boolean(workedExamples?.length),
    },
    {
      key: "flashcards" as const,
      title: "Flashcards",
      subtitle: flashcards?.length ? `${flashcards.length} quick cards` : "No cards yet",
      icon: ClipboardList,
      hasContent: Boolean(flashcards?.length),
    },
  ];

  const firstAvailable = resources.find((resource) => resource.hasContent)?.key ?? null;
  const [open, setOpen] = useState<ResourceKey | null>(firstAvailable);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});

  if (!resources.some((resource) => resource.hasContent)) return null;

  return (
    <section>
      <div className="mb-5">
        <h2 className="m-0 text-2xl font-extrabold">Quick revision resources</h2>
        <p className="mt-2 text-muted">Use these when you need a refresher. The practice path stays the main route.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {resources.map((resource) => {
          if (!resource.hasContent) return null;
          const Icon = resource.icon;
          const isOpen = open === resource.key;

          return (
            <Card key={resource.key} className="overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : resource.key)}
                className="flex min-h-24 w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[#fffaf5]"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fff4ec] text-forge">
                    <Icon className="size-6" />
                  </span>
                  <span>
                    <strong className="block text-lg">{resource.title}</strong>
                    <span className="mt-1 block text-sm text-muted">{resource.subtitle}</span>
                  </span>
                </span>
                <ChevronDown className={`size-5 shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen ? (
                <div className="border-t border-line bg-[#fffdf9] p-5">
                  {resource.key === "notes" ? <NotesPanel notes={notes ?? []} /> : null}
                  {resource.key === "formula" ? <FormulaPanel formulaCards={formulaCards ?? []} /> : null}
                  {resource.key === "example" ? <WorkedExamplePanel examples={workedExamples ?? []} /> : null}
                  {resource.key === "flashcards" ? (
                    <FlashcardsPanel
                      flashcards={flashcards ?? []}
                      revealed={revealedCards}
                      onToggle={(id) => setRevealedCards((current) => ({ ...current, [id]: !current[id] }))}
                    />
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function NotesPanel({ notes }: { notes: NoteBlock[] }) {
  return (
    <div className="grid gap-4">
      {notes.map((note) => (
        <article key={note.id} className="rounded-xl border border-line bg-white p-4">
          <h3 className="mb-2 font-extrabold">{note.title}</h3>
          <div className="text-sm leading-relaxed text-muted">
            <MathContent>{note.body}</MathContent>
            {note.mathContent ? <MathContent>{note.mathContent}</MathContent> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function FormulaPanel({ formulaCards }: { formulaCards: FormulaCard[] }) {
  return (
    <div className="grid gap-4">
      {formulaCards.map((formula) => (
        <article key={formula.id} className="rounded-xl border border-line bg-white p-4">
          <h3 className="font-extrabold">{formula.title}</h3>
          <p className="mt-1 text-sm text-muted">{formula.description}</p>
          <div className="mt-4 rounded-xl border border-line bg-[#fffdf9] p-4 text-center">
            <MathContent>{formula.formula}</MathContent>
          </div>
          {formula.example ? (
            <div className="mt-3 text-sm text-muted">
              <MathContent>{formula.example}</MathContent>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function WorkedExamplePanel({ examples }: { examples: WorkedExample[] }) {
  return (
    <div className="grid gap-4">
      {examples.map((example) => (
        <article key={example.id} className="rounded-xl border border-line bg-white p-4">
          <h3 className="font-extrabold">{example.title}</h3>
          <div className="mt-3 rounded-lg border border-line bg-[#fffdf9] p-3 text-sm">
            <MathContent>{example.prompt}</MathContent>
          </div>
          <div className="mt-4 grid gap-3">
            {example.steps.map((step, index) => (
              <div key={`${example.id}-${index}`} className="grid grid-cols-[28px_1fr] gap-3 text-sm text-muted">
                <span className="grid size-7 place-items-center rounded-full bg-[#fff4ec] text-xs font-extrabold text-forge">{index + 1}</span>
                <MathContent>{step}</MathContent>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-line bg-[#fffdf9] p-3 text-sm">
            <p className="mb-1 font-bold text-muted">Final answer</p>
            <MathContent>{example.finalAnswer}</MathContent>
          </div>
        </article>
      ))}
    </div>
  );
}

function FlashcardsPanel({
  flashcards,
  revealed,
  onToggle,
}: {
  flashcards: Flashcard[];
  revealed: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {flashcards.map((card) => {
        const isRevealed = Boolean(revealed[card.id]);
        return (
          <article key={card.id} className="rounded-xl border border-line bg-white p-4">
            <div className="font-extrabold">
              <MathContent>{card.front}</MathContent>
            </div>
            {isRevealed ? (
              <div className="mt-3 rounded-lg border border-line bg-[#fffdf9] p-3 text-sm text-muted">
                <MathContent>{card.back}</MathContent>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => onToggle(card.id)}
              className="mt-3 rounded-md border border-line bg-white px-4 py-2 text-sm font-extrabold transition hover:border-forge hover:text-forge"
            >
              {isRevealed ? "Hide answer" : "Reveal answer"}
            </button>
          </article>
        );
      })}
    </div>
  );
}