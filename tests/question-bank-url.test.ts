import assert from "node:assert/strict";
import test from "node:test";
import {
  parseQuestionBankSearchParams,
  questionBankSearchString,
  QUESTION_BANK_URL_DEFAULTS,
  serializeQuestionBankUrlState,
  type QuestionBankUrlState,
} from "../lib/question-bank-url";

test("parsing an empty query string yields exactly the canonical defaults", () => {
  assert.deepEqual(parseQuestionBankSearchParams(new URLSearchParams()), QUESTION_BANK_URL_DEFAULTS);
});

test("canonical parameter names round-trip through parse and serialize", () => {
  const state: QuestionBankUrlState = {
    courseAreaId: "calculus",
    specAreaId: "differentiation",
    skillPathId: "basic-differentiation",
    stageId: "basic-diff-stage-foundations",
    status: "review-recommended",
    type: "numerical",
    calc: "allowed",
    sort: "review-priority",
    page: 3,
  };
  const params = serializeQuestionBankUrlState(state);
  assert.equal(params.get("course"), "calculus");
  assert.equal(params.get("spec"), "differentiation");
  assert.equal(params.get("path"), "basic-differentiation");
  assert.equal(params.get("stage"), "basic-diff-stage-foundations");
  assert.equal(params.get("status"), "review-recommended");
  assert.equal(params.get("type"), "numerical");
  assert.equal(params.get("calc"), "allowed");
  assert.equal(params.get("sort"), "review-priority");
  assert.equal(params.get("page"), "3");
  assert.deepEqual(parseQuestionBankSearchParams(params), state);
});

test("default values are omitted from the serialized URL", () => {
  const params = serializeQuestionBankUrlState(QUESTION_BANK_URL_DEFAULTS);
  assert.equal(params.toString(), "");
  assert.equal(questionBankSearchString(QUESTION_BANK_URL_DEFAULTS), "");
});

test("only non-default fields are serialized", () => {
  const params = serializeQuestionBankUrlState({ ...QUESTION_BANK_URL_DEFAULTS, skillPathId: "basic-differentiation", page: 2 });
  assert.deepEqual([...params.keys()].sort(), ["page", "path"]);
});

test("invalid enum values are discarded safely and fall back to defaults", () => {
  const params = new URLSearchParams({ status: "not-a-real-status", type: "not-a-real-type", calc: "maybe", sort: "random" });
  const parsed = parseQuestionBankSearchParams(params);
  assert.equal(parsed.status, "all");
  assert.equal(parsed.type, "all");
  assert.equal(parsed.calc, "all");
  assert.equal(parsed.sort, "default");
});

test("invalid page values (non-numeric, zero, negative, fractional-only) fall back to page 1", () => {
  assert.equal(parseQuestionBankSearchParams(new URLSearchParams({ page: "not-a-number" })).page, 1);
  assert.equal(parseQuestionBankSearchParams(new URLSearchParams({ page: "0" })).page, 1);
  assert.equal(parseQuestionBankSearchParams(new URLSearchParams({ page: "-3" })).page, 1);
  assert.equal(parseQuestionBankSearchParams(new URLSearchParams({ page: "2.7" })).page, 2);
});

test("selected question IDs, search text and other ephemeral state have no canonical parameter names", () => {
  const params = serializeQuestionBankUrlState({ ...QUESTION_BANK_URL_DEFAULTS, skillPathId: "basic-differentiation" });
  assert(!params.has("selected"));
  assert(!params.has("search"));
  assert(!params.has("expanded"));
});
