"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Settings2 } from "lucide-react";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { StudyPlanItemRow, formatStudyPlanDate } from "@/components/study-plan/study-plan-item-row";
import { AssessmentReadinessSection } from "@/components/study-plan/assessment-readiness-section";
import { StudyPlanSettingsDialog } from "@/components/study-plan/study-plan-settings-dialog";
import { useStudyPlan } from "@/components/study-plan/use-study-plan";
import type { StudyPlanWeeklyItem } from "@/lib/study-plan/types";

export function StudyPlanWeek() {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [movingItemKey, setMovingItemKey] = useState<string | null>(null);
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
  const studyPlan = useStudyPlan({ evidence, courseSlug: "higher-maths" });
  const groups = useMemo(() => groupItems(studyPlan.plan?.items ?? []), [studyPlan.plan?.items]);

  const dialog = (
    <StudyPlanSettingsDialog
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      courseSlug="higher-maths"
      courseName="Higher Maths"
      initial={studyPlan.state.setup}
      onSave={studyPlan.saveSetup}
    />
  );

  if (!studyPlan.loaded) return <p className="text-sm text-muted">Preparing your week…</p>;
  if (!studyPlan.state.setup) {
    return (
      <>
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-xl font-extrabold">Set up your Study Plan</h2>
          <p className="mt-2 text-sm text-muted">Set a realistic rhythm for Higher Maths and Orthic will suggest a short plan for each day.</p>
          <button type="button" onClick={() => setSettingsOpen(true)} className="mt-4 min-h-11 rounded-lg bg-forge px-4 text-sm font-extrabold text-white">Set up my plan</button>
        </section>
        {dialog}
      </>
    );
  }

  const plan = studyPlan.plan;
  const remaining = plan?.items.filter((item) => item.state === "planned").length ?? 0;
  return (
    <>
    <section aria-labelledby="study-plan-week-title" data-testid="study-plan-week" className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Study Plan</p>
          <h1 id="study-plan-week-title" className="mt-1 text-[32px] font-extrabold leading-none">This week</h1>
          {plan ? <p className="mt-3 text-sm text-muted">~{plan.allocatedMinutes} min planned · {plan.preferences.availableDays.length} study {plan.preferences.availableDays.length === 1 ? "day" : "days"} · {remaining} {remaining === 1 ? "item" : "items"} remaining</p> : null}
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-lg px-3 font-extrabold text-forge">← Today</Link>
          <button type="button" onClick={() => setSettingsOpen(true)} className={quietButton}><Settings2 aria-hidden="true" className="size-4" />Plan settings</button>
          <button type="button" onClick={studyPlan.refresh} className={quietButton}><RefreshCw aria-hidden="true" className="size-4" />Refresh</button>
        </div>
      </div>

      {studyPlan.message ? <p role="status" className="mt-4 rounded-lg bg-forge-soft p-3 text-sm text-ink">{studyPlan.message}</p> : null}
      <AssessmentReadinessSection
        assessments={studyPlan.state.setup.assessments}
        courseSlug="higher-maths"
        evidence={evidence}
      />
      {!plan || plan.status !== "ok" ? <p className="mt-5 rounded-lg bg-paper p-4 text-sm text-muted">A useful weekly plan is not available for this course yet.</p>
        : remaining === 0 && !plan.items.length ? <div className="mt-5 rounded-lg bg-paper p-5"><h2 className="text-lg font-extrabold">You’re caught up for this week.</h2><p className="mt-1 text-sm text-muted">Orthic will update the plan when Review becomes due or your progress changes.</p></div>
        : groups.map((group) => (
          <section key={group.key} aria-labelledby={`study-plan-day-${group.key}`} data-testid="study-plan-day-group" className="mt-6">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <h2 id={`study-plan-day-${group.key}`} className="text-lg font-extrabold">{group.key === "later" ? "Later this week" : formatStudyPlanDate(group.key)}</h2>
              <span className="text-xs font-bold text-muted">{group.items.reduce((sum, item) => sum + item.suggestedMinutes, 0)} min</span>
            </div>
            <ol className="divide-y divide-line">{group.items.map((item) => <li key={item.itemKey}><StudyPlanItemRow item={item} availableDates={studyPlan.availableDates} moving={movingItemKey === item.itemKey} onToggleMove={() => setMovingItemKey(movingItemKey === item.itemKey ? null : item.itemKey)} onDone={() => studyPlan.markItem(item.itemKey, "completed")} onSkip={() => studyPlan.markItem(item.itemKey, "skipped")} onMove={(date) => { studyPlan.moveItem(item.itemKey, date); setMovingItemKey(null); }} onSwap={() => studyPlan.swapItem(item)} /></li>)}</ol>
          </section>
        ))}
      {plan && remaining === 0 && plan.items.length > 0 ? <p className="mt-6 rounded-lg bg-paper p-4 text-sm text-muted">You’re caught up for this week. Nothing else is currently worth adding.</p> : null}
    </section>
    {dialog}
    </>
  );
}

function groupItems(items: readonly StudyPlanWeeklyItem[]) {
  const grouped = new Map<string, StudyPlanWeeklyItem[]>();
  for (const item of items) {
    const key = item.scheduledDate ?? "later";
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => left === "later" ? 1 : right === "later" ? -1 : left.localeCompare(right))
    .map(([key, values]) => ({ key, items: values }));
}

const quietButton = "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-bold text-muted hover:bg-paper";
