import {
  CLOSE_EXAM_REVIEW_SHARE,
  DEFAULT_REVIEW_SHARE,
  MAX_REVIEW_ITEMS_PER_DAY,
} from "@/lib/study-plan/constants";
import { compareStudyPlanCandidates, isValidStudyPlanHref } from "@/lib/study-plan/candidate-builder";
import { datesForAvailableDays, isAvailableDate } from "@/lib/study-plan/dates";
import type {
  StudyPlanCandidate,
  StudyPlanDiagnostic,
  StudyPlanExamPhase,
  StudyPlanItem,
  StudyPlanPreservationInput,
  StudyPlanWeekday,
} from "@/lib/study-plan/types";

type AllocationInput = {
  candidates: readonly StudyPlanCandidate[];
  weekStart: string;
  courseSlug: string;
  weeklyMinutes: number;
  availableDays: readonly StudyPlanWeekday[];
  examPhase: StudyPlanExamPhase;
  notBeforeDate?: string;
  preservation?: StudyPlanPreservationInput;
};

export function allocateStudyPlan(input: AllocationInput): {
  items: StudyPlanItem[];
  allocatedMinutes: number;
  diagnostics: StudyPlanDiagnostic[];
} {
  const dates = datesForAvailableDays(input.weekStart, input.availableDays)
    .filter((date) => !input.notBeforeDate || date >= input.notBeforeDate);
  const dayMinutes = new Map(dates.map((date) => [date, 0]));
  const dayReviewCounts = new Map(dates.map((date) => [date, 0]));
  const items: StudyPlanItem[] = [];
  const diagnostics: StudyPlanDiagnostic[] = [];
  const seen = new Set<string>();
  let allocatedMinutes = 0;
  let reviewMinutes = 0;
  const reviewShare = input.examPhase === "close" ? CLOSE_EXAM_REVIEW_SHARE : DEFAULT_REVIEW_SHARE;
  const reviewCap = Math.floor(input.weeklyMinutes * reviewShare);
  const ordered = [...input.candidates].sort(compareStudyPlanCandidates);
  const hasUsefulNonReview = ordered.some((candidate) =>
    candidate.actionType !== "review" && !isPreservedAs(candidate, input, "skipped"));

  for (const candidate of ordered) {
    const itemKey = createStudyPlanItemKey(input.weekStart, input.courseSlug, candidate);
    if (input.preservation?.excludedItemKeys?.includes(itemKey)) {
      diagnostics.push(diagnostic(candidate, "preserved_exclusion"));
      continue;
    }
    const state = input.preservation?.itemStates?.[itemKey] ?? "planned";
    if (!isValidStudyPlanHref(candidate.href)) {
      diagnostics.push(diagnostic(candidate, "invalid_href"));
      continue;
    }
    const movedDate = input.preservation?.movedDates?.[itemKey];
    const date = movedDate && isAvailableDate(movedDate, input.weekStart, input.availableDays)
      ? movedDate
      : chooseDate(candidate, dates, dayMinutes, dayReviewCounts, input.weeklyMinutes);
    if (!date) {
      diagnostics.push(diagnostic(candidate, "no_available_day"));
      continue;
    }
    if (movedDate && movedDate !== date) {
      diagnostics.push(diagnostic(candidate, "invalid_manual_date_ignored", movedDate));
    }

    const duplicateKey = `${candidate.skillPathId}:${candidate.actionType}:${date}`;
    if (seen.has(duplicateKey)) {
      diagnostics.push(diagnostic(candidate, "duplicate_equivalent_item"));
      continue;
    }
    seen.add(duplicateKey);

    const item = toItem(candidate, itemKey, date, state);
    if (state === "skipped") {
      items.push(item);
      diagnostics.push(diagnostic(candidate, "preserved_skipped", undefined, "selected"));
      continue;
    }

    const overdue = candidate.reasonCode === "review_overdue";
    if (candidate.actionType === "review" && !overdue && hasUsefulNonReview
      && reviewMinutes + candidate.suggestedMinutes > reviewCap) {
      diagnostics.push(diagnostic(candidate, "soft_review_cap"));
      continue;
    }
    if (allocatedMinutes + candidate.suggestedMinutes > input.weeklyMinutes) {
      diagnostics.push(diagnostic(candidate, "weekly_budget_exhausted"));
      continue;
    }

    items.push(item);
    allocatedMinutes += candidate.suggestedMinutes;
    dayMinutes.set(date, (dayMinutes.get(date) ?? 0) + candidate.suggestedMinutes);
    if (candidate.actionType === "review") {
      reviewMinutes += candidate.suggestedMinutes;
      dayReviewCounts.set(date, (dayReviewCounts.get(date) ?? 0) + 1);
    }
    diagnostics.push(diagnostic(candidate, state === "completed" ? "preserved_completed" : "allocated", undefined, "selected"));
  }

  return { items, allocatedMinutes, diagnostics };
}

export function createStudyPlanItemKey(
  weekStart: string,
  courseSlug: string,
  candidate: Pick<StudyPlanCandidate, "candidateKey">,
): string {
  return `${weekStart}:${courseSlug}:${candidate.candidateKey}`;
}

function chooseDate(
  candidate: StudyPlanCandidate,
  dates: readonly string[],
  dayMinutes: ReadonlyMap<string, number>,
  dayReviewCounts: ReadonlyMap<string, number>,
  weeklyMinutes: number,
): string | null {
  if (!dates.length) return null;
  const approximateCapacity = Math.ceil(weeklyMinutes / dates.length);
  const reviewFriendly = candidate.actionType === "review"
    ? dates.filter((date) => (dayReviewCounts.get(date) ?? 0) < MAX_REVIEW_ITEMS_PER_DAY)
    : [...dates];
  const pool = reviewFriendly.length ? reviewFriendly : [...dates];
  return pool.find((date) => (dayMinutes.get(date) ?? 0) + candidate.suggestedMinutes <= approximateCapacity)
    ?? [...pool].sort((left, right) =>
      (dayMinutes.get(left) ?? 0) - (dayMinutes.get(right) ?? 0) || left.localeCompare(right))[0]
    ?? null;
}

function toItem(
  candidate: StudyPlanCandidate,
  itemKey: string,
  date: string,
  state: StudyPlanItem["state"],
): StudyPlanItem {
  return {
    id: `study-plan:${itemKey}`,
    itemKey,
    date,
    skillPathId: candidate.skillPathId,
    skillName: candidate.skillName,
    actionType: candidate.actionType,
    href: candidate.href,
    reasonCode: candidate.reasonCode,
    tier: candidate.tier,
    stageId: candidate.stageId,
    stageName: candidate.stageName,
    examQualifier: candidate.examQualifier,
    assessmentQualifier: candidate.assessmentQualifier,
    suggestedMinutes: candidate.suggestedMinutes,
    state,
  };
}

function isPreservedAs(
  candidate: StudyPlanCandidate,
  input: AllocationInput,
  state: "completed" | "skipped",
) {
  const key = createStudyPlanItemKey(input.weekStart, input.courseSlug, candidate);
  return input.preservation?.itemStates?.[key] === state;
}

function diagnostic(
  candidate: StudyPlanCandidate,
  code: string,
  detail?: string,
  outcome: StudyPlanDiagnostic["outcome"] = "excluded",
): StudyPlanDiagnostic {
  return {
    skillPathId: candidate.skillPathId,
    candidateKey: candidate.candidateKey,
    outcome,
    code,
    ...(detail ? { detail } : {}),
  };
}
