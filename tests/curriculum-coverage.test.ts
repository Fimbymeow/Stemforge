import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { higherMathematicsCalculusCoverageClaims } from "../data/curriculum/higher-mathematics/calculus-coverage-claims";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { higherMathematicsCalculusSkillContracts } from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
import { proposedCalculusSkillPathIds } from "../data/curriculum/higher-mathematics/calculus-skill-map";
import { higherMathematicsCalculusTeachingSequence } from "../data/curriculum/higher-mathematics/calculus-teaching-sequence";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { computeCurriculumCoverageReport, formatCurriculumCoverageReport } from "../lib/curriculum/coverage";

function liveCalculusSkillPaths() {
  const calculus = higherMaths.courseAreas.find((area) => area.slug === "calculus")!;
  return calculus.specAreas.flatMap((specArea) => specArea.skillPaths ?? []);
}

function buildReport() {
  return computeCurriculumCoverageReport({
    register: higherMathematicsSpecificationRegister,
    claims: higherMathematicsCalculusCoverageClaims,
    contracts: higherMathematicsCalculusSkillContracts,
    prerequisiteEdges: higherMathematicsCalculusPrerequisites,
    sequenceEntries: higherMathematicsCalculusTeachingSequence,
    proposedSkillPathIds: proposedCalculusSkillPathIds,
    liveSkillPaths: liveCalculusSkillPaths(),
  });
}

test("every active point is verified, and every verified point has at least one active coverage claim", () => {
  const report = buildReport();
  assert.equal(report.totalActiveSpecificationPoints, 19);
  assert.equal(report.verifiedSpecificationPointCount, 19);
  assert.equal(report.provisionalSpecificationPointCount, 0);
  assert.deepEqual(report.unmappedSpecificationPointIds, []);
  assert.equal(report.verifiedCoverageClaimsMapped.mapped, 21);
  assert.equal(report.verifiedCoverageClaimsMapped.total, 21);
  assert.equal(report.provisionalCoverageClaimsMapped.mapped, 0);
});

test("the report is verified, never authoritative while provisional points remain (none do here)", () => {
  const report = buildReport();
  assert.equal(report.authoritativeSourceStatus, "verified");
});

test("seventeen canonical skills are represented, and exactly the three authored ones have contracts", () => {
  const report = buildReport();
  assert.equal(report.canonicalSkillsRepresented.length, 17);
  assert.equal(report.skillContractsPresent.length, 3);
  assert.deepEqual(report.skillContractsPresent, ["basic-differentiation", "chain-rule", "trigonometric-differentiation"]);
  assert.equal(report.skillContractsMissing.length, 14);
});

test("no prerequisite contract is missing, and the prerequisite graph and recommended sequence are both valid", () => {
  const report = buildReport();
  assert.deepEqual(report.prerequisiteContractsMissing, []);
  assert.deepEqual(report.prerequisiteValidationErrors, []);
  assert.equal(report.recommendedSequenceValid, true);
  assert.deepEqual(report.recommendedSequenceErrors, []);
});

test("only Basic Differentiation is published, and it is correctly reported as such", () => {
  const report = buildReport();
  assert.deepEqual(report.publishedSkillPathIds, ["basic-differentiation"]);
  assert.equal(report.publishedProductCompleteness.published, 1);
  assert.equal(report.publishedProductCompleteness.total, 17);
});

test("curriculum-mapping completeness and published-product completeness are reported separately, never blended", () => {
  const report = buildReport();
  assert.equal(report.curriculumMappingCompleteness.defined, 3);
  assert.equal(report.publishedProductCompleteness.published, 1);
  assert.notEqual(report.curriculumMappingCompleteness.defined, report.publishedProductCompleteness.published);
});

test("the course is not reported complete, because contracts and publication are both far from total", () => {
  const report = buildReport();
  assert.equal(report.courseComplete, false);
});

test("after the 51 -> 49 migration, every proposed Calculus skill now has a live registry entry", () => {
  const report = buildReport();
  assert.deepEqual(report.proposedSkillsAbsentFromLiveRegistry, []);
});

test("the human-readable formatter distinguishes verified from provisional and never claims completeness", () => {
  const report = buildReport();
  const formatted = formatCurriculumCoverageReport(report);
  assert.ok(formatted.includes("Curriculum Coverage"));
  assert.ok(formatted.includes("Official specification source: verified"));
  assert.ok(formatted.includes("Verified specification points: 19"));
  assert.ok(formatted.includes("Provisional points remaining: 0"));
  assert.ok(formatted.includes("Prerequisite graph: valid"));
  assert.ok(formatted.includes("Recommended sequence: valid"));
  assert.ok(formatted.includes("Course complete: no"));
});

test("a report built from a register with a provisional point is never marked verified or complete", () => {
  const register = structuredClone(higherMathematicsSpecificationRegister);
  register.points.push({
    verificationStatus: "provisional",
    specPointId: "hm-calc-test-provisional-point",
    courseId: "higher-maths",
    areaId: register.areas[0].areaId,
    officialReference: null,
    officialStatement: null,
    authoringSummary: "a deliberately unverified test point",
    limitation: "added only to prove the report never overclaims verification",
    mandatory: false,
    status: "active",
  });
  const report = computeCurriculumCoverageReport({
    register,
    claims: higherMathematicsCalculusCoverageClaims,
    contracts: higherMathematicsCalculusSkillContracts,
    prerequisiteEdges: higherMathematicsCalculusPrerequisites,
    sequenceEntries: higherMathematicsCalculusTeachingSequence,
    proposedSkillPathIds: proposedCalculusSkillPathIds,
    liveSkillPaths: liveCalculusSkillPaths(),
  });
  assert.equal(report.provisionalSpecificationPointCount, 1);
  assert.equal(report.authoritativeSourceStatus, "partially_verified");
  assert.equal(report.courseComplete, false);
  const formatted = formatCurriculumCoverageReport(report);
  assert.ok(formatted.includes("partially verified"));
});
