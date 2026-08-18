"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { presentStudyPlanAssessmentQualifier, presentStudyPlanReason } from "@/lib/study-plan/presenter";
import type { StudyPlanWeeklyItem } from "@/lib/study-plan/types";

export function StudyPlanItemRow({ item, availableDates, moving, onToggleMove, onDone, onSkip, onMove, onSwap }: {
  item: StudyPlanWeeklyItem;
  availableDates: readonly string[];
  moving: boolean;
  onToggleMove: () => void;
  onDone: () => void;
  onSkip: () => void;
  onMove: (date: string | null) => void;
  onSwap: () => void;
}) {
  const assessmentText = presentStudyPlanAssessmentQualifier(item.assessmentQualifier);
  return (
    <div data-testid="study-plan-item" data-item-key={item.itemKey} className="py-3">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 max-sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full ${item.state === "completed" ? "bg-forge-soft text-forge" : "bg-paper text-muted"}`}>{item.state === "completed" ? <Check className="size-4" /> : <CalendarDays className="size-4" />}</span>
        <span className="min-w-0">
          <span className={`block text-sm font-extrabold ${item.state === "completed" ? "text-muted line-through" : "text-ink"}`}>{item.skillName}</span>
          <span className="block text-xs text-muted">{presentStudyPlanReason(item.reasonCode)}{assessmentText ? ` · ${assessmentText}` : ""} · {item.suggestedMinutes} min</span>
          {item.manualOverride === "moved" || item.manualOverride === "pulled_forward" ? <span className="block text-xs font-bold text-forge">Moved by you</span> : null}
        </span>
        <Link href={item.href} className="inline-flex min-h-10 items-center font-extrabold text-forge">{item.state === "completed" ? "Open" : "Start"}</Link>
        <details className="relative max-sm:col-span-3 max-sm:w-full">
          <summary aria-label={`Actions for ${item.skillName}`} className="flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-sm font-bold text-muted">Actions<ChevronDown aria-hidden="true" className="size-4" /></summary>
          <div className="mt-2 grid min-w-40 grid-cols-2 gap-1 rounded-lg border border-line bg-white p-2 sm:absolute sm:right-0 sm:z-10 sm:grid-cols-1 sm:shadow-card">
            <button type="button" className={actionButton} disabled={item.state === "completed"} onClick={onDone}>Done</button>
            <button type="button" className={actionButton} disabled={item.state === "skipped"} onClick={onSkip}>Skip</button>
            <button type="button" className={actionButton} disabled={item.state !== "planned"} onClick={onToggleMove}>Move</button>
            <button type="button" className={actionButton} disabled={item.state !== "planned"} onClick={onSwap}>Swap</button>
          </div>
        </details>
      </div>
      {moving ? (
        <fieldset className="mt-3 flex flex-wrap gap-2 pl-11">
          <legend className="mb-1 w-full text-xs font-bold text-muted">Move {item.skillName}</legend>
          {availableDates.map((date) => <button key={date} type="button" disabled={date === item.scheduledDate} onClick={() => onMove(date)} className={moveButton}>{formatShortDate(date)}</button>)}
          <button type="button" disabled={item.scheduledDate === null} onClick={() => onMove(null)} className={moveButton}>Later this week</button>
        </fieldset>
      ) : null}
    </div>
  );
}

export function formatStudyPlanDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

const actionButton = "min-h-10 rounded-md px-3 text-left text-sm font-bold hover:bg-paper disabled:opacity-50";
const moveButton = "min-h-10 rounded-lg border border-line px-3 text-xs font-bold disabled:opacity-50";
