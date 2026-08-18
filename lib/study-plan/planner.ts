import { buildStudyPlanCandidates } from "@/lib/study-plan/candidate-builder";
import { MAX_WEEKLY_MINUTES, STUDY_PLAN_GENERATION_VERSION } from "@/lib/study-plan/constants";
import { allocateStudyPlan } from "@/lib/study-plan/allocator";
import { courseWidePhase, effectiveAssessments, isValidAssessmentType } from "@/lib/study-plan/assessments";
import { isValidDateOnly, utcDayKey, utcWeekStart } from "@/lib/study-plan/dates";
import type {
  Assessment,
  StudyPlanGenerationInput,
  StudyPlanResult,
  StudyPlanResultStatus,
  StudyPlanWeekday,
} from "@/lib/study-plan/types";

const VALID_WEEKDAYS = new Set<StudyPlanWeekday>(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export function generateStudyPlan(input: StudyPlanGenerationInput): StudyPlanResult {
  const validationError = validateInput(input);
  const safeNow = Number.isFinite(input.now.getTime()) ? input.now : new Date(0);
  const safeCalendarDate = input.calendarDate && Number.isFinite(input.calendarDate.getTime())
    ? input.calendarDate
    : safeNow;
  const weekStart = utcWeekStart(safeCalendarDate);
  const assessments = effectiveAssessments(input.preferences);
  const examPhase = courseWidePhase(assessments, safeCalendarDate);
  if (validationError) {
    return emptyResult(input, weekStart, examPhase, "invalid_input", validationError);
  }

  const built = buildStudyPlanCandidates({
    now: input.now,
    courseSlug: input.preferences.courseSlug,
    evidence: input.evidence,
    assessments,
    learnerConfidence: input.learnerConfidence,
  });
  if (!built.courseExists) {
    return emptyResult(input, weekStart, examPhase, "course_missing", "selected_course_missing", built.diagnostics);
  }
  if (!built.availableContentExists) {
    return emptyResult(input, weekStart, examPhase, "no_available_content", "no_available_content", built.diagnostics);
  }

  const allocated = allocateStudyPlan({
    candidates: built.candidates,
    weekStart,
    courseSlug: input.preferences.courseSlug,
    weeklyMinutes: input.preferences.weeklyMinutes,
    availableDays: input.preferences.availableDays,
    examPhase,
    ...(input.calendarDate ? { notBeforeDate: utcDayKey(safeCalendarDate) } : {}),
    preservation: input.preservation,
  });
  return {
    status: "ok",
    errorCode: null,
    weekStart,
    generatedAt: input.now.toISOString(),
    generationVersion: STUDY_PLAN_GENERATION_VERSION,
    courseSlug: input.preferences.courseSlug,
    weeklyMinutes: input.preferences.weeklyMinutes,
    allocatedMinutes: allocated.allocatedMinutes,
    unusedMinutes: input.preferences.weeklyMinutes - allocated.allocatedMinutes,
    examPhase,
    caughtUp: built.candidates.length === 0 && hasOnlyCaughtUpExclusions(built.diagnostics),
    items: allocated.items,
    diagnostics: [...built.diagnostics, ...allocated.diagnostics],
  };
}

function hasOnlyCaughtUpExclusions(diagnostics: StudyPlanResult["diagnostics"]) {
  const unresolvedCodes = new Set([
    "new_start_suppressed_close_exam",
    "continuation_destination_unavailable",
    "next_skill_destination_unavailable",
    "review_history_unavailable",
  ]);
  return !diagnostics.some((item) => unresolvedCodes.has(item.code));
}

function validateInput(input: StudyPlanGenerationInput): string | null {
  if (!Number.isFinite(input.now.getTime())) return "invalid_now";
  if (input.calendarDate && !Number.isFinite(input.calendarDate.getTime())) return "invalid_calendar_date";
  if (!input.preferences.courseSlug.trim()) return "invalid_course";
  if (!Number.isInteger(input.preferences.weeklyMinutes)
      || input.preferences.weeklyMinutes <= 0
      || input.preferences.weeklyMinutes > MAX_WEEKLY_MINUTES) return "invalid_weekly_minutes";
  if (!input.preferences.availableDays.length
      || input.preferences.availableDays.some((day) => !VALID_WEEKDAYS.has(day))) return "invalid_available_days";
  if (input.preferences.assessments.some((assessment) => !isValidAssessment(assessment))) return "invalid_assessments";
  return null;
}

function isValidAssessment(assessment: Assessment): boolean {
  if (!assessment.id.trim() || !assessment.courseSlug.trim() || !assessment.title.trim()) return false;
  if (!isValidAssessmentType(assessment.type)) return false;
  if (assessment.date.precision === "exact") {
    if (!isValidDateOnly(assessment.date.date)) return false;
  } else if (assessment.date.precision === "month") {
    if (!Number.isInteger(assessment.date.year) || assessment.date.year < 2000 || assessment.date.year > 2100) return false;
    if (!Number.isInteger(assessment.date.month) || assessment.date.month < 1 || assessment.date.month > 12) return false;
  } else {
    return false;
  }
  if (assessment.scope.kind === "topics" && !assessment.scope.topicIds.length) return false;
  if (assessment.scope.kind === "skills" && !assessment.scope.skillPathIds.length) return false;
  return true;
}

function emptyResult(
  input: StudyPlanGenerationInput,
  weekStart: string,
  examPhase: StudyPlanResult["examPhase"],
  status: Exclude<StudyPlanResultStatus, "ok">,
  errorCode: string,
  diagnostics: StudyPlanResult["diagnostics"] = [],
): StudyPlanResult {
  const weeklyMinutes = Number.isInteger(input.preferences.weeklyMinutes) && input.preferences.weeklyMinutes > 0
    ? input.preferences.weeklyMinutes
    : 0;
  return {
    status,
    errorCode,
    weekStart,
    generatedAt: Number.isFinite(input.now.getTime()) ? input.now.toISOString() : new Date(0).toISOString(),
    generationVersion: STUDY_PLAN_GENERATION_VERSION,
    courseSlug: input.preferences.courseSlug,
    weeklyMinutes,
    allocatedMinutes: 0,
    unusedMinutes: weeklyMinutes,
    examPhase,
    caughtUp: status === "no_available_content",
    items: [],
    diagnostics,
  };
}
