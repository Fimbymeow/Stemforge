"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui";
import { deriveFlashcardStates } from "@/lib/flashcards/derivation";
import {
  buildFlashcardSession,
  createFlashcardReviewInput,
  flashcardDueCopy,
  markTypedFlashcardAnswer,
  requeueForgottenCard,
  type FlashcardQueueItem,
} from "@/lib/flashcards/session";
import type { Flashcard, FlashcardOutcome, FlashcardOutcomeSource } from "@/lib/flashcards/types";
import { getEmptyProgressEvidence, getProgressEvidence, recordFlashcardReviewEvent } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";

type Mode = "landing" | "session" | "complete";

export function FlashcardExperience({ subjectName, subjectSlug, skillName, cards }: {
  subjectName: string;
  subjectSlug: string;
  skillName: string;
  cards: readonly Flashcard[];
}) {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const [now, setNow] = useState(() => new Date());
  const [mode, setMode] = useState<Mode>("landing");
  const [queue, setQueue] = useState<FlashcardQueueItem[]>([]);
  const [pendingQueue, setPendingQueue] = useState<FlashcardQueueItem[] | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [scheduledSteps, setScheduledSteps] = useState(0);
  const [requeues, setRequeues] = useState<Record<string, number>>({});
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [finalOutcomes, setFinalOutcomes] = useState<Record<string, FlashcardOutcome>>({});
  const [revealed, setRevealed] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [result, setResult] = useState<{ outcome: FlashcardOutcome; source: FlashcardOutcomeSource } | null>(null);
  const [saving, setSaving] = useState(false);
  const revealFocusRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => { setEvidence(getProgressEvidence()); setNow(new Date()); };
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const states = useMemo(() => deriveFlashcardStates(cards, evidence.flashcardReviews, now), [cards, evidence.flashcardReviews, now]);
  const dueCount = states.filter((state) => state.status !== "unseen" && state.due).length;
  const newCount = states.filter((state) => state.status === "unseen").length;
  const current = queue[0] ?? null;

  function startSession() {
    const next = buildFlashcardSession(cards, evidence.flashcardReviews, new Date());
    if (!next.length) return;
    setQueue(next);
    setScheduledSteps(next.length);
    setCompletedSteps(0);
    setRequeues({});
    setReviewedIds([]);
    setFinalOutcomes({});
    resetCardInteraction();
    setMode("session");
  }

  function reveal() {
    setRevealed(true);
    window.setTimeout(() => revealFocusRef.current?.focus(), 0);
  }

  async function rate(outcome: FlashcardOutcome, source: FlashcardOutcomeSource) {
    if (!current || saving || result) return;
    setSaving(true);
    const saved = await recordFlashcardReviewEvent(createFlashcardReviewInput(current.card, outcome, source, new Date().toISOString()));
    setSaving(false);
    if (!saved) return;
    let next = queue.slice(1);
    if (outcome === "forgot") {
      const prior = requeues[current.card.id] ?? 0;
      const requeued = requeueForgottenCard(next, current, prior);
      if (requeued.length > next.length) {
        setRequeues((value) => ({ ...value, [current.card.id]: prior + 1 }));
        setScheduledSteps((value) => value + 1);
      }
      next = requeued;
    }
    setFinalOutcomes((outcomes) => ({ ...outcomes, [current.card.id]: outcome }));
    setReviewedIds((ids) => ids.includes(current.card.id) ? ids : [...ids, current.card.id]);
    setPendingQueue(next);
    setResult({ outcome, source });
    window.setTimeout(() => resultRef.current?.focus(), 0);
  }

  function submitTyped(event: FormEvent) {
    event.preventDefault();
    if (!current || current.card.type !== "typed" || !typedAnswer.trim()) return;
    const marking = markTypedFlashcardAnswer(current.card, typedAnswer);
    if (marking.outcomeKind !== "graded") return;
    void rate(marking.isCorrect ? "remembered" : "forgot", "graded");
  }

  function continueSession() {
    const next = pendingQueue ?? [];
    setCompletedSteps((value) => value + 1);
    if (!next.length) {
      setMode("complete");
      return;
    }
    setQueue(next);
    setPendingQueue(null);
    resetCardInteraction();
  }

  function resetCardInteraction() {
    setRevealed(false);
    setTypedAnswer("");
    setResult(null);
  }

  return (
    <AppShell demo={false} active="Subjects" className="py-6 sm:py-8">
      <main className="mx-auto w-full max-w-3xl">
        <Link href={`/subjects/${subjectSlug}`} className="text-sm font-bold text-forge">← {subjectName}</Link>
        <header className="mt-5">
          <p className="m-0 text-xs font-extrabold uppercase tracking-wide text-muted">{subjectName} · {skillName}</p>
          <h1 className="mb-0 mt-2 text-3xl font-extrabold sm:text-4xl">Flashcards</h1>
        </header>

        {mode === "landing" ? (
          <Landing dueCount={dueCount} newCount={newCount} states={states} now={now} onStart={startSession} />
        ) : mode === "session" && current ? (
          <section className="mt-6" aria-label="Flashcard session">
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-muted">
              <span aria-label={`Card ${completedSteps + 1} of ${scheduledSteps}`}>Card {completedSteps + 1} of {scheduledSteps}</span>
              <span>{flashcardDueCopy(current.initialState, now)}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span className="block h-full rounded-full bg-forge" style={{ width: `${Math.min(100, ((completedSteps + 1) / scheduledSteps) * 100)}%` }} />
            </div>
            <Card className="mt-5 flex min-h-[280px] flex-col p-5 sm:min-h-[330px] sm:p-8" data-testid="flashcard-card">
              <CardPrompt card={current.card} revealed={revealed || Boolean(result)} />
              <div className="mt-auto pt-7">
                {result ? (
                  <div ref={resultRef} tabIndex={-1} role="status" className="rounded-xl border border-line bg-paper p-4 outline-none focus:ring-2 focus:ring-forge/20">
                    <p className="m-0 font-extrabold">{result.outcome === "remembered" ? "Remembered" : "Forgot"}</p>
                    <p className="mb-0 mt-1 text-sm text-muted">
                      {result.outcome === "remembered" ? "Your next review has been scheduled." : "This card will come back sooner."}
                    </p>
                    <button type="button" onClick={continueSession} className="mt-4 min-h-11 w-full rounded-lg bg-forge px-5 font-extrabold text-white sm:w-auto">Next card</button>
                  </div>
                ) : current.card.type === "typed" ? (
                  <form onSubmit={submitTyped}>
                    <label htmlFor="flashcard-answer" className="text-sm font-extrabold">Your answer</label>
                    <input id="flashcard-answer" value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} maxLength={200} autoComplete="off"
                      className="mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-4 text-base outline-none focus:border-forge focus:ring-2 focus:ring-forge/15" />
                    <button type="submit" disabled={!typedAnswer.trim() || saving} className="mt-3 min-h-11 w-full rounded-lg bg-forge px-5 font-extrabold text-white disabled:opacity-50 sm:w-auto">Check answer</button>
                  </form>
                ) : !revealed ? (
                  <button type="button" onClick={reveal} className="min-h-11 w-full rounded-lg bg-forge px-5 font-extrabold text-white sm:w-auto">Show answer</button>
                ) : (
                  <div role="group" aria-label="How well did you remember this card?" className="grid grid-cols-2 gap-3 max-[340px]:grid-cols-1">
                    <button ref={revealFocusRef} type="button" disabled={saving} onClick={() => void rate("forgot", "self_rated")} className="min-h-12 rounded-lg border border-ink bg-white px-4 font-extrabold text-ink">Forgot</button>
                    <button type="button" disabled={saving} onClick={() => void rate("remembered", "self_rated")} className="min-h-12 rounded-lg bg-forge px-4 font-extrabold text-white">Remembered</button>
                  </div>
                )}
              </div>
            </Card>
          </section>
        ) : (
          <Card className="mt-6 p-6 sm:p-8" data-testid="flashcard-complete">
            <h2 className="m-0 text-2xl font-extrabold">You&apos;re done for now.</h2>
            <p className="mt-3 text-muted">{reviewedIds.length} card{reviewedIds.length === 1 ? "" : "s"} reviewed</p>
            <p className="text-muted">{Object.values(finalOutcomes).filter((outcome) => outcome === "forgot").length} will come back sooner</p>
            <Link href={`/subjects/${subjectSlug}`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-forge px-5 font-extrabold text-white">Return to {subjectName}</Link>
          </Card>
        )}
      </main>
    </AppShell>
  );
}

