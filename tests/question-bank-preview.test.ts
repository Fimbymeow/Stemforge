import assert from "node:assert/strict";
import test from "node:test";
import { buildQuestionBankExcerpt } from "../lib/question-bank-preview";
import type { AnswerType } from "../data/types";

function question(overrides: Partial<{ questionText: string; title: string; answerType: AnswerType }>) {
  return {
    questionText: "",
    title: "Fallback title",
    answerType: "numerical" as AnswerType,
    ...overrides,
  };
}

test("plain text with no maths or markdown passes through, collapsed and trimmed", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "  Differentiate   the function   below.  " }));
  assert.equal(result, "Differentiate the function below.");
});

test("inline maths delimiters are stripped and their contents kept", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "Find $x$ such that $x + 1 = 2$." }));
  assert.equal(result, "Find x such that x + 1 = 2 .");
});

test("\\(...\\) inline maths delimiters are stripped", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "Evaluate \\(2 + 2\\) exactly." }));
  assert.equal(result, "Evaluate 2 + 2 exactly.");
});

test("display maths ($$...$$ and \\[...\\]) delimiters are stripped", () => {
  const dollar = buildQuestionBankExcerpt(question({ questionText: "Simplify $$\\frac{1}{2}+\\frac{1}{2}$$ fully." }));
  assert.equal(dollar, "Simplify 1/2+1/2 fully.");
  const bracket = buildQuestionBankExcerpt(question({ questionText: "Simplify \\[x^2\\] fully." }));
  assert.equal(bracket, "Simplify x^2 fully.");
});

test("multiline maths content is collapsed onto one line", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "Differentiate\n\n$$\ny = x^2\n$$\n\nwith respect to x." }));
  assert.equal(result, "Differentiate y = x^2 with respect to x.");
});

test("fractions, roots and powers become readable approximations", () => {
  const fraction = buildQuestionBankExcerpt(question({ questionText: "Simplify $\\frac{3}{4}$." }));
  assert.equal(fraction, "Simplify 3/4 .");
  const root = buildQuestionBankExcerpt(question({ questionText: "Evaluate $\\sqrt{16}$." }));
  assert.equal(root, "Evaluate sqrt(16) .");
  const power = buildQuestionBankExcerpt(question({ questionText: "Differentiate $x^{3}$." }));
  assert.equal(power, "Differentiate x^3 .");
});

test("raw LaTeX command sequences are never exposed even when unhandled", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "Solve $\\nabla \\otimes \\somecommand{a}{b}$ here." }));
  assert(!result.includes("\\"));
  assert(!/\\[a-zA-Z]+\{/.test(result));
});

test("markdown emphasis and code decoration are removed, not shown literally", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "This is **bold**, *italic*, `code` and __underline__ text." }));
  assert.equal(result, "This is bold, italic, code and underline text.");
});

test("unmatched delimiters do not crash and do not leak stray markers", () => {
  const dollar = buildQuestionBankExcerpt(question({ questionText: "An unmatched $ delimiter in the middle of text." }));
  assert(!dollar.includes("$"));
  const bracket = buildQuestionBankExcerpt(question({ questionText: "An unmatched \\( delimiter with no close." }));
  assert(!bracket.includes("\\("));
});

test("truncation prefers a word boundary and appends an ellipsis", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "This sentence is deliberately long enough that it must be truncated somewhere in the middle." }), 40);
  assert(result.length <= 41);
  assert(result.endsWith("…"));
  assert(!result.slice(0, -1).endsWith(" "));
});

test("a single word longer than the limit is still truncated rather than left empty", () => {
  const longWord = "a".repeat(100);
  const result = buildQuestionBankExcerpt(question({ questionText: longWord }), 20);
  assert.equal(result.length, 21);
  assert(result.endsWith("…"));
  assert(result.length > 0);
});

test("empty question text falls back to a non-visual type's title", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "   ", title: "Basic differentiation question", answerType: "written" }));
  assert.equal(result, "Basic differentiation question");
});

test("visual-only types fall back to a type-aware preview message when text is empty", () => {
  const graph = buildQuestionBankExcerpt(question({ questionText: "", title: "Graph question", answerType: "graph_structured" }));
  assert.equal(graph, "Graph question — open to preview.");
  const table = buildQuestionBankExcerpt(question({ questionText: "  ", title: "Table question", answerType: "nature_table" }));
  assert.equal(table, "Table question — open to preview.");
});

test("a visual type with genuine descriptive text still gets a real excerpt, not the fallback", () => {
  const result = buildQuestionBankExcerpt(question({ questionText: "Sketch the graph of $y = x^2$.", answerType: "graph_structured" }));
  assert.equal(result, "Sketch the graph of y = x^2 .");
});

test("output is deterministic across repeated calls with identical input", () => {
  const input = question({ questionText: "Differentiate $$y = 4x^3 - 5x^2 + 7$$ with respect to $x$." });
  const first = buildQuestionBankExcerpt(input);
  const second = buildQuestionBankExcerpt(input);
  assert.equal(first, second);
});
