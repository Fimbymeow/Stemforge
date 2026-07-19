"use client";
import { RouteError } from "@/components/recovery/route-error";
export default function InternalReportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} code="SF-INTERNAL-REPORTS-RECOVERY" title="Internal report operations are unavailable." message="No report was changed. Retry after checking the sanitized internal health view." backHref="/internal/beta-reports" backLabel="Return to report queue" />;
}
