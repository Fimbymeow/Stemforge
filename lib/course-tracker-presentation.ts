import type { CourseTrackerSkill, CourseTrackerSkillConfidence } from "@/lib/course-tracker";
import { CONFIDENCE_LEVEL_RANK } from "@/lib/confidence/types";
import type { ProgressStatus } from "@/lib/progress/types";

export type CourseTrackerSkillGroup =
  | { kind: "actionable"; skill: CourseTrackerSkill }
  | { kind: "curriculum_references"; skills: CourseTrackerSkill[] };

export type CourseTrackerStatusTone = "learning" | "secure" | "neutral";

export const COURSE_TRACKER_STATUS_DOT: Record<CourseTrackerStatusTone, string> = {
  learning: "bg-navy",
  secure: "bg-success",
  neutral: "bg-rule-strong",
};

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
 * Compact course rows project canonical learning/evidence status only. Learner
 * confidence and spaced-Review timing remain independent concepts.
 */
export function getCourseTrackerStatusTone(skill: CourseTrackerSkill): CourseTrackerStatusTone {
  return getSkillStatusTone({
    progressStatus: skill.masteryStatus,
  });
}

export function getSkillStatusTone(input: {
  progressStatus: ProgressStatus | null;
}): CourseTrackerStatusTone {
  switch (input.progressStatus) {
    case "in_progress":
    case "completed":
      return "learning";
    case "secure":
    case "mastered":
      return "secure";
    default: return "neutral";
  }
}

export function getSkillStatusLabel(status: ProgressStatus | null) {
  switch (status) {
    case "in_progress": return "Learning in progress";
    case "completed": return "Practice completed";
    case "secure": return "Learning secure";
    case "mastered": return "Learning mastered";
    default: return "Not started";
  }
}
