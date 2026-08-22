import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { markQuestionAnswer } from "@/lib/answer-engine";
import { auditBankAssessment, classifyBank, compareQuestion } from "@/lib/content-import/classification";
import { createImportRegistry, parseAndValidateBankConfiguration } from "@/lib/content-import/configuration";
import type { BankImportConfiguration, ImportAnswerCandidate, RequiredCapability } from "@/lib/content-import/types";
import { higherMathsDifferentiationQuestions } from "@/content/questions/higher-maths/basic-differentiation";
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

test("classification carries canonical curriculum metadata into generated questions", () => {
  const configuration = JSON.parse(basicConfigurationText()) as BankImportConfiguration;
  const curriculum = { primarySkillId: "basic-differentiation", requiredSkillIds: ["chain-rule"] };
  const classification = classifyBank(syntheticBank(questionIR({ curriculum })), configuration, registry).classifications[0];
  assert.deepEqual(classification.canonicalQuestion?.curriculum, curriculum);
});

test("classification rejects curriculum ownership mismatches and unknown required skills", () => {
  const configuration = JSON.parse(basicConfigurationText()) as BankImportConfiguration;
  const classification = classifyBank(syntheticBank(questionIR({
    curriculum: { primarySkillId: "tangents-and-normals", requiredSkillIds: ["not-a-skill"] },
  })), configuration, registry).classifications[0];
  assert.equal(classification.status, "blocked");
  assert.ok(classification.blockers.some((item) => item.code === "curriculum_primary_skill_mismatch"));
  assert.ok(classification.blockers.some((item) => item.code === "unknown_curriculum_required_skill"));
});

test("all eight real Basic Differentiation exact-ID collisions are surfaced without resolution", () => {
  const bank = loadBank("basic-differentiation-v1.md");
  const config = parseAndValidateBankConfiguration(basicConfigurationText(), registry, bank);
  assert.ok(config.configuration);
  const result = classifyBank(bank, config.configuration!, registry);
  assert.deepEqual(result.collisionDiffs.map((item) => item.questionId).sort(), higherMathsDifferentiationQuestions.map((question) => question.id).sort());
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
    ["(x+1)^(1/3)", "algebraic", "composite_algebraic_equivalence"],
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

test("a supported V1 composite-algebraic target reaches ready or convertible with every declared alias checked", () => {
  const supported = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{ ...candidate("15(3x+2)^4", "algebraic"), acceptedAnswers: ["15(3x+2)^4", "15*(3x+2)^4", "15(3x + 2)^4"] }],
  })))[0];
  assert.notEqual(supported.status, "blocked");
  assert.equal(supported.markerCompatibility?.strategy, "composite_algebraic_equivalence");
  assert.equal(supported.markerCompatibility?.targetOutcome, "graded");
  assert.ok(supported.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true));

  const badAlias = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{ ...candidate("15(3x+2)^4", "algebraic"), acceptedAnswers: ["15(3x+2)^4", "dy/dx=15(3x+2)^4"] }],
  })))[0];
  assert.equal(badAlias.status, "blocked");
  assert.ok(badAlias.blockers.some((item) => item.code === "unsupported_intended_alias"));
});

test("a V2-shaped target infers strategy version 2, reaches ready or convertible, and every reciprocal/radical alias grades correct", () => {
  for (const answer of ["-12(4x+5)^(-4)", "-12/(4x+5)^4", "(5x+4)^(-1/2)", "7/(2sqrt(7x-3))"]) {
    const classification = auditBankAssessment(syntheticBank(questionIR({
      answerCandidates: [{ ...candidate(answer, "algebraic"), acceptedAnswers: [answer] }],
    })))[0];
    assert.notEqual(classification.status, "blocked", answer);
    assert.equal(classification.markerCompatibility?.strategy, "composite_algebraic_equivalence", answer);
    assert.equal(classification.markerCompatibility?.strategyVersion, 2, answer);
  }

  const reciprocalAliases = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{
      ...candidate("-6x(x^2+1)^(-4)", "algebraic"),
      acceptedAnswers: ["-6x(x^2+1)^(-4)", "-6*x*(x^2+1)^(-4)", "-6x/(x^2+1)^4", "-6*x/(x^2+1)^4"],
    }],
  })))[0];
  assert.notEqual(reciprocalAliases.status, "blocked");
  assert.ok(reciprocalAliases.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true));

  const radicalAliases = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{
      ...candidate("(5/2)(5x+4)^(-1/2)", "algebraic"),
      acceptedAnswers: ["(5/2)(5x+4)^(-1/2)", "5/2(5x+4)^(-1/2)", "5/(2sqrt(5x+4))", "5/(2*sqrt(5x+4))"],
    }],
  })))[0];
  assert.notEqual(radicalAliases.status, "blocked");
  assert.ok(radicalAliases.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true));
});

