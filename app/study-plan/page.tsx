import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StudyPlanWeek } from "@/components/study-plan/study-plan-week";
import { getStudyPlanConfiguration } from "@/lib/study-plan/config";

export const metadata: Metadata = { title: "This week" };

export default function StudyPlanPage() {
  if (!getStudyPlanConfiguration().enabled) notFound();
  return (
    <AppShell demo={false} active="Dashboard" className="py-8 max-lg:pt-5">
      <div className="mx-auto min-w-0 max-w-[860px]">
        <StudyPlanWeek />
      </div>
    </AppShell>
  );
}
