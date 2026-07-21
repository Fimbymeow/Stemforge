import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/differentiation";
import { markQuestionAnswer } from "../lib/answer-engine";
import {
  classifyAnswerFeedback,
  internalAnswerFailureFeedback,
} from "../lib/questions/answer-feedback";
import {
  ANSWER_DRAFT_STORAGE_KEY,
  clearAnswerDraft,
  createAnswerDraftKey,
  loadAnswerDraft,
  MAX_DRAFT_LENGTH,
  saveAnswerDraft,
  type AnswerDraftIdentity,
} from "../lib/questions/answer-drafts";
import { deriveStageQuestionPosition } from "../lib/questions/question-context";
import { deriveWorkedSolutionPresentation } from "../lib/questions/worked-solution";
import { contentResolver } from "../lib/content-resolver";
import type { StorageLike } from "../lib/progress/storage";

const algebraic = higherMathsDifferentiationQuestions[0];
const numerical = higherMathsDifferentiationQuestions[2];
const identity: AnswerDraftIdentity = {
  questionId: algebraic.id,
  questionVersion: algebraic.questionVersion,
  contentRevision: algebraic.contentRevision,
};

test("feedback preserves existing correctness semantics for accepted, equivalent-looking, and incorrect answers", () => {
  for (const answer of ["5x^4", "5*x^4", " 5x^{4} "]) {
    const marking = markQuestionAnswer(algebraic, answer);
    assert.equal(marking.isCorrect, true);
    assert.equal(classifyAnswerFeedback(algebraic, answer, marking).category, "correct");
  }
  for (const answer of ["x^4*5", "5x*x*x*x", "4x^5", "-2", "1/2"]) {
    const marking = markQuestionAnswer(algebraic, answer);
    assert.equal(marking.isCorrect, false);
    assert.equal(classifyAnswerFeedback(algebraic, answer, marking).category, "incorrect");
  }
});

test("empty and whitespace feedback cannot become an attempt", () => {
  for (const answer of ["", "   "]) {
    const result = classifyAnswerFeedback(algebraic, answer, markQuestionAnswer(algebraic, answer));
    assert.deepEqual({ category: result.category, record: result.shouldRecordAttempt }, { category: "empty", record: false });
  }
});

test("known malformed grouping and incomplete powers receive format feedback without changing non-empty attempt eligibility", () => {
  for (const answer of ["((5x^4", "5x^", "5x^4)"]) {
    const result = classifyAnswerFeedback(algebraic, answer, markQuestionAnswer(algebraic, answer));
    assert.equal(result.category, "malformed");
    assert.equal(result.shouldRecordAttempt, true);
    assert.equal(result.isInputError, true);
  }
});

test("unsupported final-answer forms are distinguished only when the authored contract makes that safe", () => {
  const equation = classifyAnswerFeedback(algebraic, "y=5x^4", markQuestionAnswer(algebraic, "y=5x^4"));
  assert.equal(equation.category, "unsupported_format");
  const sentence = classifyAnswerFeedback(numerical, "fourteen", markQuestionAnswer(numerical, "fourteen"));
  assert.equal(sentence.category, "unsupported_format");
  assert.equal(sentence.guidance, "Enter numbers and mathematical symbols rather than a sentence.");
});

test("structured parse failure remains distinct from an incorrect structured answer", () => {
  const structuredQuestion = { ...algebraic, answerType: "graph_structured" as const };
  const marking = markQuestionAnswer(structuredQuestion, "{not-json");
  assert.equal(marking.reason, "structured_parse_failure");
  assert.equal(classifyAnswerFeedback(structuredQuestion, "{not-json", marking).category, "malformed");
});

test("negative values, fractions, powers, and multiple accepted aliases retain deterministic marking", () => {
  const cases = [
    { answer: "-2", acceptedAnswers: ["-2"] },
    { answer: "1/2", acceptedAnswers: ["1/2", "0.5"] },
    { answer: "x^2", acceptedAnswers: ["x^2", "x*x"] },
  ];
  for (const item of cases) {
    const question = { ...algebraic, acceptedAnswers: item.acceptedAnswers };
    const marking = markQuestionAnswer(question, item.answer);
    assert.equal(marking.isCorrect, true);
    assert.equal(classifyAnswerFeedback(question, item.answer, marking).category, "correct");
  }
});

