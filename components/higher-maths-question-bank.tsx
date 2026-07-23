"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Filter, Lock, Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MathContent } from "@/components/questions/math-content";
import { Card } from "@/components/ui";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import {
  deriveQuestionBankFilterOptions,
  queryAvailableQuestionBankQuestions,
  type QuestionBankProgressFilter,
  type QuestionBankQuestionEntry,
  type QuestionBankSort,
} from "@/lib/question-bank-query";
import {
  normalizeQuestionBankFilters,
  paginateQuestionIds,
  setQuestionGroupSelection,
  toggleQuestionSelection,
  type QuestionBankFilters,
} from "@/lib/question-bank-selection";
import { createCustomPracticeSession } from "@/lib/practice/custom-practice";
import { loadPracticeSessionStore, updatePracticeSession, upsertPracticeSession } from "@/lib/practice/practice-storage";
import type { PracticeSession } from "@/lib/practice/practice-types";
import { useHasMounted } from "@/lib/use-mounted";

const initialFilters: QuestionBankFilters = { courseAreaId: "", specAreaId: "", skillPathId: "", stageId: "" };
const statusFilters: Array<{ id: QuestionBankProgressFilter; label: string }> = [
  { id: "all", label: "All questions" },
  { id: "not-started", label: "Not attempted" },
  { id: "in-progress", label: "In progress" },
  { id: "review-recommended", label: "Needs review" },
  { id: "completed", label: "Completed" },
];

