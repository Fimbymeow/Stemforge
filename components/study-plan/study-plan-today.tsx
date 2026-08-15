"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { StudyPlanItemRow } from "@/components/study-plan/study-plan-item-row";
import { useStudyPlan } from "@/components/study-plan/use-study-plan";
import { canPullForward } from "@/lib/study-plan/weekly-plan";
import { STUDY_PLAN_LOCAL_STATE_STORAGE_KEY, type StudyPlanSetup } from "@/lib/study-plan/local-state";
import type { ProgressEvidence } from "@/lib/progress/types";
import type { StudyPlanWeekday } from "@/lib/study-plan/types";
import type { StudyPlanDashboardState } from "@/lib/study-plan/dashboard-dedup";

const WEEKDAYS: readonly { id: StudyPlanWeekday; short: string; name: string }[] = [
  { id: "mon", short: "M", name: "Monday" }, { id: "tue", short: "T", name: "Tuesday" },
  { id: "wed", short: "W", name: "Wednesday" }, { id: "thu", short: "T", name: "Thursday" },
  { id: "fri", short: "F", name: "Friday" }, { id: "sat", short: "S", name: "Saturday" },
  { id: "sun", short: "S", name: "Sunday" },
];

type Props = { evidence: ProgressEvidence; courseSlug: string; courseName: string; onDashboardStateChange?: (state: StudyPlanDashboardState) => void };

export function StudyPlanToday({ evidence, courseSlug, courseName, onDashboardStateChange }: Props) {
  const studyPlan = useStudyPlan({ evidence, courseSlug });
  const [editingSettings, setEditingSettings] = useState(false);
  const [movingItemKey, setMovingItemKey] = useState<string | null>(null);
  const dashboardState = useMemo<StudyPlanDashboardState>(() => {
    if (!studyPlan.loaded) return { status: "loading", caughtUp: false, todayItems: [], planItems: [] };
    if (!studyPlan.state.setup || editingSettings) return { status: "setup", caughtUp: false, todayItems: [], planItems: [] };
    return { status: "configured", caughtUp: studyPlan.plan?.caughtUp ?? false, todayItems: studyPlan.todayItems, planItems: studyPlan.plan?.items ?? [] };
  }, [editingSettings, studyPlan.loaded, studyPlan.plan?.caughtUp, studyPlan.plan?.items, studyPlan.state.setup, studyPlan.todayItems]);

  useEffect(() => onDashboardStateChange?.(dashboardState), [dashboardState, onDashboardStateChange]);

  if (!studyPlan.loaded) return null;
  if (!studyPlan.state.setup || editingSettings) {
    return <StudyPlanSetupForm courseName={courseName} initial={studyPlan.state.setup} onCancel={studyPlan.state.setup ? () => setEditingSettings(false) : undefined} onSave={(setup) => { studyPlan.saveSetup(setup); setEditingSettings(false); }} />;
  }

  const plan = studyPlan.plan;
  const oneMore = plan ? canPullForward(plan, studyPlan.today) : false;
  return (
    <section aria-labelledby="study-plan-today-title" data-testid="study-plan-today" className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Study Plan</p>
          <h2 id="study-plan-today-title" className="mt-1 text-xl font-extrabold">Today</h2>
          <p className="mt-1 text-sm text-muted">A short plan for {courseName}, based on your learning so far.</p>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/study-plan" className="inline-flex min-h-10 items-center rounded-lg px-3 font-extrabold text-forge">View this week <span aria-hidden="true">→</span></Link>
          <details className="relative">
            <summary aria-label="Plan options" className="flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-lg px-2 font-bold text-muted">Options<ChevronDown aria-hidden="true" className="size-4" /></summary>
            <div className="absolute right-0 z-10 mt-2 grid min-w-40 rounded-lg border border-line bg-white p-2 shadow-card">
              <button type="button" onClick={studyPlan.refresh} className={optionButton}><RefreshCw aria-hidden="true" className="size-4" />Refresh plan</button>
              <button type="button" onClick={() => setEditingSettings(true)} className={optionButton}>Plan settings</button>
            </div>
          </details>
        </div>
      </div>

      {plan?.status !== "ok" ? (
        <p className="mt-4 rounded-lg bg-paper p-3 text-sm text-muted">A useful plan is not available for this course yet.</p>
      ) : studyPlan.todayItems.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper p-3 text-sm text-muted">{plan.caughtUp ? "You’re caught up for now." : "Nothing is planned for today."}</p>
      ) : (
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {studyPlan.todayItems.map((item) => <li key={item.itemKey}><StudyPlanItemRow item={item} availableDates={studyPlan.availableDates} moving={movingItemKey === item.itemKey} onToggleMove={() => setMovingItemKey(movingItemKey === item.itemKey ? null : item.itemKey)} onDone={() => studyPlan.markItem(item.itemKey, "completed")} onSkip={() => studyPlan.markItem(item.itemKey, "skipped")} onMove={(date) => { studyPlan.moveItem(item.itemKey, date); setMovingItemKey(null); }} onSwap={() => studyPlan.swapItem(item)} /></li>)}
        </ol>
      )}
      {oneMore ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper p-3"><p className="text-sm font-bold">Finished for today. Want one more?</p><button type="button" onClick={studyPlan.pullForward} className="min-h-10 rounded-lg border border-forge px-3 text-sm font-extrabold text-forge">Add one more</button></div> : null}
      {studyPlan.message ? <p role="status" className="mt-3 text-sm text-muted">{studyPlan.message}</p> : null}
    </section>
  );
}

