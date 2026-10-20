import type { CourseTrackerSkill, CourseTrackerSkillConfidence } from "@/lib/course-tracker";
import type { ConfidenceLevel } from "@/lib/confidence/types";
import { CONFIDENCE_LEVEL_RANK } from "@/lib/confidence/types";

export type CourseTrackerSkillGroup =
  | { kind: "actionable"; skill: CourseTrackerSkill }
  | { kind: "curriculum_references"; skills: CourseTrackerSkill[] };

export type CourseTrackerStatusTone = "review-due" | "confident" | "developing" | "needs-work" | "neutral";

export const COURSE_TRACKER_STATUS_DOT: Record<CourseTrackerStatusTone, string> = {
  "review-due": "bg-warning",
  confident: "bg-success",
  developing: "bg-warning",
  "needs-work": "bg-danger",
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
 * Compact tracker rows project existing Review and learner-confidence state into colour only.
 * Review remains the actionable priority; no new learner state is inferred here.
 */
export function getCourseTrackerStatusTone(skill: CourseTrackerSkill): CourseTrackerStatusTone {
  return getSkillStatusTone({
    reviewDue: skill.reviewDue,
    learnerConfidence: skill.confidence?.learnerLevel,
  });
}

export function getSkillStatusTone(input: {
  reviewDue: boolean;
  learnerConfidence?: ConfidenceLevel | null;
}): CourseTrackerStatusTone {
  if (input.reviewDue) return "review-due";
  switch (input.learnerConfidence) {
    case "confident": return "confident";
    case "developing": return "developing";
    case "needs_work": return "needs-work";
    default: return "neutral";
  }
}

export function getSkillStatusLabel(tone: CourseTrackerStatusTone) {
  switch (tone) {
    case "review-due": return "Review due";
    case "confident": return "Confidence: confident";
    case "developing": return "Confidence: developing";
    case "needs-work": return "Confidence: needs work";
    default: return "No learning status recorded";
  }
}
