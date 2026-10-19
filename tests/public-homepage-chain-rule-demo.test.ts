import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import { markQuestionAnswer } from "../lib/answer-engine";
import {
  PUBLIC_CHAIN_RULE_DEMO_ID,
  PUBLIC_CHAIN_RULE_SOURCE_ID,
  publicChainRuleDemoQuestion as question,
} from "../waitlist/site/chain-rule-demo-question";

test("public homepage demo reuses active canonical Chain Rule content unchanged", () => {
  assert.ok(question);
  assert.equal(PUBLIC_CHAIN_RULE_SOURCE_ID, "hm-calc-diff-chain-f-003");
  assert.equal(PUBLIC_CHAIN_RULE_DEMO_ID, PUBLIC_CHAIN_RULE_SOURCE_ID);
  assert.equal(question.id, PUBLIC_CHAIN_RULE_DEMO_ID);
  assert.equal(question, higherMathsChainRuleQuestions.find((candidate) => candidate.id === PUBLIC_CHAIN_RULE_SOURCE_ID));
  assert.equal(question.contentStatus, "active");
  assert.equal(question.skillPathId, "chain-rule");
  assert.equal(question.answerType, "algebraic");
  assert.equal(question.questionText, "Differentiate $y=(3x+2)^5$ with respect to $x$.");
  assert.equal(question.marking.strategy, "composite_algebraic_equivalence");
  assert.equal(question.marking.target, "15(3x+2)^4");
  assert.doesNotMatch(`${question.questionText} ${question.title} ${question.skill}`, /rate of change|optimis|stationary|model/i);
});

test("public homepage demo delegates correct, wrong and equivalent answers to the real marker", () => {
  const canonical = markQuestionAnswer(question, "15(3x+2)^4");
  const equivalent = markQuestionAnswer(question, "15*(3x+2)^4");
  const wrong = markQuestionAnswer(question, "5(3x+2)^4");
  assert.equal(canonical.outcomeKind, "graded");
  assert.equal(canonical.isCorrect, true);
  assert.equal(equivalent.outcomeKind, "graded");
  assert.equal(equivalent.isCorrect, true);
  assert.equal(equivalent.normalizedStudentAnswer, canonical.normalizedStudentAnswer);
  assert.equal(wrong.outcomeKind, "graded");
  assert.equal(wrong.isCorrect, false);
});

test("public homepage adapter imports canonical content and marking without persistence or account APIs", () => {
  const source = readFileSync("waitlist/site/chain-rule-demo.ts", "utf8");
  const questionSource = readFileSync("waitlist/site/chain-rule-demo-question.ts", "utf8");
  assert.match(questionSource, /higherMathsChainRuleQuestions/);
  assert.match(questionSource, /PUBLIC_CHAIN_RULE_SOURCE_ID/);
  assert.match(source, /markQuestionAnswer/);
  assert.match(source, /normalizeRichMathSource/);
  assert.match(source, /import\("mathlive"\)/);
  for (const forbidden of ["fetch(", "localStorage", "sessionStorage", "/api/auth", "/api/progress", "/api/evidence", "/api/premium"]) {
    assert.ok(!source.includes(forbidden), forbidden);
  }
});
