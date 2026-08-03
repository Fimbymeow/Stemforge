import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { auditBankAssessment, classifyBank, compareQuestion } from "@/lib/content-import/classification";
import { createImportRegistry, parseAndValidateBankConfiguration } from "@/lib/content-import/configuration";
import type { BankImportConfiguration, ImportAnswerCandidate, RequiredCapability } from "@/lib/content-import/types";
import {
  BANK_DIRECTORY,
  basicConfigurationText,
  canonicalContent,
  loadBank,
  questionIR,
  syntheticBank,
} from "@/tests/content-import-fixtures";

const registry = createImportRegistry(canonicalContent.subjects, canonicalContent.questions);

test("Basic Differentiation configuration resolves only exact live paths and stages", () => {
  const bank = loadBank("basic-differentiation-v1.md");
  const result = parseAndValidateBankConfiguration(basicConfigurationText(), registry, bank);
  assert.equal(result.valid, true);
  assert.match(result.configurationHash ?? "", /^[a-f0-9]{64}$/);
});

test("configuration rejects invalid paths, stages, traversal, malformed overrides and fuzzy names", () => {
  const base = JSON.parse(basicConfigurationText()) as Record<string, unknown>;
  const invalidPath = parseAndValidateBankConfiguration(JSON.stringify({ ...base, targetSkillPathSlug: "Basic differentiation" }), registry);
  assert.equal(invalidPath.valid, false);
  assert.ok(invalidPath.diagnostics.some((item) => item.code === "invalid_target_skill_path" || item.code === "unknown_target_skill_path"));
  const traversal = parseAndValidateBankConfiguration(JSON.stringify({ ...base, targetSkillPathSlug: "../basic-differentiation" }), registry);
  assert.equal(traversal.valid, false);
  const invalidStage = parseAndValidateBankConfiguration(JSON.stringify({ ...base, stageNameToStageId: { Foundations: "foundations" } }), registry);
  assert.ok(invalidStage.diagnostics.some((item) => item.code === "unknown_target_stage"));
  const malformedOverride = parseAndValidateBankConfiguration(JSON.stringify({ ...base, pathOverrides: [{ questionIds: [], targetSkillPathSlug: "basic-differentiation", stageNameToStageId: base.stageNameToStageId }] }), registry);
  assert.ok(malformedOverride.diagnostics.some((item) => item.code === "malformed_path_override_ids"));
});

test("malformed configuration structures fail closed without being dereferenced during bank validation", () => {
  const bank = loadBank("basic-differentiation-v1.md");
  const base = JSON.parse(basicConfigurationText()) as Record<string, unknown>;
  for (const malformed of [
    { ...base, pathOverrides: {} },
    { ...base, stageNameToStageId: null },
    { ...base, pathOverrides: [null] },
  ]) {
    const result = parseAndValidateBankConfiguration(JSON.stringify(malformed), registry, bank);
    assert.equal(result.valid, false);
    assert.ok(result.diagnostics.some((item) =>
      ["malformed_path_overrides", "malformed_stage_mapping", "malformed_path_override"].includes(item.code)));
  }
});

test("Stationary Points remains deliberately unconfigurable because the live placement is unresolved", () => {
  const pending = {
    bankId: "hm-calc-diff-stationary",
    sourceBankVersion: "2",
    targetSkillPathSlug: "stationary-points",
    stageNameToStageId: {
      Foundations: "stationary-foundations",
      Applications: "stationary-applications",
      "Past Paper-style Questions": "stationary-past-paper-style",
    },
    runMode: "new_content_only",
  };
  const result = parseAndValidateBankConfiguration(JSON.stringify(pending), registry, loadBank("stationary-points-v2.md"));
  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.some((item) => item.code === "target_path_has_no_live_stages"));
});

test("configuration and classification fail closed when a source stage is not completely mapped", () => {
  const bank = loadBank("basic-differentiation-v1.md");
  const incomplete = JSON.parse(basicConfigurationText()) as BankImportConfiguration;
  delete incomplete.stageNameToStageId["Past Paper-style Questions"];
  const validation = parseAndValidateBankConfiguration(JSON.stringify(incomplete), registry, bank);
  assert.equal(validation.valid, false);
  assert.ok(validation.diagnostics.some((item) => item.code === "unmapped_source_stage"));

  const question = questionIR({ declaredStage: "Unmapped" });
  const classification = classifyBank(syntheticBank(question), incomplete, registry).classifications[0];
  assert.equal(classification.status, "blocked");
  assert.equal(classification.canonicalQuestion, undefined);
  assert.ok(classification.blockers.some((item) => item.code === "unmapped_source_stage"));
});

