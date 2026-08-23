import Link from "next/link";
import { deriveActivityHistory } from "@/lib/activity/derivation";
import type { ProgressEvidence } from "@/lib/progress/types";

export function DashboardActivitySummary({ evidence, now = new Date() }: { evidence: ProgressEvidence; now?: Date }) {
  const history = deriveActivityHistory(evidence, now, { rangeDays: 14 });
  const label = history.activeDayCount === 0
    ? "No activity in the last 14 days"
    : `${history.activeDayCount} active day${history.activeDayCount === 1 ? "" : "s"} in the last 14 days`;
  return (
    <section aria-labelledby="dashboard-activity-title" data-testid="dashboard-activity-summary" className="border-t border-line/80 pt-3 text-muted">
      <p className="sr-only">{label}</p>
      <div className="inline-grid max-w-full grid-cols-[auto_auto_auto] items-center gap-x-5 gap-y-2 max-sm:grid-cols-[1fr_auto]" data-testid="dashboard-activity-content">
        <div className="min-w-0">
          <h2 id="dashboard-activity-title" className="text-sm font-extrabold text-ink">Activity</h2>
          <p className="mt-0.5 text-xs font-semibold text-muted" aria-hidden="true">{label}</p>
        </div>
        <div className="flex items-center gap-1 max-sm:col-span-2 max-sm:row-start-2" aria-hidden="true" data-testid="dashboard-activity-strip">
          {history.days.map((day) => <span key={day.dayKey} data-intensity={day.intensityLevel} className={`size-3.5 rounded-sm ${activityColour(day.intensityLevel)}`} />)}
        </div>
        <Link href="/activity" aria-label="View full activity history" className="inline-flex min-h-10 items-center whitespace-nowrap text-sm font-bold text-forge max-sm:col-start-2 max-sm:row-start-1">View activity <span aria-hidden="true">→</span></Link>
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
