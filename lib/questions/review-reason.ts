import type { QuestionProgressState } from "@/lib/progress/types";

/**
 * Grounded, deterministic reasons a question is recommended for review — derived from the
 * same signals as the review-recommendation rule itself (see STEM_FORGE_MASTERY_ARCHITECTURE.md
 * section 14: solution use, hint-assisted correctness, latest incorrect after a stronger
 * historical result, or uncertain legacy completion). Never infers a learner's ability or
 * mental state — only describes what the recorded evidence shows.
 */
export type ReviewReason =
  | "not_completed"
  | "solution_used"
  | "hint_used"
  | "uncertain_legacy_completion"
  | "latest_incorrect"
  | "general";

const REVIEW_REASON_TEXT: Record<ReviewReason, string> = {
  not_completed: "This question has not yet been completed.",
  solution_used: "You used a worked solution, so another attempt would strengthen your understanding.",
  hint_used: "You completed this with a hint. Try it again independently when you are ready.",
  uncertain_legacy_completion: "We can't confirm how this was originally completed, so a fresh attempt would confirm your understanding.",
  latest_incorrect: "You answered this incorrectly most recently.",
  general: "This question is ready for another attempt to build confidence.",
};

type ReviewReasonInput = Pick<QuestionProgressState, "completed" | "latestResult" | "bestOutcome">;

export function deriveReviewReason(progress: ReviewReasonInput): ReviewReason {
  if (!progress.completed) return "not_completed";
  if (progress.bestOutcome === "completed_with_solution") return "solution_used";
  if (progress.bestOutcome === "correct_with_hint") return "hint_used";
  if (progress.bestOutcome === "legacy_completed" || progress.bestOutcome === "legacy_correct_unknown_support") return "uncertain_legacy_completion";
  if (progress.latestResult === false) return "latest_incorrect";
  return "general";
}

export function describeReviewReason(progress: ReviewReasonInput): string {
  return REVIEW_REASON_TEXT[deriveReviewReason(progress)];
}
