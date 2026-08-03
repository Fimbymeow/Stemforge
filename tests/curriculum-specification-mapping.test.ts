import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSpecificationCoverageClaim,
  validateSpecificationCoverageClaims,
} from "../lib/curriculum/specification-mapping";
import type { SpecificationCoverageClaim } from "../lib/curriculum/specification-mapping";
import type { VerifiedSpecificationPoint } from "../lib/curriculum/specification-register";
import { higherMathematicsCalculusCoverageClaims } from "../data/curriculum/higher-mathematics/calculus-coverage-claims";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { proposedCalculusSkillPathIds } from "../data/curriculum/higher-mathematics/calculus-skill-map";

function point(specPointId: string, areaId = "test-area"): VerifiedSpecificationPoint {
  return {
    verificationStatus: "verified",
    specPointId,
    courseId: "higher-maths",
    areaId,
    officialReference: { documentId: "test-doc", section: "Test section" },
    officialStatement: "A test official statement.",
    authoringSummary: "A test authoring summary.",
    mandatory: true,
    status: "active",
  };
}

function claim(overrides: Partial<SpecificationCoverageClaim> = {}): SpecificationCoverageClaim {
  return {
    claimId: "claim-a",
    specPointId: "spec-point-a",
    summary: "A test claim summary.",
    primarySkillId: "skill-a",
    reinforcedBySkillIds: [],
    status: "active",
    ...overrides,
  };
}

const twoPoints = [point("spec-point-a"), point("spec-point-b")];
const knownSkills = new Set(["skill-a", "skill-b", "skill-c"]);

test("a well-formed claim passes shape validation with no errors", () => {
  const report = validateSpecificationCoverageClaim(claim());
  assert.deepEqual(report.errors, []);
});

test("two distinct claim IDs may legitimately share one specification point and one primary skill", () => {
  const claims = [
    claim({ claimId: "claim-find", specPointId: "spec-point-a", primarySkillId: "skill-a", summary: "Covers finding the thing." }),
    claim({ claimId: "claim-classify", specPointId: "spec-point-a", primarySkillId: "skill-a", summary: "Covers classifying the thing." }),
  ];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.deepEqual(report.errors, []);
});

test("two distinct claim IDs sharing one specification point, one primary skill, AND identical summaries still pass — summary is never used as a uniqueness signal", () => {
  const claims = [
    claim({ claimId: "claim-one", specPointId: "spec-point-a", primarySkillId: "skill-a", summary: "Identical wording." }),
    claim({ claimId: "claim-two", specPointId: "spec-point-a", primarySkillId: "skill-a", summary: "Identical wording." }),
  ];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.deepEqual(report.errors, []);
});

test("duplicate claim IDs fail — this is the only duplication rule the schema enforces", () => {
  const claims = [
    claim({ claimId: "claim-a", specPointId: "spec-point-a", primarySkillId: "skill-a" }),
    claim({ claimId: "claim-a", specPointId: "spec-point-b", primarySkillId: "skill-b", summary: "Completely different claim, same ID." }),
  ];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-claim-id"));
  assert.equal(report.errors.filter((issue) => issue.code === "duplicate-primary-ownership").length, 0);
});

test("an unknown specification point ID fails", () => {
  const claims = [claim({ specPointId: "not-a-real-spec-point" })];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.ok(report.errors.some((issue) => issue.code === "unknown-spec-point"));
});

test("an unknown primary skill ID fails", () => {
  const claims = [claim({ primarySkillId: "not-a-real-skill" })];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.ok(report.errors.some((issue) => issue.code === "unknown-primary-skill"));
});

test("an unknown related (reinforcedBySkillIds) skill ID fails", () => {
  const claims = [claim({ reinforcedBySkillIds: ["skill-b", "not-a-real-skill"] })];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.ok(report.errors.some((issue) => issue.code === "unknown-reinforcement-skill"));
});

test("a known primarySkillId and known reinforcedBySkillIds produce no unknown-skill errors", () => {
  const claims = [claim({ primarySkillId: "skill-a", reinforcedBySkillIds: ["skill-b", "skill-c"] })];
  const report = validateSpecificationCoverageClaims(claims, twoPoints, knownSkills);
  assert.equal(report.errors.filter((issue) => issue.code === "unknown-primary-skill" || issue.code === "unknown-reinforcement-skill").length, 0);
});

test("the authored 21-claim Higher Maths Calculus mapping validates with no errors against its real specification points and proposed skill IDs", () => {
  const report = validateSpecificationCoverageClaims(
    higherMathematicsCalculusCoverageClaims,
    higherMathematicsSpecificationRegister.points,
    new Set(proposedCalculusSkillPathIds),
  );
  assert.deepEqual(report.errors, []);
  assert.equal(higherMathematicsCalculusCoverageClaims.length, 21);
});

test("claim-stationary-find and claim-stationary-nature legitimately share one specification point and one primary skill in the real authored mapping", () => {
  const find = higherMathematicsCalculusCoverageClaims.find((entry) => entry.claimId === "claim-stationary-find");
  const nature = higherMathematicsCalculusCoverageClaims.find((entry) => entry.claimId === "claim-stationary-nature");
  assert.ok(find && nature);
  assert.notEqual(find.claimId, nature.claimId);
  assert.equal(find.specPointId, nature.specPointId);
  assert.equal(find.primarySkillId, nature.primarySkillId);
  assert.equal(find.primarySkillId, "stationary-points");
});
