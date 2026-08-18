import assert from "node:assert/strict";
import test from "node:test";

import { shouldPromptConfidenceDisagreement } from "@/lib/confidence/disagreement";
import {
  clearLearnerConfidence,
  emptyConfidenceLocalState,
  normalizeConfidenceLocalState,
  parseStoredConfidenceLocalState,
  readConfidenceLocalState,
  recordConfidenceOverride,
  setLearnerConfidence,
  writeConfidenceLocalState,
} from "@/lib/confidence/local-state";
import { confidenceEvidenceFingerprint, deriveConfidenceSuggestion, type ConfidenceEvidenceInput } from "@/lib/confidence/suggestion";
import type { ConfidenceOverrideRecord } from "@/lib/confidence/types";

// ---- Learner confidence: persistence CRUD ----

test("a skill with no rating is Not rated by default", () => {
  const state = emptyConfidenceLocalState();
  assert.equal(state.ratings["chain-rule"], undefined);
});

test("setting each confidence level records the level and a stable timestamp", () => {
  let state = emptyConfidenceLocalState();
  for (const level of ["needs_work", "developing", "confident"] as const) {
    state = setLearnerConfidence(state, "chain-rule", level, "2026-08-10T09:00:00.000Z");
    assert.equal(state.ratings["chain-rule"].level, level);
    assert.equal(state.ratings["chain-rule"].setAt, "2026-08-10T09:00:00.000Z");
  }
});

test("changing a rating overwrites the previous level rather than accumulating history", () => {
  let state = emptyConfidenceLocalState();
  state = setLearnerConfidence(state, "chain-rule", "needs_work", "2026-08-10T09:00:00.000Z");
  state = setLearnerConfidence(state, "chain-rule", "confident", "2026-08-11T09:00:00.000Z");
  assert.equal(state.ratings["chain-rule"].level, "confident");
  assert.equal(Object.keys(state.ratings).length, 1);
});

test("clearing a rating removes it and any override acknowledgement for that skill", () => {
  let state = emptyConfidenceLocalState();
  state = setLearnerConfidence(state, "chain-rule", "confident", "2026-08-10T09:00:00.000Z");
  state = recordConfidenceOverride(state, {
    skillPathId: "chain-rule",
    learnerLevel: "confident",
    suggestedLevel: "needs_work",
    evidenceFingerprint: "fp-1",
    decidedAt: "2026-08-10T09:00:00.000Z",
  });
  state = clearLearnerConfidence(state, "chain-rule");
  assert.equal(state.ratings["chain-rule"], undefined);
  assert.equal(state.overrides["chain-rule"], undefined);
});

test("a rating and override round-trip through write/read exactly (rehydrate persistence)", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  let state = emptyConfidenceLocalState();
  state = setLearnerConfidence(state, "chain-rule", "developing", "2026-08-10T09:00:00.000Z");
  state = recordConfidenceOverride(state, {
    skillPathId: "chain-rule",
    learnerLevel: "developing",
    suggestedLevel: "needs_work",
    evidenceFingerprint: "fp-1",
    decidedAt: "2026-08-10T09:00:00.000Z",
  });
  assert.equal(writeConfidenceLocalState(storage, state), true);
  const rehydrated = readConfidenceLocalState(storage);
  assert.deepEqual(rehydrated, state);
});

test("corrupt stored JSON is rejected safely rather than crashing", () => {
  const state = parseStoredConfidenceLocalState("{not json");
  assert.deepEqual(state, emptyConfidenceLocalState());
});

test("a future/unknown storage version is dropped safely rather than misread", () => {
  const state = parseStoredConfidenceLocalState(JSON.stringify({ version: 99, ratings: { "chain-rule": { skillPathId: "chain-rule", level: "confident", setAt: "2026-08-10T09:00:00.000Z" } } }));
  assert.deepEqual(state, emptyConfidenceLocalState());
});

test("a malformed rating entry (bad level, missing timestamp) is dropped, valid siblings survive", () => {
  const state = normalizeConfidenceLocalState({
    ratings: {
      "chain-rule": { level: "confident", setAt: "2026-08-10T09:00:00.000Z" },
      "bad-level": { level: "extremely_confident", setAt: "2026-08-10T09:00:00.000Z" },
      "bad-timestamp": { level: "confident", setAt: "not-a-date" },
      "not-an-object": "confident",
    },
  });
  assert.deepEqual(Object.keys(state.ratings), ["chain-rule"]);
});

