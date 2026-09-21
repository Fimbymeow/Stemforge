import type { Metadata } from "next";
import { ActivityHistorySurface } from "@/components/activity/activity-history";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <AppShell
      demo={false}
      active="Activity"
      contextBar={<><p className="font-mono text-xs uppercase tracking-[0.12em]">Orthic <span aria-hidden="true" className="mx-2 text-rule">/</span> Activity</p><AppTopbar demo={false} /></>}
      className="!px-10 py-8 max-md:!px-4 max-lg:pt-5"
      feedbackPlacement="inline-mobile"
    >
      <div className="mx-auto grid min-w-0 max-w-[1220px] gap-8 max-sm:gap-7">
        <header>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-navy">Activity</p>
          <h1 className="m-0 text-[32px] font-semibold leading-tight tracking-tight text-navy max-sm:text-[28px]">Activity</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-secondary">See your recent learning activity and the work recorded on each day.</p>
        </header>
        <ActivityHistorySurface />
      </div>
    </AppShell>
  );
}