test("internal failures are not presented as learner mistakes", () => {
  const result = internalAnswerFailureFeedback();
  assert.equal(result.category, "internal_error");
  assert.equal(result.shouldRecordAttempt, false);
  assert.match(result.title, /not saved/i);
});

test("draft keys are canonical and version scoped", () => {
  assert.equal(createAnswerDraftKey(identity), `${encodeURIComponent(algebraic.id)}:q1:r1`);
  assert.notEqual(createAnswerDraftKey(identity), createAnswerDraftKey({ ...identity, questionVersion: 2 }));
  assert.notEqual(createAnswerDraftKey(identity), createAnswerDraftKey({ ...identity, contentRevision: 2 }));
});

test("drafts round-trip, remain local-only data, and clear explicitly", () => {
  const storage = memoryStorage();
  assert.equal(saveAnswerDraft(storage, identity, "5x^", "2026-07-21T10:00:00.000Z"), true);
  assert.equal(loadAnswerDraft(storage, identity)?.answer, "5x^");
  assert.equal(clearAnswerDraft(storage, identity), true);
  assert.equal(loadAnswerDraft(storage, identity), null);
  assert.ok(storage.getItem(ANSWER_DRAFT_STORAGE_KEY));
});

test("empty drafts remove entries and long drafts are bounded", () => {
  const storage = memoryStorage();
  saveAnswerDraft(storage, identity, "x".repeat(MAX_DRAFT_LENGTH + 50));
  assert.equal(loadAnswerDraft(storage, identity)?.answer.length, MAX_DRAFT_LENGTH);
  saveAnswerDraft(storage, identity, "   ");
  assert.equal(loadAnswerDraft(storage, identity), null);
});

test("corrupted, stale-version, and unavailable draft storage fail safely", () => {
  const storage = memoryStorage();
  storage.setItem(ANSWER_DRAFT_STORAGE_KEY, "{not-json");
  assert.equal(loadAnswerDraft(storage, identity), null);
  saveAnswerDraft(storage, identity, "5x^4");
  assert.equal(loadAnswerDraft(storage, { ...identity, questionVersion: 2 }), null);
  assert.equal(loadAnswerDraft(null, identity), null);
  assert.equal(saveAnswerDraft(null, identity, "5x^4"), false);
});

test("two-tab style writes preserve other questions and the latest matching draft wins", () => {
  const storage = memoryStorage();
  const other = { ...identity, questionId: higherMathsDifferentiationQuestions[1].id };
  saveAnswerDraft(storage, identity, "first", "2026-07-21T10:00:00.000Z");
  saveAnswerDraft(storage, other, "other question", "2026-07-21T10:01:00.000Z");
  saveAnswerDraft(storage, identity, "latest", "2026-07-21T10:02:00.000Z");
  assert.equal(loadAnswerDraft(storage, identity)?.answer, "latest");
  assert.equal(loadAnswerDraft(storage, other)?.answer, "other question");
});

test("structured solutions progress while unstructured live Maths content remains a full fallback", () => {
  assert.deepEqual(deriveWorkedSolutionPresentation(algebraic.workedSolution), { mode: "full", content: algebraic.workedSolution });
  const structured = deriveWorkedSolutionPresentation([
    { title: "Differentiate", body: "$f'(x)=5x^4$" },
    { title: "State the result", body: "Therefore the derivative is $5x^4$." },
  ]);
  assert.equal(structured.mode, "progressive");
  if (structured.mode === "progressive") assert.equal(structured.steps.length, 2);
});

test("stage-relative position uses canonical active stage membership", () => {
  const first = deriveStageQuestionPosition(contentResolver.getQuestionContext(algebraic.id));
  assert.deepEqual(first, { current: 1, total: 3, label: "Question 1 of 3 in Foundations" });
  const fourth = deriveStageQuestionPosition(contentResolver.getQuestionContext(higherMathsDifferentiationQuestions[3].id));
  assert.deepEqual(fourth, { current: 1, total: 3, label: "Question 1 of 3 in Applications" });
});

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}
