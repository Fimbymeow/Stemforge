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
    <div className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,rgba(255,117,20,0.08),transparent_30%),#fffdf9] text-ink">
      <AppSidebar demo={demo} active={active} />
      <PageContainer className={className}>{children}</PageContainer>
    </div>
  );
}
