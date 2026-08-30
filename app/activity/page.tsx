import type { Metadata } from "next";
import { ActivityHistorySurface } from "@/components/activity/activity-history";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <AppShell demo={false} active="Activity" className="py-8 max-lg:pt-5">
      <div className="mx-auto grid max-w-[1120px] gap-5">
        <header className="flex items-start justify-between gap-4 max-md:grid">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-forge">Activity</p>
            <h1 className="m-0 text-[32px] font-extrabold leading-none">Activity</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">See your recent learning activity and the work recorded on each day.</p>
          </div>
          <AppTopbar demo={false} />
        </header>
        <ActivityHistorySurface />
      </div>
    </AppShell>
  );
}
