import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMaths } from "../data/higher-maths";
import { basicDifferentiationLesson } from "../data/lessons/basic-differentiation";
import { chainRuleLesson } from "../data/lessons/chain-rule";
import type { LessonBlock, LessonDocument } from "../lib/lessons/types";
import {
  estimateLessonReadingMinutes,
  getLessonBlockHighlightEligibility,
  getLessonBlockPlainText,
  getMalformedBlockDisposition,
  validateLessonBlock,
  validateLessonDocument,
} from "../lib/lessons/lesson-document";
import { adaptLegacyResourcesToLessonDocument } from "../lib/lessons/legacy-adapter";
import { resolveLessonDocument } from "../lib/lessons/resolver";
import { validateContent } from "../lib/content-validation";

const basicPath = higherMaths.courseAreas.flatMap((course) => course.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
assert.ok(basicPath);

test("native Basic Differentiation lesson is valid, ordered and explicitly closed", () => {
  const result = validateLessonDocument(basicDifferentiationLesson);
  assert.deepEqual(result.issues, []);
  assert.equal(basicDifferentiationLesson.schemaVersion, 1);
  assert.equal(basicDifferentiationLesson.skillPathId, basicPath.slug);
  assert.equal(basicDifferentiationLesson.closure.foundationsHref, "/question/hm-calc-diff-basic-f-001");
  assert.equal(basicDifferentiationLesson.closure.confidencePrompt, undefined);
  assert.equal(basicDifferentiationLesson.blocks.some((block) => block.type === "callout" && block.semantic === "exam_tip"), false);
  assert.equal(basicDifferentiationLesson.estimatedReadingMinutes, estimateLessonReadingMinutes(basicDifferentiationLesson.blocks));
});

test("schema V1 validates every supported block type", () => {
  const blocks: LessonBlock[] = [
    { blockId: "heading", type: "heading", level: 2, text: "Heading" },
    { blockId: "prose", type: "prose", content: "Plain explanation." },
    { blockId: "callout", type: "callout", semantic: "proof", title: "Proof", content: "Reasoning", defaultCollapsed: true },
    { blockId: "example", type: "worked_example", title: "Example", prompt: "Do this", steps: [{ title: "Step", body: "Working" }], finalAnswer: "Answer" },
    { blockId: "figure", type: "figure", title: "Graph", description: "A graph", figure: { kind: "graph", viewport: { xMin: -1, xMax: 1, yMin: -1, yMax: 1 }, functions: [{ id: "f", expression: { type: "constant", value: { numerator: 0, denominator: 1 } }, styleRole: "primary" }] } },
    { blockId: "check", type: "self_check", title: "Check", prompt: "Question", answer: "Answer" },
  ];
  for (const block of blocks) assert.deepEqual(validateLessonBlock(block).issues, []);
});

test("lesson graph figures reject invalid bounds and duplicate functions", () => {
  const graphBlock = {
    blockId: "invalid-graph",
    type: "figure",
    title: "Invalid graph",
    description: "Validation fixture",
    figure: {
      kind: "graph",
      viewport: { xMin: 1, xMax: -1, yMin: -1, yMax: 1 },
      functions: [
        { id: "f", expression: { type: "constant", value: { numerator: 0, denominator: 1 } }, styleRole: "primary" },
        { id: "f", expression: { type: "constant", value: { numerator: 1, denominator: 1 } }, styleRole: "secondary" },
      ],
    },
  } as unknown as LessonBlock;
  const codes = validateLessonBlock(graphBlock).issues.map((issue) => issue.code);
  assert.ok(codes.includes("invalid-graph-viewport"));
  assert.ok(codes.includes("invalid-graph-function-id"));
});

test("invalid schema, IDs, duplicate blocks, section anchors and closure aggregate precise issues", () => {
  const invalid = structuredClone(basicDifferentiationLesson) as unknown as Record<string, unknown>;
  invalid.schemaVersion = 2;
  invalid.lessonId = "Bad ID";
  const blocks = invalid.blocks as Array<Record<string, unknown>>;
  blocks[1].blockId = blocks[0].blockId;
  invalid.sections = [{ sectionId: "bad-section", title: "Missing", anchorBlockId: "missing-block" }];
  delete invalid.closure;
  const codes = validateLessonDocument(invalid).issues.map((issue) => issue.code);
  assert(codes.includes("invalid-schema-version"));
  assert(codes.includes("invalid-stable-id"));
  assert(codes.includes("duplicate-block-id"));
  assert(codes.includes("invalid-section-anchor"));
  assert(codes.includes("missing-closure"));
});

test("legacy adaptation is deterministic, preserves every resource ID and does not synthesize sections", () => {
  const legacyPath = structuredClone(basicPath);
  delete legacyPath.lessonDocument;
  const first = adaptLegacyResourcesToLessonDocument(legacyPath);
  const second = adaptLegacyResourcesToLessonDocument(legacyPath);
  assert.deepEqual(first, second);
  assert.ok(first);
  assert.equal(first.sections, undefined);
  const expectedIds = [
    ...(legacyPath.notes ?? []),
    ...(legacyPath.formulaCards ?? []),
    ...(legacyPath.workedExamples ?? []),
  ].map((resource) => resource.id).sort();
  assert.deepEqual(first.blocks.map((block) => block.blockId).sort(), expectedIds);
});

test("lesson resolution prefers native, adapts legacy and returns null for empty placeholders", () => {
  assert.equal(resolveLessonDocument(basicPath)?.source, "native");
  const legacyPath = structuredClone(basicPath);
  delete legacyPath.lessonDocument;
  assert.equal(resolveLessonDocument(legacyPath)?.source, "legacy_adapter");

  const allPaths = higherMaths.courseAreas.flatMap((course) => course.specAreas).flatMap((area) => area.skillPaths ?? []);
  const livePathSlugs = new Set(["basic-differentiation", "chain-rule"]);
  for (const path of allPaths) {
    const result = resolveLessonDocument(path);
    if (livePathSlugs.has(path.slug)) assert.ok(result);
    else assert.equal(result, null, `${path.slug} is an honest content placeholder`);
  }
});

test("future annotation text and eligibility are deterministic and block-local", () => {
  const example = basicDifferentiationLesson.blocks.find((block) => block.blockId === "basic-diff-example-polynomial");
  const formula = basicDifferentiationLesson.blocks.find((block) => block.blockId === "basic-diff-formula-power-rule");
  const selfCheck = basicDifferentiationLesson.blocks.find((block) => block.type === "self_check");
  assert.ok(example && formula && selfCheck);
  assert.equal(getLessonBlockPlainText(example), getLessonBlockPlainText(structuredClone(example)));
  assert.match(getLessonBlockPlainText(example), /Differentiate a polynomial\n/);
  assert.equal(getLessonBlockHighlightEligibility(example), "text");
  assert.equal(getLessonBlockHighlightEligibility(formula), "whole_block");
  assert.equal(getLessonBlockHighlightEligibility(selfCheck), "none");
  assert.doesNotMatch(getLessonBlockPlainText(formula), /\\frac/);
});

test("reading-time estimation is deterministic and rounds up", () => {
  const prose = (count: number): LessonBlock => ({ blockId: `words-${count}`, type: "prose", content: Array.from({ length: count }, () => "word").join(" ") });
  assert.equal(estimateLessonReadingMinutes([prose(1)]), 1);
  assert.equal(estimateLessonReadingMinutes([prose(200)]), 1);
  assert.equal(estimateLessonReadingMinutes([prose(201)]), 2);
});

test("malformed block handling diagnoses in development and stays calm in production", () => {
  const malformed = { blockId: "broken", type: "worked_example", title: "Broken" };
  const development = getMalformedBlockDisposition(malformed, "development");
  const production = getMalformedBlockDisposition(malformed, "production");
  assert.equal(development.action, "diagnostic");
  assert(development.issues.some((issue) => issue.code === "invalid-worked-steps"));
  assert.equal(production.action, "calm_fallback");
  assert.equal(getMalformedBlockDisposition({ blockId: "broken", type: "prose", content: "" }, "production").action, "omit");
});

test("content validation aggregates lesson schema and ownership failures", () => {
  const subject = structuredClone(higherMaths);
  const path = subject.courseAreas.flatMap((course) => course.specAreas).flatMap((area) => area.skillPaths ?? []).find((item) => item.slug === "basic-differentiation");
  assert.ok(path?.lessonDocument);
  path.lessonDocument.skillPathId = "wrong-path";
  path.lessonDocument.blocks.push(structuredClone(path.lessonDocument.blocks[0]));
  const report = validateContent({ subjects: [subject], questions: structuredClone(higherMathsDifferentiationQuestions) });
  assert(report.errors.some((issue) => issue.code === "lesson-skill-path-mismatch"));
  assert(report.errors.some((issue) => issue.code === "lesson-duplicate-block-id"));
});

const chainRulePath = higherMaths.courseAreas.flatMap((course) => course.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "chain-rule");
assert.ok(chainRulePath);

test("native Chain Rule lesson is valid, ordered and explicitly closed", () => {
  const result = validateLessonDocument(chainRuleLesson);
  assert.deepEqual(result.issues, []);
  assert.equal(chainRuleLesson.schemaVersion, 1);
  assert.equal(chainRuleLesson.skillPathId, chainRulePath.slug);
  assert.equal(chainRuleLesson.closure.foundationsHref, "/question/hm-calc-diff-chain-f-001");
  assert.equal(chainRuleLesson.estimatedReadingMinutes, estimateLessonReadingMinutes(chainRuleLesson.blocks));
});

test("the Chain Rule lesson is wired onto the now-live, imported skill path", () => {
  // Chain Rule's import completed (34 questions, 10/9/15 across three real learning stages) and
  // the skill path was atomically flipped to available in the same edit — see the Step 4 retry
  // report. lessonDocument now resolves to the real, previously-authored chainRuleLesson.
  assert.equal(chainRulePath.status, "available");
  assert.equal(chainRulePath.isAvailable, true);
  assert.equal(chainRulePath.lessonDocument, chainRuleLesson);
});

test("the Chain Rule lesson addresses both Notes-target misconceptions from the skill package adjudication", () => {
  const plainText = chainRuleLesson.blocks.map(getLessonBlockPlainText).join("\n");
  assert.match(plainText, /multiplying by the inside function itself rather than its derivative/i, "must name the multiplied-by-inner-function misconception explicitly");
  assert.match(plainText, /not the same shape as/i, "must name the composite-as-simple-power-rule misconception explicitly");
});

test("the Chain Rule lesson has a self-check with a verifiable worked answer", () => {
  const selfCheck = chainRuleLesson.blocks.find((block) => block.type === "self_check");
  assert.ok(selfCheck && selfCheck.type === "self_check");
  assert.match(selfCheck.answer, /36x\(3x\^2\+1\)\^2/);
});

test("every callout semantic maps to the schema without creating extra block designs", () => {
  const semantics = ["definition", "formula", "key_idea", "common_mistake", "warning", "exam_tip", "memory_trick", "proof", "real_world_intuition", "challenge"] as const;
  for (const semantic of semantics) {
    const block: LessonBlock = { blockId: `callout-${semantic.replaceAll("_", "-")}`, type: "callout", semantic, title: semantic, content: "Content" };
    assert.equal(validateLessonBlock(block).valid, true);
  }
});
