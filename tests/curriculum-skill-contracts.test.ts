import assert from "node:assert/strict";
import test from "node:test";
import {
  basicDifferentiationContract,
  chainRuleContract,
  higherMathematicsCalculusSkillContracts,
  trigonometricDifferentiationContract,
} from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
import { validateCanonicalSkillContract, validateCanonicalSkillContracts } from "../lib/curriculum/skill-contracts";
import type { CanonicalSkillContract } from "../lib/curriculum/skill-contracts";

function cloneContracts(): CanonicalSkillContract[] {
  return structuredClone(higherMathematicsCalculusSkillContracts);
}

test("the three authored Phase 1 contracts all validate with no errors", () => {
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
