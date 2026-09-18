import { AppShell } from "@/components/layout/app-shell";
import { DashboardLocalProgressSection } from "@/components/dashboard-local-progress";
import { DashboardContextBar, DashboardPersonalisation } from "@/components/learner-preferences/dashboard-personalisation";
import { getStudyPlanConfiguration } from "@/lib/study-plan/config";

type DashboardMode = "demo";

export function DashboardPage({ mode }: { mode: DashboardMode }) {
  const isDemo = mode === "demo";
  const studyPlanEnabled = getStudyPlanConfiguration().enabled;

  return (
    <AppShell demo={isDemo} active="Dashboard" contextBar={<DashboardContextBar />} feedbackPlacement="inline-mobile" className="!px-10 py-8 max-md:!px-4 max-lg:pt-5 [&+[data-global-report-dock]]:!static [&+[data-global-report-dock]]:pb-6 [&+[data-global-report-dock]]:px-4">
      <div className="mx-auto grid min-w-0 max-w-[1220px] grid-cols-[minmax(0,1fr)] gap-7 max-sm:gap-6">
        <DashboardPersonalisation />
        <DashboardLocalProgressSection studyPlanEnabled={studyPlanEnabled} />
      </div>
    </AppShell>
  );
}
