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
 * contamination (a question quietly requiring a skill the learner hasn't reached yet) —
 * Phase 1 defines the contract and its pure validator only. It does not attempt to infer
 * required skills from question text, and it does not retrofit this metadata onto every
 * existing question; that is explicitly future, question-by-question authoring work.
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
): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/question-metadata/${metadata.primarySkillId ?? "unknown"}`;
  const allowed = new Set([metadata.primarySkillId, ...prerequisiteClosure(metadata.primarySkillId, edges)]);

  (metadata.requiredSkillIds ?? []).forEach((skillId) => {
    if (!allowed.has(skillId)) {
      issue(
        "error",
        "required-skill-outside-prerequisite-closure",
        `Question metadata for "${metadata.primarySkillId}" requires "${skillId}", which is neither the primary skill nor a declared (direct or transitive) prerequisite — this is future-skill contamination.`,
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
