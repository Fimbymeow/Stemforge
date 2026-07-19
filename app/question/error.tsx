"use client";
import { RouteError } from "@/components/recovery/route-error";
export default function QuestionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} code="SF-QUESTION-RECOVERY" title="This question workspace needs to reload." message="No technical details are exposed, and existing browser progress remains available." backHref="/subjects/higher-maths/question-bank" backLabel="Open question bank" />;
}
