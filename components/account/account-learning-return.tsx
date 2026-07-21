"use client";

import Link from "next/link";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";

export function AccountLearningReturn() {
  const nextAction = useLearnerNextAction();
  if (!nextAction.href) return null;

  return (
    <section className="mt-5 rounded-xl border border-forge/25 bg-forge-soft p-4" aria-labelledby="account-learning-return-title">
      <h2 id="account-learning-return-title" className="m-0 text-lg font-extrabold">Ready to keep learning?</h2>
      <p id="account-learning-return-reason" className="mt-2 text-sm leading-relaxed text-muted">{nextAction.reason}</p>
      <Link href={nextAction.href} aria-describedby="account-learning-return-reason" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-forge px-5 text-sm font-extrabold text-white">
        {nextAction.label}
      </Link>
    </section>
  );
}