test("a V1-shaped target still infers strategy version 1, not 2, once V2 exists", () => {
  const classification = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{ ...candidate("15(3x+2)^4", "algebraic"), acceptedAnswers: ["15(3x+2)^4", "15*(3x+2)^4"] }],
  })))[0];
  assert.notEqual(classification.status, "blocked");
  assert.equal(classification.markerCompatibility?.strategy, "composite_algebraic_equivalence");
  assert.equal(classification.markerCompatibility?.strategyVersion, 1);
});

test("fractional exponents other than +-1/2 remain unsupported under V2", () => {
  for (const answer of ["(x+1)^(1/3)", "(x+1)^(2/3)", "(x+1)^(-1/3)"]) {
    const classification = auditBankAssessment(syntheticBank(questionIR({ answerCandidates: [candidate(answer, "algebraic")] })))[0];
    assert.equal(classification.status, "blocked", answer);
    assert.ok(classification.blockers.some((item) => item.code === "unsupported_marker_target"), answer);
  }
});

test("an equation-form target is never silently routed into composite-algebraic expression marking", () => {
  const classification = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [candidate("dy/dx=15(3x+2)^4", "algebraic")],
  })))[0];
  assert.equal(classification.status, "blocked");
  assert.deepEqual(classification.blockers.map((item) => item.code), ["requires_equation_form_answer"]);
});

test("nested and multi-bracket-power composites remain blocked rather than partially matched", () => {
  for (const answer of ["(x+1)^2(x-1)^3", "((x+1)^2+1)^3", "10x(x^2+4)(x+2)^(-4)"]) {
    const classification = auditBankAssessment(syntheticBank(questionIR({ answerCandidates: [candidate(answer, "algebraic")] })))[0];
    assert.equal(classification.status, "blocked", answer);
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
    [questionIR({ answerCandidates: [candidate("maximum", "classification")] }), "closed_vocabulary_text_answer"],
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

test("a constrained text_short field with a small explicit vocabulary infers closed_vocabulary_text_answer, and every declared alias grades correct", () => {
  const classification = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{ ...candidate("C1", "text_short"), acceptedAnswers: ["C1", "curve C1", "first curve"] }],
  })))[0];
  assert.notEqual(classification.status, "blocked");
  assert.equal(classification.markerCompatibility?.strategy, "closed_vocabulary_text_answer");
  assert.equal(classification.markerCompatibility?.strategyVersion, 1);
  assert.equal(classification.markerCompatibility?.targetOutcome, "graded");
  assert.ok(classification.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true));
});

test("plausible non-vocabulary answers grade incorrect for a constrained text_short field, never merely blocked", () => {
  const contract = { strategy: "closed_vocabulary_text_answer" as const, strategyVersion: 1 as const, target: "C1", acceptedAnswers: ["C1", "curve C1"], fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] } };
  for (const wrong of ["C2", "both curves", "probably C1"]) {
    const result = markQuestionAnswer({ marking: contract }, wrong);
    assert.equal(result.outcomeKind, "graded", wrong);
    assert.equal(result.isCorrect, false, wrong);
  }
});

