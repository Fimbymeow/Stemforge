import { Suspense } from "react";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return <Suspense fallback={<main id="main-content" className="min-h-screen bg-paper" aria-label="Loading Orthic" />}><OnboardingFlow /></Suspense>;
}
