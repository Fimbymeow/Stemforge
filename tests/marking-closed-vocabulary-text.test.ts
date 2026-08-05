import assert from "node:assert/strict";
import test from "node:test";
import {
  CLOSED_VOCABULARY_ENTRY_MAX_LENGTH,
  CLOSED_VOCABULARY_INPUT_MAX_LENGTH,
  CLOSED_VOCABULARY_MAX_ENTRIES,
  buildVocabulary,
  markClosedVocabularyTextAnswer,
  normalizeClosedVocabularyText,
} from "../lib/marking/closed-vocabulary-text";
import type { ClosedVocabularyTextAnswerMarkingContract } from "../lib/marking/types";

// The real hm-calc-diff-chain-ppq-017 greater_gradient field, used as the authority throughout.
function ppq017Contract(): ClosedVocabularyTextAnswerMarkingContract {
  return {
    strategy: "closed_vocabulary_text_answer",
    strategyVersion: 1,
    target: "C1",
    acceptedAnswers: ["C1", "curve C1", "first curve", "y=(x+2)^4"],
    fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] },
  };
}

test("normaliser: trims, collapses internal whitespace, lowercases, and strips exactly one trailing full stop", () => {
  assert.equal(normalizeClosedVocabularyText("  Curve   C1  "), "curve c1");
  assert.equal(normalizeClosedVocabularyText("CURVE C1"), "curve c1");
  assert.equal(normalizeClosedVocabularyText("Curve C1."), "curve c1");
  assert.equal(normalizeClosedVocabularyText("Curve C1.."), "curve c1.");
  assert.equal(normalizeClosedVocabularyText("curve\tC1"), "curve c1");
  assert.equal(normalizeClosedVocabularyText("curve\n\nC1"), "curve c1");
});

test("correct matching uses the real ppq-017 vocabulary, case- and whitespace-insensitively", () => {
  const contract = ppq017Contract();
  for (const input of ["C1", "c1", " C1 ", "curve C1", "Curve   C1", "CURVE C1", "first curve", "First Curve", "First curve.", "y=(x+2)^4"]) {
    const result = markClosedVocabularyTextAnswer(contract, input);
    assert.equal(result.outcomeKind, "graded", input);
    assert.equal(result.isCorrect, true, input);
  }
});

test("incorrect matching: wrong curve, both curves, partial phrases, explanations, unauthored variants and empty input", () => {
  const contract = ppq017Contract();
  const incorrect = [
    "C2",
    "curve C2",
    "both curves",
    "C1 because its gradient is bigger",
    "probably C1",
    "the first curve", // "the" was never declared — must not be inferred
    "curve one",
    "c-1",
    "definitely not in the vocabulary",
  ];
  for (const input of incorrect) {
    const result = markClosedVocabularyTextAnswer(contract, input);
    assert.equal(result.outcomeKind, "graded", input);
    assert.equal(result.isCorrect, false, input);
    assert.equal(result.outcomeReason, "value_wrong", input);
  }
  assert.equal(markClosedVocabularyTextAnswer(contract, "").outcomeKind, "malformed");
});

test("never accepts an answer merely because it contains C1, and never substring- or edit-distance-matches", () => {
  const contract = ppq017Contract();
  for (const input of ["C1 is the answer", "xC1x", "C11", "curveC1", "Curve C1 obviously", "C1?"]) {
    const result = markClosedVocabularyTextAnswer(contract, input);
    assert.equal(result.outcomeKind, "graded", input);
    assert.equal(result.isCorrect, false, input);
  }
});

test("malformed: empty input and over-length input", () => {
  const contract = ppq017Contract();
  assert.equal(markClosedVocabularyTextAnswer(contract, "").outcomeKind, "malformed");
  assert.equal(markClosedVocabularyTextAnswer(contract, "").outcomeReason, "malformed_closed_vocabulary_text");
  const overLength = markClosedVocabularyTextAnswer(contract, "x".repeat(CLOSED_VOCABULARY_INPUT_MAX_LENGTH + 1));
  assert.equal(overLength.outcomeKind, "malformed");
});

test("unmarkable: control characters are never treated as merely incorrect", () => {
  const contract = ppq017Contract();
  for (const input of [String.fromCharCode(1) + "C1", "C1" + String.fromCharCode(7), String.fromCharCode(27) + "[31mC1"]) {
    const result = markClosedVocabularyTextAnswer(contract, input);
    assert.equal(result.outcomeKind, "unmarkable", JSON.stringify(input));
    assert.equal(result.isCorrect, null, JSON.stringify(input));
    assert.equal(result.outcomeReason, "expression_not_permitted", JSON.stringify(input));
  }
});

test("contract validation: empty vocabulary is rejected", () => {
  assert.deepEqual(buildVocabulary({ target: "", acceptedAnswers: [] }), { status: "invalid", reason: "empty_entry" });
});

test("contract validation: duplicate aliases after normalisation are rejected as ambiguous", () => {
  assert.deepEqual(buildVocabulary({ target: "C1", acceptedAnswers: ["C1", "c1"] }), { status: "invalid", reason: "ambiguous_duplicate" });
  assert.deepEqual(buildVocabulary({ target: "C1", acceptedAnswers: ["curve C1", "Curve  C1."] }), { status: "invalid", reason: "ambiguous_duplicate" });
});

test("contract validation: a target absent from the declared aliases is deterministically reconciled into the vocabulary, not rejected", () => {
  const result = buildVocabulary({ target: "C1", acceptedAnswers: ["curve C1"] });
  assert.equal(result.status, "valid");
  if (result.status === "valid") {
    assert.ok(result.vocabulary.has("c1"));
    assert.ok(result.vocabulary.has("curve c1"));
  }
});

test("contract validation: excessive answer length and excessive entry count are rejected", () => {
  assert.deepEqual(buildVocabulary({ target: "x".repeat(CLOSED_VOCABULARY_ENTRY_MAX_LENGTH + 1), acceptedAnswers: [] }), { status: "invalid", reason: "entry_too_long" });
  const tooMany = Array.from({ length: CLOSED_VOCABULARY_MAX_ENTRIES + 1 }, (_, index) => `option ${index}`);
  assert.deepEqual(buildVocabulary({ target: tooMany[0], acceptedAnswers: tooMany }), { status: "invalid", reason: "too_many_entries" });
});

test("an invalid contract passed directly to the marker fails as internal_error, never grades", () => {
  const invalid: ClosedVocabularyTextAnswerMarkingContract = {
    strategy: "closed_vocabulary_text_answer",
    strategyVersion: 1,
    target: "",
    acceptedAnswers: [],
    fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] },
  };
  const result = markClosedVocabularyTextAnswer(invalid, "C1");
  assert.equal(result.outcomeKind, "internal_error");
  assert.equal(result.isCorrect, null);
});

test("universal marking-result metadata matches the repository convention", () => {
  const result = markClosedVocabularyTextAnswer(ppq017Contract(), "C1");
  assert.equal(result.strategy, "closed_vocabulary_text_answer");
  assert.equal(result.strategyVersion, 1);
  assert.equal(result.outcomeKind, "graded");
  assert.equal(result.matchedAcceptedAnswer, "C1");
});