test("unsupported free-text questions do not automatically infer closed_vocabulary_text_answer merely because they have aliases: nature/classification-typed fields still block", () => {
  for (const type of ["nature", "classification", "text"]) {
    const classification = auditBankAssessment(syntheticBank(questionIR({
      answerCandidates: [{ ...candidate("Maximum", type), acceptedAnswers: ["Maximum", "max", "a maximum point"] }],
    })))[0];
    assert.equal(classification.status, "blocked", type);
    assert.ok(classification.blockers.some((item) => item.code === "requires_closed_vocabulary_text_answer"), type);
  }
});

test("a text_short field whose declared vocabulary is invalid (too many entries, or an ambiguous duplicate) still blocks rather than silently accepting", () => {
  const tooMany = Array.from({ length: 13 }, (_, index) => `option ${index}`);
  const tooManyEntries = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{ ...candidate(tooMany[0], "text_short"), acceptedAnswers: tooMany }],
  })))[0];
  assert.equal(tooManyEntries.status, "blocked");
  assert.ok(tooManyEntries.blockers.some((item) => item.code === "requires_closed_vocabulary_text_answer"));

  const ambiguousDuplicate = auditBankAssessment(syntheticBank(questionIR({
    answerCandidates: [{ ...candidate("C1", "text_short"), acceptedAnswers: ["C1", "c1"] }],
  })))[0];
  assert.equal(ambiguousDuplicate.status, "blocked");
  assert.ok(ambiguousDuplicate.blockers.some((item) => item.code === "requires_closed_vocabulary_text_answer"));
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
  assert.equal((source.match(/^Answer fields:\s*$/gm) ?? []).length, 15);
});

test("the post-migration Chain Rule draft parses to exactly 34 questions across the same three stages", () => {
  const bank = loadBank("chain-rule-v6.md");
  assert.equal(bank.questions.length, 34);
  const byStage = new Map<string, number>();
  for (const question of bank.questions) {
    byStage.set(question.declaredStage, (byStage.get(question.declaredStage) ?? 0) + 1);
  }
  assert.equal(byStage.get("Foundations"), 10);
  assert.equal(byStage.get("Applications"), 9);
  assert.equal(byStage.get("Past Paper-style Questions"), 15);
});

test("the five moved-to-Tangents and six removed-as-duplicate IDs no longer exist in Chain Rule; every retained ID is stable", () => {
  const bank = loadBank("chain-rule-v6.md");
  const ids = bank.questions.map((question) => question.id);
  for (const movedOrRemovedId of [
    "hm-calc-diff-chain-a-010",
    "hm-calc-diff-chain-ppq-001",
    "hm-calc-diff-chain-ppq-002",
    "hm-calc-diff-chain-ppq-005",
    "hm-calc-diff-chain-ppq-006",
    "hm-calc-diff-chain-ppq-009",
    "hm-calc-diff-chain-ppq-013",
    "hm-calc-diff-chain-ppq-022",
    "hm-calc-diff-chain-ppq-023",
    "hm-calc-diff-chain-ppq-024",
    "hm-calc-diff-chain-ppq-025",
  ]) {
    assert.ok(!ids.includes(movedOrRemovedId), movedOrRemovedId);
  }
  assert.ok(ids.includes("hm-calc-diff-chain-f-001"));
  assert.ok(ids.includes("hm-calc-diff-chain-f-010"));
  assert.ok(ids.includes("hm-calc-diff-chain-a-001"));
  assert.ok(ids.includes("hm-calc-diff-chain-a-009"));
  assert.ok(ids.includes("hm-calc-diff-chain-ppq-010"), "ppq-010 is retained for now, per the migration decision");
  assert.ok(ids.includes("hm-calc-diff-chain-ppq-021"));
  assert.equal(new Set(ids).size, 34);
});

