import type { SkillPath } from "@/data/types";
import type { PrerequisiteRelationship } from "@/lib/curriculum/prerequisite-graph";
import { validatePrerequisiteGraph } from "@/lib/curriculum/prerequisite-graph";
import type { CanonicalSkillSequence } from "@/lib/curriculum/teaching-sequence";
import { validateCanonicalSkillSequences } from "@/lib/curriculum/teaching-sequence";
import type { CourseSpecificationRegister } from "@/lib/curriculum/specification-register";
import { getActiveAreas, getActivePoints, getProvisionalPoints, getVerifiedPoints } from "@/lib/curriculum/specification-register";
import type { CanonicalSkillContract } from "@/lib/curriculum/skill-contracts";
import type { SpecificationCoverageClaim } from "@/lib/curriculum/specification-mapping";
import { getActiveClaims, getClaimsForPoint } from "@/lib/curriculum/specification-mapping";

export type CurriculumCoverageReport = {
  courseId: string;
  registerVersion: number;
  generatedAt: string;

  totalActiveSpecificationAreas: number;

  /** Points verified against a stored, cited official source — never claimed authoritative if this is 0 and provisional points remain. */
  verifiedSpecificationPointCount: number;
  /** Points with no official wording at all — an honest, explicit gap, never silently merged into the verified count. */
  provisionalSpecificationPointCount: number;
  totalActiveSpecificationPoints: number;

  verifiedCoverageClaimsMapped: { mapped: number; total: number };
  provisionalCoverageClaimsMapped: { mapped: number; total: number };

  unmappedSpecificationPointIds: string[];

  canonicalSkillsRepresented: string[];
  skillContractsPresent: string[];
  skillContractsMissing: string[];

  prerequisiteContractsMissing: string[];
  prerequisiteValidationErrors: string[];
  recommendedSequenceValid: boolean;
  recommendedSequenceErrors: string[];

  proposedSkillsAbsentFromLiveRegistry: string[];

  publishedSkillPathIds: string[];
  unpublishedSkillPathIds: string[];

  /** Contracts defined / skills represented by an active coverage claim. Never blended with publication. */
  curriculumMappingCompleteness: { defined: number; total: number };
  /** Live SkillPaths with status "available" / skills represented by an active coverage claim. Never blended with mapping. */
  publishedProductCompleteness: { published: number; total: number };

  /**
   * A course can never be reported complete while any provisional point remains, or while
   * any structural check (prerequisite graph, recommended sequence) is invalid — regardless
   * of how high the mapping/publication numbers look.
   */
  authoritativeSourceStatus: "verified" | "partially_verified" | "unverified";
  courseComplete: boolean;
};

