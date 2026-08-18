/**
 * Learner-controlled confidence on a canonical skill. Deliberately separate from mastery
 * (`ProgressStatus`) and Review scheduling — this is a self-report, not evidence. See
 * `lib/confidence/suggestion.ts` for Orthic's own, distinct, evidence-derived suggestion.
 */
export type ConfidenceLevel = "needs_work" | "developing" | "confident";

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ["needs_work", "developing", "confident"];

/** Ordering used only to detect the one disagreement direction Confidence V1 prompts on — the learner rating themselves higher than Orthic's suggestion. */
export const CONFIDENCE_LEVEL_RANK: Record<ConfidenceLevel, number> = { needs_work: 0, developing: 1, confident: 2 };

export function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return value === "needs_work" || value === "developing" || value === "confident";
}

export type LearnerConfidence = {
  skillPathId: string;
  level: ConfidenceLevel;
  setAt: string;
};

/**
 * Orthic's own coarse, evidence-derived read on a skill. `null` means insufficient evidence
 * (e.g. never attempted) — never coerced into "needs_work" for lack of data. See
 * `deriveConfidenceSuggestion` for the deterministic policy that produces this.
 */
export type ConfidenceSuggestionReason =
  | "open_mistake"
  | "review_overdue"
  | "stalled_with_review_due"
  | "secure_or_mastered"
  | "completed_no_flags"
  | "in_progress_no_flags"
  | "secure_or_mastered_review_due";

export type ConfidenceSuggestion = {
  level: ConfidenceLevel;
  reason: ConfidenceSuggestionReason;
} | null;

/**
 * A learner's deliberate choice to keep their own rating after seeing it conflicts with Orthic's
 * suggestion. `evidenceFingerprint` captures only the suggestion's own inputs (see
 * `confidenceEvidenceFingerprint`) so the same disagreement never re-prompts, but materially
 * changed evidence can surface it again later.
 */
export type ConfidenceOverrideRecord = {
  skillPathId: string;
  learnerLevel: ConfidenceLevel;
  suggestedLevel: ConfidenceLevel;
  evidenceFingerprint: string;
  decidedAt: string;
};
