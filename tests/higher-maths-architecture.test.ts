import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent } from "../data/canonical-content";
import { higherMaths } from "../data/higher-maths";
import { createContentResolver } from "../lib/content-resolver";
import { validateContent } from "../lib/content-validation";
import { deriveCourseDashboardSummary } from "../lib/dashboard-derivations";
import { deriveLearnerNextAction } from "../lib/learning/next-action";
import { discoverEligiblePracticeQuestions } from "../lib/practice/practice-eligibility";
import { queryAvailableQuestionBankQuestions } from "../lib/question-bank-query";
import { attempt, evidence } from "./progress-fixtures";

const existingCalculusPaths = [
  ["basic-differentiation", "differentiation", "/subjects/higher-maths/calculus/differentiation/basic-differentiation"],
  ["chain-rule", "differentiation", "/subjects/higher-maths/calculus/differentiation/chain-rule"],
  ["trigonometric-differentiation", "differentiation", "/subjects/higher-maths/calculus/differentiation/trigonometric-differentiation"],
  ["stationary-points", "differentiation", "/subjects/higher-maths/calculus/differentiation/stationary-points"],
  ["nature-of-stationary-points", "differentiation", "/subjects/higher-maths/calculus/differentiation/nature-of-stationary-points"],
  ["optimisation", "differentiation", "/subjects/higher-maths/calculus/differentiation/optimisation"],
  ["tangents-and-normals", "differentiation", "/subjects/higher-maths/calculus/differentiation/tangents-and-normals"],
  ["mixed-differentiation-practice", "differentiation", "/subjects/higher-maths/calculus/differentiation/mixed-differentiation-practice"],
  ["basic-integration", "integration", "/subjects/higher-maths/calculus/integration/basic-integration"],
  ["further-integration", "integration", "/subjects/higher-maths/calculus/integration/further-integration"],
  ["definite-integrals", "integration", "/subjects/higher-maths/calculus/integration/definite-integrals"],
  ["differential-equations", "integration", "/subjects/higher-maths/calculus/integration/differential-equations"],
  ["areas-using-integration", "integration", "/subjects/higher-maths/calculus/integration/areas-using-integration"],
] as const;

function allPathRecords() {
  return higherMaths.courseAreas.flatMap((courseArea) =>
    courseArea.specAreas.flatMap((specArea) =>
      (specArea.skillPaths ?? []).map((skillPath) => ({ courseArea, specArea, skillPath })),
    ),
  );
}

test("Higher Maths exposes the four approved course areas without a standalone Reasoning area", () => {
  assert.deepEqual(
    higherMaths.courseAreas.map((courseArea) => courseArea.name),
    ["Algebra and Trigonometry", "Vectors", "Calculus", "Lines, Circles and Sequences"],
  );
  assert.equal(higherMaths.courseAreas.some((courseArea) => courseArea.name === "Reasoning"), false);
});

test("every path resolves to a strand declared by its own course area", () => {
  for (const { courseArea, skillPath } of allPathRecords()) {
    assert.ok(
      courseArea.specificationStrands?.some((strand) => strand.id === skillPath.specificationStrandId),
      `${skillPath.slug} must resolve ${String(skillPath.specificationStrandId)} in ${courseArea.slug}`,
    );
  }
});

test("all 50 future paths are honest zero-contribution placeholders", () => {
  const placeholders = allPathRecords().filter(({ skillPath }) => !skillPath.isAvailable);
  assert.equal(placeholders.length, 50);
  for (const { skillPath } of placeholders) {
    assert.notEqual(skillPath.status, "available");
    assert.equal(skillPath.questions, 0);
    assert.equal(skillPath.completed, 0);
    assert.equal(skillPath.progress, 0);
    assert.equal(skillPath.learningStages?.length ?? 0, 0);
    assert.equal(skillPath.notes?.length ?? 0, 0);
    assert.equal(skillPath.formulaCards?.length ?? 0, 0);
    assert.equal(skillPath.workedExamples?.length ?? 0, 0);
    assert.equal(skillPath.flashcards?.length ?? 0, 0);
    assert.equal(skillPath.practiceSets?.length ?? 0, 0);
    assert.equal(skillPath.recommendedAction, undefined);
  }
});

