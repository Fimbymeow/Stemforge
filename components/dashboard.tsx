import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { DashboardLocalProgressSection } from "@/components/dashboard-local-progress";

type DashboardMode = "demo";

export function DashboardPage({ mode }: { mode: DashboardMode }) {
  const isDemo = mode === "demo";

  return (
    <AppShell demo={isDemo} active="Dashboard" className="py-8 max-xl:pt-5">
      <div className="mx-auto grid min-w-0 max-w-[1120px] grid-cols-[minmax(0,1fr)] gap-5">
        <DashboardHeader />
        <DashboardLocalProgressSection />
      </div>
    </AppShell>
  );
}

function DashboardHeader() {
  return (
    <header className="flex items-start justify-between gap-4 max-md:grid">
      <div>
        <p className="text-sm font-bold text-muted">Home</p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight">Welcome back</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Continue learning or open your course.</p>
      </div>
      <AppTopbar demo={false} />
    </header>
  );
}