test("a malformed override entry is dropped safely", () => {
  const state = normalizeConfidenceLocalState({
    overrides: {
      "chain-rule": { learnerLevel: "confident", suggestedLevel: "needs_work", evidenceFingerprint: "fp-1", decidedAt: "2026-08-10T09:00:00.000Z" },
      "bad-fingerprint": { learnerLevel: "confident", suggestedLevel: "needs_work", evidenceFingerprint: "", decidedAt: "2026-08-10T09:00:00.000Z" },
    },
  });
  assert.deepEqual(Object.keys(state.overrides), ["chain-rule"]);
});

// ---- Orthic suggestion policy ----

const NOW = new Date("2026-08-10T09:00:00.000Z");

function evidenceInput(overrides: Partial<ConfidenceEvidenceInput> = {}): ConfidenceEvidenceInput {
  return {
    attemptedCount: 5,
    masteryStatus: "secure",
    reviewDue: false,
    reviewDueSoon: false,
    reviewOverdueAt: null,
    openMistakeCount: 0,
    ...overrides,
  };
}

test("a never-attempted skill (e.g. Tangents) gets no suggestion, never a default of needs_work", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ attemptedCount: 0, masteryStatus: "not_started" }), NOW);
  assert.equal(suggestion, null);
});

test("strong positive evidence (secure mastery, no flags, review not due) suggests Confident", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "secure" }), NOW);
  assert.deepEqual(suggestion, { level: "confident", reason: "secure_or_mastered" });
});

test("mastered with no flags also suggests Confident", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "mastered" }), NOW);
  assert.equal(suggestion?.level, "confident");
});

test("partial evidence (in_progress, no flags) suggests Developing", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "in_progress" }), NOW);
  assert.deepEqual(suggestion, { level: "developing", reason: "in_progress_no_flags" });
});

test("completed with no flags (below the secure threshold) suggests Developing, not Confident", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "completed" }), NOW);
  assert.deepEqual(suggestion, { level: "developing", reason: "completed_no_flags" });
});

test("secure mastery but Review due soon is tempered to Developing rather than Confident", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "secure", reviewDueSoon: true }), NOW);
  assert.deepEqual(suggestion, { level: "developing", reason: "secure_or_mastered_review_due" });
});

test("clear weakness (an open mistake) suggests Needs work even with otherwise-secure mastery", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "secure", openMistakeCount: 1 }), NOW);
  assert.deepEqual(suggestion, { level: "needs_work", reason: "open_mistake" });
});

test("Review significantly overdue (past the shared overdue grace period) suggests Needs work", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({
    masteryStatus: "secure",
    reviewDue: true,
    reviewOverdueAt: "2026-08-08T09:00:00.000Z", // 2 days before NOW, well past the 24h grace
  }), NOW);
  assert.deepEqual(suggestion, { level: "needs_work", reason: "review_overdue" });
});

test("Review due but still within the overdue grace period does not escalate to Needs work", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({
    masteryStatus: "in_progress",
    reviewDue: false,
    reviewOverdueAt: "2026-08-10T08:59:00.000Z", // 1 minute before NOW, inside the 24h grace
  }), NOW);
  assert.notEqual(suggestion?.level, "needs_work");
});

test("a stalled skill (still in_progress while its own Review is already due) suggests Needs work", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({ masteryStatus: "in_progress", reviewDue: true }), NOW);
  assert.deepEqual(suggestion, { level: "needs_work", reason: "stalled_with_review_due" });
});

test("an open mistake takes priority over an overdue Review when both are present", () => {
  const suggestion = deriveConfidenceSuggestion(evidenceInput({
    masteryStatus: "secure",
    openMistakeCount: 2,
    reviewDue: true,
    reviewOverdueAt: "2026-08-01T09:00:00.000Z",
  }), NOW);
  assert.equal(suggestion?.reason, "open_mistake");
});

