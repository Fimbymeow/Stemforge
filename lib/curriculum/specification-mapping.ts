import type { SpecificationPoint } from "@/lib/curriculum/specification-register";
import {
  CurriculumValidationReport,
  createIssueCollector,
  finalizeReport,
  findDuplicates,
  isValidId,
  requiredId,
  requiredText,
} from "@/lib/curriculum/validation-report";

/**
 * A SpecificationCoverageClaim records "this canonical skill is claimed to teach this
 * specification point" — a curriculum-mapping fact. It never asserts that the claimed
 * skill has been published to learners; curriculum mapping and product publication are
 * deliberately kept as two separate measures (see lib/curriculum/coverage.ts).
 */
export type SpecificationCoverageClaim = {
  claimId: string;
  specPointId: string;
  summary: string;
  primarySkillId: string;
  reinforcedBySkillIds: string[];
  status: "active" | "retired";
};

export function validateSpecificationCoverageClaim(claim: SpecificationCoverageClaim): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/coverage-claim/${claim.claimId ?? "unknown"}`;

  requiredId(claim.claimId, "claimId", location, issue);
  requiredId(claim.specPointId, "specPointId", location, issue);
  requiredText(claim.summary, "summary", location, issue);
  requiredId(claim.primarySkillId, "primarySkillId", location, issue);
  if (!Array.isArray(claim.reinforcedBySkillIds)) {
    issue("error", "invalid-reinforced-by", `Claim "${claim.claimId}" reinforcedBySkillIds must be an array.`, location);
  } else {
    if (claim.reinforcedBySkillIds.includes(claim.primarySkillId)) {
      issue("error", "primary-listed-as-reinforcement", `Claim "${claim.claimId}" lists its own primary skill "${claim.primarySkillId}" as a reinforcement.`, location);
    }
    findDuplicates(claim.reinforcedBySkillIds).forEach((duplicateId) =>
      issue("error", "duplicate-reinforcement", `Claim "${claim.claimId}" lists reinforcement "${duplicateId}" more than once.`, location));
    claim.reinforcedBySkillIds.forEach((skillId, index) => {
      if (!isValidId(skillId)) issue("error", "invalid-reinforcement-id", `Claim "${claim.claimId}" reinforcedBySkillIds[${index}] is not a valid stable ID.`, location);
    });
  }
  if (!["active", "retired"].includes(claim.status)) issue("error", "invalid-claim-status", `Claim "${claim.claimId}" status must be active or retired.`, location);

  return finalizeReport(issues);
}

export function validateSpecificationCoverageClaims(
  claims: SpecificationCoverageClaim[],
  points: SpecificationPoint[],
): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  claims.forEach((claim) => issues.push(...validateSpecificationCoverageClaim(claim).issues));

  findDuplicates(claims.map((claim) => claim.claimId)).forEach((duplicateId) =>
    issue("error", "duplicate-claim-id", `More than one claim declares claimId "${duplicateId}".`, "curriculum/coverage-claims"));

  const pointIds = new Set(points.map((point) => point.specPointId));
  claims.forEach((claim) => {
    if (isValidId(claim.specPointId) && !pointIds.has(claim.specPointId)) {
      issue("error", "unknown-spec-point", `Claim "${claim.claimId}" references unknown specification point "${claim.specPointId}".`, `curriculum/coverage-claim/${claim.claimId}`);
    }
  });

  // "Duplicate primary ownership": two distinct claims naming the exact same specPointId
  // AND the exact same primarySkillId are a literal duplicate, not a legitimate split
  // into distinct abilities (the shared-specPointId, different-primarySkillId case is
  // the intended, valid way to split one specification point into several claims).
  const seenPointAndPrimary = new Map<string, string>();
  claims.forEach((claim) => {
    const key = `${claim.specPointId}::${claim.primarySkillId}`;
    const existing = seenPointAndPrimary.get(key);
    if (existing) {
      issue("error", "duplicate-primary-ownership", `Claims "${existing}" and "${claim.claimId}" both claim primary ownership of "${claim.specPointId}" by "${claim.primarySkillId}".`, `curriculum/coverage-claim/${claim.claimId}`);
    } else {
      seenPointAndPrimary.set(key, claim.claimId);
    }
  });

  return finalizeReport(issues);
}

export function getActiveClaims(claims: SpecificationCoverageClaim[]) {
  return claims.filter((claim) => claim.status === "active");
}

export function getClaimsForPoint(claims: SpecificationCoverageClaim[], specPointId: string) {
  return getActiveClaims(claims).filter((claim) => claim.specPointId === specPointId);
}