test("the migrated Tangents questions exist under clean, new IDs, unrelated to their old Chain Rule identities", () => {
  const bank = loadBank("tangents-and-normals-v1.md");
  const ids = bank.questions.map((question) => question.id);
  assert.deepEqual(ids, [
    "hm-calc-tangent-a-001",
    "hm-calc-tangent-ppq-001",
    "hm-calc-tangent-ppq-002",
    "hm-calc-tangent-ppq-003",
    "hm-calc-tangent-ppq-004",
  ]);
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

test("the fully marker-compatible Chain Rule draft produces exactly 23 ready / 11 convertible / 0 blocked", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  const counts = { ready: 0, convertible: 0, blocked: 0 };
  for (const c of classifications) counts[c.status as "ready" | "convertible" | "blocked"] += 1;
  assert.deepEqual(counts, { ready: 23, convertible: 11, blocked: 0 });
  assert.equal(bank.questions.length, 34);

  // Every question now carries zero blockers of any kind, including unsupported_intended_alias —
  // every declared alias list contains only forms the live strategies actually accept.
  assert.ok(!classifications.some((c) => c.blockers.length > 0));

  const readyIds = classifications.filter((c) => c.status === "ready").map((c) => c.questionId).sort();
  assert.deepEqual(readyIds, [
    "hm-calc-diff-chain-a-001",
    "hm-calc-diff-chain-a-002",
    "hm-calc-diff-chain-a-003",
    "hm-calc-diff-chain-a-004",
    "hm-calc-diff-chain-a-005",
    "hm-calc-diff-chain-a-006",
    "hm-calc-diff-chain-a-007",
    "hm-calc-diff-chain-a-008",
    "hm-calc-diff-chain-a-009",
    "hm-calc-diff-chain-f-003",
    "hm-calc-diff-chain-f-004",
    "hm-calc-diff-chain-f-005",
    "hm-calc-diff-chain-f-006",
    "hm-calc-diff-chain-f-007",
    "hm-calc-diff-chain-f-008",
    "hm-calc-diff-chain-f-009",
    "hm-calc-diff-chain-ppq-003",
    "hm-calc-diff-chain-ppq-004",
    "hm-calc-diff-chain-ppq-007",
    "hm-calc-diff-chain-ppq-008",
    "hm-calc-diff-chain-ppq-010",
    "hm-calc-diff-chain-ppq-011",
    "hm-calc-diff-chain-ppq-014",
  ]);
  const convertibleIds = classifications.filter((c) => c.status === "convertible").map((c) => c.questionId).sort();
  assert.deepEqual(convertibleIds, [
    "hm-calc-diff-chain-f-001",
    "hm-calc-diff-chain-f-002",
    "hm-calc-diff-chain-f-010",
    "hm-calc-diff-chain-ppq-012",
    "hm-calc-diff-chain-ppq-015",
    "hm-calc-diff-chain-ppq-016",
    "hm-calc-diff-chain-ppq-017",
    "hm-calc-diff-chain-ppq-018",
    "hm-calc-diff-chain-ppq-019",
    "hm-calc-diff-chain-ppq-020",
    "hm-calc-diff-chain-ppq-021",
  ]);
  const blockedIds = classifications.filter((c) => c.status === "blocked").map((c) => c.questionId).sort();
  assert.deepEqual(blockedIds, []);
});

test("all 12 V1-repaired questions reach composite_algebraic_equivalence with every declared alias grading correct and no dy/dx= alias remaining", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  const byId = new Map(bank.questions.map((q) => [q.id, q]));
  const targetIds = [
    "hm-calc-diff-chain-f-003", "hm-calc-diff-chain-f-004", "hm-calc-diff-chain-f-005",
    "hm-calc-diff-chain-f-006", "hm-calc-diff-chain-f-007", "hm-calc-diff-chain-a-002",
    "hm-calc-diff-chain-ppq-003", "hm-calc-diff-chain-ppq-004", "hm-calc-diff-chain-ppq-007",
    "hm-calc-diff-chain-ppq-008", "hm-calc-diff-chain-ppq-010", "hm-calc-diff-chain-ppq-011",
  ];
  for (const id of targetIds) {
    const classification = classifications.find((c) => c.questionId === id)!;
    assert.equal(classification.status, "ready", id);
    assert.deepEqual(classification.blockers, [], id);
    assert.equal(classification.markerCompatibility?.strategy, "composite_algebraic_equivalence", id);
    assert.equal(classification.markerCompatibility?.targetOutcome, "graded", id);
    assert.ok(classification.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true), id);

    const question = byId.get(id)!;
    const candidate = question.answerCandidates[0];
    assert.ok(!candidate.correctAnswer.includes("dy/dx"), `${id} correctAnswer`);
    assert.ok(candidate.acceptedAnswers.every((answer) => !answer.includes("dy/dx")), `${id} acceptedAnswers`);
  }
});

