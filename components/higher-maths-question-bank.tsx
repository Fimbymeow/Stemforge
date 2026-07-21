"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, CheckCircle2, ChevronDown, ClipboardList, Lock, Search, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card, ProgressBar } from "@/components/ui";
import { getActiveSubject, getActiveSkillPath, getAllSkillPaths, getQuestionCountForSkillPath, getSkillPathHref } from "@/lib/learning-paths";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import { queryQuestionBank, type QuestionBankProgressFilter, type QuestionBankSort, type QuestionBankStageFilter } from "@/lib/question-bank-query";
import { useHasMounted } from "@/lib/use-mounted";
import type { SkillPath } from "@/data/types";
import { formatProgressStatusLabel } from "@/components/learning/mastery-badge";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import type { LearnerNextAction } from "@/lib/learning/next-action";

const filters: { id: QuestionBankProgressFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "not-started", label: "Not started" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "review-recommended", label: "Review recommended" },
];

export function HigherMathsQuestionBank() {
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const skillPaths = getAllSkillPaths(subject);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuestionBankProgressFilter>("all");
  const [stageFilter, setStageFilter] = useState<QuestionBankStageFilter>("all");
  const [sort, setSort] = useState<QuestionBankSort>("default");
  const [version, setVersion] = useState(0);
  const hasMounted = useHasMounted();
  const nextAction = useLearnerNextAction();

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
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();
  const progress = getSkillPathProgress(skillPath, evidence);
  const status = getStatus(progress.status);
  const visibleEntries = queryQuestionBank(contentResolver, evidence, { search: query, progressFilter: filter, stageFilter, sort });
  const strands = contentResolver.getSpecificationStrands(contentResolver.getCourseArea("higher-maths", "calculus"));
  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)_300px] gap-4 max-lg:grid-cols-1">
        <section className="grid content-start gap-4">
          <header>
            <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/subjects/higher-maths">Higher Maths</Link>
              <ArrowRight className="size-4" />
              <span>Practice</span>
              <ArrowRight className="size-4" />
              <span className="font-bold text-forge">Question Bank</span>
            </nav>
            <h1 className="m-0 text-[32px] font-extrabold leading-none">Higher Maths Question Bank</h1>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Browse original Qualifications Scotland-style questions by topic.</p>
          </header>

          <div className="grid gap-4">
            <label className="relative block max-w-[560px]">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <input
                aria-label="Search question bank"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search topics or keywords..."
                className="min-h-10 w-full rounded-xl border border-line bg-white pl-12 pr-4 text-base outline-none transition focus:border-forge"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${filter === item.id ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-muted hover:border-forge/50"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value as QuestionBankStageFilter)}
                  className="min-h-10 rounded-lg border border-line bg-white px-4 text-sm font-bold text-muted outline-none focus:border-forge"
                >
                  <option value="all">Stage: All stages</option>
                  <option value="Foundations">Foundations</option>
                  <option value="Applications">Applications</option>
                  <option value="Past Paper-style Questions">Past Paper-style Questions</option>
                </select>
                <select value={sort} onChange={(event) => setSort(event.target.value as QuestionBankSort)} className="min-h-10 rounded-lg border border-line bg-white px-4 text-sm font-bold text-muted outline-none focus:border-forge">
                  <option value="default">Sort: Default</option>
                  <option value="recently-practised">Sort: Recently practised</option>
                  <option value="review-priority">Sort: Review priority</option>
                  <option value="completion-status">Sort: Completion status</option>
                </select>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <TopicHeader />
            <div className="divide-y divide-line">
              <TopicRow icon={<Calculator className="size-5" />} title="Calculus" countLabel={`${skillPaths.length} paths`} depth={0} open />
              {visibleEntries.length ? (
                strands.map((strand) => {
                  const strandEntries = visibleEntries.filter((entry) => entry.context.specificationStrand.id === strand.id);
                  if (!strandEntries.length) return null;
                  return (
                    <Fragment key={strand.id}>
                      <TopicRow icon={<BookOpen className="size-5" />} title={strand.name} countLabel={`${strandEntries.length} path${strandEntries.length === 1 ? "" : "s"}`} depth={1} open />
                      {strandEntries.map((entry) => (
                        <SkillPathRow key={entry.id} path={entry.context.skillPath} stageFilter={stageFilter} />
                      ))}
                    </Fragment>
                  );
                })
              ) : (
                <div className="p-4 text-muted">No topics match the current search and filter.</div>
              )}
            </div>
          </Card>

          <Card className="bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="m-0 text-base font-extrabold">New topics are being prepared carefully.</h2>
                <p className="mt-2 text-sm text-muted">For beta, {skillPath.name} is the available question-bank path.</p>
              </div>
              <Link href={getSkillPathHref(skillPath)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 font-extrabold transition hover:border-forge hover:text-forge max-md:w-full">
                Open active path
              </Link>
            </div>
          </Card>
        </section>

        <aside className="grid content-start gap-4">
          <SelectedPathPanel progress={progress} status={status} nextAction={nextAction} />
        </aside>
      </div>
    </AppShell>
  );
}

function TopicHeader() {
  return (
    <div className="grid grid-cols-[1fr_auto] border-b border-line bg-paper px-4 py-3 text-sm font-bold text-muted">
      <span>Topic</span>
      <span>Questions</span>
    </div>
  );
}

function TopicRow({ icon, title, countLabel, depth, open = false }: { icon: ReactNode; title: string; countLabel: string; depth: number; open?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3" style={{ paddingLeft: `${24 + depth * 28}px` }}>
      <div className="flex items-center gap-4">
        <ChevronDown className={`size-4 text-muted ${open ? "" : "-rotate-90"}`} />
        <span className="grid size-10 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge">{icon}</span>
        <strong className="text-base">{title}</strong>
      </div>
      <span className="font-bold text-muted">{countLabel}</span>
    </div>
  );
}

