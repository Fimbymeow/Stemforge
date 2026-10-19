import type { CourseTrackerSkill, CourseTrackerSkillConfidence } from "@/lib/course-tracker";
import { CONFIDENCE_LEVEL_RANK } from "@/lib/confidence/types";

export type CourseTrackerSkillGroup =
  | { kind: "actionable"; skill: CourseTrackerSkill }
  | { kind: "curriculum_references"; skills: CourseTrackerSkill[] };

export type CourseTrackerStatusTone = "review-due" | "confident" | "developing" | "needs-work" | "neutral";

/** Preserve canonical order while compacting each contiguous run of curriculum-reference skills. */
export function groupCourseTrackerSkills(skills: readonly CourseTrackerSkill[]): CourseTrackerSkillGroup[] {
  const groups: CourseTrackerSkillGroup[] = [];
  for (const skill of skills) {
    if (skill.availability === "actionable") {
      groups.push({ kind: "actionable", skill });
      continue;
    }
    const previous = groups.at(-1);
    if (previous?.kind === "curriculum_references") previous.skills.push(skill);
    else groups.push({ kind: "curriculum_references", skills: [skill] });
  }
  return groups;
}

export function hasCourseTrackerConfidenceDisagreement(confidence: CourseTrackerSkillConfidence | null) {
  return Boolean(
    confidence?.learnerLevel
    && confidence.suggestion
    && CONFIDENCE_LEVEL_RANK[confidence.learnerLevel] > CONFIDENCE_LEVEL_RANK[confidence.suggestion.level],
  );
}

/**
 * Compact tracker rows project existing Review and learner-confidence state into colour only.
 * Review remains the actionable priority; no new learner state is inferred here.
 */
export function getCourseTrackerStatusTone(skill: CourseTrackerSkill): CourseTrackerStatusTone {
  if (skill.reviewDue) return "review-due";
  switch (skill.confidence?.learnerLevel) {
    case "confident": return "confident";
    case "developing": return "developing";
    case "needs_work": return "needs-work";
    default: return "neutral";
  }
}
