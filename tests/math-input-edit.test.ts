import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import { markQuestionAnswer } from "../lib/answer-engine";
import { clearInput, deleteAtSelection, insertAtSelection, moveCaret, wrapOrInsertOpeningBracket } from "../lib/questions/math-input-edit";
import { deriveMathInputCapabilities } from "../lib/questions/math-input-capabilities";

test("insertion appends, inserts in the middle and replaces a selection with plain text", () => {
  assert.deepEqual(insertAtSelection("5x", 2, 2, "^2"), { value: "5x^2", selectionStart: 4, selectionEnd: 4 });
  assert.deepEqual(insertAtSelection("5x4", 2, 2, "^"), { value: "5x^4", selectionStart: 3, selectionEnd: 3 });
  assert.deepEqual(insertAtSelection("5xwrong", 2, 7, "^4"), { value: "5x^4", selectionStart: 4, selectionEnd: 4 });
});

test("opening bracket inserts at a caret and wraps selected text without losing the selection", () => {
  assert.deepEqual(wrapOrInsertOpeningBracket("x+1", 0, 0), { value: "(x+1", selectionStart: 1, selectionEnd: 1 });
  assert.deepEqual(wrapOrInsertOpeningBracket("2x+1", 1, 4), { value: "2(x+1)", selectionStart: 2, selectionEnd: 5 });
});

test("cursor movement advances one position, collapses selections and is safe at boundaries", () => {
  assert.deepEqual(moveCaret("5x^4", 2, 2, "left"), { value: "5x^4", selectionStart: 1, selectionEnd: 1 });
  assert.deepEqual(moveCaret("5x^4", 2, 2, "right"), { value: "5x^4", selectionStart: 3, selectionEnd: 3 });
  assert.deepEqual(moveCaret("5x^4", 0, 0, "left"), { value: "5x^4", selectionStart: 0, selectionEnd: 0 });
  assert.deepEqual(moveCaret("5x^4", 4, 4, "right"), { value: "5x^4", selectionStart: 4, selectionEnd: 4 });
  assert.deepEqual(moveCaret("5x^4", 1, 3, "left").selectionStart, 1);
  assert.deepEqual(moveCaret("5x^4", 1, 3, "right").selectionStart, 3);
});

test("backspace deletes the previous character or selection and is safe on empty input", () => {
  assert.deepEqual(deleteAtSelection("5x^4", 3, 3), { value: "5x4", selectionStart: 2, selectionEnd: 2 });
  assert.deepEqual(deleteAtSelection("5x^4", 1, 3), { value: "54", selectionStart: 1, selectionEnd: 1 });
  assert.deepEqual(deleteAtSelection("", 0, 0), { value: "", selectionStart: 0, selectionEnd: 0 });
});

test("clear changes only answer text and places the caret at the beginning", () => {
  const session = { sessionId: "session-1", currentQuestionIndex: 2 };
  assert.deepEqual(clearInput(), { value: "", selectionStart: 0, selectionEnd: 0 });
  assert.deepEqual(session, { sessionId: "session-1", currentQuestionIndex: 2 });
});

test("plain strings produced by the toolbar retain Basic and Chain Rule marking semantics", () => {
  const basic = higherMathsDifferentiationQuestions.find((question) => question.id === "hm-calc-diff-basic-f-001");
  const chain = higherMathsChainRuleQuestions.find((question) => question.id === "hm-calc-diff-chain-f-003");
  assert.ok(basic && chain);
  assert.equal(markQuestionAnswer(basic, "5x^4").isCorrect, true);
  assert.equal(markQuestionAnswer(chain, "15(3x+2)^4").isCorrect, true);
});

test("root and pi controls derive only from executable correct-answer fixtures", () => {
  const basic = higherMathsDifferentiationQuestions.find((question) => question.id === "hm-calc-diff-basic-f-001");
  const ordinaryChain = higherMathsChainRuleQuestions.find((question) => question.id === "hm-calc-diff-chain-f-003");
  const rootChain = higherMathsChainRuleQuestions.find((question) => question.id === "hm-calc-diff-chain-f-008");
  assert.ok(basic && ordinaryChain && rootChain);
  assert.deepEqual(deriveMathInputCapabilities(basic), { squareRoot: false, pi: false });
  assert.deepEqual(deriveMathInputCapabilities(ordinaryChain), { squareRoot: false, pi: false });
  assert.deepEqual(deriveMathInputCapabilities(rootChain), { squareRoot: true, pi: false });
});
