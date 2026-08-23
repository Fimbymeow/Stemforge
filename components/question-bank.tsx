"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Filter, Lock, Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MathContent } from "@/components/questions/math-content";
import { QuestionGraphVisual } from "@/components/questions/question-graph-visual";
import { Card } from "@/components/ui";
import type { AnswerType } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { getSubjectBySlug } from "@/lib/learning-paths";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { buildQuestionBankExcerpt } from "@/lib/question-bank-preview";
import {
  deriveQuestionBankFilterOptions,
  queryAvailableQuestionBankQuestions,
  type QuestionBankFilterOptions,
  type QuestionBankProgressFilter,
  type QuestionBankQuestionEntry,
} from "@/lib/question-bank-query";
import {
  normalizeQuestionBankFilters,
  paginateQuestionIds,
  setQuestionGroupSelection,
  toggleQuestionSelection,
} from "@/lib/question-bank-selection";
import {
  parseQuestionBankSearchParams,
  questionBankSearchString,
  QUESTION_BANK_URL_DEFAULTS,
  type QuestionBankUrlState,
} from "@/lib/question-bank-url";
import { checkPracticeEligibility } from "@/lib/practice/practice-eligibility";
import { createCustomPracticeSession } from "@/lib/practice/custom-practice";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { useHasMounted } from "@/lib/use-mounted";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { formatNeedsPracticeLabel } from "@/lib/working-context";
import { deriveMistakeLog } from "@/lib/mistakes/derivation";
import { SkillFilterPicker } from "@/components/question-bank-skill-picker";

const STATUS_FILTERS: Array<{ id: QuestionBankProgressFilter; label: string }> = [
  { id: "all", label: "All questions" },
  { id: "not-started", label: "Not attempted" },
  { id: "in-progress", label: "In progress" },
  { id: "review-recommended", label: "Needs more practice" },
  { id: "previously-incorrect", label: "Previously incorrect" },
  { id: "completed", label: "Completed" },
];

const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  multiple_choice: "Multiple-choice",
  numerical: "Numerical",
  algebraic: "Algebraic",
  written: "Written",
  multi_step: "Multi-step",
  graph_structured: "Graph",
  nature_table: "Table",
};

const VISUAL_ANSWER_TYPES: ReadonlySet<AnswerType> = new Set(["graph_structured", "nature_table"]);

type FilterChip = { key: keyof QuestionBankUrlState; label: string; value?: string };

type Group = {
  pathId: string;
  pathName: string;
  stageId: string;
  stageName: string;
  allEntries: QuestionBankQuestionEntry[];
  eligibleIds: string[];
};

