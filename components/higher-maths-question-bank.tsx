"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, ClipboardList, Lock, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import { Card } from "@/components/ui";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import {
  queryAvailableQuestionBankQuestions,
  type QuestionBankProgressFilter,
  type QuestionBankSort,
  type QuestionBankStageFilter,
} from "@/lib/question-bank-query";
import { getRelatedResourcesForQuestion } from "@/lib/study-context";
import { useHasMounted } from "@/lib/use-mounted";

const filters: { id: QuestionBankProgressFilter; label: string }[] = [
  { id: "all", label: "All questions" },
  { id: "not-started", label: "Not started" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "review-recommended", label: "Review recommended" },
];

export function HigherMathsQuestionBank() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuestionBankProgressFilter>("all");
  const [stageFilter, setStageFilter] = useState<QuestionBankStageFilter>("all");
  const [sort, setSort] = useState<QuestionBankSort>("default");
  const [version, setVersion] = useState(0);
  const hasMounted = useHasMounted();
  const nextAction = useLearnerNextAction();
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const questions = queryAvailableQuestionBankQuestions(contentResolver, evidence, {
    search: query,
    progressFilter: filter,
    stageFilter,
    sort,
  });
  const lockedPaths = contentResolver.getAllPathContexts().filter((context) => !context.skillPath.isAvailable);

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

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[980px] justify-end"><AppTopbar demo /></div>
      <div className="mx-auto grid max-w-[980px] gap-4">
        <header>
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects/higher-maths">Higher Maths</Link>
            <ArrowRight className="size-4" />
            <span className="font-bold text-forge">Question Bank</span>
          </nav>
          <h1 className="m-0 text-[32px] font-extrabold leading-none">Higher Maths Question Bank</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Open any of the eight available Basic differentiation questions directly.</p>
        </header>

        <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-4">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 max-md:grid-cols-1">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase text-forge">Best next step</p>
              <h2 className="m-0 text-xl font-extrabold">{nextAction.title}</h2>
              <p id="question-bank-next-reason" className="mt-1 text-sm text-muted">{nextAction.reason}</p>
            </div>
            <div className="flex flex-wrap gap-2 max-md:grid">
              {nextAction.href ? (
                <Link href={nextAction.href} aria-describedby="question-bank-next-reason" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-4 font-extrabold text-white">
                  {nextAction.label}
                </Link>
              ) : null}
              <QuickPracticeAction preferredPathId={nextAction.pathId} label="Quick Practice" className="border border-forge bg-white !text-forge" />
            </div>
          </div>
        </Card>

        <section aria-labelledby="available-questions-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-forge">Available now</p>
              <h2 id="available-questions-title" className="m-0 text-2xl font-extrabold">
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </h2>
            </div>
            <details className="group min-w-[220px] rounded-xl border border-line bg-white">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-bold">
                <span className="inline-flex items-center gap-2"><Search className="size-4" />Filter and sort</span>
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <div className="grid gap-4 border-t border-line p-4">
                <label className="grid gap-2">
                  <span className="font-bold">Search available questions</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 rounded-lg border border-line px-3" />
                </label>
                <fieldset className="grid gap-2">
                  <legend className="mb-1 font-bold">Progress</legend>
                  {filters.map((item) => (
                    <label key={item.id} className="flex min-h-10 items-center gap-2">
                      <input type="radio" name="question-progress" checked={filter === item.id} onChange={() => setFilter(item.id)} />
                      {item.label}
                    </label>
                  ))}
                </fieldset>
                <label className="grid gap-2">
                  <span className="font-bold">Stage</span>
                  <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as QuestionBankStageFilter)} className="min-h-11 rounded-lg border border-line bg-white px-3">
                    <option value="all">All stages</option>
                    <option value="Foundations">Foundations</option>
                    <option value="Applications">Applications</option>
                    <option value="Past Paper-style Questions">Past Paper-style Questions</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="font-bold">Sort</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value as QuestionBankSort)} className="min-h-11 rounded-lg border border-line bg-white px-3">
                    <option value="default">Path order</option>
                    <option value="recently-practised">Recently practised</option>
                    <option value="review-priority">Review priority</option>
                    <option value="completion-status">Completion status</option>
                  </select>
                </label>
              </div>
            </details>
          </div>

          {questions.length ? (
            <ol className="grid gap-3">
              {questions.map((entry, index) => {
                const formula = getRelatedResourcesForQuestion(entry.question.id).find((item) => item.type === "formula-cards");
                return (
                  <li key={entry.question.id}>
                    <Card className="p-4">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 max-md:grid-cols-[auto_1fr]">
                        <span className="grid size-10 place-items-center rounded-full bg-forge-soft text-sm font-extrabold text-forge">{index + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-muted">{entry.context.stage.name} · {questionStatus(entry.progress)}</p>
                          <h3 className="mt-1 text-lg font-extrabold">{entry.question.title}</h3>
                          <p className="mt-1 text-sm text-muted">{entry.question.skill}</p>
                          {formula ? <Link href={formula.href} className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-forge"><BookOpen className="size-4" />Formula card for {entry.context.skillPath.name}</Link> : null}
                        </div>
                        <Link href={`/question/${entry.question.id}`} aria-label={`Open ${entry.question.title}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-4 font-extrabold text-white max-md:col-span-2 max-md:w-full">
                          Open question <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Card className="p-5">
              <h3 className="font-extrabold">No questions match these filters</h3>
              <p className="mt-2 text-sm text-muted">Clear the optional filters to return to all available questions.</p>
              <button type="button" onClick={() => { setQuery(""); setFilter("all"); setStageFilter("all"); setSort("default"); }} className="mt-4 min-h-10 rounded-lg border border-line bg-white px-4 font-bold text-forge">Clear filters</button>
            </Card>
          )}
        </section>

        <details className="group rounded-xl border border-line bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold text-muted">
            <span className="inline-flex items-center gap-2"><Lock className="size-4" />Future Higher Maths paths ({lockedPaths.length})</span>
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-2 border-t border-line p-4">
            {lockedPaths.map((context) => (
              <div key={context.skillPath.slug} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                <span className="font-bold">{context.skillPath.name}</span>
                <span className="text-muted">Coming soon</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </AppShell>
  );
}

function questionStatus(progress: ReturnType<typeof queryAvailableQuestionBankQuestions>[number]["progress"]) {
  if (progress.reviewRecommended) return "Review recommended";
  if (progress.completed) return "Completed";
  if (progress.attempted) return "In progress";
  return "Not started";
}
