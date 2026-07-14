import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent } from "../data/canonical-content";
import { higherMathsCalculusStrandIds } from "../data/higher-maths";
import { createContentResolver } from "../lib/content-resolver";
import { validateContent } from "../lib/content-validation";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";

const officialCalculusHeadings = [
  "Differentiating functions",
  "Using differentiation to investigate the nature and properties of functions",
  "Integrating functions",
  "Using integration to calculate definite integrals",
  "Applying differential calculus",
  "Applying integral calculus",
];

test("Higher Maths exposes the six official Calculus specification strands in explicit order", () => {
  const resolver = createContentResolver(canonicalContent);
  const course = resolver.getCourseArea("higher-maths", "calculus");
  assert.deepEqual(resolver.getSpecificationStrands(course).map((strand) => strand.name), officialCalculusHeadings);
  assert.equal(resolver.getPathContext("basic-differentiation")?.specificationStrand.id, higherMathsCalculusStrandIds.differentiatingFunctions);
});

test("every planned Calculus path resolves to one explicit strand", () => {
  const resolver = createContentResolver(canonicalContent);
  const expected = new Map([
    ["basic-differentiation", higherMathsCalculusStrandIds.differentiatingFunctions],
    ["chain-rule", higherMathsCalculusStrandIds.differentiatingFunctions],
    ["trigonometric-differentiation", higherMathsCalculusStrandIds.differentiatingFunctions],
    ["stationary-points", higherMathsCalculusStrandIds.investigatingFunctions],
    ["nature-of-stationary-points", higherMathsCalculusStrandIds.investigatingFunctions],
    ["tangents-and-normals", higherMathsCalculusStrandIds.investigatingFunctions],
    ["optimisation", higherMathsCalculusStrandIds.applyingDifferentialCalculus],
    ["basic-integration", higherMathsCalculusStrandIds.integratingFunctions],
    ["further-integration", higherMathsCalculusStrandIds.integratingFunctions],
    ["definite-integrals", higherMathsCalculusStrandIds.definiteIntegrals],
    ["differential-equations", higherMathsCalculusStrandIds.integratingFunctions],
    ["areas-using-integration", higherMathsCalculusStrandIds.applyingIntegralCalculus],
  ]);
  for (const [pathId, strandId] of expected) assert.equal(resolver.getPathContext(pathId)?.specificationStrand.id, strandId);
});

test("Basic differentiation resolves complete ownership and path-scoped navigation", () => {
  const resolver = createContentResolver(canonicalContent);
  const context = resolver.getQuestionContext("hm-calc-diff-basic-a-001");
  assert.ok(context);
  assert.equal(context.subject.subjectSlug, "higher-maths");
  assert.equal(context.courseArea.slug, "calculus");
  assert.equal(context.specificationStrand.name, "Differentiating functions");
  assert.equal(context.skillPath.slug, "basic-differentiation");
  assert.equal(context.stage.id, "basic-diff-stage-applications");
  assert.equal(context.previousQuestion?.id, "hm-calc-diff-basic-f-003");
  assert.equal(context.nextQuestion?.id, "hm-calc-diff-basic-a-002");
  assert.equal(context.questionIndexInPath, 3);
});

test("a test-only second path keeps sequencing, stage boundaries and completion destination isolated", () => {
  const resolver = createContentResolver(createTwoPathFixture());
  const first = resolver.getQuestionContext(fixtureIds.questions[0]);
  const boundary = resolver.getQuestionContext(fixtureIds.questions[1]);
  const final = resolver.getQuestionContext(fixtureIds.questions[2]);
  assert.ok(first && boundary && final);
  assert.equal(first.skillPath.slug, fixtureIds.path);
  assert.equal(first.previousQuestion, undefined);
  assert.equal(boundary.nextQuestion?.id, fixtureIds.questions[2]);
  assert.equal(boundary.nextStage?.id, fixtureIds.applicationsStage);
  assert.equal(final.nextQuestion, undefined);
  assert.equal(final.skillPath.href, "/subjects/higher-maths/calculus/integration/fixture-basic-integration");
  assert.ok(!final.pathQuestions.some((question) => question.skillPathId === "basic-differentiation"));
});

test("unknown, missing and archived relationships fail safely", () => {
  const source = createTwoPathFixture();
  const subject = source.subjects[0];
  const integration = subject.courseAreas[0].specAreas.find((topic) => topic.slug === "integration");
  const path = integration?.skillPaths?.find((candidate) => candidate.slug === fixtureIds.path);
  assert.ok(path);
  path.contentStatus = "archived";
  const resolver = createContentResolver(source);
  assert.equal(resolver.getPathContext(fixtureIds.path), undefined);
  assert.equal(resolver.getQuestionContext(fixtureIds.questions[0]), undefined);
  assert.equal(resolver.getQuestionContext("missing-question"), undefined);
});

test("taxonomy validation rejects invalid ownership, duplicate order and archived-parent leakage", () => {
  const invalidReference = createTwoPathFixture();
  const invalidPath = invalidReference.subjects[0].courseAreas[0].specAreas[1].skillPaths?.find((path) => path.slug === fixtureIds.path);
  assert.ok(invalidPath);
  invalidPath.specificationStrandId = "missing-strand";
  assert.ok(validateContent({ subjects: [...invalidReference.subjects], questions: [...invalidReference.questions] }).errors.some((issue) => issue.code === "invalid-specification-strand-reference"));

  const duplicateOrder = createTwoPathFixture();
  const strands = duplicateOrder.subjects[0].courseAreas[0].specificationStrands;
  assert.ok(strands);
  strands[1].displayOrder = strands[0].displayOrder;
  assert.ok(validateContent({ subjects: [...duplicateOrder.subjects], questions: [...duplicateOrder.questions] }).errors.some((issue) => issue.code === "duplicate-strand-display-order"));

  const archivedParent = createTwoPathFixture();
  const parent = archivedParent.subjects[0].courseAreas[0].specificationStrands?.find((strand) => strand.id === higherMathsCalculusStrandIds.integratingFunctions);
  assert.ok(parent);
  parent.contentStatus = "archived";
  assert.ok(validateContent({ subjects: [...archivedParent.subjects], questions: [...archivedParent.questions] }).errors.some((issue) => issue.code === "archived-parent-active-child"));
});

test("the representative two-path fixture is internally valid and remains test-only", () => {
  const source = createTwoPathFixture();
  assert.deepEqual(validateContent({ subjects: [...source.subjects], questions: [...source.questions] }).errors, []);
  assert.equal(createContentResolver(canonicalContent).getPathContext(fixtureIds.path), undefined);
});
