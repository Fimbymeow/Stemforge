import Link from "next/link";
import { Eyebrow, Surface } from "@/components/ui";
import { deriveActivityHistory } from "@/lib/activity/derivation";
import { activityIntensityClass, deriveDashboardActivityRecap } from "@/lib/activity/presentation";
import type { ProgressEvidence } from "@/lib/progress/types";

export function DashboardActivitySummary({ evidence, now = new Date() }: { evidence: ProgressEvidence; now?: Date }) {
  const history = deriveActivityHistory(evidence, now, { rangeDays: 14 });
  const recap = deriveDashboardActivityRecap(history);
  return (
    <section aria-labelledby="dashboard-activity-title" data-testid="dashboard-activity-summary" className="border-t border-line/80 pt-3 text-muted">
      <Surface level="inline" className="inline-grid max-w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-5 gap-y-2 px-3 py-2.5 max-sm:grid-cols-[minmax(0,1fr)_auto]" data-testid="dashboard-activity-content">
        <div className="min-w-0">
          <Eyebrow as="h2" id="dashboard-activity-title" className="text-muted">Activity</Eyebrow>
          <p className="mt-1 text-sm font-semibold leading-snug text-ink" data-testid="dashboard-activity-recap">{recap}</p>
        </div>
        <div className="flex items-center gap-1 max-sm:col-span-2 max-sm:row-start-2" role="img" aria-label={history.summaryText} data-testid="dashboard-activity-strip">
          {history.days.map((day) => <span key={day.dayKey} aria-hidden="true" data-intensity={day.intensityLevel} className={`size-3.5 rounded-sm border ${activityIntensityClass(day.intensityLevel)}`} />)}
        </div>
        <Link href="/activity" aria-label="View full activity history" className="inline-flex min-h-10 items-center whitespace-nowrap text-sm font-bold text-forge max-sm:col-start-2 max-sm:row-start-1">View activity <span aria-hidden="true">→</span></Link>
      </Surface>
    </section>
  );
}
