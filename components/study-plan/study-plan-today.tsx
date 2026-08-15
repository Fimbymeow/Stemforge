"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, RefreshCw } from "lucide-react";
import { datesForAvailableDays } from "@/lib/study-plan/dates";
import {
  emptyStudyPlanLocalState,
  localCalendarDate,
  localDayKey,
  preservationInput,
  readStudyPlanLocalState,
  STUDY_PLAN_LOCAL_STATE_STORAGE_KEY,
  STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT,
  type StudyPlanLocalState,
  type StudyPlanSetup,
  writeStudyPlanLocalState,
} from "@/lib/study-plan/local-state";
import { generateStudyPlan } from "@/lib/study-plan/planner";
import { presentStudyPlanReason } from "@/lib/study-plan/presenter";
import type { ProgressEvidence } from "@/lib/progress/types";
import type { StudyPlanItem, StudyPlanWeekday } from "@/lib/study-plan/types";

const WEEKDAYS: readonly { id: StudyPlanWeekday; short: string; name: string }[] = [
  { id: "mon", short: "M", name: "Monday" }, { id: "tue", short: "T", name: "Tuesday" },
  { id: "wed", short: "W", name: "Wednesday" }, { id: "thu", short: "T", name: "Thursday" },
  { id: "fri", short: "F", name: "Friday" }, { id: "sat", short: "S", name: "Saturday" },
  { id: "sun", short: "S", name: "Sunday" },
];

type Props = { evidence: ProgressEvidence; courseSlug: string; courseName: string };

