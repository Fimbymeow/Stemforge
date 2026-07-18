"use client";

import { ReportDialog } from "@/components/beta-reports/report-dialog";

export function GlobalReportDock() {
  return (
    <div className="fixed bottom-4 right-4 z-40 max-md:bottom-20">
      <ReportDialog triggerLabel="Send feedback" pageArea="global" />
    </div>
  );
}