test("Basic differentiation and every pre-Sprint-B Calculus path retain their identities", () => {
  const calculus = higherMaths.courseAreas.find((courseArea) => courseArea.slug === "calculus");
  assert.ok(calculus);
  const actual = calculus.specAreas.flatMap((specArea) =>
    (specArea.skillPaths ?? [])
      .filter((path) => existingCalculusPaths.some(([slug]) => slug === path.slug))
      .map((path) => [path.slug, specArea.slug, path.href]),
  );
  assert.deepEqual(actual, existingCalculusPaths);
  const basic = actual[0];
  assert.deepEqual(basic, [
    "basic-differentiation",
    "differentiation",
    "/subjects/higher-maths/calculus/differentiation/basic-differentiation",
  ]);
});

test("expanded taxonomy leaves learner completion totals and percentages unchanged", () => {
  const resolver = createContentResolver(canonicalContent);
  const allPaths = resolver.getAllPathContexts().map((context) => context.skillPath);
  const baselinePaths = allPaths.filter((path) => path.slug === "basic-differentiation");
  const completedEvidence = evidence(
    resolver.getPathQuestions("basic-differentiation").map((question, index) =>
      attempt({
        questionId: question.id,
        skillPathId: question.skillPathId,
        stageId: question.stageId,
        eventId: `architecture-complete-${index}`,
        sequence: index + 1,
        isCorrect: true,
      }),
    ),
  );
  const before = deriveCourseDashboardSummary(baselinePaths, completedEvidence, resolver.getQuestionVersions());
  const after = deriveCourseDashboardSummary(allPaths, completedEvidence, resolver.getQuestionVersions());
  assert.equal(before.totalQuestions, 8);
  assert.equal(after.totalQuestions, before.totalQuestions);
  assert.equal(after.completedQuestions, before.completedQuestions);
  assert.equal(after.completionPercentage, before.completionPercentage);
  assert.equal(after.availablePathCount, 1);
});

test("recommendations, practice and active Question Bank queries ignore placeholders", () => {
  const resolver = createContentResolver(canonicalContent);
  const next = deriveLearnerNextAction({ evidence: evidence(), source: canonicalContent });
  assert.equal(next.pathId, "basic-differentiation");
  const practice = discoverEligiblePracticeQuestions(canonicalContent);
  assert.deepEqual(new Set(practice.eligible.map((entry) => entry.reference.pathId)), new Set(["basic-differentiation"]));
  assert.equal(practice.eligible.length, 8);
  const bank = queryAvailableQuestionBankQuestions(resolver, evidence());
  assert.equal(bank.length, 8);
  assert(bank.every((entry) => entry.context.skillPath.slug === "basic-differentiation"));
});

test("content validation rejects broken strands, duplicate slugs and dishonest placeholders", () => {
  const missingStrand = structuredClone(higherMaths);
  missingStrand.courseAreas[0].specAreas[0].skillPaths![0].specificationStrandId = "missing-strand";
  assert(validateContent({ subjects: [missingStrand], questions: [...canonicalContent.questions] }).errors.some((issue) => issue.code === "invalid-specification-strand-reference"));

  const duplicateSlug = structuredClone(higherMaths);
  duplicateSlug.courseAreas[1].specAreas[0].skillPaths![0].slug = duplicateSlug.courseAreas[0].specAreas[0].skillPaths![0].slug;
  assert(validateContent({ subjects: [duplicateSlug], questions: [...canonicalContent.questions] }).errors.some((issue) => issue.code === "duplicate-skill-path-slug"));

  const availablePlaceholder = structuredClone(higherMaths);
  availablePlaceholder.courseAreas[0].specAreas[0].skillPaths![0].isAvailable = true;
  availablePlaceholder.courseAreas[0].specAreas[0].skillPaths![0].status = "available";
  assert(validateContent({ subjects: [availablePlaceholder], questions: [...canonicalContent.questions] }).errors.some((issue) => issue.code === "empty-path-marked-available"));

  const countedPlaceholder = structuredClone(higherMaths);
  countedPlaceholder.courseAreas[0].specAreas[0].skillPaths![0].questions = 1;
  assert(validateContent({ subjects: [countedPlaceholder], questions: [...canonicalContent.questions] }).errors.some((issue) => issue.code === "placeholder-enters-progress"));
});
