"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingEligibility } from "@/components/onboarding/use-onboarding-eligibility";

export function DashboardOnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const eligibility = useOnboardingEligibility();

  useEffect(() => {
    if (eligibility.destination === "onboarding") router.replace("/onboarding");
  }, [eligibility.destination, router]);

  if (!eligibility.loaded || eligibility.destination === "onboarding") {
    return <main id="main-content" className="min-h-screen bg-paper" aria-label="Loading Orthic" />;
  }
  return children;
}
