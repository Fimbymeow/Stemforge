"use client";

import Link from "next/link";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { safeLearningReturnDestination } from "@/lib/auth/redirects";

export function AccountLearningReturn({ requestedDestination }: { requestedDestination?: string | null }) {
  const nextAction = useLearnerNextAction();
  const requested = safeLearningReturnDestination(requestedDestination);
  const resumePractice = nextAction.kind === "resume_practice" && nextAction.href;
  const href = resumePractice ? nextAction.href : requested ?? nextAction.href;
  if (!href) return null;
  const label = resumePractice || !requested ? nextAction.label : "Continue where you left off";
  const reason = resumePractice || !requested
    ? nextAction.reason
    : "Your learning progress is unchanged. You can return to the page you came from.";

  return (
    <section className="mt-6 flex flex-col gap-3 rounded-lg bg-forge-soft p-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="account-learning-return-title">
      <div><h2 id="account-learning-return-title" className="m-0 text-sm font-extrabold">Ready to keep learning?</h2>
      <p id="account-learning-return-reason" className="mb-0 mt-1 text-sm leading-relaxed text-muted">{reason}</p></div>
      <Link href={href} aria-describedby="account-learning-return-reason" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
        {label}
      </Link>
    </section>
  );
}
