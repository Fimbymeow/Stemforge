import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMathsChainRuleQuestions } from "../content/questions/higher-maths/chain-rule";
import { higherMaths } from "../data/higher-maths";
import type { Question, Subject } from "../data/types";
import { validateContent } from "../lib/content-validation";

function cloneSubject(): Subject {
  return structuredClone(higherMaths);
}

function cloneQuestions(): Question[] {
  return structuredClone([...higherMathsDifferentiationQuestions, ...higherMathsChainRuleQuestions]);
}

function basicDifferentiation(subject: Subject) {
  return subject.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
}

test("current Higher Maths content has no validation errors", () => {
  const report = validateContent({ subjects: [cloneSubject()], questions: cloneQuestions() });
  assert.deepEqual(report.errors, []);
});

test("duplicate question IDs fail validation", () => {
  const questions = cloneQuestions();
  questions.push(structuredClone(questions[0]));
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-question-id"));
});

test("missing stage question references fail validation", () => {
  const subject = cloneSubject();
  const stage = basicDifferentiation(subject)?.learningStages?.[0];
  assert.ok(stage);
  stage.questionIds.push("hm-calc-diff-basic-f-999");
  stage.questions = stage.questionIds.length;
  const report = validateContent({ subjects: [subject], questions: cloneQuestions() });
  assert.ok(report.errors.some((issue) => issue.code === "missing-question-reference"));
});

test("invalid auto-marked answer structures fail validation", () => {
  const questions = cloneQuestions();
  questions[0].acceptedAnswers = [];
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "empty-accepted-answers"));
});

test("mismatched question relationships fail validation", () => {
  const questions = cloneQuestions();
  questions[0].stageId = "missing-stage";
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-stage-reference"));
});

test("stale aggregate and path question counts fail validation", () => {
  const subject = cloneSubject();
  const path = basicDifferentiation(subject);
  assert.ok(path);
  path.questions += 1;
  const specArea = subject.courseAreas.flatMap((area) => area.specAreas).find((area) => area.skillPaths?.some((skill) => skill.slug === path.slug));
  assert.ok(specArea);
  specArea.questions += 1;
  const report = validateContent({ subjects: [subject], questions: cloneQuestions() });
  assert.ok(report.errors.some((issue) => issue.code === "path-question-count-mismatch"));
  assert.ok(report.errors.some((issue) => issue.code === "spec-area-question-count-mismatch"));
});

test("live stage duration and completeness are objective publication errors", () => {
  const subject = cloneSubject();
  const stage = basicDifferentiation(subject)?.learningStages?.[0];
  assert.ok(stage);
  stage.estimatedMinutes = 0;
  const questions = cloneQuestions();
  questions[0].hint = "";
  questions[0].calculatorAllowed = undefined as unknown as boolean;
  const report = validateContent({ subjects: [subject], questions });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-stage-estimated-minutes"));
  assert.ok(report.errors.some((issue) => issue.code === "empty-hint"));
  assert.ok(report.errors.some((issue) => issue.code === "invalid-calculator-metadata"));
});

test("empty live stages and exact normalized duplicate prompts are diagnosed", () => {
  const subject = cloneSubject();
  const path = basicDifferentiation(subject);
  assert.ok(path?.learningStages);
  const stage = path.learningStages[0];
  stage.questionIds = [];
  stage.questions = 0;
  path.questions -= 3;
  const questions = cloneQuestions();
  questions[1].questionText = `  ${questions[0].questionText.toUpperCase()}  `;
  const report = validateContent({ subjects: [subject], questions });
  assert.ok(report.errors.some((issue) => issue.code === "empty-live-stage"));
  assert.ok(report.warnings.some((issue) => issue.code === "duplicate-normalized-question-prompt"));
});

test("optional question-level curriculum dependencies validate canonical references", () => {
  const questions = cloneQuestions();
  questions[0].curriculum = {
    primarySkillId: "basic-differentiation",
    requiredSkillIds: ["missing-skill"],
  };
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "unknown-question-required-skill"));

  questions[0].curriculum.requiredSkillIds = ["optimisation"];
  const contaminationReport = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(contaminationReport.errors.some((issue) => issue.code === "required-skill-outside-prerequisite-closure"));
});

test("active Higher Maths questions require explicit reviewed curriculum metadata", () => {
  const questions = cloneQuestions();
  delete questions[0].curriculum;
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "missing-question-curriculum-metadata"));
});

test("question graph metadata rejects stale linked-derivative references", () => {
  const questions = cloneQuestions();
  questions[0].graphConfig = {
    version: 1,
    title: "Graph validation fixture",
    description: "A deliberately stale derivative link.",
    viewport: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
    functions: [{ id: "f", expression: { type: "constant", value: { numerator: 1, denominator: 1 } }, styleRole: "primary" }],
    linkedDerivative: { originalFunctionId: "f", derivativeFunctionId: "missing", initialX: 0, showTangent: true },
  };
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-linked-derivative-reference"));
});

test("a bounded elementary-expression contract validates and unsupported subsets fail clearly", () => {
  const questions = cloneQuestions();
  const question = questions[0];
  question.correctAnswer = "3sin(x)";
  question.acceptedAnswers = ["3sin(x)"];
  question.finalAnswer = "3sin(x)";
  question.marking = {
    strategy: "elementary_expression_equivalence",
    strategyVersion: 1,
    target: "3sin(x)",
    variable: "x",
    allowedFunctions: ["sin", "cos"],
    allowedConstants: [],
    fixtures: {
      correct: [{ input: "3sin(x)" }],
      incorrect: [{ input: "3cos(x)", reason: "value_wrong" }],
      malformed: [{ input: "sin(", reason: "malformed_elementary_expression" }],
      unmarkable: [{ input: "tan(x)", reason: "unsupported_mathematical_form" }],
    },
  };
  assert.deepEqual(validateContent({ subjects: [cloneSubject()], questions }).errors, []);

  question.marking.target = "tan(x)";
  const report = validateContent({ subjects: [cloneSubject()], questions });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-elementary-expression-contract"));

  question.marking.target = "3sin(x)";
  question.marking.allowedFunctions = ["sin", "sec" as "sin"];
  assert.ok(validateContent({ subjects: [cloneSubject()], questions }).errors.some((issue) => issue.code === "invalid-elementary-expression-contract"));
});
