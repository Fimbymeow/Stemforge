import { DashboardPage } from "@/components/dashboard";
import { DashboardOnboardingGate } from "@/components/onboarding/dashboard-onboarding-gate";

export default function Dashboard() {
  return <DashboardOnboardingGate><DashboardPage mode="demo" /></DashboardOnboardingGate>;
}
