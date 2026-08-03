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

/**
 * Structural uniqueness for a SpecificationCoverageClaim set rests on exactly one honest
 * signal: claimId. A claimId can never be registered twice (checked below), and that is
 * the only fact this schema can assert about "duplication" without guessing at authorial
 * intent from free text.
 *
 * It is deliberately NOT an error for two distinct claims to share both specPointId and
 * primarySkillId. A compound specification point can legitimately be split into several
 * claims for several distinct assessable abilities, and two of those abilities can
 * legitimately map to the same canonical skill — for example, after a canonical-skill
 * merge collapses two previously-separate skills into one surviving identity, two claims
 * that used to target different skills now both target the survivor. This is a real,
 * current case in the Higher Maths Calculus mapping: claim-stationary-find and
 * claim-stationary-nature both reference specPointId "hm-calc-stationary-nature-sketching"
 * and primarySkillId "stationary-points", because "Stationary Points" and "Nature of
 * Stationary Points" merged into one skill, "Stationary Points and Their Nature", while
 * remaining two distinct official abilities (finding vs. classifying).
 *
 * An earlier version of this function tried to distinguish "genuine duplicate" from
 * "legitimate parallel claim" by also comparing the claims' summary text. That was
 * incorrect: summary is free-form prose written for humans, not a stable identifier, and
 * using it as a pseudo-identifier means two claims with coincidentally similar wording
 * could be wrongly flagged, while two genuinely duplicated claims with slightly reworded
 * summaries would wrongly pass. The schema has no field beyond claimId that can honestly
 * distinguish a duplicate from a deliberate split, so no such check is made here — dedupe
 * is enforced by claimId uniqueness alone; correctness of which abilities may share a
 * skill is a matter for curriculum review, not mechanical validation.
 */
export function validateSpecificationCoverageClaims(
  claims: SpecificationCoverageClaim[],
  points: SpecificationPoint[],
  /** Every valid canonical skill ID a claim's primarySkillId or reinforcedBySkillIds may reference. */
  knownSkillIds: Set<string>,
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

  claims.forEach((claim) => {
    const location = `curriculum/coverage-claim/${claim.claimId}`;
    if (isValidId(claim.primarySkillId) && !knownSkillIds.has(claim.primarySkillId)) {
      issue("error", "unknown-primary-skill", `Claim "${claim.claimId}" primarySkillId "${claim.primarySkillId}" is not a known canonical skill.`, location);
    }
    (claim.reinforcedBySkillIds ?? []).forEach((skillId, index) => {
      if (isValidId(skillId) && !knownSkillIds.has(skillId)) {
        issue("error", "unknown-reinforcement-skill", `Claim "${claim.claimId}" reinforcedBySkillIds[${index}] "${skillId}" is not a known canonical skill.`, location);
      }
    });
  });

  return finalizeReport(issues);
}

export function getActiveClaims(claims: SpecificationCoverageClaim[]) {
  return claims.filter((claim) => claim.status === "active");
}

export function getClaimsForPoint(claims: SpecificationCoverageClaim[], specPointId: string) {
  return getActiveClaims(claims).filter((claim) => claim.specPointId === specPointId);
}
