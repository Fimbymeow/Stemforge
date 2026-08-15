import Link from "next/link";
import { deriveActivityHistory } from "@/lib/activity/derivation";
import type { ProgressEvidence } from "@/lib/progress/types";

export function DashboardActivitySummary({ evidence, now = new Date() }: { evidence: ProgressEvidence; now?: Date }) {
  const history = deriveActivityHistory(evidence, now, { rangeDays: 7 });
  const label = history.activeDayCount === 0
    ? "No activity yet"
    : `${history.activeDayCount} active day${history.activeDayCount === 1 ? "" : "s"} in the last 7 days`;
  return (
    <section aria-labelledby="dashboard-activity-title" data-testid="dashboard-activity-summary" className="border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="dashboard-activity-title" className="text-base font-extrabold">Activity</h2><p className="mt-1 text-xs font-semibold text-muted">{label}</p></div>
        <div className="flex items-center gap-1.5" aria-hidden="true">{history.days.map((day) => <span key={day.dayKey} data-intensity={day.intensityLevel} className={`size-4 rounded-sm ${activityColour(day.intensityLevel)}`} />)}</div>
        <Link href="/activity" className="inline-flex min-h-10 items-center text-sm font-extrabold text-forge">View activity <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

function activityColour(level: number) {
  if (level === 0) return "bg-line";
  if (level === 1) return "bg-forge/25";
  if (level === 2) return "bg-forge/45";
  if (level === 3) return "bg-forge/70";
  return "bg-forge";
}
