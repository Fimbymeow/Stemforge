import type { CourseTrackerSkill, CourseTrackerSkillConfidence } from "@/lib/course-tracker";

export type CourseTrackerSkillGroup =
  | { kind: "actionable"; skill: CourseTrackerSkill }
  | { kind: "curriculum_references"; skills: CourseTrackerSkill[] };

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
    && confidence.learnerLevel !== confidence.suggestion.level,
  );
}