test("the evidence fingerprint is stable for identical inputs and changes when mastery/review/mistakes change", () => {
  const base = evidenceInput({ masteryStatus: "secure" });
  const same = confidenceEvidenceFingerprint(base, NOW);
  assert.equal(confidenceEvidenceFingerprint(evidenceInput({ masteryStatus: "secure" }), NOW), same);
  assert.notEqual(confidenceEvidenceFingerprint(evidenceInput({ masteryStatus: "mastered" }), NOW), same);
  assert.notEqual(confidenceEvidenceFingerprint(evidenceInput({ masteryStatus: "secure", openMistakeCount: 1 }), NOW), same);
  assert.notEqual(confidenceEvidenceFingerprint(evidenceInput({ masteryStatus: "secure", reviewDue: true }), NOW), same);
});

// ---- Disagreement trigger policy ----

const CONFIDENT_SUGGESTS_NEEDS_WORK = { level: "needs_work" as const, reason: "open_mistake" as const };
const FINGERPRINT = "in_progress|none|0|attempted";

test("no suggestion (insufficient evidence) never prompts, regardless of the level chosen", () => {
  assert.equal(shouldPromptConfidenceDisagreement({ chosenLevel: "confident", suggestion: null, override: null, evidenceFingerprint: null }), false);
});

test("choosing the level that matches Orthic's suggestion never prompts", () => {
  const suggestion = { level: "developing" as const, reason: "in_progress_no_flags" as const };
  assert.equal(shouldPromptConfidenceDisagreement({ chosenLevel: "developing", suggestion, override: null, evidenceFingerprint: FINGERPRINT }), false);
});

test("rating yourself lower than the suggestion never prompts (only the upgrade direction interrupts)", () => {
  const suggestion = { level: "confident" as const, reason: "secure_or_mastered" as const };
  assert.equal(shouldPromptConfidenceDisagreement({ chosenLevel: "needs_work", suggestion, override: null, evidenceFingerprint: FINGERPRINT }), false);
});

test("rating yourself higher than a Needs-work suggestion prompts the disagreement confirmation", () => {
  assert.equal(shouldPromptConfidenceDisagreement({
    chosenLevel: "confident",
    suggestion: CONFIDENT_SUGGESTS_NEEDS_WORK,
    override: null,
    evidenceFingerprint: FINGERPRINT,
  }), true);
});

test("choosing 'Keep own rating' persists an override that suppresses the exact same disagreement on reload", () => {
  const override: ConfidenceOverrideRecord = {
    skillPathId: "chain-rule",
    learnerLevel: "confident",
    suggestedLevel: "needs_work",
    evidenceFingerprint: FINGERPRINT,
    decidedAt: "2026-08-10T09:00:00.000Z",
  };
  assert.equal(shouldPromptConfidenceDisagreement({
    chosenLevel: "confident",
    suggestion: CONFIDENT_SUGGESTS_NEEDS_WORK,
    override,
    evidenceFingerprint: FINGERPRINT,
  }), false);
});

test("materially changed evidence (a new fingerprint) makes the disagreement eligible to prompt again", () => {
  const staleOverride: ConfidenceOverrideRecord = {
    skillPathId: "chain-rule",
    learnerLevel: "confident",
    suggestedLevel: "needs_work",
    evidenceFingerprint: "an-older-fingerprint",
    decidedAt: "2026-08-01T09:00:00.000Z",
  };
  assert.equal(shouldPromptConfidenceDisagreement({
    chosenLevel: "confident",
    suggestion: CONFIDENT_SUGGESTS_NEEDS_WORK,
    override: staleOverride,
    evidenceFingerprint: FINGERPRINT,
  }), true);
});

test("an override for a different chosen level does not suppress a fresh, differently-directed disagreement", () => {
  const override: ConfidenceOverrideRecord = {
    skillPathId: "chain-rule",
    learnerLevel: "developing",
    suggestedLevel: "needs_work",
    evidenceFingerprint: FINGERPRINT,
    decidedAt: "2026-08-10T09:00:00.000Z",
  };
  assert.equal(shouldPromptConfidenceDisagreement({
    chosenLevel: "confident",
    suggestion: CONFIDENT_SUGGESTS_NEEDS_WORK,
    override,
    evidenceFingerprint: FINGERPRINT,
  }), true);
});
