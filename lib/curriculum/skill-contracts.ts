import {
  CurriculumValidationReport,
  createIssueCollector,
  finalizeReport,
  findDuplicates,
  isValidId,
  positiveInteger,
  requiredId,
  requiredText,
} from "@/lib/curriculum/validation-report";

export type CanonicalSkillContract = {
  skillPathId: string;
  name: string;
  learningObjective: string;

  boundaries: {
    includes: string[];
    excludes: string[];
  };

  prerequisiteSkillIds: string[];
  unlocksSkillIds: string[];

  permittedIngredients: string[];
  forbiddenIngredients: string[];

  typicalMisconceptions: string[];
  pastPaperPatternFamilyIds: string[];

  autoMarkingRequirements: string[];

  contractRevision: number;
  contentStatus: "active" | "archived";
};

export function validateCanonicalSkillContract(contract: CanonicalSkillContract): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/skill-contract/${contract.skillPathId ?? "unknown"}`;

  requiredId(contract.skillPathId, "skillPathId", location, issue);
  requiredText(contract.name, "name", location, issue);
  requiredText(contract.learningObjective, "learningObjective", location, issue);

  if (!Array.isArray(contract.boundaries?.includes) || contract.boundaries.includes.length === 0) {
    issue("error", "empty-boundary-includes", `Contract "${contract.skillPathId}" must declare at least one included boundary — a skill must represent one coherent capability, not an unbounded one.`, location);
  }
  if (!Array.isArray(contract.boundaries?.excludes) || contract.boundaries.excludes.length === 0) {
    issue("warning", "empty-boundary-excludes", `Contract "${contract.skillPathId}" declares no excluded boundaries — an explicit scope fence is expected even when short.`, location);
  }

  if (contract.skillPathId && contract.prerequisiteSkillIds?.includes(contract.skillPathId)) {
    issue("error", "prerequisite-self-reference", `Contract "${contract.skillPathId}" lists itself as its own prerequisite.`, location);
  }
  if (contract.skillPathId && contract.unlocksSkillIds?.includes(contract.skillPathId)) {
    issue("error", "unlocks-self-reference", `Contract "${contract.skillPathId}" lists itself in unlocksSkillIds.`, location);
  }
  findDuplicates(contract.prerequisiteSkillIds ?? []).forEach((duplicateId) =>
    issue("error", "duplicate-prerequisite-id", `Contract "${contract.skillPathId}" lists prerequisite "${duplicateId}" more than once.`, location));
  (contract.prerequisiteSkillIds ?? []).forEach((prerequisiteId, index) => {
    if (!isValidId(prerequisiteId)) issue("error", "invalid-prerequisite-id", `Contract "${contract.skillPathId}" prerequisiteSkillIds[${index}] is not a valid stable ID.`, location);
  });

  ["permittedIngredients", "forbiddenIngredients", "typicalMisconceptions", "pastPaperPatternFamilyIds", "autoMarkingRequirements", "unlocksSkillIds"].forEach((field) => {
    const value = (contract as unknown as Record<string, unknown>)[field];
    if (!Array.isArray(value)) issue("error", "invalid-array-field", `Contract "${contract.skillPathId}" field "${field}" must be an array.`, location);
  });

  positiveInteger(contract.contractRevision, "contractRevision", location, issue);
  if (!["active", "archived"].includes(contract.contentStatus)) {
    issue("error", "invalid-content-status", `Contract "${contract.skillPathId}" contentStatus must be active or archived.`, location);
  }

  return finalizeReport(issues);
}

/** Aggregate validation across a whole contract set — cross-contract duplicate detection. */
export function validateCanonicalSkillContracts(contracts: CanonicalSkillContract[]): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  contracts.forEach((contract) => issues.push(...validateCanonicalSkillContract(contract).issues));

  findDuplicates(contracts.map((contract) => contract.skillPathId)).forEach((duplicateId) =>
    issue("error", "duplicate-skill-contract", `More than one contract declares skillPathId "${duplicateId}".`, "curriculum/skill-contracts"));

  return finalizeReport(issues);
}