test("real Chain Rule V2 regression: all seven V2 target questions reach ready or convertible with strategy version 2, every real alias grading correct, and a plausible wrong answer grading incorrect", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  const byId = new Map(classifications.map((c) => [c.questionId, c]));

  const cases: Array<{ id: string; correctAnswer: string; aliases: string[]; wrong: string; candidateId?: string }> = [
    { id: "hm-calc-diff-chain-f-008", correctAnswer: "(2x+7)^(-1/2)", aliases: ["(2x+7)^(-1/2)", "(2x + 7)^(-1/2)", "1/sqrt(2x+7)", "1/sqrt(2x + 7)"], wrong: "(2x+9)^(-1/2)" },
    { id: "hm-calc-diff-chain-f-009", correctAnswer: "-6x(x^2+1)^(-4)", aliases: ["-6x(x^2+1)^(-4)", "-6*x*(x^2+1)^(-4)", "-6x(x^2 + 1)^(-4)", "-6x/(x^2+1)^4", "-6*x/(x^2+1)^4"], wrong: "-6x(x^2+1)^(-3)" },
    { id: "hm-calc-diff-chain-a-004", correctAnswer: "-12/(3x-2)^5", aliases: ["-12/(3x-2)^5", "-12/(3x - 2)^5"], wrong: "12/(3x-2)^5" },
    { id: "hm-calc-diff-chain-a-006", correctAnswer: "7/(2sqrt(7x-3))", aliases: ["7/(2sqrt(7x-3))", "7/(2*sqrt(7x-3))", "(7/2)(7x-3)^(-1/2)", "7/2*(7x-3)^(-1/2)"], wrong: "7/(2sqrt(7x-5))" },
    { id: "hm-calc-diff-chain-a-007", correctAnswer: "-12/(4x+5)^4", aliases: ["-12/(4x+5)^4", "-12/(4x + 5)^4", "-12(4x+5)^(-4)", "-12*(4x+5)^(-4)"], wrong: "12/(4x+5)^4" },
    { id: "hm-calc-diff-chain-ppq-012", correctAnswer: "(5/2)(5x+4)^(-1/2)", aliases: ["(5/2)(5x+4)^(-1/2)", "5/2(5x+4)^(-1/2)", "5/(2sqrt(5x+4))", "5/(2sqrt(5x + 4))", "5/(2*sqrt(5x+4))"], wrong: "(5/2)(5x+6)^(-1/2)", candidateId: "derivative" },
    { id: "hm-calc-diff-chain-ppq-014", correctAnswer: "-2(x+3)^(-3)", aliases: ["-2(x+3)^(-3)", "-2*(x+3)^(-3)", "-2(x + 3)^(-3)", "-2/(x+3)^3", "-2/((x+3)^3)"], wrong: "2(x+3)^(-3)" },
  ];

  for (const { id, correctAnswer, aliases, wrong, candidateId } of cases) {
    const classification = byId.get(id)!;
    assert.notEqual(classification.status, "blocked", id);
    assert.deepEqual(classification.blockers, [], id);
    assert.equal(classification.markerCompatibility?.strategy, "composite_algebraic_equivalence", id);
    assert.equal(classification.markerCompatibility?.strategyVersion, 2, id);
    assert.equal(classification.markerCompatibility?.targetOutcome, "graded", id);
    assert.ok(classification.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true), id);
    assert.deepEqual(classification.markerCompatibility?.aliasOutcomes.map((outcome) => outcome.answer).sort(), [...aliases].sort(), id);

    const question = bank.questions.find((item) => item.id === id)!;
    const candidate = candidateId ? question.answerCandidates.find((item) => item.id === candidateId)! : question.answerCandidates[0];
    assert.equal(candidate.correctAnswer, correctAnswer, id);
    assert.ok(!candidate.correctAnswer.includes("dy/dx"), `${id} correctAnswer`);
    assert.ok(candidate.acceptedAnswers.every((answer) => !answer.includes("dy/dx")), `${id} acceptedAnswers`);

    const contract = { strategy: "composite_algebraic_equivalence" as const, strategyVersion: 2 as const, target: correctAnswer, variable: "x", fixtures: { correct: [], incorrect: [], malformed: [], unmarkable: [] } };
    const wrongResult = markQuestionAnswer({ marking: contract }, wrong);
    assert.equal(wrongResult.outcomeKind, "graded", id);
    assert.equal(wrongResult.isCorrect, false, id);
  }
});