function SkillPathRow({ path, stageFilter }: { path: SkillPath; stageFilter: QuestionBankStageFilter }) {
  const hasMounted = useHasMounted();
  const progress = getSkillPathProgress(path, hasMounted ? undefined : getEmptyProgressEvidence());
  const status = getStatus(progress.status);
  const isSelectedPath = path.slug === getActiveSkillPath().slug;
  const stages = (path.learningStages ?? []).filter((stage) => stageFilter === "all" || stage.name === stageFilter);

  if (path.isAvailable && isSelectedPath) {
    return (
      <div className="bg-gradient-to-r from-forge/10 to-white px-4 py-4 max-md:px-4">
        <div className="grid grid-cols-[1fr_auto] gap-4 max-md:grid-cols-1">
          <div className="flex items-start gap-4 pl-14 max-md:pl-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-forge-soft bg-white text-forge">
              <Target className="size-5" />
            </span>
            <div>
              <h3 className="m-0 text-lg font-extrabold">{path.name}</h3>
              <p className="mt-1 text-sm font-bold text-[#188246]">{status.label}</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">Learn to differentiate algebraic expressions using the power rule.</p>
              <div className="mt-4 grid gap-3 border-l border-dashed border-line pl-5">
                {stages.map((stage, index) => {
                  const stageProgress = progress.stageProgress[stage.id];
                  return (
                    <div key={stage.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-white/70 px-3 py-2 max-sm:grid-cols-[auto_1fr]">
                      <span className="grid size-7 place-items-center rounded-full bg-forge text-xs font-extrabold text-white">{index + 1}</span>
                      <span className="font-bold">{stage.name}</span>
                      <span className="text-sm text-muted max-sm:col-span-2 max-sm:pl-10">{stage.questions} questions - {stageProgress?.completedQuestionIds.length ?? 0} done</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid content-start justify-items-end gap-3 max-md:justify-items-start">
            <span className="grid size-10 place-items-center rounded-full border border-forge-soft bg-white font-extrabold text-forge">{getQuestionCountForSkillPath(path)}</span>
            <Link href={getSkillPathHref(path)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 font-extrabold text-ink max-md:w-full">
              View path
            </Link>
            <Link href="/practice" className="inline-flex min-h-10 items-center justify-center px-2 font-extrabold text-muted max-md:w-full">
              Practice options
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 opacity-70 max-md:px-4">
      <div className="flex items-center gap-4 pl-14 max-md:pl-0">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-forge-soft text-forge">
          <Lock className="size-4" />
        </span>
        <div>
          <h3 className="m-0 text-base font-extrabold">{path.name}</h3>
          <p className="mt-1 text-sm text-muted">Coming soon</p>
        </div>
      </div>
      <span className="text-sm font-bold text-muted">Locked</span>
    </div>
  );
}

function SelectedPathPanel({ progress, status, nextAction }: { progress: ReturnType<typeof getSkillPathProgress>; status: ReturnType<typeof getStatus>; nextAction: LearnerNextAction }) {
  const skillPath = getActiveSkillPath();
  return (
    <Card className="p-4">
      <h2 className="mb-5 text-lg font-extrabold">Your selected path</h2>
      <div className="mb-3 flex items-center gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-forge-soft text-lg font-extrabold text-forge">fx</span>
        <div>
          <h3 className="m-0 text-lg font-extrabold">{skillPath.name}</h3>
          <p className="mt-1 text-muted">{getQuestionCountForSkillPath(skillPath)} questions</p>
        </div>
      </div>
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${status.badgeClass}`}>{status.label}</span>
      <div className="my-4 border-t border-line pt-4">
        <div className="mb-2 flex justify-between text-sm font-bold text-muted">
          <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
          <span>{progress.completionPercentage}%</span>
        </div>
        <ProgressBar value={progress.completionPercentage} />
      </div>
      <div className="mb-3 grid gap-3">
        <h4 className="m-0 font-extrabold">Learning stages</h4>
        {skillPath.learningStages?.map((stage, index) => (
          <div key={stage.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-forge-soft text-sm font-extrabold text-forge">{index + 1}</span>
              <span className="font-bold">{stage.name}</span>
            </div>
            <span className="text-sm text-muted">{stage.questions}</span>
          </div>
        ))}
      </div>
      <div className="mb-3 border-t border-line pt-4">
        <h4 className="mb-3 flex items-center gap-2 font-extrabold"><BookOpen className="size-5" /> About this topic</h4>
        <p className="text-sm leading-relaxed text-muted">Covers the power rule for algebraic expressions, constants and simple polynomials.</p>
      </div>
      {nextAction.href ? <Link href={nextAction.href} aria-describedby="question-bank-next-reason" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-forge px-4 font-extrabold text-white">
        {nextAction.label}
        <ArrowRight className="size-5" />
      </Link> : null}
      <p id="question-bank-next-reason" className="mt-2 text-sm leading-relaxed text-muted">{nextAction.reason}</p>
      <Link href={getSkillPathHref(skillPath)} className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 font-extrabold text-ink">
        View path details
      </Link>
    </Card>
  );
}

function getStatus(status: "not_started" | "in_progress" | "completed" | "secure" | "mastered") {
  const id = status.replace("_", "-");
  const label = formatProgressStatusLabel(status);
  const isStrong = status === "secure" || status === "mastered";
  return {
    id,
    label,
    needsWork: false,
    badgeClass: isStrong ? "bg-[#f1fbf4] text-[#188246]" : status === "not_started" ? "bg-[#f4f1eb] text-muted" : "bg-forge-soft text-forge",
  };
}