export function StudyPlanToday({ evidence, courseSlug, courseName }: Props) {
  const [localState, setLocalState] = useState<StudyPlanLocalState>(() => emptyStudyPlanLocalState());
  const [loaded, setLoaded] = useState(false);
  const [generationNow, setGenerationNow] = useState<Date | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [movingItemKey, setMovingItemKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      setLocalState(readStudyPlanLocalState(window.localStorage));
      setGenerationNow(new Date());
      setLoaded(true);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT, read);
    };
  }, []);

  const result = useMemo(() => {
    if (!localState.setup || !generationNow) return null;
    return generateStudyPlan({
      now: generationNow,
      calendarDate: localCalendarDate(generationNow),
      evidence,
      preferences: { courseSlug, ...localState.setup },
      preservation: preservationInput(localState),
    });
  }, [courseSlug, evidence, generationNow, localState]);
  const todayKey = generationNow ? localDayKey(generationNow) : "";
  const todayItems = result?.items.filter((item) => item.date === todayKey && item.state !== "skipped").slice(0, 4) ?? [];

  function save(next: StudyPlanLocalState) {
    if (!writeStudyPlanLocalState(window.localStorage, next)) {
      setMessage("Your Study Plan change could not be saved on this browser.");
      return false;
    }
    setLocalState(next);
    window.dispatchEvent(new Event(STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT));
    return true;
  }

  function saveSetup(setup: StudyPlanSetup) {
    const next = { ...emptyStudyPlanLocalState(), setup };
    if (save(next)) {
      setGenerationNow(new Date());
      setEditingSettings(false);
      setMessage("Your plan has been updated.");
    }
  }

  function setItemState(itemKey: string, state: "completed" | "skipped") {
    const next = {
      ...localState,
      preservation: {
        ...localState.preservation,
        itemStates: { ...localState.preservation.itemStates, [itemKey]: state },
      },
    };
    if (save(next)) setMessage(state === "completed" ? "Marked done for this plan." : "Skipped for this plan.");
  }

  function moveItem(itemKey: string, date: string) {
    if (!result || !localState.setup || !datesForAvailableDays(result.weekStart, localState.setup.availableDays).includes(date)) return;
    const next = {
      ...localState,
      preservation: {
        ...localState.preservation,
        movedDates: { ...localState.preservation.movedDates, [itemKey]: date },
      },
    };
    if (save(next)) {
      setMovingItemKey(null);
      setMessage("Moved within this week.");
    }
  }

  function swapItem(item: StudyPlanItem) {
    if (!generationNow || !localState.setup || !result) return;
    const excludedItemKeys = [...new Set([...localState.preservation.excludedItemKeys, item.itemKey])];
    const trialState = { ...localState, preservation: { ...localState.preservation, excludedItemKeys } };
    const trial = generateStudyPlan({
      now: generationNow,
      calendarDate: localCalendarDate(generationNow),
      evidence,
      preferences: { courseSlug, ...localState.setup },
      preservation: preservationInput(trialState),
    });
    const existingKeys = new Set(result.items.map((entry) => entry.itemKey));
    const alternative = trial.items.find((entry) => entry.state === "planned" && !existingKeys.has(entry.itemKey));
    if (!alternative) {
      setMessage("No other useful recommendation is available right now.");
      return;
    }
    if (save(trialState)) setMessage("Recommendation swapped.");
  }

  if (!loaded) return null;
  if (!localState.setup || editingSettings) {
    return <StudyPlanSetupForm courseName={courseName} initial={localState.setup} onCancel={localState.setup ? () => setEditingSettings(false) : undefined} onSave={saveSetup} />;
  }

  const availableDates = result ? datesForAvailableDays(result.weekStart, localState.setup.availableDays).filter((date) => date >= todayKey) : [];
  return (
    <section aria-labelledby="study-plan-today-title" data-testid="study-plan-today" className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Study Plan</p>
          <h2 id="study-plan-today-title" className="mt-1 text-xl font-extrabold">Today</h2>
          <p className="mt-1 text-sm text-muted">A short plan for {courseName}, based on your learning so far.</p>
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          <button type="button" onClick={() => { setGenerationNow(new Date()); setMessage("Plan refreshed. Your choices were kept."); }} className={quietButton}><RefreshCw aria-hidden="true" className="size-4" />Refresh</button>
          <button type="button" onClick={() => setEditingSettings(true)} className={quietButton}>Plan settings</button>
        </div>
      </div>

      {result?.status !== "ok" ? (
        <p className="mt-4 rounded-lg bg-paper p-3 text-sm text-muted">A useful plan is not available for this course yet.</p>
      ) : todayItems.length === 0 ? (
        <p className="mt-4 rounded-lg bg-paper p-3 text-sm text-muted">{result.caughtUp ? "You’re caught up for now." : "Nothing is planned for today."}</p>
      ) : (
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {todayItems.map((item) => (
            <li key={item.itemKey} data-testid="study-plan-item" className="py-3">
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 max-sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full ${item.state === "completed" ? "bg-forge-soft text-forge" : "bg-paper text-muted"}`}>{item.state === "completed" ? <Check className="size-4" /> : <CalendarDays className="size-4" />}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-extrabold ${item.state === "completed" ? "text-muted line-through" : "text-ink"}`}>{item.skillName}</span>
                  <span className="block text-xs text-muted">{presentStudyPlanReason(item.reasonCode)} · {item.suggestedMinutes} min</span>
                </span>
                <Link href={item.href} className="inline-flex min-h-10 items-center font-extrabold text-forge">{item.state === "completed" ? "Open" : "Start"}</Link>
                <details className="relative max-sm:col-span-3 max-sm:w-full">
                  <summary aria-label={`Actions for ${item.skillName}`} className="flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-sm font-bold text-muted">Actions<ChevronDown aria-hidden="true" className="size-4" /></summary>
                  <div className="mt-2 grid min-w-40 grid-cols-2 gap-1 rounded-lg border border-line bg-white p-2 sm:absolute sm:right-0 sm:z-10 sm:grid-cols-1 sm:shadow-card">
                    <button type="button" className={actionButton} disabled={item.state === "completed"} onClick={() => setItemState(item.itemKey, "completed")}>Done</button>
                    <button type="button" className={actionButton} onClick={() => setItemState(item.itemKey, "skipped")}>Skip</button>
                    <button type="button" className={actionButton} onClick={() => setMovingItemKey(movingItemKey === item.itemKey ? null : item.itemKey)}>Move</button>
                    <button type="button" className={actionButton} onClick={() => swapItem(item)}>Swap</button>
                  </div>
                </details>
              </div>
              {movingItemKey === item.itemKey ? (
                <fieldset className="mt-3 flex flex-wrap gap-2 pl-11">
                  <legend className="sr-only">Move {item.skillName} to another available day</legend>
                  {availableDates.map((date) => <button key={date} type="button" disabled={date === item.date} onClick={() => moveItem(item.itemKey, date)} className="min-h-10 rounded-lg border border-line px-3 text-xs font-bold disabled:opacity-50">{formatDate(date)}</button>)}
                </fieldset>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {message ? <p role="status" className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}

function StudyPlanSetupForm({ courseName, initial, onSave, onCancel }: { courseName: string; initial: StudyPlanSetup | null; onSave: (setup: StudyPlanSetup) => void; onCancel?: () => void }) {
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
        <fieldset>
          <legend className="text-sm font-bold">Days you can study</legend>
          <div className="mt-2 flex flex-wrap gap-2">{WEEKDAYS.map((day) => {
            const checked = availableDays.includes(day.id);
            return <label key={day.id} className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-extrabold ${checked ? "border-forge bg-forge-soft text-forge" : "border-line bg-white text-muted"}`} title={day.name}><input type="checkbox" className="sr-only" checked={checked} aria-label={day.name} onChange={() => setAvailableDays(checked ? availableDays.filter((entry) => entry !== day.id) : [...availableDays, day.id])} />{day.short}</label>;
          })}</div>
        </fieldset>
        <label className="grid max-w-xs gap-1 text-sm font-bold">Exam date <span className="font-normal text-muted">(optional)</span><input aria-label="Exam date" type="date" value={examDate} onChange={(event) => setExamDate(event.currentTarget.value)} className={inputClass} /></label>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={availableDays.length === 0 || !Number.isFinite(weeklyMinutes)} className="min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-50">{initial ? "Save plan" : "Create my plan"}</button>{onCancel ? <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-line px-5 text-sm font-extrabold">Cancel</button> : null}</div>
      </form>
    </section>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

const inputClass = "min-h-11 rounded-lg border border-line bg-white px-3 text-base font-normal text-ink";
const quietButton = "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-bold text-forge";
const actionButton = "min-h-10 rounded-md px-3 text-left text-sm font-bold hover:bg-paper disabled:opacity-50";

export { STUDY_PLAN_LOCAL_STATE_STORAGE_KEY };
