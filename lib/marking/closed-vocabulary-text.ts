import type { ClosedVocabularyTextAnswerMarkingContract, MarkingResult } from "@/lib/marking/types";

export const CLOSED_VOCABULARY_INPUT_MAX_LENGTH = 200;
export const CLOSED_VOCABULARY_ENTRY_MAX_LENGTH = 60;
export const CLOSED_VOCABULARY_MAX_ENTRIES = 12;

/**
 * The finite authored vocabulary, keyed by normalised text so lookup is a single exact map hit —
 * no substring matching, no edit distance, no inference. `matchedAcceptedAnswer` on a hit is the
 * original (un-normalised) authored text, for display/diagnostic purposes only.
 */
export type ClosedVocabulary = Map<string, string>;
export type VocabularyValidationResult =
  | { status: "valid"; vocabulary: ClosedVocabulary }
  | { status: "invalid"; reason: "empty_vocabulary" | "too_many_entries" | "entry_too_long" | "empty_entry" | "ambiguous_duplicate" };

export function markClosedVocabularyTextAnswer(
  contract: Pick<ClosedVocabularyTextAnswerMarkingContract, "strategy" | "strategyVersion" | "target" | "acceptedAnswers">,
  input: string,
): MarkingResult {
  const base = { strategy: contract.strategy, strategyVersion: contract.strategyVersion };
  if (!input || input.length > CLOSED_VOCABULARY_INPUT_MAX_LENGTH) {
    return { ...base, outcomeKind: "malformed", isCorrect: null, normalizedStudentAnswer: input, outcomeReason: "malformed_closed_vocabulary_text" };
  }
  if (containsControlCharacter(input)) {
    return { ...base, outcomeKind: "unmarkable", isCorrect: null, normalizedStudentAnswer: input, outcomeReason: "expression_not_permitted" };
  }
  const validation = buildVocabulary(contract);
  if (validation.status !== "valid") {
    return { ...base, outcomeKind: "internal_error", isCorrect: null, normalizedStudentAnswer: input, diagnosticReason: "invalid_closed_vocabulary_contract_" + validation.reason };
  }
  const normalized = normalizeClosedVocabularyText(input);
  const matched = validation.vocabulary.get(normalized);
  if (matched) return { ...base, outcomeKind: "graded", isCorrect: true, normalizedStudentAnswer: normalized, matchedAcceptedAnswer: matched };
  return { ...base, outcomeKind: "graded", isCorrect: false, outcomeReason: "value_wrong", normalizedStudentAnswer: normalized };
}

/**
 * One small pure normaliser, deliberately narrow. Exact transformations, in order:
 *   1. trim leading/trailing whitespace;
 *   2. collapse repeated internal whitespace to a single space;
 *   3. lowercase (case-insensitive comparison);
 *   4. strip exactly one trailing full stop, if present.
 * Nothing else. No stray punctuation is removed, no words are dropped, no Unicode folding is
 * applied (the repository has no existing Unicode-normalisation convention in lib/marking, and no
 * authored vocabulary entry needs one) — "curve", "the", "first" etc. are never stripped; a phrase
 * that uses them must be declared as its own explicit alias.
 */
export function normalizeClosedVocabularyText(value: string): string {
  const collapsed = value.trim().split(/\s+/).join(" ").toLowerCase();
  return collapsed.endsWith(".") ? collapsed.slice(0, -1) : collapsed;
}

/**
 * Validates and builds the finite vocabulary at contract-construction time (never per-submission).
 * The target is always folded into the vocabulary alongside the declared aliases — "require the
 * target itself to appear in the vocabulary or be added deterministically" is satisfied by always
 * adding it, exactly like every other contract builder in this codebase already folds its own
 * target into its alias list (see e.g. compositeAlgebraicContract's `unique([target, ...accepted])`)
 * — so a target that is absent from acceptedAnswers is deterministically reconciled, never rejected
 * for that reason alone.
 * Rejects: an empty vocabulary, more than CLOSED_VOCABULARY_MAX_ENTRIES entries, any entry over
 * CLOSED_VOCABULARY_ENTRY_MAX_LENGTH characters, an entry that normalises to nothing, or two entries
 * that normalise to the same value (an ambiguous duplicate).
 */
export function buildVocabulary(contract: { target: string; acceptedAnswers: string[] }): VocabularyValidationResult {
  const entries = [...new Set([contract.target, ...contract.acceptedAnswers])];
  if (entries.length === 0) return { status: "invalid", reason: "empty_vocabulary" };
  if (entries.length > CLOSED_VOCABULARY_MAX_ENTRIES) return { status: "invalid", reason: "too_many_entries" };
  const vocabulary: ClosedVocabulary = new Map();
  for (const entry of entries) {
    if (entry.length > CLOSED_VOCABULARY_ENTRY_MAX_LENGTH) return { status: "invalid", reason: "entry_too_long" };
    const normalized = normalizeClosedVocabularyText(entry);
    if (!normalized) return { status: "invalid", reason: "empty_entry" };
    if (vocabulary.has(normalized)) return { status: "invalid", reason: "ambiguous_duplicate" };
    vocabulary.set(normalized, entry);
  }
  return { status: "valid", vocabulary };
}

/** True if the input contains any C0/C1 control character (other than plain space). */
function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 && code !== 9) return true;
    if (code === 127) return true;
    if (code >= 128 && code <= 159) return true;
  }
  return false;
}
