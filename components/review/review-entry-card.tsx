"use client";

import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";

export function ReviewEntryCard({ pathId }: { pathId: string }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;

  return (
    <Card data-testid="review-entry-card" aria-label="Review" className="self-start p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Review</p>
          <h2 className="mt-1 text-xl font-extrabold">Keep learning secure</h2>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge">
          <RefreshCcw aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {model.reviewHref
          ? `${model.reviewCount} skill is ready to review.`
          : "Nothing is due yet. We’ll surface a review when it will help."}
      </p>
      {model.reviewHref ? (
        <Link href={model.reviewHref} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 text-sm font-extrabold text-forge">
          Review now <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-paper px-4 text-sm font-extrabold text-muted">
          No review due
        </span>
      )}
    </Card>
  );
}
