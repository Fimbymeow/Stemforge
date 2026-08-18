import { classifyExamPhase, classifyMonthPhase } from "@/lib/study-plan/dates";
import type {
  Assessment,
  AssessmentScope,
  AssessmentType,
  StudyPlanAssessmentQualifier,
  StudyPlanExamPhase,
  StudyPlanPreferences,
} from "@/lib/study-plan/types";

/**
 * Repository-owned provisional assessment defaults, keyed by course slug.
 *
 * These are never persisted to learner state (local or account). They are merged in at
 * resolution time by `effectiveAssessments`, and are automatically superseded the moment a
 * learner adds their own final exam for the course, or a future content-production pass
 * replaces the entry below with an official (exact-date) one. This keeps local state free of
 * duplicated/stale defaults and gives the repository a single place to update once a real
 * national timetable is published.
 */
export const PROVISIONAL_COURSE_ASSESSMENTS: Readonly<Record<string, Assessment>> = {
  "higher-maths": {
    id: "provisional:higher-maths:final-exam",
    courseSlug: "higher-maths",
    type: "final_exam",
    title: "Higher Maths final exam",
    date: { precision: "month", year: 2027, month: 5 },
    scope: { kind: "whole_course" },
    source: "orthic_provisional",
  },
};

/**
 * The assessment list actually used for planning: the learner's own assessments, plus the
 * repository provisional default for this course unless the learner already has an exact or
 * official final exam covering the whole course (avoids a duplicate "final exam" entry).
 */
export function effectiveAssessments(preferences: Pick<StudyPlanPreferences, "courseSlug" | "assessments">): Assessment[] {
  const own = preferences.assessments.filter((assessment) => assessment.courseSlug === preferences.courseSlug);
  const hasOwnFinalExam = own.some((assessment) => assessment.type === "final_exam" && assessment.scope.kind === "whole_course");
  const provisional = PROVISIONAL_COURSE_ASSESSMENTS[preferences.courseSlug];
  return provisional && !hasOwnFinalExam ? [...own, provisional] : own;
}

export function phaseForAssessmentDate(date: Assessment["date"], now: Date): StudyPlanExamPhase {
  return date.precision === "exact" ? classifyExamPhase(now, date.date) : classifyMonthPhase(now, date.year, date.month);
}

export function assessmentScopeIncludesSkill(scope: AssessmentScope, courseAreaId: string, skillPathId: string): boolean {
  if (scope.kind === "whole_course") return true;
  if (scope.kind === "course_areas") return scope.courseAreaIds.includes(courseAreaId);
  return scope.skillPathIds.includes(skillPathId);
}

/** Nearest relevant assessment for one skill: the soonest assessment whose scope includes it. Never sums multiple assessments. */
export function nearestRelevantAssessment(
  assessments: readonly Assessment[],
  courseAreaId: string,
  skillPathId: string,
  now: Date,
): { assessment: Assessment; phase: Exclude<StudyPlanExamPhase, "no_date"> } | null {
  const relevant = assessments
    .filter((assessment) => assessmentScopeIncludesSkill(assessment.scope, courseAreaId, skillPathId))
    .map((assessment) => ({ assessment, sortKey: approximateTimestamp(assessment.date) }))
    .sort((left, right) => left.sortKey - right.sortKey);
  const nearest = relevant[0];
  if (!nearest) return null;
  const phase = phaseForAssessmentDate(nearest.assessment.date, now);
  return phase === "no_date" ? null : { assessment: nearest.assessment, phase };
}

export function assessmentQualifierFor(
  assessment: Assessment,
  phase: Exclude<StudyPlanExamPhase, "no_date">,
  now: Date,
): StudyPlanAssessmentQualifier {
  return {
    assessmentId: assessment.id,
    title: assessment.title,
    type: assessment.type,
    phase,
    daysUntil: assessment.date.precision === "exact" ? daysUntilExact(assessment.date.date, now) : null,
  };
}

const PHASE_URGENCY: Record<StudyPlanExamPhase, number> = { close: 0, medium: 1, far: 2, no_date: 3 };

export function mostUrgentPhase(phases: readonly StudyPlanExamPhase[]): StudyPlanExamPhase {
  return phases.reduce<StudyPlanExamPhase>((most, phase) => (PHASE_URGENCY[phase] < PHASE_URGENCY[most] ? phase : most), "no_date");
}

/** Course-wide urgency signal used only for the plan's overall Review time-budget cap (Part G/allocator). Never used to suppress individual new-skill starts, that decision stays per-skill. */
export function courseWidePhase(assessments: readonly Assessment[], now: Date): StudyPlanExamPhase {
  return mostUrgentPhase(assessments.map((assessment) => phaseForAssessmentDate(assessment.date, now)));
}

export function isValidAssessmentType(value: unknown): value is AssessmentType {
  return value === "class_test" || value === "prelim" || value === "final_exam" || value === "other";
}

function approximateTimestamp(date: Assessment["date"]): number {
  // Sort key only, never surfaced as a claimed exact date for month-precision entries.
  return date.precision === "exact" ? Date.parse(date.date) : Date.UTC(date.year, date.month - 1, 1);
}

function daysUntilExact(date: string, now: Date): number | null {
  const parsed = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.ceil((parsed - today) / (24 * 60 * 60 * 1000));
}
