"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import type { Flashcard } from "@/data/types";

export function FlashcardsPreview({ flashcards }: { flashcards?: Flashcard[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (!flashcards?.length) return null;

  return (
    <section>
      <h2 className="m-0 text-3xl font-extrabold">Flashcards Preview</h2>
      <p className="mt-2 text-muted">Quick checks before you practise.</p>
      <Card className="mt-6 p-7">
        <span className="mb-5 grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">
          <ClipboardList className="size-6" />
        </span>
        <div className="grid gap-3">
          {flashcards.map((card) => {
            const isRevealed = Boolean(revealed[card.id]);

            return (
              <article key={card.id} className="rounded-xl border border-line bg-[#fffdf9] p-4">
                <div className="font-extrabold text-ink">
                  <MathContent>{card.front}</MathContent>
                </div>
                {isRevealed ? (
                  <div className="mb-0 mt-3 rounded-lg border border-line bg-white p-3 text-sm leading-relaxed text-muted">
                    <MathContent>{card.back}</MathContent>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="mt-3 rounded-md border border-line bg-white px-4 py-2 text-sm font-extrabold text-ink transition hover:border-forge hover:text-forge"
                  onClick={() => setRevealed((current) => ({ ...current, [card.id]: !isRevealed }))}
                >
                  {isRevealed ? "Hide answer" : "Reveal answer"}
                </button>
                {card.hint ? <p className="mt-2 text-xs font-bold text-forge">{card.hint}</p> : null}
              </article>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
