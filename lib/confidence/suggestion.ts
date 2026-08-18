import { OVERDUE_GRACE_MS } from "@/lib/study-plan/constants";
import type { ProgressStatus } from "@/lib/progress/types";
import type { ConfidenceSuggestion } from "@/lib/confidence/types";

/**
 * The exact inputs the suggestion policy reasons over. All fields are already-computed,
 * already-validated Orthic evidence (mastery status thresholds from `calculateSkillPathProgress`,
 * the same overdue-Review grace period Study Plan uses) — no new magic numbers.
 */
export type ConfidenceEvidenceInput = {
  attemptedCount: number;
  masteryStatus: ProgressStatus;
  reviewDue: boolean;
  reviewDueSoon: boolean;
  /** Whether `review.dueAt` is far enough in the past to count as significantly overdue (Study Plan's own Tier-0 threshold). */
  reviewOverdueAt: string | null;
  openMistakeCount: number;
};

/**
 * Deterministic V1 suggestion policy (Part E). No ML, no opaque score — a skill lands in exactly
 * one of three states, or gets no suggestion at all when there isn't enough real evidence yet.
 *
 * - No suggestion: the learner has never attempted this skill. "Not attempted" is not evidence of
 *   weakness, so we never coerce it into "needs_work".
 * - Needs work: strong evidence of struggle — an open (unresolved) mistake, Review significantly
 *   overdue, or the skill is still in_progress while its Review is already due (started but
 *   stalled, not just "not finished yet").
 * - Confident: solid mastery evidence (secure/mastered — Orthic's own >=75/>=90 thresholds), no
 *   open mistake, and Review not significantly overdue.
 * - Developing: everything else with real evidence — genuine partial progress, or mild
 *   Review/mistake signals that don't rise to "needs work".
 */
export function deriveConfidenceSuggestion(input: ConfidenceEvidenceInput, now: Date): ConfidenceSuggestion {
  if (input.attemptedCount === 0) return null;

  const reviewOverdue = Boolean(
    input.reviewOverdueAt &&
    Number.isFinite(Date.parse(input.reviewOverdueAt)) &&
    now.getTime() - Date.parse(input.reviewOverdueAt) >= OVERDUE_GRACE_MS,
  );

  if (input.openMistakeCount > 0) return { level: "needs_work", reason: "open_mistake" };
  if (reviewOverdue) return { level: "needs_work", reason: "review_overdue" };
  if (input.masteryStatus === "in_progress" && input.reviewDue) return { level: "needs_work", reason: "stalled_with_review_due" };

  const secureOrMastered = input.masteryStatus === "secure" || input.masteryStatus === "mastered";
  if (secureOrMastered) {
    if (input.reviewDue || input.reviewDueSoon) return { level: "developing", reason: "secure_or_mastered_review_due" };
    return { level: "confident", reason: "secure_or_mastered" };
  }

  if (input.masteryStatus === "completed") return { level: "developing", reason: "completed_no_flags" };
  return { level: "developing", reason: "in_progress_no_flags" };
}

/**
 * A small deterministic fingerprint of the suggestion's own inputs — not a diff engine. Used only
 * to decide whether a previously-acknowledged disagreement should re-surface: if this string is
 * unchanged, the same disagreement is suppressed; if it changed, the evidence behind the
 * suggestion moved meaningfully and a fresh prompt is allowed.
 */
export function confidenceEvidenceFingerprint(input: ConfidenceEvidenceInput, now: Date): string {
  const reviewOverdue = Boolean(
    input.reviewOverdueAt &&
    Number.isFinite(Date.parse(input.reviewOverdueAt)) &&
    now.getTime() - Date.parse(input.reviewOverdueAt) >= OVERDUE_GRACE_MS,
  );
  const reviewPhase = reviewOverdue ? "overdue" : input.reviewDue ? "due" : input.reviewDueSoon ? "due_soon" : "none";
  return [input.masteryStatus, reviewPhase, input.openMistakeCount, input.attemptedCount > 0 ? "attempted" : "unattempted"].join("|");
}
