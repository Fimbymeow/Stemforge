"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthFeatureProvider } from "@/components/auth-feature-provider";
import { PremiumPreviewProvider } from "@/components/premium-preview-provider";
import { ProgressSyncProvider } from "@/components/progress-sync-provider";
import { AccountStateSyncProvider } from "@/components/account-state-sync-provider";
import { DemoRuntimeProvider } from "@/components/demo/demo-runtime-provider";
import { isDemoRoute } from "@/lib/demo/content";

/** Select before mounting either tree: preview is never beneath production services. */
export function RuntimeBoundary({ children, accountsAvailable, premiumPreviewAvailable }: {
  children: ReactNode; accountsAvailable: boolean; premiumPreviewAvailable: boolean;
}) {
  const pathname = usePathname();
  if (!pathname) return null;
  if (isDemoRoute(pathname)) return <DemoRuntimeProvider>{children}</DemoRuntimeProvider>;
  return <AuthFeatureProvider accountsAvailable={accountsAvailable}>
    <PremiumPreviewProvider available={premiumPreviewAvailable}>
      <ProgressSyncProvider accountsAvailable={accountsAvailable}>
        <AccountStateSyncProvider accountsAvailable={accountsAvailable}>{children}</AccountStateSyncProvider>
      </ProgressSyncProvider>
    </PremiumPreviewProvider>
  </AuthFeatureProvider>;
}
