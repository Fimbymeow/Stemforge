"use client";
import { RouteError } from "@/components/recovery/route-error";
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} code="SF-DASHBOARD-RECOVERY" title="Your dashboard could not be prepared." message="Your saved learning remains untouched. Try again or continue from the subject hub." backHref="/subjects/higher-maths" backLabel="Open Higher Maths" />;
}