test("all eight real Basic Differentiation exact-ID collisions are surfaced without resolution", () => {
  const bank = loadBank("basic-differentiation-v1.md");
  const config = parseAndValidateBankConfiguration(basicConfigurationText(), registry, bank);
  assert.ok(config.configuration);
  const result = classifyBank(bank, config.configuration!, registry);
  assert.deepEqual(result.collisionDiffs.map((item) => item.questionId).sort(), canonicalContent.questions.map((question) => question.id).sort());
  assert.equal(result.collisionDiffs.length, 8);
  assert.ok(result.collisionDiffs.every((item) => item.fields.length > 0));
});

test("live marker oracle supports flat polynomials and exact numeric fractions", () => {
  for (const answer of ["2x^2+3x+1", "3/4"]) {
    const classification = auditBankAssessment(syntheticBank(questionIR({
      interactionType: answer.includes("x") ? "algebraic" : "numeric",
      answerCandidates: [candidate(answer, answer.includes("x") ? "algebraic" : "numeric")],
    })))[0];
    assert.notEqual(classification.status, "blocked", answer);
    assert.equal(classification.markerCompatibility?.targetOutcome, "graded");
  }
});

test("unsupported composite, equation, coordinate, interval and integration forms block with exact capabilities", () => {
  const fixtures: Array<[string, string, RequiredCapability]> = [
    ["15(3x+2)^4", "algebraic", "composite_algebraic_equivalence"],
    ["x(30-2x)", "algebraic", "composite_algebraic_equivalence"],
    ["2x^2+2000/x", "algebraic", "composite_algebraic_equivalence"],
    ["x^-2", "algebraic", "composite_algebraic_equivalence"],
    ["x^(1/2)", "algebraic", "composite_algebraic_equivalence"],
    ["sqrt(x)", "algebraic", "composite_algebraic_equivalence"],
    ["2/x", "algebraic", "composite_algebraic_equivalence"],
    ["y=3x+2", "algebraic", "equation_form_answer"],
    ["(2,3)", "coordinate", "structured_coordinate_pair"],
    ["x<2", "interval", "interval_set"],
    ["x^2+C", "algebraic", "arbitrary_integration_constant"],
  ];
  for (const [answer, type, capability] of fixtures) {
    const classification = auditBankAssessment(syntheticBank(questionIR({ answerCandidates: [candidate(answer, type)] })))[0];
    assert.equal(classification.status, "blocked", answer);
    assert.ok(classification.blockers.some((item) => item.requiredCapability === capability), answer);
  }
});

test("unsupported unit and variable-labelled aliases block without pruning the intended aliases", () => {
  for (const alias of ["12 m", "x=12"]) {
    const classification = auditBankAssessment(syntheticBank(questionIR({
      interactionType: "numeric",
      answerCandidates: [{ ...candidate("12", "numeric"), acceptedAnswers: ["12", alias] }],
    })))[0];
    assert.equal(classification.status, "blocked");
    assert.ok(classification.blockers.some((item) => item.code === "unsupported_intended_alias"));
    assert.equal(classification.markerCompatibility?.aliasOutcomes.length, 2);
  }
});

test("multiple-choice authority resolves only exact, unique and internally consistent options", () => {
  const options = "Choose one.\nA. First expression\nB. Second expression";
  for (const answer of ["A", "A. First expression", "First expression"]) {
    const supported = auditBankAssessment(syntheticBank(questionIR({
      questionText: options,
      interactionType: "multiple_choice",
      answerCandidates: [{ ...candidate(answer, "multiple_choice"), acceptedAnswers: [answer, "A"] }],
    })))[0];
    assert.notEqual(supported.status, "blocked", answer);
    assert.equal(supported.markerCompatibility?.strategy, "multiple_choice");
  }
  for (const [answer, questionText] of [
    ["Z", options],
    ["A. Wrong expression", options],
    ["A", "Choose one.\nA. First expression\nB. First expression"],
    ["A", "Choose one.\nA. First expression\nA. Second expression"],
    ["A", "Choose one without declared options."],
  ]) {
    const blocked = auditBankAssessment(syntheticBank(questionIR({
      questionText,
      interactionType: "multiple_choice",
      answerCandidates: [candidate(answer, "multiple_choice")],
    })))[0];
    assert.equal(blocked.status, "blocked", `${answer}:${questionText}`);
  }
});

