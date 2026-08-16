import type { PrerequisiteRelationship } from "@/lib/curriculum/prerequisite-graph";
import {
  CurriculumValidationReport,
  createIssueCollector,
  finalizeReport,
  isValidId,
  requiredId,
} from "@/lib/curriculum/validation-report";

/**
 * Declares, for one question, which canonical skill it primarily assesses and which
 * skills it is allowed to assume. This is the future mechanism for checking future-skill
 * contamination (a question quietly requiring a skill the learner hasn't reached yet).
 * Main content validation checks references when metadata is present. It does not infer
 * required skills from question text or retrofit metadata onto existing questions; those
 * remain question-by-question authoring decisions.
 */
export type QuestionCurriculumMetadata = {
  primarySkillId: string;
  requiredSkillIds: string[];
  patternIds?: string[];
  misconceptionIds?: string[];
};

export function validateQuestionCurriculumMetadata(metadata: QuestionCurriculumMetadata): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/question-metadata/${metadata.primarySkillId ?? "unknown"}`;

  requiredId(metadata.primarySkillId, "primarySkillId", location, issue);
  if (!Array.isArray(metadata.requiredSkillIds)) {
    issue("error", "invalid-required-skill-ids", "requiredSkillIds must be an array.", location);
  } else {
    metadata.requiredSkillIds.forEach((skillId, index) => {
      if (!isValidId(skillId)) issue("error", "invalid-required-skill-id", `requiredSkillIds[${index}] is not a valid stable ID.`, location);
    });
  }
  if (metadata.patternIds !== undefined && !Array.isArray(metadata.patternIds)) issue("error", "invalid-pattern-ids", "patternIds must be an array when present.", location);
  if (metadata.misconceptionIds !== undefined && !Array.isArray(metadata.misconceptionIds)) issue("error", "invalid-misconception-ids", "misconceptionIds must be an array when present.", location);

  return finalizeReport(issues);
}

/**
 * Runtime reference validation for optional canonical-question metadata. Conditional
 * dependencies deliberately need not be edges in the universal prerequisite graph.
 */
export function validateQuestionCurriculumMetadataReferences(
  metadata: QuestionCurriculumMetadata,
  owningSkillId: string,
  knownSkillIds: ReadonlySet<string>,
): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/question-metadata/${owningSkillId}`;
  issues.push(...validateQuestionCurriculumMetadata(metadata).issues);
  if (metadata.primarySkillId !== owningSkillId) {
    issue("error", "question-primary-skill-mismatch", `Question metadata primarySkillId "${metadata.primarySkillId}" must match owning skill "${owningSkillId}".`, location);
  }
  for (const skillId of new Set([metadata.primarySkillId, ...(metadata.requiredSkillIds ?? [])])) {
    if (isValidId(skillId) && !knownSkillIds.has(skillId)) issue("error", "unknown-question-required-skill", `Question metadata references unknown canonical skill "${skillId}".`, location);
  }
  const seen = new Set<string>();
  for (const skillId of metadata.requiredSkillIds ?? []) {
    if (seen.has(skillId)) issue("error", "duplicate-question-required-skill", `Question metadata repeats required skill "${skillId}".`, location);
    seen.add(skillId);
  }
  return finalizeReport(issues);
}

/**
 * requiredSkillIds must be a subset of {primarySkillId} union the transitive closure of
 * primarySkillId's declared prerequisites (hard and soft), walked through the prerequisite
 * graph. Declared prerequisites are read transitively — not only direct edges — since a
 * question may legitimately draw on a prerequisite's own prerequisite. This transitive
 * reading is a deliberate design decision, not an incidental default; see the completion
 * report's unresolved-decisions section.
 */
export function validateRequiredSkillsWithinPrerequisiteClosure(
  metadata: QuestionCurriculumMetadata,
  edges: PrerequisiteRelationship[],
  additionalAllowedSkillIds: Iterable<string> = [],
): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/question-metadata/${metadata.primarySkillId ?? "unknown"}`;
  const allowed = new Set([metadata.primarySkillId, ...prerequisiteClosure(metadata.primarySkillId, edges), ...additionalAllowedSkillIds]);

  (metadata.requiredSkillIds ?? []).forEach((skillId) => {
    if (!allowed.has(skillId)) {
      issue(
        "error",
        "required-skill-outside-prerequisite-closure",
        `Question metadata for "${metadata.primarySkillId}" requires "${skillId}", which is neither the primary skill, a declared (direct or transitive) prerequisite, nor an approved conditional package dependency — this is future-skill contamination.`,
        location,
      );
    }
  });

  return finalizeReport(issues);
}

function prerequisiteClosure(skillPathId: string, edges: PrerequisiteRelationship[]): Set<string> {
  const closure = new Set<string>();
  const queue = [skillPathId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.skillPathId !== current) continue;
      if (closure.has(edge.requiresSkillPathId)) continue;
      closure.add(edge.requiresSkillPathId);
      queue.push(edge.requiresSkillPathId);
    }
  }
  return closure;
}
