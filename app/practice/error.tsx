"use client";
import { RouteError } from "@/components/recovery/route-error";
export default function PracticeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} code="SF-PRACTICE-RECOVERY" title="Practice could not continue on this view." message="Your stored attempts are not deleted. Try again or return to practice setup." backHref="/practice" backLabel="Practice setup" />;
}
