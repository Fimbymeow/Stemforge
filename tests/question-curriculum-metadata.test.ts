import assert from "node:assert/strict";
import test from "node:test";
import { validateQuestionCurriculumMetadata, validateRequiredSkillsWithinPrerequisiteClosure } from "../lib/curriculum/question-curriculum-metadata";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import type { PrerequisiteRelationship } from "../lib/curriculum/prerequisite-graph";

const edges: PrerequisiteRelationship[] = [
  { relationshipId: "chain-rule-requires-basic-differentiation", skillPathId: "chain-rule", requiresSkillPathId: "basic-differentiation", strength: "hard" },
  { relationshipId: "basic-differentiation-requires-algebra-foundations", skillPathId: "basic-differentiation", requiresSkillPathId: "algebra-foundations", strength: "soft" },
];

test("valid metadata with an empty requiredSkillIds passes shape validation", () => {
  const report = validateQuestionCurriculumMetadata({ primarySkillId: "basic-differentiation", requiredSkillIds: [] });
  assert.deepEqual(report.errors, []);
});

test("an invalid primarySkillId fails shape validation", () => {
  const report = validateQuestionCurriculumMetadata({ primarySkillId: "Not A Valid ID", requiredSkillIds: [] });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-primaryskillid-id"));
});

test("a requiredSkillIds entry naming the primary skill's direct prerequisite passes closure validation", () => {
  const report = validateRequiredSkillsWithinPrerequisiteClosure(
    { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
    edges,
  );
  assert.deepEqual(report.errors, []);
});

test("a requiredSkillIds entry naming a TRANSITIVE (two-hop) prerequisite passes closure validation", () => {
  const report = validateRequiredSkillsWithinPrerequisiteClosure(
    { primarySkillId: "chain-rule", requiredSkillIds: ["algebra-foundations"] },
    edges,
  );
  assert.deepEqual(report.errors, [], "algebra-foundations is basic-differentiation's prerequisite, and basic-differentiation is chain-rule's prerequisite — the closure is transitive by design");
});

test("a requiredSkillIds entry naming an undeclared skill fails as future-skill contamination", () => {
  const report = validateRequiredSkillsWithinPrerequisiteClosure(
    { primarySkillId: "chain-rule", requiredSkillIds: ["optimisation"] },
    edges,
  );
  assert.ok(report.errors.some((issue) => issue.code === "required-skill-outside-prerequisite-closure"));
});

test("the primary skill itself is always allowed in requiredSkillIds", () => {
  const report = validateRequiredSkillsWithinPrerequisiteClosure(
    { primarySkillId: "chain-rule", requiredSkillIds: ["chain-rule"] },
    edges,
  );
  assert.deepEqual(report.errors, []);
});

// ---- Real Tangents question-level dependency policy ----
// This validator's closure invariant is for boundary-review sanity-checking (see
// basic-differentiation-question-review.ts and tests/curriculum-boundary-review.test.ts),
// not for representing a skill's own conditional per-question dependencies. Chain Rule's and
// Trigonometric Differentiation's conditional relevance to some Tangents questions is
// deliberately outside Tangents' real prerequisite closure — that policy belongs to a future
// Tangents skill package's questionLevelRequirements (lib/curriculum/skill-package.ts),
// mirroring chain-rule-package.ts's existing declaration, and is asserted there once that
// package exists — not here, and not via a graph edge of any strength.

test("a Tangents question cannot declare Chain Rule, Trigonometric Differentiation, or any other unrelated skill as required, against the real prerequisite graph", () => {
  for (const unrelatedSkillId of ["chain-rule", "trigonometric-differentiation", "optimisation"]) {
    const report = validateRequiredSkillsWithinPrerequisiteClosure(
      { primarySkillId: "tangents-and-normals", requiredSkillIds: [unrelatedSkillId] },
      higherMathematicsCalculusPrerequisites,
    );
    assert.ok(
      report.errors.some((issue) => issue.code === "required-skill-outside-prerequisite-closure"),
      `expected "${unrelatedSkillId}" to be outside Tangents' real prerequisite closure`,
    );
  }
});

test("a Tangents question may still declare its own real hard prerequisite, basic-differentiation, as required", () => {
  const report = validateRequiredSkillsWithinPrerequisiteClosure(
    { primarySkillId: "tangents-and-normals", requiredSkillIds: ["basic-differentiation"] },
    higherMathematicsCalculusPrerequisites,
  );
  assert.deepEqual(report.errors, []);
});
