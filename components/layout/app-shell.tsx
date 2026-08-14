"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dock = dockRef.current;
    if (!root || !dock) return;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? entry?.contentRect.height;
      if (height) root.style.setProperty("--feedback-dock-height", `${height}px`);
    });
    observer.observe(dock);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--feedback-dock-height");
    };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-paper text-ink">
      <AppSidebar
        demo={demo}
        active={active}
        workingContextPathId={workingContextPathId}
      />
      <PageContainer className={className}>{children}</PageContainer>
      <div
        ref={dockRef}
        data-global-report-dock
        className="pointer-events-none fixed inset-x-4 z-30 mx-auto flex max-w-2xl justify-end md:inset-x-auto md:right-4 md:max-w-md"
        style={{ bottom: "var(--global-bottom-inset)" }}
      >
        <div className="pointer-events-auto">
          <GlobalReportDock />
        </div>
      </div>
    </div>
  );
}
