"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { deriveActivityHistory, type ActivityDay, type ActivityIntensityLevel, type ActivityWeek } from "@/lib/activity/derivation";
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

  return (
    <section className="max-w-4xl border-y border-line py-5 sm:py-6" data-testid="activity-history">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-wide text-muted">Learning history</p>
          <h2 className="mb-0 mt-1 text-2xl font-extrabold">Last 12 weeks</h2>
        </div>
        <p className="m-0 text-sm font-semibold text-muted" aria-hidden="true">{history.activeDayCount} active day{history.activeDayCount === 1 ? "" : "s"}</p>
        <p className="sr-only" id="activity-summary">{history.summaryText}</p>
      </header>

      <div className="mt-5 grid grid-cols-[minmax(0,420px)_minmax(240px,1fr)] items-start gap-6 max-md:grid-cols-1">
        <div className="min-w-0 overflow-x-auto pb-1" data-testid="activity-history-scroll">
          <div className="grid min-w-[372px] gap-2" role="group" aria-label="Activity by week" aria-describedby="activity-summary">
            {history.weeks.map((week) => <ActivityWeekRow key={week.startDayKey} week={week} selectedDayKey={selectedDay.dayKey} onInspect={(day) => setSelectedDayKey(day.dayKey)} />)}
          </div>
        </div>
        <DayDetail day={selectedDay} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-muted">Activity level</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2" aria-label="Activity level legend">
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span key={level} className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
              <span aria-hidden="true" className={`size-4 rounded border ${activityCellClass(level)}`} />
              {intensityName(level)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DayDetail({ day }: { day: ActivityDay }) {
  const rows = [
    ["Questions worked on", day.distinctQuestionsWorkedOn],
    ["Completed independently", day.independentlyCompletedQuestionCount],
    ["Review completed", day.independentReviewSuccessCount],
    ["Milestones completed", day.milestoneCount],
    ["Flashcards reviewed", day.distinctFlashcardsReviewed],
  ] as const;
  const activeRows = rows.filter(([, count]) => count > 0);
  return (
    <section className="rounded-lg border border-ink/15 bg-paper/50 p-4" aria-live="polite" aria-labelledby="activity-detail-heading" data-testid="activity-detail-panel">
      <h3 id="activity-detail-heading" className="m-0 text-base font-extrabold">{formatDay(day.date)}</h3>
      {activeRows.length ? (
        <>
          <p className="mb-0 mt-1 text-xs font-bold uppercase tracking-wide text-muted">{day.intensityLabel} activity</p>
          <dl className="mb-0 mt-3 divide-y divide-line border-y border-line">
            {activeRows.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2 text-sm">
                <dt className="text-muted">{label}</dt><dd className="m-0 font-extrabold tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : <p className="mb-0 mt-3 text-sm text-muted">No learning activity recorded for this day.</p>}
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
          className={`aspect-square w-full rounded-md border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forge focus-visible:ring-offset-2 focus-visible:ring-offset-white ${day.dayKey === selectedDayKey ? "ring-2 ring-ink ring-offset-1 ring-offset-white" : ""} ${activityCellClass(day.intensityLevel)}`}
        />
      ))}
    </div>
  );
}
function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

function activityCellClass(level: ActivityIntensityLevel) {
  if (level === 1) return "border-forge/20 bg-forge-soft forced-colors:border-[Highlight]";
  if (level === 2) return "border-forge/30 bg-activity-moderate forced-colors:border-[Highlight]";
  if (level === 3) return "border-forge/40 bg-activity-strong forced-colors:border-[Highlight]";
  if (level === 4) return "border-forge bg-forge forced-colors:border-[Highlight]";
  return "border-line bg-paper forced-colors:border-[CanvasText]";
}
function intensityName(level: ActivityIntensityLevel) {
  return ["No activity", "Light", "Moderate", "Strong", "Very strong"][level];
}
