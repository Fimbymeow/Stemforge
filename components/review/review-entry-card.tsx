"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveSubjectReviewSummary } from "@/lib/review/derivation";

export function ReviewEntryCard({ pathId }: { pathId?: string }) {
  return pathId ? <ScopedReviewEntryCard pathId={pathId} /> : <HigherMathsReviewEntryCard />;
}

function ScopedReviewEntryCard({ pathId }: { pathId: string }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;
  return <ReviewCard
    dueCount={model.reviewCount}
    detail={model.reviewHref ? `${model.skillName} is ready to review.` : null}
    href={model.reviewHref}
  />;
}

function HigherMathsReviewEntryCard() {
  const [summary, setSummary] = useState(() =>
    deriveSubjectReviewSummary("higher-maths", getEmptyProgressEvidence()));

  useEffect(() => {
    const update = () => setSummary(deriveSubjectReviewSummary("higher-maths", getProgressEvidence()));
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const detail = summary.dueSkillCount === 1
    ? `${summary.dueSkillNames[0]} is ready to review.`
    : summary.dueSkillCount > 1
      ? `Review is due across ${summary.dueSkillCount} skills.`
      : null;
  return <ReviewCard dueCount={summary.dueSkillCount} detail={detail} href={summary.href} />;
}

function ReviewCard({ dueCount, detail, href }: { dueCount: number; detail: string | null; href: string | null }) {
  return (
    <Card data-testid="review-entry-card" aria-label="Review" className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Review</p>
          <h2 className="mt-1 text-xl font-extrabold">Keep learning secure</h2>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge">
          <RefreshCcw aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {href ? detail : "Nothing is due yet. We’ll surface a review when it will help."}
      </p>
      {href ? (
        <Link href={href} aria-label={dueCount === 1 ? "Start Review for 1 skill" : `Start Review across ${dueCount} skills`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 text-sm font-extrabold text-forge">
          Start Review <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className="animate-fade-rise mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-paper px-4 text-sm font-extrabold text-muted">
          No review due
        </span>
      )}
    </Card>
  );
}