export function HigherMathsQuestionBank() {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [status, setStatus] = useState<QuestionBankProgressFilter>("all");
  const [sort, setSort] = useState<QuestionBankSort>("default");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pendingSession, setPendingSession] = useState<PracticeSession | null>(null);
  const closeReviewRef = useRef<HTMLButtonElement | null>(null);
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const allEntries = useMemo(
    () => queryAvailableQuestionBankQuestions(contentResolver, evidence),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, hasMounted],
  );
  const options = useMemo(() => deriveQuestionBankFilterOptions(allEntries), [allEntries]);
  const questions = useMemo(() => queryAvailableQuestionBankQuestions(contentResolver, evidence, {
    search,
    progressFilter: status,
    courseAreaId: filters.courseAreaId || undefined,
    specAreaId: filters.specAreaId || undefined,
    skillPathId: filters.skillPathId || undefined,
    stageId: filters.stageId || undefined,
    sort,
  }), [evidence, filters, search, sort, status]);
  const entryById = useMemo(() => new Map(allEntries.map((entry) => [entry.question.id, entry])), [allEntries]);
  const pagination = paginateQuestionIds(questions.map((entry) => entry.question.id), page);
  const pageEntries = pagination.questionIds.map((id) => entryById.get(id)).filter((entry): entry is QuestionBankQuestionEntry => Boolean(entry));
  const groups = groupQuestions(pageEntries);
  const selectedEntries = [...selected].map((id) => entryById.get(id)).filter((entry): entry is QuestionBankQuestionEntry => Boolean(entry));
  const selectedMarks = selectedEntries.reduce((total, entry) => total + entry.question.marks, 0);
  const lockedPaths = contentResolver.getAllPathContexts().filter((context) => !context.skillPath.isAvailable);
  const futureCoverage = groupFutureCoverage(lockedPaths);

  useEffect(() => {
    const update = () => setVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters, search, sort, status]);

  useEffect(() => {
    if (!reviewOpen) return;
    closeReviewRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setReviewOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [reviewOpen]);

  function updateFilters(patch: Partial<QuestionBankFilters>) {
    setFilters((current) => normalizeQuestionBankFilters({ ...current, ...patch }, options));
  }

  function clearFilters() {
    setSearch("");
    setFilters(initialFilters);
    setStatus("all");
    setSort("default");
  }

  function startPractice() {
    const result = createCustomPracticeSession([...selected]);
    if (!result.session) {
      setSelected(new Set());
      return;
    }
    const store = loadPracticeSessionStore().store;
    const active = store.activeSessionId ? store.sessions.find((session) => session.sessionId === store.activeSessionId && session.status === "active") : null;
    if (active) {
      setPendingSession(result.session);
      return;
    }
    saveAndOpen(result.session);
  }

  function replaceActiveSession() {
    if (!pendingSession) return;
    const store = loadPracticeSessionStore().store;
    if (store.activeSessionId) {
      updatePracticeSession(store.activeSessionId, (session) => ({
        ...session, status: "abandoned", updatedAt: new Date().toISOString(),
      }));
    }
    saveAndOpen(pendingSession);
  }

  function saveAndOpen(session: PracticeSession) {
    upsertPracticeSession(session);
    router.push(`/practice/session/${session.sessionId}`);
  }

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end"><AppTopbar demo /></div>
      <div className={`mx-auto grid min-w-0 max-w-[1120px] gap-4 ${selected.size ? "pb-24" : ""}`}>
        <header>
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects/higher-maths">Higher Maths</Link><ArrowRight className="size-4" /><span className="font-bold text-forge">Question Bank</span>
          </nav>
          <h1 className="m-0 text-[clamp(28px,4vw,36px)] font-extrabold leading-none">Question Bank</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Choose topics and questions to build your own practice session.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-forge-soft px-3 py-1.5 text-forge">{allEntries.length} questions available</span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5">{options.skillPaths.length} available skill path{options.skillPaths.length === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted">More Higher Maths content is coming later</span>
          </div>
        </header>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <details className="group h-fit rounded-xl border border-line bg-white lg:open:block">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-extrabold">
              <span className="inline-flex items-center gap-2"><Filter className="size-4" />Filters</span>
              <ChevronDown className="size-4 group-open:rotate-180 lg:hidden" />
            </summary>
            <div className="grid gap-3 border-t border-line p-4">
              <FilterSelect label="Course area" value={filters.courseAreaId} onChange={(value) => updateFilters({ courseAreaId: value, specAreaId: "", skillPathId: "", stageId: "" })} options={options.courseAreas} allLabel="All areas" />
              <FilterSelect label="Specification area" value={filters.specAreaId} onChange={(value) => updateFilters({ specAreaId: value, skillPathId: "", stageId: "" })} options={options.specAreas.filter((item) => !filters.courseAreaId || item.courseAreaId === filters.courseAreaId)} allLabel="All specification areas" />
              <FilterSelect label="Skill path" value={filters.skillPathId} onChange={(value) => updateFilters({ skillPathId: value, stageId: "" })} options={options.skillPaths.filter((item) => (!filters.courseAreaId || item.courseAreaId === filters.courseAreaId) && (!filters.specAreaId || item.specAreaId === filters.specAreaId))} allLabel="All skill paths" />
              <FilterSelect label="Stage" value={filters.stageId} onChange={(value) => updateFilters({ stageId: value })} options={options.stages.filter((item) => !filters.skillPathId || item.skillPathId === filters.skillPathId)} allLabel="All stages" />
              <label className="grid gap-1 text-sm font-bold">Status
                <select value={status} onChange={(event) => setStatus(event.target.value as QuestionBankProgressFilter)} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3">
                  {statusFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <button type="button" onClick={clearFilters} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold text-forge">Reset filters</button>
            </div>
          </details>

          <section className="min-w-0" aria-labelledby="question-results-title">
            <div className="grid gap-3">
              <label className="relative block">
                <span className="sr-only">Search questions</span>
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions, paths or stages" className="min-h-12 w-full rounded-xl border border-line bg-white pl-10 pr-4" />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="question-results-title" className="text-xl font-extrabold" aria-live="polite">{questions.length} matching question{questions.length === 1 ? "" : "s"}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {questions.length ? (
                    <button type="button" onClick={() => setSelected((current) => setQuestionGroupSelection(current, questions.map((entry) => entry.question.id), true))} className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-bold">
                      Select all {questions.length} filtered questions
                    </button>
                  ) : null}
                  <label className="text-sm font-bold">Sort <select value={sort} onChange={(event) => setSort(event.target.value as QuestionBankSort)} className="ml-1 min-h-10 rounded-lg border border-line bg-white px-2">
                    <option value="default">Course order</option><option value="recently-practised">Recently practised</option><option value="review-priority">Review priority</option><option value="completion-status">Completion status</option>
                  </select></label>
                </div>
              </div>
            </div>

            {groups.length ? <div className="mt-3 grid gap-4">{groups.map((group) => {
              const allGroupQuestions = questions.filter((entry) => entry.context.skillPath.slug === group.pathId && entry.context.stage.id === group.stageId);
              const groupIds = allGroupQuestions.map((entry) => entry.question.id);
              const groupChecked = groupIds.every((id) => selected.has(id));
              return <section key={`${group.pathId}:${group.stageId}`} className="overflow-hidden rounded-xl border border-line bg-white" aria-labelledby={`group-${group.stageId}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-paper px-4 py-3">
                  <div><p className="text-xs font-bold text-muted">{group.pathName}</p><h3 id={`group-${group.stageId}`} className="font-extrabold">{group.stageName} · {allGroupQuestions.length} questions</h3></div>
                  <label className="flex min-h-10 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={groupChecked} onChange={(event) => setSelected((current) => setQuestionGroupSelection(current, groupIds, event.target.checked))} />Select this stage</label>
                </div>
                <ol className="divide-y divide-line">{group.entries.map((entry) => <QuestionRow key={entry.question.id} entry={entry} selected={selected.has(entry.question.id)} onSelected={(checked) => setSelected((current) => toggleQuestionSelection(current, entry.question.id, checked))} />)}</ol>
              </section>;
            })}</div> : <Card className="mt-3 p-5"><h3 className="font-extrabold">{allEntries.length ? "No available questions match these filters." : "Questions will appear here as Higher Maths content is published."}</h3>{allEntries.length ? <button type="button" onClick={clearFilters} className="mt-4 min-h-10 rounded-lg border border-line px-4 font-bold text-forge">Reset filters</button> : null}</Card>}

            {pagination.pageCount > 1 ? <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Question result pages">
              <p className="text-sm text-muted">Showing {pagination.start}–{pagination.end} of {pagination.total}</p>
              <div className="flex gap-2"><button type="button" disabled={pagination.page === 1} onClick={() => setPage((value) => value - 1)} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40"><ArrowLeft className="mr-1 inline size-4" />Previous</button><button type="button" disabled={pagination.page === pagination.pageCount} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40">Next<ArrowRight className="ml-1 inline size-4" /></button></div>
            </nav> : null}
          </section>
        </div>

        <details className="group rounded-xl border border-line bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold text-muted"><span className="inline-flex items-center gap-2"><Lock className="size-4" />Future Higher Maths coverage</span><ChevronDown className="size-4 group-open:rotate-180" /></summary>
          <div className="grid gap-3 border-t border-line p-4"><p className="text-sm text-muted">Planned coverage is shown broadly. It cannot be filtered or selected until questions are published.</p>{futureCoverage.map((area) => <div key={area.slug} className="rounded-lg bg-paper px-4 py-3"><div className="flex justify-between gap-2"><strong>{area.name}</strong><span className="text-sm text-muted">{area.pathCount} planned paths</span></div><p className="mt-1 text-sm text-muted">{area.specAreas.map((item) => item.name).join(" · ")}</p></div>)}</div>
        </details>

        {selected.size ? <section className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forge/30 bg-white p-3 shadow-card" aria-label="Question selection summary">
          <p className="font-extrabold">{selected.size} selected <span className="font-normal text-muted">· {selectedMarks} total marks</span></p>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(new Set())} className="min-h-11 px-3 font-bold text-muted">Clear selection</button><button type="button" onClick={() => setReviewOpen(true)} className="min-h-11 rounded-lg border border-line px-3 font-bold">Review selection</button><button type="button" onClick={startPractice} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white">Start practice</button></div>
        </section> : null}
      </div>

      {reviewOpen ? <ReviewSelection entries={selectedEntries} onClose={() => setReviewOpen(false)} onRemove={(id) => setSelected((current) => toggleQuestionSelection(current, id, false))} onClear={() => setSelected(new Set())} onStart={startPractice} closeRef={closeReviewRef} /> : null}
      {pendingSession ? <ActiveSessionConflict session={pendingSession} onCancel={() => setPendingSession(null)} onReplace={replaceActiveSession} /> : null}
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel }: { label: string; value: string; onChange: (value: string) => void; options: readonly { id: string; name: string }[]; allLabel: string }) {
  return <label className="grid gap-1 text-sm font-bold">{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3"><option value="">{allLabel}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
}

function QuestionRow({ entry, selected, onSelected }: { entry: QuestionBankQuestionEntry; selected: boolean; onSelected: (checked: boolean) => void }) {
  const position = entry.context.pathQuestions.findIndex((question) => question.id === entry.question.id) + 1;
  const label = `Select ${entry.context.skillPath.name}, ${entry.context.stage.name}, Question ${position}`;
  return <li className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 max-sm:grid-cols-[auto_minmax(0,1fr)]">
    <input type="checkbox" checked={selected} onChange={(event) => onSelected(event.target.checked)} aria-label={label} className="size-5" />
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted"><span>Question {position}</span><span>{entry.question.marks} mark{entry.question.marks === 1 ? "" : "s"}</span><span>{questionStatus(entry)}</span></div><h4 className="mt-1 font-extrabold">{entry.question.title}</h4><div className="mt-1 line-clamp-2 overflow-hidden text-sm text-muted"><MathContent>{entry.question.questionText}</MathContent></div></div>
    <Link href={`/question/${entry.question.id}`} aria-label={`Open ${entry.question.title}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-forge max-sm:col-span-2 max-sm:ml-8">Open question</Link>
  </li>;
}

function ReviewSelection({ entries, onClose, onRemove, onClear, onStart, closeRef }: { entries: QuestionBankQuestionEntry[]; onClose: () => void; onRemove: (id: string) => void; onClear: () => void; onStart: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-3" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="review-selection-title" className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-forge">Custom practice</p><h2 id="review-selection-title" className="text-2xl font-extrabold">Review selection</h2><p className="mt-1 text-sm text-muted">{entries.length} questions · {entries.reduce((total, entry) => total + entry.question.marks, 0)} marks</p></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close selection review" className="grid size-11 place-items-center rounded-lg border border-line"><X className="size-5" /></button></div>
      <ul className="mt-4 divide-y divide-line">{entries.map((entry) => <li key={entry.question.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs font-bold text-muted">{entry.context.skillPath.name} · {entry.context.stage.name}</p><p className="font-bold">{entry.question.title}</p></div><button type="button" onClick={() => onRemove(entry.question.id)} aria-label={`Remove ${entry.question.title}`} className="min-h-10 px-2 font-bold text-muted">Remove</button></li>)}</ul>
      <div className="mt-4 flex flex-wrap justify-between gap-2"><button type="button" onClick={onClear} className="min-h-11 px-3 font-bold text-muted">Clear all</button><div className="flex gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-line px-3 font-bold">Return to filters</button><button type="button" onClick={onStart} disabled={!entries.length} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white disabled:opacity-40">Start practice</button></div></div>
    </section>
  </div>;
}

function ActiveSessionConflict({ session, onCancel, onReplace }: { session: PracticeSession; onCancel: () => void; onReplace: () => void }) {
  const store = loadPracticeSessionStore().store;
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 p-3"><section role="dialog" aria-modal="true" aria-labelledby="active-session-title" className="w-full max-w-lg rounded-xl bg-white p-5"><h2 id="active-session-title" className="text-xl font-extrabold">You already have active practice</h2><p className="mt-2 text-muted">Resume it, or replace it with your {session.questionReferences.length}-question selection. Your recorded progress will not be deleted.</p><div className="mt-5 flex flex-wrap gap-2"><Link href={`/practice/session/${store.activeSessionId}`} className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-bold">Resume current session</Link><button type="button" onClick={onReplace} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white">Replace and start</button><button type="button" onClick={onCancel} className="min-h-11 px-3 font-bold text-muted">Cancel</button></div></section></div>;
}

function groupQuestions(entries: QuestionBankQuestionEntry[]) {
  const groups = new Map<string, { pathId: string; pathName: string; stageId: string; stageName: string; entries: QuestionBankQuestionEntry[] }>();
  for (const entry of entries) {
    const key = `${entry.context.skillPath.slug}:${entry.context.stage.id}`;
    const group = groups.get(key) ?? { pathId: entry.context.skillPath.slug, pathName: entry.context.skillPath.name, stageId: entry.context.stage.id, stageName: entry.context.stage.name, entries: [] };
    group.entries.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function groupFutureCoverage(lockedPaths: ReturnType<typeof contentResolver.getAllPathContexts>) {
  const areas = new Map<string, { slug: string; name: string; pathCount: number; specAreas: Array<{ slug: string; name: string }> }>();
  for (const context of lockedPaths) {
    const area = areas.get(context.courseArea.slug) ?? { slug: context.courseArea.slug, name: context.courseArea.name, pathCount: 0, specAreas: [] };
    area.pathCount += 1;
    if (!area.specAreas.some((item) => item.slug === context.routeTopic.slug)) area.specAreas.push({ slug: context.routeTopic.slug, name: context.routeTopic.name });
    areas.set(area.slug, area);
  }
  return [...areas.values()];
}

function questionStatus(entry: QuestionBankQuestionEntry) {
  if (entry.progress.reviewRecommended) return "Needs review";
  if (entry.progress.completed) return "Completed";
  if (entry.progress.attempted) return "In progress";
  return "Not attempted";
}