export function computeCurriculumCoverageReport(input: {
  register: CourseSpecificationRegister;
  claims: SpecificationCoverageClaim[];
  contracts: CanonicalSkillContract[];
  prerequisiteEdges: PrerequisiteRelationship[];
  sequenceEntries: CanonicalSkillSequence[];
  /** Every proposed skillPathId in the target canonical skill map, whether or not it has a contract yet. */
  proposedSkillPathIds: string[];
  /** Real, live SkillPath registry entries (e.g. Higher Maths Calculus), used only to read publication state. */
  liveSkillPaths: SkillPath[];
}): CurriculumCoverageReport {
  const activeAreas = getActiveAreas(input.register);
  const activePoints = getActivePoints(input.register);
  const verifiedPoints = getVerifiedPoints(activePoints);
  const provisionalPoints = getProvisionalPoints(activePoints);
  const activeClaims = getActiveClaims(input.claims);

  const verifiedPointIds = new Set(verifiedPoints.map((point) => point.specPointId));
  const provisionalPointIds = new Set(provisionalPoints.map((point) => point.specPointId));

  const mappedPointIds = activePoints
    .filter((point) => getClaimsForPoint(input.claims, point.specPointId).length > 0)
    .map((point) => point.specPointId);
  const unmappedPointIds = activePoints
    .map((point) => point.specPointId)
    .filter((specPointId) => !mappedPointIds.includes(specPointId));

  const verifiedClaims = activeClaims.filter((claim) => verifiedPointIds.has(claim.specPointId));
  const provisionalClaims = activeClaims.filter((claim) => provisionalPointIds.has(claim.specPointId));

  const contractById = new Map(input.contracts.map((contract) => [contract.skillPathId, contract]));
  const skillsRepresented = [...new Set(activeClaims.map((claim) => claim.primarySkillId))].sort();
  const contractsPresent = skillsRepresented.filter((skillId) => contractById.has(skillId));
  const contractsMissing = skillsRepresented.filter((skillId) => !contractById.has(skillId));

  const declaredPrerequisiteIds = [...new Set(input.contracts.flatMap((contract) => contract.prerequisiteSkillIds))];
  const prerequisiteContractsMissing = declaredPrerequisiteIds.filter((skillId) => !contractById.has(skillId));

  const knownSkillIds = new Set(input.proposedSkillPathIds);
  const graphResult = validatePrerequisiteGraph(input.prerequisiteEdges, input.contracts, knownSkillIds);
  const prerequisiteValidationErrors = graphResult.errors.map((error) => error.message);

  const sequenceResult = validateCanonicalSkillSequences(input.sequenceEntries, input.contracts, knownSkillIds);
  const recommendedSequenceErrors = sequenceResult.errors.map((error) => error.message);

  const liveSlugs = new Set(input.liveSkillPaths.map((skillPath) => skillPath.slug));
  const proposedSkillsAbsent = input.proposedSkillPathIds.filter((skillId) => !liveSlugs.has(skillId)).sort();

  const publishedSkillPathIds = input.liveSkillPaths.filter((skillPath) => skillPath.isAvailable).map((skillPath) => skillPath.slug).sort();
  const unpublishedSkillPathIds = input.liveSkillPaths.filter((skillPath) => !skillPath.isAvailable).map((skillPath) => skillPath.slug).sort();
  const representedAndPublished = skillsRepresented.filter((skillId) => publishedSkillPathIds.includes(skillId));

  const structurallyValid = prerequisiteValidationErrors.length === 0 && recommendedSequenceErrors.length === 0;
  const authoritativeSourceStatus: CurriculumCoverageReport["authoritativeSourceStatus"] =
    provisionalPoints.length === 0 && verifiedPoints.length > 0 ? "verified"
      : verifiedPoints.length > 0 ? "partially_verified"
      : "unverified";

  return {
    courseId: input.register.courseId,
    registerVersion: input.register.registerVersion,
    generatedAt: new Date().toISOString(),
    totalActiveSpecificationAreas: activeAreas.length,
    verifiedSpecificationPointCount: verifiedPoints.length,
    provisionalSpecificationPointCount: provisionalPoints.length,
    totalActiveSpecificationPoints: activePoints.length,
    verifiedCoverageClaimsMapped: { mapped: verifiedClaims.length, total: activeClaims.length },
    provisionalCoverageClaimsMapped: { mapped: provisionalClaims.length, total: activeClaims.length },
    unmappedSpecificationPointIds: unmappedPointIds.sort(),
    canonicalSkillsRepresented: skillsRepresented,
    skillContractsPresent: contractsPresent,
    skillContractsMissing: contractsMissing,
    prerequisiteContractsMissing,
    prerequisiteValidationErrors,
    recommendedSequenceValid: recommendedSequenceErrors.length === 0,
    recommendedSequenceErrors,
    proposedSkillsAbsentFromLiveRegistry: proposedSkillsAbsent,
    publishedSkillPathIds,
    unpublishedSkillPathIds,
    curriculumMappingCompleteness: { defined: contractsPresent.length, total: skillsRepresented.length },
    publishedProductCompleteness: { published: representedAndPublished.length, total: skillsRepresented.length },
    authoritativeSourceStatus,
    // Never authoritative/complete while any provisional point remains or any structural
    // check fails — regardless of how complete the mapping/publication figures look.
    courseComplete: authoritativeSourceStatus === "verified" && unmappedPointIds.length === 0 && structurallyValid
      && contractsMissing.length === 0 && representedAndPublished.length === skillsRepresented.length,
  };
}

export function formatCurriculumCoverageReport(report: CurriculumCoverageReport): string {
  const sourceLabel = report.authoritativeSourceStatus === "verified" ? "verified"
    : report.authoritativeSourceStatus === "partially_verified" ? `partially verified (${report.provisionalSpecificationPointCount} provisional point(s) remain)`
    : "unverified";
  const lines = [
    `${report.courseId} Curriculum Coverage`,
    "",
    `Official specification source: ${sourceLabel} — register v${report.registerVersion}`,
    `Verified specification points: ${report.verifiedSpecificationPointCount}`,
    `Provisional points remaining: ${report.provisionalSpecificationPointCount}`,
    `Verified coverage claims mapped: ${report.verifiedCoverageClaimsMapped.mapped} / ${report.verifiedCoverageClaimsMapped.total} total claims`,
    `Provisional coverage claims mapped: ${report.provisionalCoverageClaimsMapped.mapped} / ${report.provisionalCoverageClaimsMapped.total} total claims`,
    `Canonical skill contracts defined: ${report.curriculumMappingCompleteness.defined} / ${report.curriculumMappingCompleteness.total}`,
    `Skills present in live registry: ${report.canonicalSkillsRepresented.length - report.proposedSkillsAbsentFromLiveRegistry.length} / ${report.canonicalSkillsRepresented.length}`,
    `Published learner skills: ${report.publishedProductCompleteness.published} / ${report.publishedProductCompleteness.total}`,
    `Prerequisite graph: ${report.prerequisiteValidationErrors.length === 0 ? "valid" : `${report.prerequisiteValidationErrors.length} error(s)`}`,
    `Recommended sequence: ${report.recommendedSequenceValid ? "valid" : `${report.recommendedSequenceErrors.length} error(s)`}`,
    `Course complete: ${report.courseComplete ? "yes" : "no"}`,
    "",
    report.unmappedSpecificationPointIds.length > 0
      ? `Unmapped specification points: ${report.unmappedSpecificationPointIds.join(", ")}`
      : "Unmapped specification points: none",
    report.skillContractsMissing.length > 0
      ? `Skills represented without a contract yet: ${report.skillContractsMissing.join(", ")}`
      : "Skills represented without a contract yet: none",
    report.proposedSkillsAbsentFromLiveRegistry.length > 0
      ? `Proposed-but-absent skills: ${report.proposedSkillsAbsentFromLiveRegistry.join(", ")}`
      : "Proposed-but-absent skills: none",
  ];
  return lines.join("\n");
}
