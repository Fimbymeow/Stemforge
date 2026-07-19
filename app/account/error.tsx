"use client";
import { RouteError } from "@/components/recovery/route-error";
export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} code="SF-ACCOUNT-RECOVERY" title="Account controls are temporarily unavailable." message="Learning can continue locally. Retry before making account-data changes." backHref="/dashboard" backLabel="Continue learning" />;
}
