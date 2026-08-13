export type ReviewPresentationState = "base" | "available" | "recommended" | "due";

const LABELS: Record<ReviewPresentationState, string> = {
  base: "Review",
  available: "Available",
  recommended: "Recommended",
  due: "Due",
};

export function ReviewStatus({ state, compact = false, className = "" }: { state: ReviewPresentationState; compact?: boolean; className?: string }) {
  const tone = state === "due"
    ? "border-forge bg-forge-soft text-forge"
    : state === "recommended"
      ? "border-line bg-paper text-ink"
      : "border-transparent bg-transparent text-muted";
  return (
    <span className={`inline-flex min-h-6 items-center rounded-full border px-2 text-xs font-bold ${tone} ${className}`} data-review-state={state}>
      {compact && state === "base" ? "Review" : LABELS[state]}
    </span>
  );
}

export function getReviewPresentationState(input: { eligible: boolean; due: boolean; dueSoon: boolean }): ReviewPresentationState {
  if (input.due) return "due";
  if (input.dueSoon) return "recommended";
  return input.eligible ? "available" : "base";
}
