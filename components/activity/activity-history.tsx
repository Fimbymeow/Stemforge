"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { deriveActivityHistory, type ActivityDay, type ActivityIntensityLevel, type ActivityWeek } from "@/lib/activity/derivation";
import { activityIntensityClass, activityIntensityName } from "@/lib/activity/presentation";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";

export function ActivityHistorySurface() {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const nextAction = useLearnerNextAction();

  useEffect(() => {
    const update = () => setEvidence(getProgressEvidence());
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const history = useMemo(() => deriveActivityHistory(evidence, new Date()), [evidence]);
  if (!history.hasActivity) {
    return (
      <section className="max-w-3xl border-y border-line py-6" data-testid="activity-empty-state">
        <h2 className="m-0 text-xl font-extrabold">Your activity will appear here</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Once you start answering questions, your learning activity will build up here over time.</p>
        {nextAction.href ? (
          <Link href={nextAction.href} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
            {nextAction.label}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </section>
    );
  }

  const selectedDay = history.days.find((day) => day.dayKey === selectedDayKey)
    ?? [...history.days].reverse().find((day) => day.rawScore > 0)
    ?? history.days[history.days.length - 1];
  const currentDay = history.days[history.days.length - 1];

  return (
    <section data-testid="activity-history">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <Eyebrow className="text-secondary">Learning history</Eyebrow>
          <h2 className="mb-0 mt-2 text-2xl font-semibold tracking-tight text-navy">Last 12 weeks</h2>
        </div>
        <p className="m-0 pb-1 text-sm font-medium text-secondary" aria-hidden="true">{history.activeDayCount} active day{history.activeDayCount === 1 ? "" : "s"}</p>
        <p className="sr-only" id="activity-summary">{history.summaryText}</p>
      </header>

      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)] items-stretch max-md:grid-cols-1">
        <div className="min-w-0 overflow-x-auto border-b border-rule py-7 pr-8 max-md:pr-0" data-testid="activity-history-scroll">
          <div className="grid min-w-[372px] gap-2" role="group" aria-label="Activity by week" aria-describedby="activity-summary">
            <div aria-hidden="true" className="grid grid-cols-[64px_repeat(7,minmax(0,36px))] items-center gap-1 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-secondary sm:grid-cols-[92px_repeat(7,40px)] sm:gap-2">
              <span className="text-left">Week</span>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
            </div>
            {history.weeks.map((week) => <ActivityWeekRow key={week.startDayKey} week={week} selectedDayKey={selectedDay.dayKey} onInspect={(day) => setSelectedDayKey(day.dayKey)} />)}
          </div>
        </div>
        <DayDetail day={selectedDay} isCurrentDay={selectedDay.dayKey === currentDay.dayKey} onJumpToCurrentDay={() => setSelectedDayKey(currentDay.dayKey)} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-rule py-5">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-secondary">Activity level</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Activity level legend">
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span key={level} className="inline-flex items-center gap-2 text-xs font-medium text-secondary">
              <span aria-hidden="true" className={`size-4 rounded-sm border ${activityIntensityClass(level)}`} />
              {activityIntensityName(level)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DayDetail({ day, isCurrentDay, onJumpToCurrentDay }: { day: ActivityDay; isCurrentDay: boolean; onJumpToCurrentDay: () => void }) {
  const rows = [
    ["Questions worked on", day.distinctQuestionsWorkedOn],
    ["Completed independently", day.independentlyCompletedQuestionCount],
    ["Review completed", day.independentReviewSuccessCount],
    ["Milestones completed", day.milestoneCount],
    ["Flashcards reviewed", day.distinctFlashcardsReviewed],
  ] as const;
  const activeRows = rows.filter(([, count]) => count > 0);
  return (
    <section className="orthic-transition-standard min-w-0 border-b border-l border-rule py-7 pl-8 max-md:border-l-0 max-md:pl-0" aria-live="polite" aria-labelledby="activity-detail-heading" data-testid="activity-detail-panel">
      <Eyebrow className="text-secondary">Inspecting day</Eyebrow>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h3 id="activity-detail-heading" className="m-0 text-lg font-semibold text-navy">{formatDay(day.date)}</h3>
        <span className="rounded-sm bg-surface-dim px-2 py-1 text-xs font-medium text-secondary">{activeRows.length ? `${day.intensityLabel} activity` : "No records"}</span>
      </div>
      {activeRows.length ? (
          <dl className="mb-0 mt-5 divide-y divide-rule border-y border-rule">
            {activeRows.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-secondary">{label}</dt><dd className="m-0 font-semibold tabular-nums text-navy">{count}</dd>
              </div>
            ))}
          </dl>
      ) : <p className="mb-0 mt-7 text-sm leading-relaxed text-secondary">No learning activity recorded for this day.</p>}
      <div className="mt-6 flex min-h-11 items-center justify-between gap-4 border-t border-rule pt-4 text-xs text-secondary">
        <span>Selected from last 12 weeks</span>
        {!isCurrentDay ? <button type="button" onClick={onJumpToCurrentDay} className="orthic-secondary-link min-h-11 font-medium text-navy">Jump to current day</button> : <span className="font-medium text-navy">Current day</span>}
      </div>
    </section>
  );
}

function ActivityWeekRow({ week, selectedDayKey, onInspect }: { week: ActivityWeek; selectedDayKey: string; onInspect: (day: ActivityDay) => void }) {
  const [focusIndex, setFocusIndex] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const moveFocus = (nextIndex: number) => {
    const bounded = Math.max(0, Math.min(6, nextIndex));
    setFocusIndex(bounded);
    const button = rowRef.current?.querySelector<HTMLButtonElement>(`[data-day-index="${bounded}"]`);
    button?.focus();
  };
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") { event.preventDefault(); moveFocus(index + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); moveFocus(index - 1); }
    else if (event.key === "Home") { event.preventDefault(); moveFocus(0); }
    else if (event.key === "End") { event.preventDefault(); moveFocus(6); }
  };
  return (
    <div ref={rowRef} role="group" aria-label={`Week ${week.weekIndex + 1}, ${week.label}`} className="grid grid-cols-[64px_repeat(7,minmax(0,36px))] items-center gap-1 sm:grid-cols-[92px_repeat(7,40px)] sm:gap-2">
      <span className="pr-1 text-xs font-bold tabular-nums text-muted">{week.label}</span>
      {week.days.map((day, index) => (
        <button
          key={day.dayKey}
          type="button"
          data-day-index={index}
          data-day-key={day.dayKey}
          data-intensity={day.intensityLevel}
          tabIndex={index === focusIndex ? 0 : -1}
          aria-pressed={day.dayKey === selectedDayKey}
          aria-label={day.accessibleText}
          title={day.accessibleText}
          onFocus={() => { setFocusIndex(index); onInspect(day); }}
          onMouseEnter={() => onInspect(day)}
          onClick={() => { setFocusIndex(index); onInspect(day); }}
          onKeyDown={(event) => handleKey(event, index)}
          className={`orthic-transition-fast aspect-square w-full rounded-sm border outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${day.dayKey === selectedDayKey ? "border-navy shadow-[inset_0_0_0_2px_#fff,inset_0_0_0_3px_#10263a]" : ""} ${activityIntensityClass(day.intensityLevel)}`}
        />
      ))}
    </div>
  );
}
function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}
