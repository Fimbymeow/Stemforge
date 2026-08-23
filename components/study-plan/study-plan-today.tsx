"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Settings2 } from "lucide-react";
import { StudyPlanItemRow } from "@/components/study-plan/study-plan-item-row";
import { StudyPlanSettingsDialog } from "@/components/study-plan/study-plan-settings-dialog";
import { useStudyPlan } from "@/components/study-plan/use-study-plan";
import { canPullForward } from "@/lib/study-plan/weekly-plan";
import type { ProgressEvidence } from "@/lib/progress/types";
import type { StudyPlanDashboardState } from "@/lib/study-plan/dashboard-dedup";
import { usePremiumPreview } from "@/components/premium-preview-provider";

type Props = { evidence: ProgressEvidence; courseSlug: string; courseName: string; onDashboardStateChange?: (state: StudyPlanDashboardState) => void };

export function StudyPlanToday({ evidence, courseSlug, courseName, onDashboardStateChange }: Props) {
  const premiumPreview = usePremiumPreview();
  const studyPlan = useStudyPlan({ evidence, courseSlug, assessmentAware: premiumPreview.enabled });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [movingItemKey, setMovingItemKey] = useState<string | null>(null);
  const dashboardState = useMemo<StudyPlanDashboardState>(() => {
    if (!studyPlan.loaded) return { status: "loading", caughtUp: false, todayItems: [], planItems: [] };
    if (!studyPlan.state.setup) return { status: "setup", caughtUp: false, todayItems: [], planItems: [] };
    return { status: "configured", caughtUp: studyPlan.plan?.caughtUp ?? false, todayItems: studyPlan.todayItems, planItems: studyPlan.plan?.items ?? [] };
  }, [studyPlan.loaded, studyPlan.plan?.caughtUp, studyPlan.plan?.items, studyPlan.state.setup, studyPlan.todayItems]);

  useEffect(() => onDashboardStateChange?.(dashboardState), [dashboardState, onDashboardStateChange]);

  if (!studyPlan.loaded) return null;

  const dialog = (
    <StudyPlanSettingsDialog
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      courseSlug={courseSlug}
      courseName={courseName}
      initial={studyPlan.state.setup}
      assessmentFeaturesEnabled={premiumPreview.enabled}
      onSave={studyPlan.saveSetup}
    />
  );

  if (!studyPlan.state.setup) {
    return (
      <>
        <section aria-labelledby="study-plan-setup-title" data-testid="study-plan-setup" className="rounded-2xl border border-forge/25 bg-white p-4 shadow-card md:p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Study Plan</p>
          <h2 id="study-plan-setup-title" className="mt-1 text-xl font-extrabold">Plan your study week</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">Set a realistic rhythm for {courseName} and Orthic will suggest a short plan for each day.</p>
          <button type="button" onClick={() => setSettingsOpen(true)} className="mt-4 min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">Set up my plan</button>
        </section>
        {dialog}
      </>
    );
  }

  const plan = studyPlan.plan;
  const oneMore = plan ? canPullForward(plan, studyPlan.today) : false;
  return (
    <>
      <section aria-labelledby="study-plan-today-title" data-testid="study-plan-today" className="rounded-2xl border border-forge/25 bg-white p-4 shadow-card md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Study Plan</p>
            <h2 id="study-plan-today-title" className="mt-1 text-xl font-extrabold">Today</h2>
            <p className="mt-1 text-sm text-muted">What Orthic recommends next for {courseName}, based on your learning so far.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <Link href="/study-plan" className="inline-flex min-h-10 items-center rounded-lg px-3 font-extrabold text-forge">View this week <span aria-hidden="true">→</span></Link>
            <button type="button" onClick={studyPlan.refresh} className={quietButton}><RefreshCw aria-hidden="true" className="size-4" />Refresh</button>
            <button type="button" onClick={() => setSettingsOpen(true)} className={quietButton}><Settings2 aria-hidden="true" className="size-4" />Plan settings</button>
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
      {dialog}
    </>
  );
}

const quietButton = "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-bold text-muted hover:bg-paper";
