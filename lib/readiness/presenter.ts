import type { AssessmentReadinessReason, AssessmentReadinessState } from "@/lib/readiness/derivation";
import { assessmentTemporalState } from "@/lib/study-plan/assessments";
import type { Assessment } from "@/lib/study-plan/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const READINESS_STATE_LABEL: Record<AssessmentReadinessState, string> = {
  secure: "Secure",
  developing: "Developing",
  needs_attention: "Needs attention",
  limited_evidence: "Limited evidence",
};

export const READINESS_REASON_LABEL: Record<AssessmentReadinessReason, string> = {
  content_recheck: "Content recheck needed",
  open_mistake: "Recent unresolved mistake",
  review_overdue: "Review overdue",
  review_due: "Review due",
  review_due_soon: "Review coming up",
  review_status_unavailable: "Review freshness could not be confirmed",
  learning_in_progress: "Learning still in progress",
  secure_evidence: "Secure evidence with no current action due",
  limited_evidence: "Not enough Orthic evidence yet",
  content_unavailable: "Not available in Orthic yet",
};

export function presentAssessmentTiming(assessment: Assessment, now: Date) {
  const temporal = assessmentTemporalState(assessment, now);
  if (assessment.date.precision === "month") {
    if (temporal === "expired") return "Date needs confirmation";
    const currentMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
    const targetMonth = assessment.date.year * 12 + assessment.date.month - 1;
    if (targetMonth === currentMonth) return "Expected this month";
    if (targetMonth === currentMonth + 1) return "Expected next month";
    return `Expected ${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(assessment.date.year, assessment.date.month - 1, 1)))}`;
  }
  if (temporal === "expired") return "Assessment ended";
  const target = new Date(`${assessment.date.date}T00:00:00.000Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((target.getTime() - today) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(target);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(target.getUTCFullYear() !== now.getUTCFullYear() ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(target);
}

export function presentReadinessCounts(counts: Record<AssessmentReadinessState, number>) {
  const parts = [
    counts.needs_attention ? `${counts.needs_attention} need attention` : null,
    counts.developing ? `${counts.developing} developing` : null,
    counts.secure ? `${counts.secure} secure` : null,
    counts.limited_evidence ? `${counts.limited_evidence} limited evidence` : null,
  ].filter((value): value is string => Boolean(value));
  return parts.join(" · ") || "No supported skills to assess yet";
}