test("ppq-017's greater_gradient field now resolves through closed_vocabulary_text_answer: every real declared alias grades correct and the question is no longer blocked", () => {
  const bank = loadBank("chain-rule-v6.md");
  const question = bank.questions.find((item) => item.id === "hm-calc-diff-chain-ppq-017")!;
  const scaffolding = ["c1_derivative", "c1_gradient", "c2_derivative", "c2_gradient"];
  for (const id of scaffolding) {
    const candidate = question.answerCandidates.find((item) => item.id === id)!;
    assert.equal(candidate.assessed, false, id);
  }
  const greaterGradient = question.answerCandidates.find((item) => item.id === "greater_gradient")!;
  assert.equal(greaterGradient.assessed, true);
  assert.equal(greaterGradient.type, "text_short");
  // No mathematical value or wording changed by this task.
  assert.equal(question.answerCandidates.find((item) => item.id === "c1_gradient")!.correctAnswer, "108");
  assert.equal(question.answerCandidates.find((item) => item.id === "c2_gradient")!.correctAnswer, "12");
  assert.equal(greaterGradient.correctAnswer, "C1");
  assert.deepEqual(greaterGradient.acceptedAnswers, ["C1", "curve C1", "first curve", "y=(x+2)^4"]);

  const classification = auditBankAssessment(bank).find((item) => item.questionId === "hm-calc-diff-chain-ppq-017")!;
  assert.ok(!classification.blockers.some((b) => b.code === "undeclared_multi_field_assessment"));
  assert.ok(classification.conversions.includes("explicit_scaffolding_field_drop"));
  assert.deepEqual(classification.blockers, []);
  assert.notEqual(classification.status, "blocked");
  assert.equal(classification.markerCompatibility?.strategy, "closed_vocabulary_text_answer");
  assert.equal(classification.markerCompatibility?.strategyVersion, 1);
  assert.equal(classification.markerCompatibility?.targetOutcome, "graded");
  assert.deepEqual(
    classification.markerCompatibility?.aliasOutcomes.map((outcome) => outcome.answer).sort(),
    ["C1", "curve C1", "first curve", "y=(x+2)^4"].sort(),
  );
  assert.ok(classification.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.isCorrect === true));
});

test("undeclared_multi_field_assessment no longer appears anywhere in the Chain Rule draft", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  const occurrences = classifications.filter((c) => c.blockers.some((b) => b.code === "undeclared_multi_field_assessment"));
  assert.deepEqual(occurrences, []);
});

test("the new Tangents draft's five migrated questions are honestly reported: all remain blocked by equation-form / multi-field marking limitations", () => {
  const bank = loadBank("tangents-and-normals-v1.md");
  const classifications = auditBankAssessment(bank);
  assert.equal(bank.questions.length, 5);
  assert.ok(classifications.every((c) => c.status === "blocked"), "no marking metadata was changed by this migration, so nothing became ready or convertible");

  const a001 = classifications.find((c) => c.questionId === "hm-calc-tangent-a-001")!;
  assert.deepEqual(a001.blockers.map((b) => b.code), ["requires_equation_form_answer"]);

  for (const id of ["hm-calc-tangent-ppq-001", "hm-calc-tangent-ppq-002", "hm-calc-tangent-ppq-003", "hm-calc-tangent-ppq-004"]) {
    const classification = classifications.find((c) => c.questionId === id)!;
    assert.deepEqual(classification.blockers.map((b) => b.code), ["undeclared_multi_field_assessment"], id);
  }
});