function buildGroups(entries: QuestionBankQuestionEntry[]): Group[] {
  const groups = new Map<string, Group>();
  for (const entry of entries) {
    const key = `${entry.context.skillPath.slug}:${entry.context.stage.id}`;
    const group = groups.get(key) ?? {
      pathId: entry.context.skillPath.slug,
      pathName: entry.context.skillPath.name,
      stageId: entry.context.stage.id,
      stageName: entry.context.stage.name,
      allEntries: [],
      eligibleIds: [],
    };
    group.allEntries.push(entry);
    if (checkPracticeEligibility(entry.question).eligible) group.eligibleIds.push(entry.question.id);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function QuestionBank({ subjectSlug }: { subjectSlug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const subject = getSubjectBySlug(subjectSlug);
  const [version, setVersion] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDueConfirmOpen, setReviewDueConfirmOpen] = useState(false);
  const activation = usePracticeActivation();
  const closeReviewRef = useRef<HTMLButtonElement | null>(null);
  const filterSheetRef = useRef<HTMLElement | null>(null);
  const filterSheetCloseRef = useRef<HTMLButtonElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const trayRef = useRef<HTMLElement | null>(null);
  const reviewDueTriggerRef = useRef<HTMLButtonElement | null>(null);
  const reviewDueDialogRef = useRef<HTMLElement | null>(null);
  const reviewDueCloseRef = useRef<HTMLButtonElement | null>(null);
  const evidence = hasMounted ? getProgressEvidence() : getEmptyProgressEvidence();

  const rawUrlState = useMemo(() => parseQuestionBankSearchParams(searchParams), [searchParams]);
  // Tracks the URL state this component itself last wrote, synchronously, so two rapid
  // filter changes (before Next.js commits the first navigation) never clobber each other.
  const pendingUrlStateRef = useRef(rawUrlState);
  useEffect(() => {
    pendingUrlStateRef.current = rawUrlState;
  }, [rawUrlState]);

  const allEntries = useMemo(
    () => queryAvailableQuestionBankQuestions(contentResolver, evidence, { subjectSlug }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, hasMounted, subjectSlug],
  );
  const options: QuestionBankFilterOptions = useMemo(() => deriveQuestionBankFilterOptions(allEntries), [allEntries]);

  const normalizedFilters = useMemo(
    () => normalizeQuestionBankFilters(
      {
        courseAreaId: rawUrlState.courseAreaId,
        specAreaId: rawUrlState.specAreaId,
        skillPathIds: rawUrlState.skillPathIds,
        stageIds: rawUrlState.stageIds,
      },
      options,
    ),
    [rawUrlState, options],
  );
  const typeValid = rawUrlState.type === "all" || (Object.keys(ANSWER_TYPE_LABELS) as AnswerType[]).includes(rawUrlState.type as AnswerType);
  const effectiveType = typeValid ? rawUrlState.type : "all";
  const mistakeLog = useMemo(() => deriveMistakeLog(evidence, subjectSlug), [evidence, subjectSlug]);
  const openMistakeQuestionIds = useMemo(() => new Set(mistakeLog.openGroups.flatMap((group) => group.items.map((item) => item.questionId))), [mistakeLog]);

  const questions = useMemo(() => queryAvailableQuestionBankQuestions(contentResolver, evidence, {
    subjectSlug,
    search: appliedSearch,
    progressFilter: rawUrlState.status,
    courseAreaId: normalizedFilters.courseAreaId || undefined,
    specAreaId: normalizedFilters.specAreaId || undefined,
    skillPathIds: normalizedFilters.skillPathIds,
    stageIds: normalizedFilters.stageIds,
    typeFilter: effectiveType,
    calculatorFilter: rawUrlState.calc,
    sort: rawUrlState.sort,
    openMistakeQuestionIds,
  }), [evidence, subjectSlug, appliedSearch, rawUrlState.status, rawUrlState.calc, rawUrlState.sort, effectiveType, normalizedFilters, openMistakeQuestionIds]);

  const entryById = useMemo(() => new Map(allEntries.map((entry) => [entry.question.id, entry])), [allEntries]);
  const pagination = paginateQuestionIds(questions.map((entry) => entry.question.id), rawUrlState.page);
  const pageEntryIds = useMemo(() => new Set(pagination.questionIds), [pagination.questionIds]);
  const groups = useMemo(() => buildGroups(questions), [questions]);
  const filteredEligibleIds = useMemo(() => questions.filter((entry) => checkPracticeEligibility(entry.question).eligible).map((entry) => entry.question.id), [questions]);
  const selectedEntries = [...selected].map((id) => entryById.get(id)).filter((entry): entry is QuestionBankQuestionEntry => Boolean(entry));
  const selectedMarks = selectedEntries.reduce((total, entry) => total + entry.question.marks, 0);
  const lockedPaths = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === subjectSlug && !context.skillPath.isAvailable);
  const futureCoverage = groupFutureCoverage(lockedPaths);

  const hasActiveTaxonomyFilters = Boolean(normalizedFilters.courseAreaId || normalizedFilters.specAreaId || normalizedFilters.skillPathIds.length || normalizedFilters.stageIds.length);
  const hasActiveSecondaryFilters = rawUrlState.status !== "all" || effectiveType !== "all" || rawUrlState.calc !== "all";
  const hasActiveFilters = hasActiveTaxonomyFilters || hasActiveSecondaryFilters;
  const hasSearch = appliedSearch.trim().length > 0;

  const scopedSkillPath = normalizedFilters.skillPathIds.length === 1 ? options.skillPaths.find((path) => path.id === normalizedFilters.skillPathIds[0]) : undefined;

  const reviewDueEntries = useMemo(() => allEntries.filter((entry) => entry.progress.reviewRecommended), [allEntries]);
  const reviewDueEligible = useMemo(() => reviewDueEntries.filter((entry) => checkPracticeEligibility(entry.question).eligible), [reviewDueEntries]);
  const reviewDueIneligibleCount = reviewDueEntries.length - reviewDueEligible.length;
  const reviewDueScope = useMemo(() => {
    const seen = new Map<string, string>();
    for (const entry of reviewDueEligible) {
      const key = `${entry.context.skillPath.slug}:${entry.context.stage.id}`;
      seen.set(key, `${entry.context.skillPath.name} · ${entry.context.stage.name}`);
    }
    return [...seen.values()];
  }, [reviewDueEligible]);
  const stageFilterOptions = options.stages.filter((item) => !normalizedFilters.skillPathIds.length || normalizedFilters.skillPathIds.includes(item.skillPathId));
  const stageChoices = groupStageChoices(stageFilterOptions);

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
    const handle = setTimeout(() => setAppliedSearch(searchInput), 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Reconcile stale/invalid URL state (cross-subject path leftovers, out-of-range page) to its canonical form.
  useEffect(() => {
    const canonicalPage = Math.min(rawUrlState.page, pagination.pageCount);
    const needsFilterFix = normalizedFilters.specAreaId !== rawUrlState.specAreaId
      || !sameValues(normalizedFilters.skillPathIds, rawUrlState.skillPathIds)
      || !sameValues(normalizedFilters.stageIds, rawUrlState.stageIds);
    const needsTypeFix = !typeValid;
    const needsPageFix = canonicalPage !== rawUrlState.page;
    if (!needsFilterFix && !needsTypeFix && !needsPageFix) return;
    const canonical: QuestionBankUrlState = { ...rawUrlState, ...normalizedFilters, type: effectiveType, page: canonicalPage };
    router.replace(`${pathname}${questionBankSearchString(canonical)}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedFilters, typeValid, effectiveType, rawUrlState, pagination.pageCount, pathname]);

  useEffect(() => {
    if (rawUrlState.page === 1) return;
    router.replace(`${pathname}${questionBankSearchString({ ...rawUrlState, page: 1 })}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch]);

  useModalFocusTrap({
    open: mobileFiltersOpen,
    containerRef: filterSheetRef,
    initialFocusRef: filterSheetCloseRef,
    triggerRef: filterTriggerRef,
    onClose: () => setMobileFiltersOpen(false),
  });

  useModalFocusTrap({
    open: reviewDueConfirmOpen,
    containerRef: reviewDueDialogRef,
    initialFocusRef: reviewDueCloseRef,
    triggerRef: reviewDueTriggerRef,
    onClose: () => setReviewDueConfirmOpen(false),
  });

  const trayVisible = selected.size > 0;

  useEffect(() => {
    const tray = trayRef.current;
    const root = document.documentElement;
    if (!tray) {
      root.style.removeProperty("--question-bank-selection-height");
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? entry?.contentRect.height;
      if (height) root.style.setProperty("--question-bank-selection-height", `${height}px`);
    });
    observer.observe(tray);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--question-bank-selection-height");
    };
  }, [trayVisible]);

  useEffect(() => {
    if (!reviewOpen) return;
    closeReviewRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setReviewOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [reviewOpen]);

  if (!subject) return null;

  // Material browsing changes push a history entry so Back/Forward walks through prior
  // filter states; only involuntary corrections (reconciliation, search-triggered page reset)
  // use replace, since those aren't steps a user should have to navigate back through.
  function updateFilters(patch: Partial<QuestionBankUrlState>) {
    const next: QuestionBankUrlState = { ...pendingUrlStateRef.current, ...patch, page: 1 };
    pendingUrlStateRef.current = next;
    router.push(`${pathname}${questionBankSearchString(next)}`, { scroll: false });
  }

  function goToPage(page: number) {
    const next: QuestionBankUrlState = { ...pendingUrlStateRef.current, page };
    pendingUrlStateRef.current = next;
    router.push(`${pathname}${questionBankSearchString(next)}`, { scroll: false });
  }

  function resetAllFilters() {
    setSearchInput("");
    updateFilters({ ...QUESTION_BANK_URL_DEFAULTS });
  }

  function removeChip(chip: FilterChip) {
    if (chip.key === "skillPathIds" && chip.value) {
      updateFilters({ skillPathIds: normalizedFilters.skillPathIds.filter((id) => id !== chip.value) });
      return;
    }
    if (chip.key === "stageIds" && chip.value) {
      const removed = new Set(chip.value.split(","));
      updateFilters({ stageIds: normalizedFilters.stageIds.filter((id) => !removed.has(id)) });
      return;
    }
    updateFilters({ [chip.key]: QUESTION_BANK_URL_DEFAULTS[chip.key] } as Partial<QuestionBankUrlState>);
  }

  function toggleMultiValue(key: "skillPathIds" | "stageIds", ids: readonly string[], checked: boolean) {
    const current = pendingUrlStateRef.current[key];
    const changed = checked
      ? [...new Set([...current, ...ids])]
      : current.filter((value) => !ids.includes(value));
    updateFilters({ [key]: changed });
  }

  function focusFilters() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobileFiltersOpen(true);
      return;
    }
    document.getElementById("question-bank-filters")?.querySelector("select")?.focus();
  }

  function startPractice() {
    const result = createCustomPracticeSession([...selected]);
    if (!result.session) {
      setSelected(new Set());
      return;
    }
    void activation.begin(result.session);
  }

  function startReviewPractice() {
    const result = createCustomPracticeSession(
      reviewDueEligible.map((entry) => entry.question.id),
      { origin: "subject_review" },
    );
    setReviewDueConfirmOpen(false);
    if (!result.session) return;
    void activation.begin(result.session);
  }

  const rawChips: Array<FilterChip | null> = [
    normalizedFilters.courseAreaId ? { key: "courseAreaId", label: options.courseAreas.find((item) => item.id === normalizedFilters.courseAreaId)?.name ?? normalizedFilters.courseAreaId } : null,
    normalizedFilters.specAreaId ? { key: "specAreaId", label: options.specAreas.find((item) => item.id === normalizedFilters.specAreaId)?.name ?? normalizedFilters.specAreaId } : null,
    ...normalizedFilters.skillPathIds.map((id) => ({ key: "skillPathIds" as const, value: id, label: options.skillPaths.find((item) => item.id === id)?.name ?? id })),
    ...groupStageChoices(options.stages.filter((item) => normalizedFilters.stageIds.includes(item.id))).map((choice) => ({ key: "stageIds" as const, value: choice.ids.join(","), label: choice.name })),
    rawUrlState.status !== "all" ? { key: "status", label: STATUS_FILTERS.find((item) => item.id === rawUrlState.status)?.label ?? rawUrlState.status } : null,
    effectiveType !== "all" ? { key: "type", label: `${ANSWER_TYPE_LABELS[effectiveType as AnswerType]} questions` } : null,
    rawUrlState.calc !== "all" ? { key: "calc", label: rawUrlState.calc === "allowed" ? "Calculator allowed" : "Calculator not allowed" } : null,
  ];
  const activeChips = rawChips.filter((chip): chip is FilterChip => chip !== null);

  const scopedSkillOptions = options.skillPaths.filter((item) => (!normalizedFilters.courseAreaId || item.courseAreaId === normalizedFilters.courseAreaId) && (!normalizedFilters.specAreaId || item.specAreaId === normalizedFilters.specAreaId));

  const filterPanel = (mobile: boolean) => (
    <div className="grid gap-3">
      <FilterSelect label="Course area" value={normalizedFilters.courseAreaId} onChange={(value) => updateFilters({ courseAreaId: value, specAreaId: "", skillPathIds: [], stageIds: [] })} options={options.courseAreas} allLabel="All areas" />
      <FilterSelect label="Specification area" value={normalizedFilters.specAreaId} onChange={(value) => updateFilters({ specAreaId: value, skillPathIds: [], stageIds: [] })} options={options.specAreas.filter((item) => !normalizedFilters.courseAreaId || item.courseAreaId === normalizedFilters.courseAreaId)} allLabel="All specification areas" />
      <SkillFilterPicker
        label="Skills"
        values={normalizedFilters.skillPathIds}
        onClear={() => updateFilters({ skillPathIds: [], stageIds: [] })}
        onToggle={(id, checked) => toggleMultiValue("skillPathIds", [id], checked)}
        options={scopedSkillOptions}
        allLabel="All skills"
        mobile={mobile}
      />
      <StageMultiFilter
        label="Stages"
        values={normalizedFilters.stageIds}
        onClear={() => updateFilters({ stageIds: [] })}
        onToggle={(ids, checked) => toggleMultiValue("stageIds", ids, checked)}
        options={stageChoices}
        allLabel="All stages"
      />
      <details className="group rounded-lg border border-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 font-bold text-sm">More filters<ChevronDown className="size-4 group-open:rotate-180" /></summary>
        <div className="grid gap-3 border-t border-line p-3">
          <label className="grid gap-1 text-sm font-bold">Status
            <select value={rawUrlState.status} onChange={(event) => updateFilters({ status: event.target.value as QuestionBankProgressFilter })} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3">
              {STATUS_FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">Question type
            <select value={effectiveType} onChange={(event) => updateFilters({ type: event.target.value as QuestionBankUrlState["type"] })} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3">
              <option value="all">All types</option>
              {options.types.map((type) => <option key={type} value={type}>{ANSWER_TYPE_LABELS[type]}</option>)}
            </select>
          </label>
          {options.hasCalculatorQuestions ? (
            <label className="grid gap-1 text-sm font-bold">Calculator
              <select value={rawUrlState.calc} onChange={(event) => updateFilters({ calc: event.target.value as QuestionBankUrlState["calc"] })} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3">
                <option value="all">All questions</option>
                <option value="allowed">Calculator allowed</option>
                <option value="not-allowed">Calculator not allowed</option>
              </select>
            </label>
          ) : null}
        </div>
      </details>
      <div className="grid gap-3 border-t border-line pt-3 lg:hidden">
        <label className="grid gap-1 text-sm font-bold">Sort
          <select value={rawUrlState.sort} onChange={(event) => updateFilters({ sort: event.target.value as QuestionBankUrlState["sort"] })} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3">
            <option value="default">Course order</option><option value="recently-practised">Recently practised</option><option value="review-priority">Review priority</option><option value="completion-status">Completion status</option>
          </select>
        </label>
        {filteredEligibleIds.length ? <button type="button" onClick={() => setSelected((current) => setQuestionGroupSelection(current, filteredEligibleIds, true))} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold text-forge">Select all {filteredEligibleIds.length} filtered questions</button> : null}
      </div>
      <button type="button" onClick={resetAllFilters} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold text-forge">Reset filters</button>
    </div>
  );

  return (
    <AppShell demo active="Subjects" workingContextPathId={normalizedFilters.skillPathIds.length === 1 ? normalizedFilters.skillPathIds[0] : null}>
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end max-md:mb-1"><AppTopbar demo /></div>
      <div
        className="mx-auto grid min-w-0 max-w-[1120px] gap-4 max-md:gap-2"
        style={selected.size ? { paddingBottom: "calc(var(--question-bank-selection-height, 4rem) + var(--fixed-ui-gap))" } : undefined}
      >
        <header>
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted max-md:mb-1" aria-label="Breadcrumb">
            <Link href={subject.href}>{subject.subjectName}</Link><ArrowRight className="size-4" /><span className="font-bold text-forge">Question Bank</span>
          </nav>
          <h1 className="m-0 text-[clamp(24px,4vw,36px)] font-extrabold leading-none">Question Bank</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted max-md:hidden">Choose skills and questions to build your own practice session.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold max-md:mt-1.5">
            <span className="rounded-full bg-forge-soft px-3 py-1.5 text-forge">{allEntries.length} questions available</span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5 max-md:hidden">{options.skillPaths.length} available skill{options.skillPaths.length === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted max-md:hidden">More {subject.subjectName} content is coming later</span>
          </div>
        </header>

        {scopedSkillPath || reviewDueEligible.length ? <div className="flex flex-wrap items-center gap-2">
          {scopedSkillPath ? <p className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold">
            Scoped to {scopedSkillPath.name}
            <button type="button" onClick={() => updateFilters({ skillPathIds: [], stageIds: [] })} className="min-h-8 rounded-full border border-line px-2 text-xs font-bold text-forge">Browse all {subject.subjectName}</button>
          </p> : null}
          {reviewDueEligible.length ? <button ref={reviewDueTriggerRef} type="button" onClick={() => setReviewDueConfirmOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-forge/40 bg-forge-soft px-3 text-sm font-bold text-forge">
            {formatNeedsPracticeLabel(reviewDueEligible.length)}
          </button> : null}
        </div> : null}

        <div className="grid min-w-0 gap-4 max-md:gap-2 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]">
          <div id="question-bank-filters" className="hidden h-fit rounded-xl border border-line bg-white p-4 lg:block">
            <p className="mb-3 inline-flex items-center gap-2 font-extrabold"><Filter className="size-4" />Filters</p>
            {filterPanel(false)}
          </div>

          <section className="min-w-0" aria-labelledby="question-results-title">
            <div className="grid gap-3 max-md:gap-2">
              <div className="flex items-center gap-2">
                <label className="relative block min-w-0 flex-1">
                  <span className="sr-only">Search questions</span>
                  <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" />
                  <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search questions, skills or stages" className="min-h-12 w-full rounded-xl border border-line bg-white pl-10 pr-4 max-md:min-h-11" />
                </label>
                <button ref={filterTriggerRef} type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-3 font-bold lg:hidden">
                  <Filter className="size-4" />Filters{hasActiveFilters ? <span className="rounded-full bg-forge px-1.5 text-xs text-white">{activeChips.length}</span> : null}
                </button>
              </div>

              {activeChips.length ? <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => <button key={`${chip.key}:${chip.value ?? ""}`} type="button" onClick={() => removeChip(chip)} aria-label={`Remove ${chip.label} filter`} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-bold">{chip.label}<X className="size-3" /></button>)}
              </div> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 max-md:gap-1.5">
                <h2 id="question-results-title" className="text-xl font-extrabold max-md:text-base" aria-live="polite">{questions.length} matching question{questions.length === 1 ? "" : "s"}</h2>
                <div className="flex flex-wrap items-center gap-2 max-md:hidden">
                  {questions.length ? (
                    <button type="button" onClick={() => setSelected((current) => setQuestionGroupSelection(current, filteredEligibleIds, true))} className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-bold">
                      Select all {filteredEligibleIds.length} filtered questions
                    </button>
                  ) : null}
                  <label className="text-sm font-bold">Sort <select value={rawUrlState.sort} onChange={(event) => updateFilters({ sort: event.target.value as QuestionBankUrlState["sort"] })} className="ml-1 min-h-10 rounded-lg border border-line bg-white px-2">
                    <option value="default">Course order</option><option value="recently-practised">Recently practised</option><option value="review-priority">Review priority</option><option value="completion-status">Completion status</option>
                  </select></label>
                </div>
              </div>
            </div>

            {groups.length ? <div className="mt-3 grid gap-4">{groups.map((group) => {
              const visibleEntries = group.allEntries.filter((entry) => pageEntryIds.has(entry.question.id));
              if (!visibleEntries.length) return null;
              const allSelected = group.eligibleIds.length > 0 && group.eligibleIds.every((id) => selected.has(id));
              const someSelected = group.eligibleIds.some((id) => selected.has(id));
              const indeterminate = someSelected && !allSelected;
              const ineligibleCount = group.allEntries.length - group.eligibleIds.length;
              const groupLabel = `${allSelected ? "Deselect" : "Select"} all ${group.eligibleIds.length} matching ${group.stageName} questions`;
              return <section key={`${group.pathId}:${group.stageId}`} className="overflow-hidden rounded-xl border border-line bg-white" aria-labelledby={`group-${group.stageId}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-paper px-4 py-3 max-md:py-2">
                  <div>
                    <p className="text-xs font-bold text-muted">{group.pathName}</p>
                    <h3 id={`group-${group.stageId}`} className="font-extrabold">{group.stageName} · {group.allEntries.length} questions</h3>
                    {ineligibleCount ? <p className="mt-0.5 text-xs text-muted">{ineligibleCount} not yet available for practice</p> : null}
                  </div>
                  <label className="flex min-h-10 items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      disabled={group.eligibleIds.length === 0}
                      ref={(node) => { if (node) node.indeterminate = indeterminate; }}
                      onChange={(event) => setSelected((current) => setQuestionGroupSelection(current, group.eligibleIds, event.target.checked))}
                      aria-label={groupLabel}
                    />
                    Select this stage
                  </label>
                </div>
                <ol className="divide-y divide-line">{visibleEntries.map((entry) => <QuestionRow
                  key={entry.question.id}
                  entry={entry}
                  selected={selected.has(entry.question.id)}
                  expanded={expandedId === entry.question.id}
                  onSelected={(checked) => setSelected((current) => toggleQuestionSelection(current, entry.question.id, checked))}
                  onToggleExpand={() => setExpandedId((current) => (current === entry.question.id ? null : entry.question.id))}
                />)}</ol>
              </section>;
            })}</div> : <QuestionBankEmptyState
              hasAnyQuestions={allEntries.length > 0}
              scopedSkillPathName={!hasSearch && !hasActiveSecondaryFilters ? scopedSkillPath?.name : undefined}
              hasSearch={hasSearch}
              hasActiveFilters={hasActiveFilters}
              previouslyIncorrect={rawUrlState.status === "previously-incorrect"}
              activeChips={activeChips}
              onClearSearch={() => setSearchInput("")}
              onAdjustFilters={focusFilters}
              onResetFilters={resetAllFilters}
              onRemoveChip={removeChip}
              subjectName={subject.subjectName}
              subjectHref={subject.href}
            />}

            {pagination.pageCount > 1 ? <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Question result pages">
              <p className="text-sm text-muted">Showing {pagination.start}–{pagination.end} of {pagination.total}</p>
              <div className="flex gap-2"><button type="button" disabled={pagination.page === 1} onClick={() => goToPage(pagination.page - 1)} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40"><ArrowLeft className="mr-1 inline size-4" />Previous</button><button type="button" disabled={pagination.page === pagination.pageCount} onClick={() => goToPage(pagination.page + 1)} className="min-h-11 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40">Next<ArrowRight className="ml-1 inline size-4" /></button></div>
            </nav> : null}
          </section>
        </div>

        <details className="group rounded-xl border border-line bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold text-muted"><span className="inline-flex items-center gap-2"><Lock className="size-4" />Future {subject.subjectName} coverage</span><ChevronDown className="size-4 group-open:rotate-180" /></summary>
          <div className="grid gap-3 border-t border-line p-4"><p className="text-sm text-muted">This is a preview of what&apos;s coming. You&apos;ll be able to search and practise it once it&apos;s ready.</p>{futureCoverage.map((area) => <div key={area.slug} className="rounded-lg bg-paper px-4 py-3"><div className="flex justify-between gap-2"><strong>{area.name}</strong><span className="text-sm text-muted">{area.pathCount} planned paths</span></div><p className="mt-1 text-sm text-muted">{area.specAreas.map((item) => item.name).join(" · ")}</p></div>)}</div>
        </details>

        {selected.size ? <section
          ref={trayRef}
          className="fixed left-4 right-4 z-40 mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 rounded-xl border border-forge/30 bg-white p-3 shadow-card md:left-[clamp(20px,3vw,42px)] md:right-[clamp(20px,3vw,42px)] xl:left-[calc(268px+clamp(20px,3vw,42px))]"
          style={{ bottom: "calc(var(--global-bottom-inset) + var(--feedback-dock-height) + var(--fixed-ui-gap))" }}
          aria-label="Question selection summary"
        >
          <p className="font-extrabold">{selected.size} selected <span className="font-normal text-muted">· {selectedMarks} total marks</span></p>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(new Set())} className="min-h-11 px-3 font-bold text-muted">Clear selection</button><button type="button" onClick={() => setReviewOpen(true)} className="min-h-11 rounded-lg border border-line px-3 font-bold">Review selection</button><button type="button" onClick={startPractice} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white">Start selected practice</button></div>
        </section> : null}
      </div>

      {mobileFiltersOpen ? <MobileFilterSheet
        containerRef={filterSheetRef}
        closeRef={filterSheetCloseRef}
        onClose={() => setMobileFiltersOpen(false)}
      >{filterPanel(true)}</MobileFilterSheet> : null}
      {reviewOpen ? <ReviewSelection entries={selectedEntries} onClose={() => setReviewOpen(false)} onRemove={(id) => setSelected((current) => toggleQuestionSelection(current, id, false))} onClear={() => setSelected(new Set())} onStart={startPractice} closeRef={closeReviewRef} /> : null}
      {reviewDueConfirmOpen ? <ReviewDueConfirmation
        containerRef={reviewDueDialogRef}
        closeRef={reviewDueCloseRef}
        eligibleCount={reviewDueEligible.length}
        ineligibleCount={reviewDueIneligibleCount}
        scope={reviewDueScope}
        onClose={() => setReviewDueConfirmOpen(false)}
        onStart={startReviewPractice}
      /> : null}
      {activation.error ? <p role="status" className="text-sm text-red-700">{activation.error}</p> : null}
      {activation.activationUi}
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel }: { label: string; value: string; onChange: (value: string) => void; options: readonly { id: string; name: string }[]; allLabel: string }) {
  return <label className="grid gap-1 text-sm font-bold">{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-3"><option value="">{allLabel}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
}

function StageMultiFilter({ label, values, onClear, onToggle, options, allLabel }: { label: string; values: readonly string[]; onClear: () => void; onToggle: (ids: readonly string[], checked: boolean) => void; options: readonly { name: string; ids: string[] }[]; allLabel: string }) {
  return <fieldset className="rounded-lg border border-line p-3">
    <legend className="px-1 text-sm font-bold">{label}</legend>
    <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
      <input type="checkbox" checked={!values.length} onChange={onClear} /> {allLabel}
    </label>
    <div className="grid gap-1 border-t border-line pt-1">
      {options.map((item) => {
        const checked = item.ids.every((id) => values.includes(id));
        return <label key={item.name} className="flex min-h-10 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={checked} onChange={(event) => onToggle(item.ids, event.target.checked)} /> {displayStageName(item.name)}
        </label>;
      })}
    </div>
  </fieldset>;
}

function MobileFilterSheet({ containerRef, closeRef, onClose, children }: { containerRef: React.RefObject<HTMLElement | null>; closeRef: React.RefObject<HTMLButtonElement | null>; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();
  return <div className="fixed inset-0 z-50 bg-ink/35 lg:hidden" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section ref={containerRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-line bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-line p-4">
        <h2 id={titleId} className="text-lg font-extrabold">Filters</h2>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close filters" className="grid size-11 place-items-center rounded-full border border-line"><X className="size-5" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      <footer className="flex gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onClose} className="min-h-11 w-full rounded-lg bg-forge px-3 font-extrabold text-white">Apply</button>
      </footer>
    </section>
  </div>;
}

function QuestionRow({ entry, selected, expanded, onSelected, onToggleExpand }: { entry: QuestionBankQuestionEntry; selected: boolean; expanded: boolean; onSelected: (checked: boolean) => void; onToggleExpand: () => void }) {
  const eligibility = checkPracticeEligibility(entry.question);
  const position = entry.context.questionIndexInPath + 1;
  const excerpt = buildQuestionBankExcerpt(entry.question);
  const panelId = `question-bank-preview-${entry.question.id}`;
  const label = `Select ${entry.context.skillPath.name}, ${entry.context.stage.name}, Question ${position}`;
  const hasInteractiveVisualAnswer = VISUAL_ANSWER_TYPES.has(entry.question.answerType);
  return <li className="grid min-w-0 gap-2 px-4 py-3">
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-[auto_minmax(0,1fr)]">
      <input type="checkbox" checked={selected} disabled={!eligibility.eligible} onChange={(event) => onSelected(event.target.checked)} aria-label={label} className="size-5" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
          <span>Question {position}</span>
          <span>{entry.question.marks} mark{entry.question.marks === 1 ? "" : "s"}</span>
          <span>{questionStatus(entry)}</span>
          <span>{ANSWER_TYPE_LABELS[entry.question.answerType]} question</span>
          {entry.question.calculatorAllowed ? <span>Calculator allowed</span> : null}
          {!eligibility.eligible ? <span className="font-extrabold text-muted">Not yet available for practice</span> : null}
        </div>
        <h4 className="mt-1 font-extrabold">{entry.question.title}</h4>
        <p className="mt-1 line-clamp-2 overflow-hidden text-sm text-muted">{excerpt}</p>
      </div>
      <div className="flex flex-col items-end gap-1 max-sm:col-span-2 max-sm:ml-8 max-sm:flex-row">
        <button type="button" onClick={onToggleExpand} aria-expanded={expanded} aria-controls={panelId} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-muted">{expanded ? "Hide preview" : "Preview"}</button>
        <Link href={`/question/${entry.question.id}`} aria-label={`Open ${entry.question.title}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-forge">Open question</Link>
      </div>
    </div>
    {expanded ? <div id={panelId} className="min-w-0 rounded-lg bg-paper p-3 text-sm leading-relaxed">
      <MathContent>{entry.question.questionText}</MathContent>
      <QuestionGraphVisual question={entry.question} />
      {hasInteractiveVisualAnswer ? <p className="mt-2 font-bold text-muted">Open the question page to use the interactive {entry.question.answerType === "nature_table" ? "table" : "graph"} answer tool.</p> : null}
    </div> : null}
  </li>;
}

function QuestionBankEmptyState({ hasAnyQuestions, scopedSkillPathName, hasSearch, hasActiveFilters, previouslyIncorrect, activeChips, onClearSearch, onAdjustFilters, onResetFilters, onRemoveChip, subjectName, subjectHref }: {
  hasAnyQuestions: boolean;
  scopedSkillPathName?: string;
  hasSearch: boolean;
  hasActiveFilters: boolean;
  previouslyIncorrect: boolean;
  activeChips: FilterChip[];
  onClearSearch: () => void;
  onAdjustFilters: () => void;
  onResetFilters: () => void;
  onRemoveChip: (chip: FilterChip) => void;
  subjectName: string;
  subjectHref: string;
}) {
  if (!hasAnyQuestions) {
    return <Card className="animate-fade-rise mt-3 p-5">
      <h3 className="font-extrabold">Questions are coming soon</h3>
      <p className="mt-1 text-sm text-muted">This subject doesn&apos;t have practice questions yet.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={subjectHref} className="inline-flex min-h-10 items-center rounded-lg border border-line px-4 font-bold text-forge">Return to subject overview</Link>
        <Link href="/subjects" className="inline-flex min-h-10 items-center rounded-lg border border-line px-4 font-bold text-forge">Browse another available area</Link>
      </div>
    </Card>;
  }
  if (scopedSkillPathName) {
    return <Card className="mt-3 p-5">
      <h3 className="font-extrabold">{scopedSkillPathName} has no available questions</h3>
      <p className="mt-1 text-sm text-muted">This topic doesn&apos;t have practice questions yet.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onResetFilters} className="min-h-10 rounded-lg border border-line px-4 font-bold text-forge">Browse all {subjectName}</button>
      </div>
    </Card>;
  }
  if (hasSearch) {
    return <Card className="animate-fade-rise mt-3 p-5">
      <h3 className="font-extrabold">No questions match your search</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onClearSearch} className="min-h-10 rounded-lg border border-line px-4 font-bold text-forge">Clear search</button>
        <button type="button" onClick={onAdjustFilters} className="min-h-10 rounded-lg border border-line px-4 font-bold text-forge">Adjust filters</button>
      </div>
    </Card>;
  }
  if (previouslyIncorrect) {
    return <Card className="animate-fade-rise mt-3 p-5">
      <h3 className="font-extrabold">Nothing to recover here right now.</h3>
      <p className="mt-1 text-sm text-muted">Try another skill or return to all questions.</p>
      <button type="button" onClick={onResetFilters} className="mt-4 min-h-10 rounded-lg border border-line px-4 font-bold text-forge">Clear filters</button>
    </Card>;
  }
  return <Card className="animate-fade-rise mt-3 p-5">
    <h3 className="font-extrabold">No questions match these filters</h3>
    {activeChips.length ? <div className="mt-3 flex flex-wrap gap-2">{activeChips.map((chip) => <button key={`${chip.key}:${chip.value ?? ""}`} type="button" onClick={() => onRemoveChip(chip)} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-bold">{chip.label}<X className="size-3" /></button>)}</div> : null}
    {hasActiveFilters ? <button type="button" onClick={onResetFilters} className="mt-4 min-h-10 rounded-lg border border-line px-4 font-bold text-forge">Reset all filters</button> : null}
  </Card>;
}

function ReviewSelection({ entries, onClose, onRemove, onClear, onStart, closeRef }: { entries: QuestionBankQuestionEntry[]; onClose: () => void; onRemove: (id: string) => void; onClear: () => void; onStart: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-3" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="review-selection-title" className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-forge">Custom practice</p><h2 id="review-selection-title" className="text-2xl font-extrabold">Review selection</h2><p className="mt-1 text-sm text-muted">{entries.length} questions · {entries.reduce((total, entry) => total + entry.question.marks, 0)} marks</p></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close selection review" className="grid size-11 place-items-center rounded-lg border border-line"><X className="size-5" /></button></div>
      <ul className="mt-4 divide-y divide-line">{entries.map((entry) => <li key={entry.question.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs font-bold text-muted">{entry.context.skillPath.name} · {entry.context.stage.name}</p><p className="font-bold">{entry.question.title}</p></div><button type="button" onClick={() => onRemove(entry.question.id)} aria-label={`Remove ${entry.question.title}`} className="min-h-10 px-2 font-bold text-muted">Remove</button></li>)}</ul>
      <div className="mt-4 flex flex-wrap justify-between gap-2"><button type="button" onClick={onClear} className="min-h-11 px-3 font-bold text-muted">Clear all</button><div className="flex gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-line px-3 font-bold">Return to filters</button><button type="button" onClick={onStart} disabled={!entries.length} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white disabled:opacity-40">Start selected practice</button></div></div>
    </section>
  </div>;
}

function ReviewDueConfirmation({ containerRef, closeRef, eligibleCount, ineligibleCount, scope, onClose, onStart }: {
  containerRef: React.RefObject<HTMLElement | null>;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  eligibleCount: number;
  ineligibleCount: number;
  scope: string[];
  onClose: () => void;
  onStart: () => void;
}) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-3" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="review-due-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase text-forge">Practice again</p>
          <h2 id="review-due-title" className="text-xl font-extrabold">{formatNeedsPracticeLabel(eligibleCount)}</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close review confirmation" className="grid size-11 place-items-center rounded-lg border border-line"><X className="size-5" /></button>
      </div>
      {scope.length ? <p className="mt-3 text-sm text-muted">Covers {scope.join(", ")}.</p> : null}
      {ineligibleCount ? <p className="mt-2 text-sm text-muted">{ineligibleCount} further due question{ineligibleCount === 1 ? "" : "s"} {ineligibleCount === 1 ? "is" : "are"} not yet available for practice and {ineligibleCount === 1 ? "is" : "are"} excluded from this session.</p> : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-11 px-3 font-bold text-muted">Cancel</button>
        <button type="button" onClick={onStart} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white">Start practice again</button>
      </div>
    </section>
  </div>;
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
  if (entry.progress.reviewRecommended) return "Needs more practice";
  if (entry.progress.completed) return "Completed";
  if (entry.progress.attempted) return "In progress";
  return "Not attempted";
}

function sameValues(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function groupStageChoices(stages: readonly { id: string; name: string }[]) {
  const grouped = new Map<string, string[]>();
  for (const stage of stages) grouped.set(stage.name, [...(grouped.get(stage.name) ?? []), stage.id]);
  return [...grouped].map(([name, ids]) => ({ name, ids }));
}

function displayStageName(name: string) {
  return name === "Past Paper-style Questions" ? "Exam practice" : name;
}
