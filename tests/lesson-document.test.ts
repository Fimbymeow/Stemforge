import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsDifferentiationQuestions } from "../content/questions/higher-maths/basic-differentiation";
import { higherMaths } from "../data/higher-maths";
import { basicDifferentiationLesson } from "../data/lessons/basic-differentiation";
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
  for (const path of allPaths) {
    const result = resolveLessonDocument(path);
    if (path.slug === "basic-differentiation") assert.ok(result);
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

test("every callout semantic maps to the schema without creating extra block designs", () => {
  const semantics = ["definition", "formula", "key_idea", "common_mistake", "warning", "exam_tip", "memory_trick", "proof", "real_world_intuition", "challenge"] as const;
  for (const semantic of semantics) {
    const block: LessonBlock = { blockId: `callout-${semantic.replaceAll("_", "-")}`, type: "callout", semantic, title: semantic, content: "Content" };
    assert.equal(validateLessonBlock(block).valid, true);
  }
});
