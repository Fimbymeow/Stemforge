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
  workingContextPathId,
}: {
  children: ReactNode;
  demo: boolean;
  active: string;
  className?: string;
  workingContextPathId?: string | null;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppSidebar
        demo={demo}
        active={active}
        workingContextPathId={workingContextPathId}
      />
      <PageContainer className={className}>
        <div className="mx-auto mb-3 flex max-w-[1240px] justify-end sm:mb-4">
          <BetaNotice />
        </div>
        {children}
      </PageContainer>
      <div
        data-global-report-dock
        className="pointer-events-none fixed inset-x-4 z-30 mx-auto flex max-w-2xl justify-end md:inset-x-auto md:right-4 md:max-w-md"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="pointer-events-auto">
          <GlobalReportDock />
        </div>
      </div>
    </div>
  );
}
