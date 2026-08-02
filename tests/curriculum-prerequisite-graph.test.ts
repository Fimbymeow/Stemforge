import assert from "node:assert/strict";
import test from "node:test";
import { higherMathematicsCalculusSkillContracts } from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { proposedCalculusSkillPathIds } from "../data/curriculum/higher-mathematics/calculus-skill-map";
import { validatePrerequisiteGraph, validatePrerequisiteRelationship } from "../lib/curriculum/prerequisite-graph";
import type { CanonicalSkillContract } from "../lib/curriculum/skill-contracts";
import type { PrerequisiteRelationship } from "../lib/curriculum/prerequisite-graph";

function cloneEdges(): PrerequisiteRelationship[] {
  return structuredClone(higherMathematicsCalculusPrerequisites);
}

function cloneContracts(): CanonicalSkillContract[] {
  return structuredClone(higherMathematicsCalculusSkillContracts);
}

const knownSkillIds = new Set(proposedCalculusSkillPathIds);

test("the authored Calculus prerequisite edges validate with no errors and produce a topological order", () => {
  const result = validatePrerequisiteGraph(cloneEdges(), cloneContracts(), knownSkillIds);
  assert.deepEqual(result.errors, []);
  assert.ok(result.topologicalOrder);
  const order = result.topologicalOrder!;
  assert.ok(order.indexOf("basic-differentiation") < order.indexOf("chain-rule"));
  assert.ok(order.indexOf("basic-differentiation") < order.indexOf("trigonometric-differentiation"));
  assert.ok(order.indexOf("basic-differentiation") < order.indexOf("stationary-points"));
});

test("a self-referencing edge fails validation", () => {
  const report = validatePrerequisiteRelationship({ relationshipId: "self-loop", skillPathId: "chain-rule", requiresSkillPathId: "chain-rule", strength: "hard" });
  assert.ok(report.errors.some((issue) => issue.code === "prerequisite-self-reference"));
});

test("a duplicate edge fails validation", () => {
  const edges = cloneEdges();
  edges.push({ ...structuredClone(edges[0]), relationshipId: "duplicate-of-first" });
  const result = validatePrerequisiteGraph(edges, cloneContracts());
  assert.ok(result.errors.some((issue) => issue.code === "duplicate-prerequisite-edge"));
});

test("a cycle is detected and no topological order is returned", () => {
  const edges: PrerequisiteRelationship[] = [
    { relationshipId: "a-requires-b", skillPathId: "skill-a", requiresSkillPathId: "skill-b", strength: "hard" },
    { relationshipId: "b-requires-c", skillPathId: "skill-b", requiresSkillPathId: "skill-c", strength: "hard" },
    { relationshipId: "c-requires-a", skillPathId: "skill-c", requiresSkillPathId: "skill-a", strength: "hard" },
  ];
  const result = validatePrerequisiteGraph(edges, []);
  assert.ok(result.errors.some((issue) => issue.code === "prerequisite-cycle"));
  assert.equal(result.topologicalOrder, undefined);
});

test("an edge referencing an unknown skill fails validation", () => {
  const edges = cloneEdges();
  edges.push({ relationshipId: "bad-edge", skillPathId: "chain-rule", requiresSkillPathId: "not-a-real-skill", strength: "soft" });
  const result = validatePrerequisiteGraph(edges, cloneContracts());
  assert.ok(result.errors.some((issue) => issue.code === "unknown-skill-id"));
});

test("removing a hard edge while the contract still declares the prerequisite is a mismatch", () => {
  const edges = cloneEdges().filter((edge) => edge.relationshipId !== "chain-rule-requires-basic-differentiation");
  const result = validatePrerequisiteGraph(edges, cloneContracts());
  assert.ok(result.errors.some((issue) => issue.code === "contract-prerequisite-missing-edge"));
});

test("a hard edge with no matching contract declaration is a mismatch", () => {
  const edges = cloneEdges();
  const contracts = cloneContracts();
  const chainRule = contracts.find((contract) => contract.skillPathId === "chain-rule")!;
  chainRule.prerequisiteSkillIds = [];
  const result = validatePrerequisiteGraph(edges, contracts);
  assert.ok(result.errors.some((issue) => issue.code === "edge-not-declared-in-contract"));
});

test("a prerequisite edge pointing at an archived skill produces a warning", () => {
  const edges = cloneEdges();
  const contracts = cloneContracts();
  const basicDifferentiation = contracts.find((contract) => contract.skillPathId === "basic-differentiation")!;
  basicDifferentiation.contentStatus = "archived";
  const result = validatePrerequisiteGraph(edges, contracts);
  assert.ok(result.warnings.some((issue) => issue.code === "archived-prerequisite-reference"));
});
