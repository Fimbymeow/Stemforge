import type { CanonicalSkillContract } from "@/lib/curriculum/skill-contracts";
import {
  CurriculumValidationReport,
  createIssueCollector,
  finalizeReport,
  findDuplicates,
  requiredId,
} from "@/lib/curriculum/validation-report";

/**
 * Recommended teaching order is deliberately a separate model from the prerequisite graph
 * (lib/curriculum/prerequisite-graph.ts). A prerequisite edge means "cannot be safely
 * attempted without" — a hard fact about dependency. A sequence entry means "this is the
 * order we recommend teaching it in" — a pedagogical opinion that can legitimately place
 * Trigonometric Differentiation before Chain Rule even though Chain Rule's only real
 * prerequisite is Basic Differentiation. Never invent a prerequisite edge just to force a
 * display order — use this model instead.
 *
 * This is authoring/Notes-ordering guidance only. It must never be used to lock learner
 * navigation — nothing in the runtime reads this to gate access to a skill.
 */
export type CanonicalSkillSequence = {
  courseId: string;
  areaId: string;
  skillPathId: string;
  recommendedOrder: number;
};

export function validateCanonicalSkillSequence(entry: CanonicalSkillSequence): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/sequence/${entry.areaId ?? "unknown"}/${entry.skillPathId ?? "unknown"}`;

  requiredId(entry.courseId, "courseId", location, issue);
  requiredId(entry.areaId, "areaId", location, issue);
  requiredId(entry.skillPathId, "skillPathId", location, issue);
  if (!Number.isInteger(entry.recommendedOrder) || entry.recommendedOrder <= 0) {
    issue("error", "invalid-recommended-order", `Sequence entry for "${entry.skillPathId}" must have a positive integer recommendedOrder.`, location);
  }

  return finalizeReport(issues);
}

export function validateCanonicalSkillSequences(
  entries: CanonicalSkillSequence[],
  contracts: CanonicalSkillContract[],
  /** The full proposed-skill universe, mirroring lib/curriculum/prerequisite-graph.ts's knownSkillIds parameter. */
  knownSkillIds: Set<string> = new Set(contracts.map((contract) => contract.skillPathId)),
): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  entries.forEach((entry) => issues.push(...validateCanonicalSkillSequence(entry).issues));

  const contractById = new Map(contracts.map((contract) => [contract.skillPathId, contract]));
  const location = "curriculum/sequence";

  entries.forEach((entry) => {
    if (entry.skillPathId && !knownSkillIds.has(entry.skillPathId)) {
      issue("error", "unknown-sequence-skill", `Sequence entry references unknown skill "${entry.skillPathId}".`, `${location}/${entry.skillPathId}`);
    }
    const contract = contractById.get(entry.skillPathId);
    if (contract?.contentStatus === "archived") {
      issue("error", "archived-skill-in-active-sequence", `Sequence entry places archived skill "${entry.skillPathId}" in an active recommended sequence.`, `${location}/${entry.skillPathId}`);
    }
  });

  const byArea = new Map<string, CanonicalSkillSequence[]>();
  entries.forEach((entry) => {
    if (!byArea.has(entry.areaId)) byArea.set(entry.areaId, []);
    byArea.get(entry.areaId)!.push(entry);
  });
  for (const [areaId, areaEntries] of byArea) {
    findDuplicates(areaEntries.map((entry) => entry.recommendedOrder)).forEach((duplicateOrder) =>
      issue("error", "duplicate-sequence-order", `Area "${areaId}" has more than one skill at recommendedOrder ${duplicateOrder} — order must be unique within an area.`, `${location}/${areaId}`));
    findDuplicates(areaEntries.map((entry) => entry.skillPathId)).forEach((duplicateSkillId) =>
      issue("error", "duplicate-sequence-skill-in-area", `Skill "${duplicateSkillId}" appears more than once in area "${areaId}"'s recommended sequence.`, `${location}/${areaId}`));
  }

  return finalizeReport(issues);
}

export function getRecommendedOrderForArea(entries: CanonicalSkillSequence[], areaId: string): string[] {
  return entries
    .filter((entry) => entry.areaId === areaId)
    .sort((left, right) => left.recommendedOrder - right.recommendedOrder)
    .map((entry) => entry.skillPathId);
}
