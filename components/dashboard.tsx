import { Flame } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { DashboardLocalProgressSection } from "@/components/dashboard-local-progress";

type DashboardMode = "demo";

export function DashboardPage({ mode }: { mode: DashboardMode }) {
  const isDemo = mode === "demo";

  return (
    <AppShell demo={isDemo} active="Dashboard" className="py-8 max-xl:pt-5">
      <div className="mx-auto grid max-w-[1120px] gap-5">
        <DashboardHeader />
        <DashboardLocalProgressSection />
      </div>
    </AppShell>
  );
}

function DashboardHeader() {
  return (
    <header className="flex items-start justify-between gap-4 max-md:grid">
      <div className="grid grid-cols-[48px_1fr] items-center gap-3 max-md:grid-cols-1">
        <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge">
          <Flame className="size-6" />
        </span>
        <div>
          <h1 className="m-0 text-[32px] font-extrabold leading-none">STEM Forge</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Higher Maths is the active proof-of-concept. Continue Basic differentiation, check local progress, or jump into resources.</p>
        </div>
      </div>
      <AppTopbar demo={false} />
    </header>
  );
}
