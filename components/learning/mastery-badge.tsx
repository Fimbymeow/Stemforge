import type { ProgressStatus } from "@/lib/local-progress";

export type CompletedTierStatus = "completed" | "secure" | "mastered";

export function isCompletedTierStatus(status: ProgressStatus): status is CompletedTierStatus {
  return status === "completed" || status === "secure" || status === "mastered";
}

// Same label text as formatStatus() in local-skill-path-progress.tsx / local-learning-path-section.tsx
// so the wording never forks between surfaces (hero, hub card, completion panel, dashboard).
const TIER_LABEL: Record<CompletedTierStatus, string> = {
  completed: "Learned",
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

type MasteryMarkProps = {
  status: ProgressStatus;
  density?: "compact" | "labelled";
  className?: string;
};

const STATUS_LABEL: Record<ProgressStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Learned",
  secure: "Secure",
  mastered: "Mastered",
};

const STATUS_LEVEL: Record<ProgressStatus, number> = {
  not_started: 0,
  in_progress: 0,
  completed: 1,
  secure: 2,
  mastered: 3,
};

export function MasteryMark({ status, density = "compact", className = "" }: MasteryMarkProps) {
  const level = STATUS_LEVEL[status];
  const isMastery = isCompletedTierStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-bold ${status === "not_started" ? "text-muted" : "text-ink"} ${className}`}
      aria-label={`${isMastery ? "Mastery" : "Progress"}: ${STATUS_LABEL[status]}`}
      data-mastery-status={status}
    >
      {isMastery ? <span aria-hidden="true" className="inline-flex items-center gap-1">
        {[1, 2, 3].map((segment) => <span key={segment} className={`size-2.5 rounded-full border ${segment <= level ? "border-forge bg-forge" : "border-line bg-white"}`} />)}
      </span> : null}
      {density === "labelled" ? <span>{STATUS_LABEL[status]}</span> : <span className="sr-only">{STATUS_LABEL[status]}</span>}
    </span>
  );
}

/**
 * Single source for progress-status display labels. Completed/Secure/Mastered read from the
 * same TIER_LABEL map as MasteryBadge; every other status (not_started, in_progress, ...) falls
 * back to the same split-and-capitalize rule, so the three previously independent formatters
 * (here, local-skill-path-progress.tsx, question-bank.tsx) can't drift apart.
 */
export function formatProgressStatusLabel(status: string): string {
  if (status in STATUS_LABEL) return STATUS_LABEL[status as ProgressStatus];
  if (status in TIER_LABEL) return TIER_LABEL[status as CompletedTierStatus];
  return status.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

/** The one reserved-but-unused semantic token (`warning`) in the design system, used for exactly its intended meaning. */
export function ReviewBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`inline-flex items-center rounded-full bg-warning-soft px-3 py-1 text-xs font-extrabold text-warning ${className}`}>
      Needs more practice
    </span>
  );
}
