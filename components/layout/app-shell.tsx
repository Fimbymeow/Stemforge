import type { ReactNode } from "react";
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
    </div>
  );
}
