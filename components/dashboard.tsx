import { AppShell } from "@/components/layout/app-shell";
import { DashboardLocalProgressSection } from "@/components/dashboard-local-progress";
import { DashboardContextBar, DashboardPersonalisation } from "@/components/learner-preferences/dashboard-personalisation";

type DashboardMode = "demo";

export function DashboardPage({ mode }: { mode: DashboardMode }) {
  const isDemo = mode === "demo";

  return (
    <AppShell demo={isDemo} active="Dashboard" contextBar={<DashboardContextBar />} feedbackPlacement="inline-mobile" className="!px-6 py-9 max-md:!px-4 max-lg:pt-6 [&+[data-global-report-dock]]:!static [&+[data-global-report-dock]]:pb-6 [&+[data-global-report-dock]]:px-4">
      <div className="mx-auto grid min-w-0 max-w-[880px] grid-cols-[minmax(0,1fr)] gap-7 max-sm:gap-6">
        <DashboardPersonalisation />
        <DashboardLocalProgressSection />
      </div>
    </AppShell>
  );
}
