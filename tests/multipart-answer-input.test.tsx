import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionAnswerInput } from "../components/questions/answer-inputs";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import type { MultipartMarkingContract } from "../lib/marking/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const fixtures = { correct: [], incorrect: [], malformed: [], unmarkable: [] };
const marking: MultipartMarkingContract = {
  strategy: "multipart",
  strategyVersion: 1,
  fields: [
    { id: "gradient", label: "Gradient", inputType: "numeric", marking: { strategy: "numeric", strategyVersion: 1, target: "2", comparison: { type: "exact" }, fixtures } },
    { id: "point", label: "Point of contact", inputType: "coordinate", marking: { strategy: "coordinate_pair", strategyVersion: 1, target: "(1,5)", fixtures } },
  ],
};

const question = {
  ...higherMathsDifferentiationQuestions[0],
  answerType: "multi_step" as const,
  marking,
  answerFields: marking.fields,
};

test("multipart workspace input renders distinct accessible fields and restores each draft value", () => {
  const html = renderToStaticMarkup(React.createElement(QuestionAnswerInput, {
    question,
    value: JSON.stringify({ gradient: "2", point: "(1, 5)" }),
    submitted: false,
    onChange: () => undefined,
    describedBy: "answer-guidance",
  }));
  assert.match(html, /<fieldset/);
  assert.match(html, /data-testid="answer-field-gradient"[^>]*value="2"/);
  assert.match(html, /aria-label="Gradient"/);
  assert.match(html, /data-testid="answer-field-point"[^>]*value="\(1, 5\)"/);
  assert.match(html, /aria-label="Point of contact"/);
  assert.doesNotMatch(html, /autofocus/);
});

test("submitted multipart input locks every field together", () => {
  const html = renderToStaticMarkup(React.createElement(QuestionAnswerInput, {
    question,
    value: JSON.stringify({ gradient: "2", point: "(1,5)" }),
    submitted: true,
    onChange: () => undefined,
  }));
  assert.equal((html.match(/ disabled=""/g) ?? []).length, 2);
});
