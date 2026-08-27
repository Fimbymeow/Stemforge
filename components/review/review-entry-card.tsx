"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { deriveSubjectReviewSummary } from "@/lib/review/derivation";

export function ReviewEntryCard({ pathId, headingLevel = 2, compact = false }: { pathId?: string; headingLevel?: 2 | 3; compact?: boolean }) {
  return pathId ? <ScopedReviewEntryCard pathId={pathId} headingLevel={headingLevel} compact={compact} /> : <HigherMathsReviewEntryCard headingLevel={headingLevel} compact={compact} />;
}

function ScopedReviewEntryCard({ pathId, headingLevel, compact }: { pathId: string; headingLevel: 2 | 3; compact: boolean }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;
  return <ReviewCard
    dueCount={model.reviewCount}
    detail={model.reviewHref ? `${model.skillName} is ready to review.` : null}
    href={model.reviewHref}
    headingLevel={headingLevel}
    compact={compact}
  />;
}

function HigherMathsReviewEntryCard({ headingLevel, compact }: { headingLevel: 2 | 3; compact: boolean }) {
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
  return <ReviewCard dueCount={summary.dueSkillCount} detail={detail} href={summary.href} headingLevel={headingLevel} compact={compact} />;
}

function ReviewCard({ dueCount, detail, href, headingLevel, compact }: { dueCount: number; detail: string | null; href: string | null; headingLevel: 2 | 3; compact: boolean }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  if (compact) {
    const label = href
      ? (dueCount === 1 ? "Review, 1 skill due" : `Review, ${dueCount} skills due`)
      : "Review, up to date";
    return (
      <Link href={href ?? "/practice?review=1"} aria-label={label} data-testid="review-entry-card" data-review-state={href ? "due" : "up-to-date"} className={`flex min-h-16 items-center gap-3 px-2 py-2 text-ink transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-forge ${href ? "bg-warning-soft hover:bg-warning-soft/80" : "hover:bg-forge-soft"}`}>
        <RefreshCcw aria-hidden="true" className={`size-4 shrink-0 ${href ? "text-warning" : "text-forge"}`} />
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <Heading className="text-sm font-extrabold">Review</Heading>
            <p className={`truncate text-xs ${href ? "font-bold text-warning" : "text-muted"}`}>{href ? `${dueCount} skill${dueCount === 1 ? "" : "s"} due` : "Up to date"}</p>
          </div>
        </div>
        <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" />
      </Link>
    );
  }
  return (
    <Card data-testid="review-entry-card" aria-label="Review" className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Review</p>
          <Heading className="mt-1 text-xl font-extrabold">Keep learning secure</Heading>
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