test("undeclared multi-field answers block while explicit single-assessed scaffolding converts", () => {
  const fields = [candidate("x", "algebraic", "working"), candidate("2x", "algebraic", "answer")];
  const blocked = auditBankAssessment(syntheticBank(questionIR({ answerCandidates: fields })))[0];
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockers.some((item) => item.requiredCapability === "structured_multi_field_answer"));
  const explicit = fields.map((field, index) => ({ ...field, assessed: index === 1 }));
  const converted = auditBankAssessment(syntheticBank(questionIR({ answerCandidates: explicit, explicitFieldAssessment: true })))[0];
  assert.equal(converted.status, "convertible");
  assert.ok(converted.conversions.includes("explicit_scaffolding_field_drop"));
});

test("closed vocabulary, prompt diagrams, graph responses and repeated coordinate/nature groups have bounded blocker codes", () => {
  const cases: Array<[ReturnType<typeof questionIR>, RequiredCapability]> = [
    [questionIR({ answerCandidates: [candidate("maximum", "text_short")] }), "closed_vocabulary_text_answer"],
    [questionIR({ questionText: "Use the diagram shown below.", answerCandidates: [candidate("2x", "algebraic")] }), "prompt_diagram"],
    [questionIR({ interactionType: "graph", answerCandidates: [candidate("graph", "graph")] }), "graph_response"],
    [questionIR({
      answerCandidates: [
        { ...candidate("(1,2)", "coordinate", "point"), label: "Coordinate" },
        { ...candidate("maximum", "text_short", "nature"), label: "Nature" },
      ],
    }), "repeated_coordinate_nature_group"],
  ];
  for (const [question, capability] of cases) {
    const classification = auditBankAssessment(syntheticBank(question))[0];
    assert.ok(classification.blockers.some((item) => item.requiredCapability === capability), capability);
  }
});

test("field-level collision diffs distinguish hint, solution, answers, marks, calculator and placement changes", () => {
  const existing = canonicalContent.questions[0];
  const fields = [
    "hint", "workedSolution", "acceptedAnswers", "marks", "calculatorAllowed", "stageId", "source",
  ] as const;
  for (const field of fields) {
    const changed = structuredClone(existing);
    (changed as unknown as Record<string, unknown>)[field] = field === "acceptedAnswers" ? [...existing.acceptedAnswers, "extra"] :
      field === "marks" ? existing.marks + 1 :
        field === "calculatorAllowed" ? !existing.calculatorAllowed :
          `${String((existing as unknown as Record<string, unknown>)[field])}-changed`;
    const diff = compareQuestion(existing, changed);
    assert.deepEqual(diff.fields.map((item) => item.field), [field]);
  }
  assert.equal(compareQuestion(existing, structuredClone(existing)).identical, true);
});

test("collision impacts derive only executable and semantically sufficient version decisions", () => {
  const existing = canonicalContent.questions[0];
  const hintOnly = structuredClone(existing);
  hintOnly.hint += " clarified";
  assert.deepEqual(compareQuestion(existing, hintOnly).availableVersionDecisions, [
    "content_revision_bump",
    "question_version_bump",
  ]);

  const acceptedAnswerChange = structuredClone(existing);
  acceptedAnswerChange.acceptedAnswers = [...acceptedAnswerChange.acceptedAnswers, "new alias"];
  assert.deepEqual(compareQuestion(existing, acceptedAnswerChange).availableVersionDecisions, ["question_version_bump"]);

  const crossPath = structuredClone(existing);
  crossPath.skillPathId = "chain-rule";
  assert.deepEqual(compareQuestion(existing, crossPath).availableVersionDecisions, []);
});

// ---- Chain Rule safe authoring repair batch ----

test("the live Chain Rule draft no longer uses the incorrect 'Answer fields for import:' label", () => {
  const source = readFileSync(`${BANK_DIRECTORY}/chain-rule-v6.md`, "utf8");
  assert.equal((source.match(/Answer fields for import:/g) ?? []).length, 0);
  assert.equal((source.match(/^Answer fields:\s*$/gm) ?? []).length, 26);
});

test("the live Chain Rule draft still parses to exactly 45 questions across the same three stages", () => {
  const bank = loadBank("chain-rule-v6.md");
  assert.equal(bank.questions.length, 45);
  const byStage = new Map<string, number>();
  for (const question of bank.questions) {
    byStage.set(question.declaredStage, (byStage.get(question.declaredStage) ?? 0) + 1);
  }
  assert.equal(byStage.get("Foundations"), 10);
  assert.equal(byStage.get("Applications"), 10);
  assert.equal(byStage.get("Past Paper-style Questions"), 25);
});

