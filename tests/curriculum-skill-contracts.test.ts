import assert from "node:assert/strict";
import test from "node:test";
import {
  basicDifferentiationContract,
  chainRuleContract,
  higherMathematicsCalculusSkillContracts,
  tangentsAndNormalsContract,
  trigonometricDifferentiationContract,
} from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { proposedCalculusSkillPathIds } from "../data/curriculum/higher-mathematics/calculus-skill-map";
import { validateCanonicalSkillContract, validateCanonicalSkillContracts } from "../lib/curriculum/skill-contracts";
import { validatePrerequisiteGraph } from "../lib/curriculum/prerequisite-graph";
import type { CanonicalSkillContract } from "../lib/curriculum/skill-contracts";

function cloneContracts(): CanonicalSkillContract[] {
  return structuredClone(higherMathematicsCalculusSkillContracts);
}

test("the four authored contracts all validate with no errors", () => {
  const report = validateCanonicalSkillContracts(cloneContracts());
  assert.deepEqual(report.errors, []);
});

test("Basic Differentiation has no prerequisites; Chain Rule and Trigonometric Differentiation both hard-require it", () => {
  assert.deepEqual(basicDifferentiationContract.prerequisiteSkillIds, []);
  assert.deepEqual(chainRuleContract.prerequisiteSkillIds, ["basic-differentiation"]);
  assert.deepEqual(trigonometricDifferentiationContract.prerequisiteSkillIds, ["basic-differentiation"]);
});

test("Chain Rule does not declare Trigonometric Differentiation as a skill-level prerequisite", () => {
  assert.ok(!chainRuleContract.prerequisiteSkillIds.includes("trigonometric-differentiation"));
});

test("Chain Rule's forbidden ingredients list every named future skill", () => {
  const forbidden = chainRuleContract.forbiddenIngredients.join(" ");
  for (const term of ["Product Rule", "Quotient Rule", "Implicit Differentiation", "Optimisation", "stationary-point classification"]) {
    assert.ok(forbidden.includes(term), `expected "${term}" in Chain Rule's forbidden ingredients`);
  }
});

test("a self-referencing prerequisite fails validation", () => {
  const contract = structuredClone(basicDifferentiationContract);
  contract.prerequisiteSkillIds = [contract.skillPathId];
  const report = validateCanonicalSkillContract(contract);
  assert.ok(report.errors.some((issue) => issue.code === "prerequisite-self-reference"));
});

test("an empty boundaries.includes fails validation", () => {
  const contract = structuredClone(basicDifferentiationContract);
  contract.boundaries.includes = [];
  const report = validateCanonicalSkillContract(contract);
  assert.ok(report.errors.some((issue) => issue.code === "empty-boundary-includes"));
});

test("an empty boundaries.excludes warns but does not error", () => {
  const contract = structuredClone(basicDifferentiationContract);
  contract.boundaries.excludes = [];
  const report = validateCanonicalSkillContract(contract);
  assert.ok(report.warnings.some((issue) => issue.code === "empty-boundary-excludes"));
  assert.ok(!report.errors.some((issue) => issue.code === "empty-boundary-excludes"));
});

test("duplicate skillPathId across a contract set fails validation", () => {
  const contracts = cloneContracts();
  contracts.push(structuredClone(contracts[0]));
  const report = validateCanonicalSkillContracts(contracts);
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-skill-contract"));
});

test("an invalid contractRevision fails validation", () => {
  const contract = structuredClone(basicDifferentiationContract);
  contract.contractRevision = 0;
  const report = validateCanonicalSkillContract(contract);
  assert.ok(report.errors.some((issue) => issue.code === "invalid-contractrevision"));
});

// ---- Tangents contract: identity ----

test("a full contract exists for tangents-and-normals, with its learner-facing name and technical slug both preserved", () => {
  assert.equal(tangentsAndNormalsContract.skillPathId, "tangents-and-normals");
  assert.equal(tangentsAndNormalsContract.name, "Tangents");
});

test("the full Calculus contract count is now exactly four, including Tangents", () => {
  assert.equal(higherMathematicsCalculusSkillContracts.length, 4);
  assert.deepEqual(
    higherMathematicsCalculusSkillContracts.map((contract) => contract.skillPathId).sort(),
    ["basic-differentiation", "chain-rule", "tangents-and-normals", "trigonometric-differentiation"],
  );
});

// ---- Tangents contract: scope ----

test("the Tangents objective and boundaries cover tangent gradient and tangent equation, and nothing else", () => {
  const objective = tangentsAndNormalsContract.learningObjective.toLowerCase();
  assert.ok(objective.includes("gradient"));
  assert.ok(objective.includes("tangent"));
  const includes = tangentsAndNormalsContract.boundaries.includes.join(" ").toLowerCase();
  assert.ok(includes.includes("gradient"));
  assert.ok(includes.includes("tangent"));
});

