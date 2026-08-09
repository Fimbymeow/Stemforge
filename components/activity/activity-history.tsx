"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { deriveActivityHistory, type ActivityDay, type ActivityIntensityLevel, type ActivityWeek } from "@/lib/activity/derivation";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";

export function ActivityHistorySurface() {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null);
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
      <Card className="max-w-2xl p-6 sm:p-8" data-testid="activity-empty-state">
        <h2 className="m-0 text-2xl font-extrabold">Your activity will appear here</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">Once you start answering questions, your learning activity will build up here over time.</p>
        {nextAction.href ? (
          <Link href={nextAction.href} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
            {nextAction.label}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl p-4 sm:p-6 md:p-8" data-testid="activity-history">
      <header>
        <h2 className="m-0 text-2xl font-extrabold">Last 12 weeks</h2>
        <p className="sr-only" id="activity-summary">{history.summaryText}</p>
      </header>
      <div className="mt-5 min-h-[94px] rounded-xl border border-line bg-paper/60 p-4" aria-live="polite" data-testid="activity-detail-panel">
        {selectedDay ? (
          <>
            <p className="m-0 font-extrabold">{selectedDay.detailHeading}</p>
            <p className="mb-0 mt-2 text-sm text-muted">{selectedDay.detailCounts}</p>
            {selectedDay.additionalFact ? <p className="mb-0 mt-1 text-sm font-semibold text-forge">{selectedDay.additionalFact}</p> : null}
          </>
        ) : (
          <>
            <p className="m-0 font-extrabold">Hover, focus or select a day</p>
            <p className="mb-0 mt-2 text-sm text-muted">Day details will appear here without opening another view.</p>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-2.5" role="group" aria-label="Activity by week" aria-describedby="activity-summary">
        {history.weeks.map((week) => <ActivityWeekRow key={week.startDayKey} week={week} onInspect={setSelectedDay} />)}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-muted">Activity level</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3" aria-label="Activity level legend">
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span key={level} className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
              <span aria-hidden="true" className={`size-4 rounded border ${activityCellClass(level)}`} />
              {intensityName(level)}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ActivityWeekRow({ week, onInspect }: { week: ActivityWeek; onInspect: (day: ActivityDay) => void }) {
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
          aria-label={day.accessibleText}
          title={day.accessibleText}
          onFocus={() => { setFocusIndex(index); onInspect(day); }}
          onMouseEnter={() => onInspect(day)}
          onClick={() => { setFocusIndex(index); onInspect(day); }}
          onKeyDown={(event) => handleKey(event, index)}
          className={`aspect-square w-full rounded-md border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forge focus-visible:ring-offset-2 focus-visible:ring-offset-white ${activityCellClass(day.intensityLevel)}`}
        />
      ))}
    </div>
  );
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
