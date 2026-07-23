import type { ReactNode } from "react";
import { BetaNotice } from "@/components/beta-notice";
import { GlobalReportDock } from "@/components/beta-reports/global-report-dock";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageContainer } from "@/components/layout/page-container";

export function AppShell({
  children,
  demo,
  active,
  className = "",
}: {
  children: ReactNode;
  demo: boolean;
  active: string;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppSidebar demo={demo} active={active} />
      <PageContainer className={className}>{children}</PageContainer>
      {/*
        Beta notice and feedback dock share one bottom-anchored stack so they can never
        visually collide regardless of the notice's wrapped height (previously both
        independently anchored to the same bottom-20 offset on mobile and overlapped).
        flex-col with the dock last keeps the dock nearest the true bottom edge; the notice
        stacks above it and pushes it down the page, never on top of it. Safe-area inset is
        added so neither sits under an iOS home-indicator / Android gesture-bar area.
      */}
      <div
        className="pointer-events-none fixed inset-x-4 z-30 mx-auto flex max-w-2xl flex-col items-end gap-3 md:inset-x-auto md:right-4 md:max-w-md"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <BetaNotice />
        <div className="pointer-events-auto">
          <GlobalReportDock />
        </div>
      </div>
    </div>
  );
}