function Landing({ dueCount, newCount, states, now, onStart }: {
  dueCount: number; newCount: number; states: ReturnType<typeof deriveFlashcardStates>; now: Date; onStart: () => void;
}) {
  const canStart = dueCount > 0 || newCount > 0;
  return (
    <Card className="mt-6 p-6 sm:p-8" data-testid="flashcard-landing">
      {dueCount > 0 ? <p className="m-0 text-4xl font-extrabold text-ink">{dueCount} due</p>
        : newCount > 0 ? <p className="m-0 text-2xl font-extrabold">No cards due right now</p>
          : <p className="m-0 text-2xl font-extrabold">Nothing due right now.</p>}
      {newCount > 0 ? <p className="mt-3 text-lg font-bold text-muted">{newCount} new</p> : null}
      {!canStart ? <p className="mt-3 text-muted">Your next review will appear here when it is due.</p> : null}
      {canStart ? (
        <button type="button" onClick={onStart} className="mt-5 min-h-12 w-full rounded-lg bg-forge px-6 font-extrabold text-white sm:w-auto">
          {dueCount > 0 ? "Start flashcards" : "Learn new cards"}
        </button>
      ) : null}
      {dueCount === 0 && newCount === 0 ? <p className="mt-4 text-sm text-muted">{states.map((state) => flashcardDueCopy(state, now)).sort()[0]}</p> : null}
    </Card>
  );
}

function CardPrompt({ card, revealed }: { card: Flashcard; revealed: boolean }) {
  if (card.type === "basic") return <><h2 className="m-0 text-xl font-extrabold leading-relaxed sm:text-2xl">{card.front}</h2>{revealed ? <div aria-live="polite" className="mt-6 max-h-[38dvh] overflow-y-auto border-t border-line pt-5 text-lg leading-relaxed">{card.back}</div> : null}</>;
  if (card.type === "typed") return <><h2 className="m-0 text-xl font-extrabold leading-relaxed sm:text-2xl">{card.front}</h2>{revealed ? <div className="mt-6 border-t border-line pt-5 text-lg leading-relaxed">Accepted answer: {card.acceptedAnswers[0]}</div> : null}</>;
  return <><h2 className="m-0 text-xl font-extrabold leading-relaxed sm:text-2xl">Complete the statement</h2><p className="mt-5 text-lg leading-relaxed">{card.textBefore}<span className="rounded bg-forge-soft px-2 py-1 font-bold text-forge">{revealed ? card.answer : "…"}</span>{card.textAfter}</p></>;
}
