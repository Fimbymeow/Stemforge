import type { ProgressStatus } from "@/lib/local-progress";

export type CompletedTierStatus = "completed" | "secure" | "mastered";

export function isCompletedTierStatus(status: ProgressStatus): status is CompletedTierStatus {
  return status === "completed" || status === "secure" || status === "mastered";
}

// Same label text as formatStatus() in local-skill-path-progress.tsx / local-learning-path-section.tsx
// so the wording never forks between surfaces (hero, hub card, completion panel, dashboard).
const TIER_LABEL: Record<CompletedTierStatus, string> = {
  completed: "Completed",
  secure: "Secure",
  mastered: "Mastered",
};

// One accent (forge blue) at three weights — outline, soft fill, solid fill — rather than
// a separate colour per tier. Completion alone isn't evaluative, so it gets no fill at all.
const TIER_CLASSES: Record<CompletedTierStatus, string> = {
  completed: "border border-line bg-paper text-ink",
  secure: "bg-forge-soft text-forge",
  mastered: "bg-forge text-white",
};

export function MasteryBadge({ status, className = "" }: { status: CompletedTierStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ${TIER_CLASSES[status]} ${className}`}>
      {TIER_LABEL[status]}
    </span>
  );
}

/** The one reserved-but-unused semantic token (`warning`) in the design system, used for exactly its intended meaning. */
export function ReviewBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`inline-flex items-center rounded-full bg-warning-soft px-3 py-1 text-xs font-extrabold text-warning ${className}`}>
      Review recommended
    </span>
  );
}