test("normals are explicitly excluded from the Tangents contract, and nowhere named as included", () => {
  const excludes = tangentsAndNormalsContract.boundaries.excludes.join(" ").toLowerCase();
  assert.ok(excludes.includes("normal"));
  const includes = tangentsAndNormalsContract.boundaries.includes.join(" ").toLowerCase();
  assert.ok(!includes.includes("normal"));
  const forbidden = tangentsAndNormalsContract.forbiddenIngredients.join(" ").toLowerCase();
  assert.ok(forbidden.includes("normal"));
});

test("Tangents excludes teaching Chain Rule, Basic Differentiation, stationary points and optimisation", () => {
  const excludes = tangentsAndNormalsContract.boundaries.excludes.join(" ").toLowerCase();
  assert.ok(excludes.includes("chain rule"));
  assert.ok(excludes.includes("basic differentiation"));
  assert.ok(excludes.includes("stationary-point") || excludes.includes("stationary point"));
  assert.ok(excludes.includes("optimisation"));
});

test("Tangents' misconceptions are its own — none duplicate Chain Rule's named misconceptions", () => {
  const tangentsMisconceptions = tangentsAndNormalsContract.typicalMisconceptions.join(" ").toLowerCase();
  assert.ok(!tangentsMisconceptions.includes("inner function"), "omitting the inner derivative is a Chain Rule misconception, not a Tangents one");
  assert.ok(!tangentsMisconceptions.includes("normal"), "normals are out of scope, so no normal-vs-tangent-gradient misconception is listed");
});

// ---- Tangents contract: dependencies ----

test("Basic Differentiation is Tangents' only hard prerequisite", () => {
  assert.deepEqual(tangentsAndNormalsContract.prerequisiteSkillIds, ["basic-differentiation"]);
});

test("Chain Rule and Trigonometric Differentiation are not universal (contract-level) prerequisites of Tangents", () => {
  assert.ok(!tangentsAndNormalsContract.prerequisiteSkillIds.includes("chain-rule"));
  assert.ok(!tangentsAndNormalsContract.prerequisiteSkillIds.includes("trigonometric-differentiation"));
});

test("the real prerequisite graph has exactly one hard edge for Tangents (basic-differentiation), and it validates with no errors", () => {
  const hardEdges = higherMathematicsCalculusPrerequisites.filter((edge) => edge.skillPathId === "tangents-and-normals" && edge.strength === "hard");
  assert.deepEqual(hardEdges.map((edge) => edge.requiresSkillPathId), ["basic-differentiation"]);
  const report = validatePrerequisiteGraph(higherMathematicsCalculusPrerequisites, higherMathematicsCalculusSkillContracts, new Set(proposedCalculusSkillPathIds));
  assert.deepEqual(report.errors, []);
});

test("Tangents has no soft prerequisite edges — conditional Chain Rule / Trigonometric Differentiation dependencies belong to a future skill package's questionLevelRequirements, never to this graph", () => {
  const tangentsEdges = higherMathematicsCalculusPrerequisites.filter((edge) => edge.skillPathId === "tangents-and-normals");
  assert.equal(tangentsEdges.length, 1, "Tangents should have exactly one edge in the real graph");
  assert.deepEqual(tangentsEdges[0], {
    relationshipId: "tangents-and-normals-requires-basic-differentiation",
    skillPathId: "tangents-and-normals",
    requiresSkillPathId: "basic-differentiation",
    strength: "hard",
  });
});

test("no soft-strength edge exists anywhere in the real Calculus prerequisite graph", () => {
  assert.ok(
    !higherMathematicsCalculusPrerequisites.some((edge) => edge.strength === "soft"),
    "soft edges have no established product meaning in this repository — see the doc comment on higherMathematicsCalculusPrerequisites",
  );
});

// ---- Non-regression ----

test("the pre-existing Chain Rule, Basic Differentiation and Trigonometric Differentiation contracts are unchanged by adding Tangents", () => {
  assert.deepEqual(chainRuleContract.prerequisiteSkillIds, ["basic-differentiation"]);
  assert.equal(chainRuleContract.skillPathId, "chain-rule");
  assert.deepEqual(basicDifferentiationContract.prerequisiteSkillIds, []);
  assert.equal(basicDifferentiationContract.skillPathId, "basic-differentiation");
  assert.deepEqual(trigonometricDifferentiationContract.prerequisiteSkillIds, ["basic-differentiation"]);
});