test("the repair batch did not change any Chain Rule question ID", () => {
  const bank = loadBank("chain-rule-v6.md");
  const ids = bank.questions.map((question) => question.id);
  assert.ok(ids.includes("hm-calc-diff-chain-f-001"));
  assert.ok(ids.includes("hm-calc-diff-chain-f-010"));
  assert.ok(ids.includes("hm-calc-diff-chain-a-001"));
  assert.ok(ids.includes("hm-calc-diff-chain-a-010"));
  assert.ok(ids.includes("hm-calc-diff-chain-ppq-001"));
  assert.ok(ids.includes("hm-calc-diff-chain-ppq-025"));
  assert.equal(new Set(ids).size, 45);
});

test("F010, A001, A003 and A008 no longer emit unsupported_intended_alias after alias cleanup", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  for (const id of [
    "hm-calc-diff-chain-f-010",
    "hm-calc-diff-chain-a-001",
    "hm-calc-diff-chain-a-003",
    "hm-calc-diff-chain-a-008",
  ]) {
    const classification = classifications.find((item) => item.questionId === id)!;
    assert.ok(!classification.blockers.some((b) => b.code === "unsupported_intended_alias"), id);
    assert.notEqual(classification.status, "blocked", id);
  }
});

test("A005 has canonical 5/6 with no unsupported aliases and is ready", () => {
  const bank = loadBank("chain-rule-v6.md");
  const question = bank.questions.find((item) => item.id === "hm-calc-diff-chain-a-005")!;
  assert.equal(question.answerCandidates[0].correctAnswer, "5/6");
  assert.deepEqual(question.answerCandidates[0].acceptedAnswers, ["5/6"]);
  const classification = auditBankAssessment(bank).find((item) => item.questionId === "hm-calc-diff-chain-a-005")!;
  assert.equal(classification.status, "ready");
  assert.deepEqual(classification.blockers, []);
});

test("A009 has canonical 1 with no unsupported aliases and is ready", () => {
  const bank = loadBank("chain-rule-v6.md");
  const question = bank.questions.find((item) => item.id === "hm-calc-diff-chain-a-009")!;
  assert.equal(question.answerCandidates[0].correctAnswer, "1");
  assert.deepEqual(question.answerCandidates[0].acceptedAnswers, ["1"]);
  const classification = auditBankAssessment(bank).find((item) => item.questionId === "hm-calc-diff-chain-a-009")!;
  assert.equal(classification.status, "ready");
  assert.deepEqual(classification.blockers, []);
});

test("the completed Chain Rule repair batch produces exactly 5 ready / 3 convertible / 37 blocked, with zero unsupported_intended_alias blockers anywhere", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  const counts = { ready: 0, convertible: 0, blocked: 0 };
  for (const c of classifications) counts[c.status as "ready" | "convertible" | "blocked"] += 1;
  assert.deepEqual(counts, { ready: 5, convertible: 3, blocked: 37 });
  assert.equal(bank.questions.length, 45);
  assert.ok(!classifications.some((c) => c.blockers.some((b) => b.code === "unsupported_intended_alias")));

  const readyIds = classifications.filter((c) => c.status === "ready").map((c) => c.questionId).sort();
  assert.deepEqual(readyIds, [
    "hm-calc-diff-chain-a-001",
    "hm-calc-diff-chain-a-003",
    "hm-calc-diff-chain-a-005",
    "hm-calc-diff-chain-a-008",
    "hm-calc-diff-chain-a-009",
  ]);
  const convertibleIds = classifications.filter((c) => c.status === "convertible").map((c) => c.questionId).sort();
  assert.deepEqual(convertibleIds, [
    "hm-calc-diff-chain-f-001",
    "hm-calc-diff-chain-f-002",
    "hm-calc-diff-chain-f-010",
  ]);

  const bySection = { Foundations: 0, Applications: 0, "Past Paper-style Questions": 0 };
  for (const c of classifications) {
    if (c.status !== "blocked") continue;
    const q = bank.questions.find((item) => item.id === c.questionId)!;
    bySection[q.declaredStage as keyof typeof bySection] += 1;
  }
  assert.deepEqual(bySection, { Foundations: 7, Applications: 5, "Past Paper-style Questions": 25 });
});

function candidate(answer: string, type: string, id = "answer"): ImportAnswerCandidate {
  return { id, label: id, type, correctAnswer: answer, acceptedAnswers: [answer] };
}
