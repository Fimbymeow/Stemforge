import { CONFIDENCE_LEVEL_RANK } from "@/lib/confidence/types";
import type { ConfidenceLevel, ConfidenceOverrideRecord, ConfidenceSuggestion } from "@/lib/confidence/types";

/**
 * Pure decision for whether picking `chosenLevel` should surface the disagreement confirmation
 * (Part J/L/M) — kept separate from `ConfidenceControl` so the policy is directly unit-testable
 * without a React harness. Only ever triggers in one direction: the learner rating themselves
 * *higher* than Orthic's current suggestion. Rating lower, matching the suggestion, or there being
 * no suggestion at all never prompts — and a disagreement already acknowledged for the exact same
 * suggested level under the exact same evidence fingerprint is suppressed (no re-nag) until the
 * evidence behind the suggestion changes.
 */
export function shouldPromptConfidenceDisagreement(input: {
  chosenLevel: ConfidenceLevel;
  suggestion: ConfidenceSuggestion;
  override: ConfidenceOverrideRecord | null;
  evidenceFingerprint: string | null;
}): boolean {
  if (!input.suggestion) return false;
  const disagrees = CONFIDENCE_LEVEL_RANK[input.chosenLevel] > CONFIDENCE_LEVEL_RANK[input.suggestion.level];
  if (!disagrees) return false;
  const alreadyAcknowledged = Boolean(
    input.override
    && input.override.learnerLevel === input.chosenLevel
    && input.override.suggestedLevel === input.suggestion.level
    && input.override.evidenceFingerprint === input.evidenceFingerprint,
  );
  return !alreadyAcknowledged;
}
