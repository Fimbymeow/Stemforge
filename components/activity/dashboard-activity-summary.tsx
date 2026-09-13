import Link from "next/link";
import { deriveActivityHistory } from "@/lib/activity/derivation";
import { activityIntensityClass, deriveDashboardActivityRecap } from "@/lib/activity/presentation";
import type { ProgressEvidence } from "@/lib/progress/types";

export function DashboardActivitySummary({ evidence, now = new Date() }: { evidence: ProgressEvidence; now?: Date }) {
  const history = deriveActivityHistory(evidence, now, { rangeDays: 14 });
  const recap = deriveDashboardActivityRecap(history);
  return (
    <section aria-labelledby="dashboard-activity-title" data-testid="dashboard-activity-summary" className="border border-rule bg-white p-5 text-secondary md:p-6">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-5" data-testid="dashboard-activity-content">
        <div className="min-w-0">
          <h2 id="dashboard-activity-title" className="text-sm font-semibold uppercase tracking-wide">Activity</h2>
        </div>
        <p className="col-span-2 border-t border-rule pt-4 text-sm leading-relaxed" data-testid="dashboard-activity-recap">{recap}</p>
        <div className="col-span-2 grid grid-cols-7 gap-2" role="img" aria-label={history.summaryText} data-testid="dashboard-activity-strip">
          {history.days.map((day) => <span key={day.dayKey} aria-hidden="true" data-intensity={day.intensityLevel} className={`h-6 min-w-0 rounded-sm border ${activityIntensityClass(day.intensityLevel)}`} />)}
        </div>
        <Link href="/activity" aria-label="View full activity history" className="col-start-2 row-start-1 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-navy">View activity <span aria-hidden="true">→</span></Link>
        <div className="col-span-2 flex justify-between font-mono text-[10px] uppercase tracking-wide"><span>{history.days.length - 1} days ago</span><span>Today</span></div>
      </div>
    </section>
  );
}
