import { AppShell } from "@/components/layout/app-shell";
import { DashboardLocalProgressSection } from "@/components/dashboard-local-progress";
import { DashboardPersonalisation } from "@/components/learner-preferences/dashboard-personalisation";

type DashboardMode = "demo";

export function DashboardPage({ mode }: { mode: DashboardMode }) {
  const isDemo = mode === "demo";

  return (
    <AppShell demo={isDemo} active="Dashboard" className="py-8 max-xl:pt-5">
      <div className="mx-auto grid min-w-0 max-w-[1120px] grid-cols-[minmax(0,1fr)] gap-5">
        <DashboardPersonalisation />
        <DashboardLocalProgressSection />
      </div>
    </AppShell>
  );
}
