import assert from "node:assert/strict";
import test from "node:test";
import { higherMathematicsCalculusSkillContracts } from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { proposedCalculusSkillPathIds } from "../data/curriculum/higher-mathematics/calculus-skill-map";
import { higherMathematicsCalculusTeachingSequence } from "../data/curriculum/higher-mathematics/calculus-teaching-sequence";
import { validateCanonicalSkillSequence, validateCanonicalSkillSequences } from "../lib/curriculum/teaching-sequence";
import type { CanonicalSkillSequence } from "../lib/curriculum/teaching-sequence";
import type { CanonicalSkillContract } from "../lib/curriculum/skill-contracts";

function cloneEntries(): CanonicalSkillSequence[] {
  return structuredClone(higherMathematicsCalculusTeachingSequence);
}

function cloneContracts(): CanonicalSkillContract[] {
  return structuredClone(higherMathematicsCalculusSkillContracts);
}

const knownSkillIds = new Set(proposedCalculusSkillPathIds);

test("the authored Calculus teaching sequence validates with no errors", () => {
  const report = validateCanonicalSkillSequences(cloneEntries(), cloneContracts(), knownSkillIds);
  assert.deepEqual(report.errors, []);
});

test("recommended sequence order and prerequisite order may legitimately differ", () => {
  // Trigonometric Differentiation is taught second, but is not a prerequisite of Chain Rule
  // (only Basic Differentiation is) — the two models are independent by design.
  const sequenceOrder = cloneEntries()
    .filter((entry) => entry.skillPathId === "trigonometric-differentiation" || entry.skillPathId === "chain-rule")
    .sort((a, b) => a.recommendedOrder - b.recommendedOrder)
    .map((entry) => entry.skillPathId);
  assert.deepEqual(sequenceOrder, ["trigonometric-differentiation", "chain-rule"]);

  const chainRule = cloneContracts().find((contract) => contract.skillPathId === "chain-rule")!;
  assert.ok(!chainRule.prerequisiteSkillIds.includes("trigonometric-differentiation"));
  assert.deepEqual(
    higherMathematicsCalculusPrerequisites.filter((edge) => edge.skillPathId === "chain-rule").map((edge) => edge.requiresSkillPathId),
    ["basic-differentiation"],
  );
});

test("an invalid recommendedOrder fails validation", () => {
  const report = validateCanonicalSkillSequence({ courseId: "higher-maths", areaId: "differentiating-functions", skillPathId: "chain-rule", recommendedOrder: 0 });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-recommended-order"));
});

test("a sequence entry referencing an unknown skill fails validation", () => {
  const entries = cloneEntries();
  entries.push({ courseId: "higher-maths", areaId: "differentiating-functions", skillPathId: "not-a-real-skill", recommendedOrder: 99 });
  const report = validateCanonicalSkillSequences(entries, cloneContracts(), knownSkillIds);
  assert.ok(report.errors.some((issue) => issue.code === "unknown-sequence-skill"));
});

test("a duplicate order within the same area fails validation", () => {
  const entries = cloneEntries();
  entries.push({ courseId: "higher-maths", areaId: "differentiating-functions", skillPathId: "trigonometric-differentiation", recommendedOrder: 1 });
  const report = validateCanonicalSkillSequences(entries, cloneContracts(), knownSkillIds);
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-sequence-order"));
});

test("the same order number in two different areas is not a conflict", () => {
  // Every area's sequence restarts at 1 — order is scoped per area, not global.
  const entries = cloneEntries();
  const orderOnesByArea = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.recommendedOrder === 1) orderOnesByArea.set(entry.areaId, (orderOnesByArea.get(entry.areaId) ?? 0) + 1);
  });
  assert.ok(orderOnesByArea.size >= 2, "expected multiple areas to each have their own order-1 entry");
  const report = validateCanonicalSkillSequences(entries, cloneContracts(), knownSkillIds);
  assert.deepEqual(report.errors, []);
});

test("an archived skill placed in an active sequence fails validation", () => {
  const entries = cloneEntries();
  const contracts = cloneContracts();
  const basicDifferentiation = contracts.find((contract) => contract.skillPathId === "basic-differentiation")!;
  basicDifferentiation.contentStatus = "archived";
  const report = validateCanonicalSkillSequences(entries, contracts, knownSkillIds);
  assert.ok(report.errors.some((issue) => issue.code === "archived-skill-in-active-sequence"));
});
