import assert from "node:assert/strict";
import test from "node:test";
import { deriveReviewReason, describeReviewReason } from "../lib/questions/review-reason";
import type { QuestionOutcome, QuestionProgressState } from "../lib/progress/types";

function progress(overrides: Partial<Pick<QuestionProgressState, "completed" | "latestResult" | "bestOutcome">>) {
  return {
    completed: true,
    latestResult: true as boolean | null,
    bestOutcome: "independently_correct_first_attempt" as QuestionOutcome,
    ...overrides,
  };
}

test("a never-completed question is reasoned as not yet completed, regardless of other fields", () => {
  assert.equal(deriveReviewReason(progress({ completed: false, bestOutcome: "not_attempted" })), "not_completed");
  assert.equal(describeReviewReason(progress({ completed: false, bestOutcome: "not_attempted" })), "This question has not yet been completed.");
});

test("solution use is reasoned distinctly from hint use", () => {
  assert.equal(deriveReviewReason(progress({ bestOutcome: "completed_with_solution" })), "solution_used");
  assert.equal(deriveReviewReason(progress({ bestOutcome: "correct_with_hint" })), "hint_used");
  assert.notEqual(describeReviewReason(progress({ bestOutcome: "completed_with_solution" })), describeReviewReason(progress({ bestOutcome: "correct_with_hint" })));
});

test("legacy completion with unknown support is reasoned as uncertain, not incorrect or diagnosed", () => {
  assert.equal(deriveReviewReason(progress({ bestOutcome: "legacy_completed" })), "uncertain_legacy_completion");
  assert.equal(deriveReviewReason(progress({ bestOutcome: "legacy_correct_unknown_support" })), "uncertain_legacy_completion");
  const text = describeReviewReason(progress({ bestOutcome: "legacy_completed" }));
  assert.doesNotMatch(text, /weak|falling behind|diagnos|do(es)? not understand/i);
});

test("a stronger historical result followed by a latest incorrect attempt is reasoned by the latest attempt", () => {
  assert.equal(
    deriveReviewReason(progress({ bestOutcome: "independently_correct_first_attempt", latestResult: false })),
    "latest_incorrect",
  );
  assert.equal(describeReviewReason(progress({ latestResult: false })), "You answered this incorrectly most recently.");
});

test("solution and hint outcomes take priority over the latest-result signal", () => {
  // solution_viewed/correct_with_hint outcomes are not themselves failed attempts, so their
  // specific reason should win even if latestResult happens to be recorded as false/null.
  assert.equal(deriveReviewReason(progress({ bestOutcome: "completed_with_solution", latestResult: null })), "solution_used");
  assert.equal(deriveReviewReason(progress({ bestOutcome: "correct_with_hint", latestResult: null })), "hint_used");
});

test("a completed, independently-correct question with no incorrect latest attempt falls back to a general grounded reason", () => {
  assert.equal(deriveReviewReason(progress({ bestOutcome: "independently_correct_after_error", latestResult: true })), "general");
  assert.doesNotMatch(describeReviewReason(progress({ latestResult: true })), /weak|falling behind|diagnos/i);
});

test("review-reason text never infers ability, effort, or mental state", () => {
  const allOutcomes: QuestionOutcome[] = [
    "not_attempted",
    "attempted_unresolved",
    "completed_with_solution",
    "correct_with_hint",
    "independently_correct_after_error",
    "independently_correct_first_attempt",
    "legacy_completed",
    "legacy_correct_unknown_support",
  ];
  for (const bestOutcome of allOutcomes) {
    for (const completed of [true, false]) {
      for (const latestResult of [true, false, null] as const) {
        const text = describeReviewReason({ completed, bestOutcome, latestResult });
        assert.doesNotMatch(text, /weak|falling behind|diagnos|does not understand|you are bad/i);
      }
    }
  }
});