test("the six repaired multi-field PPQs each declare exactly one assessed field matching their learner-facing final answer", () => {
  const bank = loadBank("chain-rule-v6.md");
  const expectedAssessed: Record<string, { assessedId: string; correctAnswer: string; scaffoldingIds: string[] }> = {
    "hm-calc-diff-chain-ppq-015": { assessedId: "gradient", correctAnswer: "810", scaffoldingIds: ["derivative"] },
    "hm-calc-diff-chain-ppq-016": { assessedId: "gradient", correctAnswer: "432", scaffoldingIds: ["derivative"] },
    "hm-calc-diff-chain-ppq-018": { assessedId: "f_prime_3", correctAnswer: "168", scaffoldingIds: ["derivative"] },
    "hm-calc-diff-chain-ppq-019": { assessedId: "x_value", correctAnswer: "-1", scaffoldingIds: ["derivative", "gradient_equation"] },
    "hm-calc-diff-chain-ppq-020": { assessedId: "x_value", correctAnswer: "2", scaffoldingIds: ["derivative", "substituted_equation"] },
    "hm-calc-diff-chain-ppq-021": { assessedId: "coefficient", correctAnswer: "2", scaffoldingIds: ["derivative", "gradient_equation"] },
  };
  for (const [id, expected] of Object.entries(expectedAssessed)) {
    const question = bank.questions.find((item) => item.id === id)!;
    const assessed = question.answerCandidates.filter((candidate) => candidate.assessed === true);
    const scaffolding = question.answerCandidates.filter((candidate) => candidate.assessed === false);
    assert.equal(assessed.length, 1, id);
    assert.equal(assessed[0].id, expected.assessedId, id);
    assert.equal(assessed[0].correctAnswer, expected.correctAnswer, id);
    assert.deepEqual(assessed[0].acceptedAnswers, [expected.correctAnswer], id);
    assert.deepEqual(scaffolding.map((candidate) => candidate.id).sort(), expected.scaffoldingIds.sort(), id);
    assert.equal(assessed.length + scaffolding.length, question.answerCandidates.length, id);

    const classification = auditBankAssessment(bank).find((item) => item.questionId === id)!;
    assert.ok(!classification.blockers.some((b) => b.code === "undeclared_multi_field_assessment"), id);
    assert.notEqual(classification.status, "blocked", id);
    assert.ok(classification.conversions.includes("explicit_scaffolding_field_drop"), id);
  }
});

test("ppq-012 and ppq-017 — the last two multi-field PPQs — now declare exactly one assessed field each, matching all six previously repaired multi-field PPQs", () => {
  const bank = loadBank("chain-rule-v6.md");
  const classifications = auditBankAssessment(bank);
  for (const id of ["hm-calc-diff-chain-ppq-012", "hm-calc-diff-chain-ppq-017"]) {
    const question = bank.questions.find((item) => item.id === id)!;
    const assessed = question.answerCandidates.filter((candidate) => candidate.assessed === true);
    const scaffolding = question.answerCandidates.filter((candidate) => candidate.assessed === false);
    assert.equal(assessed.length, 1, id);
    assert.equal(assessed.length + scaffolding.length, question.answerCandidates.length, id);

    const classification = classifications.find((item) => item.questionId === id)!;
    assert.ok(!classification.blockers.some((b) => b.code === "undeclared_multi_field_assessment"), id);
    assert.ok(classification.conversions.includes("explicit_scaffolding_field_drop"), id);
  }
  const undeclaredCount = classifications.filter((c) => c.blockers.some((b) => b.code === "undeclared_multi_field_assessment")).length;
  assert.equal(undeclaredCount, 0);
});

function candidate(answer: string, type: string, id = "answer"): ImportAnswerCandidate {
  return { id, label: id, type, correctAnswer: answer, acceptedAnswers: [answer] };
}