export function StudyPlanSetupForm({ courseName, initial, onSave, onCancel }: { courseName: string; initial: StudyPlanSetup | null; onSave: (setup: StudyPlanSetup) => void; onCancel?: () => void }) {
  const [weeklyMinutes, setWeeklyMinutes] = useState(initial?.weeklyMinutes ?? 90);
  const [availableDays, setAvailableDays] = useState<StudyPlanWeekday[]>(initial?.availableDays ?? ["mon", "wed", "sat"]);
  const [examDate, setExamDate] = useState(initial?.examDate ?? "");
  return (
    <section aria-labelledby="study-plan-setup-title" data-testid="study-plan-setup" className="rounded-2xl border border-forge/30 bg-white p-4 shadow-card md:p-5">
      <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Study Plan</p>
      <h2 id="study-plan-setup-title" className="mt-1 text-xl font-extrabold">Plan your study week</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">Set a realistic rhythm for {courseName}. You can change it at any time.</p>
      <form className="mt-4 grid gap-4" onSubmit={(event) => { event.preventDefault(); onSave({ weeklyMinutes, availableDays, examDate: examDate || null }); }}>
        <label className="grid max-w-xs gap-1 text-sm font-bold">Minutes each week<input aria-label="Minutes each week" type="number" min={15} max={10080} step={5} required value={weeklyMinutes} onChange={(event) => setWeeklyMinutes(event.currentTarget.valueAsNumber)} className={inputClass} /></label>
        <fieldset><legend className="text-sm font-bold">Days you can study</legend><div className="mt-2 flex flex-wrap gap-2">{WEEKDAYS.map((day) => { const checked = availableDays.includes(day.id); return <label key={day.id} className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-extrabold ${checked ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-muted"}`} title={day.name}><input type="checkbox" className="sr-only" checked={checked} aria-label={day.name} onChange={() => setAvailableDays(checked ? availableDays.filter((entry) => entry !== day.id) : [...availableDays, day.id])} />{day.short}</label>; })}</div></fieldset>
        <label className="grid max-w-xs gap-1 text-sm font-bold">Exam date <span className="font-normal text-muted">(optional)</span><input aria-label="Exam date" type="date" value={examDate} onChange={(event) => setExamDate(event.currentTarget.value)} className={inputClass} /></label>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={availableDays.length === 0 || !Number.isFinite(weeklyMinutes)} className="min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-50">{initial ? "Save plan" : "Create my plan"}</button>{onCancel ? <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-line px-5 text-sm font-extrabold">Cancel</button> : null}</div>
      </form>
    </section>
  );
}

const inputClass = "min-h-11 rounded-lg border border-line bg-white px-3 text-base font-normal text-ink";
const optionButton = "flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-bold hover:bg-paper";

export { STUDY_PLAN_LOCAL_STATE_STORAGE_KEY };
