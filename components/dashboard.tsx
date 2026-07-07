import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { DashboardLocalProgressSection } from "@/components/dashboard-local-progress";

type DashboardMode = "demo";

export function DashboardPage({ mode }: { mode: DashboardMode }) {
  const isDemo = mode === "demo";

  return (
    <AppShell demo={isDemo} active="Dashboard" className="py-16 max-xl:pt-9">
      <DashboardHeader />
      <DashboardLocalProgressSection />
    </AppShell>
  );
}

function DashboardHeader() {
  return (
    <header className="mb-8 flex items-start justify-between gap-7 max-md:grid">
      <div>
        <h1 className="m-0 text-[clamp(34px,4vw,46px)] font-extrabold leading-[1.05]">STEM Forge Dashboard</h1>
        <p className="mt-3 text-xl text-muted">STEM Forge is in early beta. Higher Maths is the first proof-of-concept subject.</p>
      </div>
      <AppTopbar demo={false} />
    </header>
  );
}
