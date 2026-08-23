import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import type { ResolvedSkillPath } from "@/lib/content-resolver";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import type { ConfidenceLevel } from "@/lib/confidence/types";
import { deriveSkillPathNextAction } from "@/lib/learning/next-action";
import { deriveMistakeLog, type MistakeItem } from "@/lib/mistakes/derivation";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { ProgressEvidence, SkillPathProgress } from "@/lib/progress/types";
import { createReviewDerivationCache, deriveSkillReviewState } from "@/lib/review/derivation";
import type { ReviewDueState } from "@/lib/review/types";
import { resolveSkillsForRequirements } from "@/lib/curriculum/requirement-resolution";
import {
  assessmentTemporalState,
  effectiveAssessments,
  orderUpcomingAssessments,
  topicScopeId,
} from "@/lib/study-plan/assessments";
import { OVERDUE_GRACE_MS } from "@/lib/study-plan/constants";
import { hardPrerequisitesSatisfied, orderStudyPlanContexts } from "@/lib/study-plan/curriculum-order";
import type { Assessment } from "@/lib/study-plan/types";

export type AssessmentReadinessState = "secure" | "developing" | "needs_attention" | "limited_evidence";
export type AssessmentReadinessReason =
  | "content_recheck"
  | "open_mistake"
  | "review_overdue"
  | "review_due"
  | "review_due_soon"
  | "review_status_unavailable"
  | "learning_in_progress"
  | "secure_evidence"
  | "limited_evidence"
  | "content_unavailable";

export type AssessmentReadinessAction = {
  kind: "review" | "practice" | "learning";
  label: string;
  href: string;
};

export type AssessmentSkillReadiness = {
  skillPathId: string;
  skillName: string;
  courseAreaId: string;
  courseAreaName: string;
  topicId: string;
  topicName: string;
  coverage: "supported" | "content_unavailable";
  state: AssessmentReadinessState | null;
  reasons: AssessmentReadinessReason[];
  learnerConfidence: ConfidenceLevel | null;
  action: AssessmentReadinessAction | null;
};

export type AssessmentReadinessCounts = Record<AssessmentReadinessState, number>;

export type AssessmentReadinessSummary = {
  assessment: Assessment;
  skills: AssessmentSkillReadiness[];
  counts: AssessmentReadinessCounts;
  supportedSkillCount: number;
  unavailableSkillCount: number;
  totalCanonicalSkillCount: number;
  bestFocus: AssessmentSkillReadiness | null;
};

export type CourseAssessmentReadiness = {
  courseSlug: string;
  assessments: AssessmentReadinessSummary[];
  expiredAssessmentIds: string[];
  diagnostics: string[];
};

type SnapshotSkill = {
  context: ResolvedSkillPath;
  progress: SkillPathProgress | null;
  review: ReviewDueState | null;
  mistakes: MistakeItem[];
  nextAction: ReturnType<typeof deriveSkillPathNextAction> | null;
  result: AssessmentSkillReadiness;
  order: number;
};

type ReadinessDependencies = {
  deriveMistakes: typeof deriveMistakeLog;
  calculateProgress: typeof calculateSkillPathProgress;
  deriveReview: typeof deriveSkillReviewState;
};

const defaultDependencies: ReadinessDependencies = {
  deriveMistakes: deriveMistakeLog,
  calculateProgress: calculateSkillPathProgress,
  deriveReview: deriveSkillReviewState,
};

/** Pure, read-side assessment interpretation. Readiness is always reconstructed and never stored. */
export function deriveCourseAssessmentReadiness(input: {
  courseSlug: string;
  assessments: readonly Assessment[];
  evidence: ProgressEvidence;
  now: Date;
  learnerConfidence?: ReadonlyMap<string, ConfidenceLevel>;
  source?: CanonicalContentSource;
}, dependencies: ReadinessDependencies = defaultDependencies): CourseAssessmentReadiness {
  const source = input.source ?? canonicalContent;
  const resolver = input.source ? createContentResolver(source) : contentResolver;
  const allContexts = orderStudyPlanContexts(resolver.getAllPathContexts().filter((context) =>
    context.subject.subjectSlug === input.courseSlug && context.skillPath.contentStatus === "active"));
  const supportedContexts = allContexts.filter((context) => context.skillPath.isAvailable);
  const versions = resolver.getQuestionVersions();
  const progressBySkill = new Map(supportedContexts.map((context) => [
    context.skillPath.slug,
    dependencies.calculateProgress(context.skillPath, input.evidence, versions),
  ]));
  const mistakes = dependencies.deriveMistakes(input.evidence, input.courseSlug, source);
  const mistakesBySkill = new Map<string, MistakeItem[]>();
  for (const group of mistakes.openGroups) {
    mistakesBySkill.set(group.skillPathId, [
      ...(mistakesBySkill.get(group.skillPathId) ?? []),
      ...group.items,
    ]);
  }
  const reviewCache = createReviewDerivationCache();
  const snapshotBySkill = new Map<string, SnapshotSkill>();
  for (const [order, context] of allContexts.entries()) {
    const progress = progressBySkill.get(context.skillPath.slug) ?? null;
    const review = progress
      ? dependencies.deriveReview(context.skillPath, input.evidence, input.now, reviewCache)
      : null;
    const pathMistakes = mistakesBySkill.get(context.skillPath.slug) ?? [];
    const nextAction = progress
      ? deriveSkillPathNextAction({ pathId: context.skillPath.slug, evidence: input.evidence, source })
      : null;
    snapshotBySkill.set(context.skillPath.slug, {
      context,
      progress,
      review,
      mistakes: pathMistakes,
      nextAction,
      result: skillReadiness({
        context,
        progress,
        review,
        mistakes: pathMistakes,
        nextAction,
        learnerConfidence: input.learnerConfidence?.get(context.skillPath.slug) ?? null,
        prerequisitesSatisfied: progress ? hardPrerequisitesSatisfied(context.skillPath.slug, progressBySkill) : false,
        now: input.now,
      }),
      order,
    });
  }

  const effective = effectiveAssessments({ courseSlug: input.courseSlug, assessments: [...input.assessments] });
  const active = orderUpcomingAssessments(effective, input.now);
  const diagnostics: string[] = [];
  const summaries = active.map((assessment) => {
    const scoped = scopedSkills(assessment, allContexts, snapshotBySkill, diagnostics);
    const results = scoped.map((item) => item.result);
    const supported = results.filter((result) => result.coverage === "supported");
    const counts = emptyCounts();
    for (const result of supported) if (result.state) counts[result.state] += 1;
    const best = [...scoped]
      .filter((item) => item.result.coverage === "supported" && item.result.action)
      .sort(compareFocus)[0]?.result ?? null;
    return {
      assessment,
      skills: results,
      counts,
      supportedSkillCount: supported.length,
      unavailableSkillCount: results.length - supported.length,
      totalCanonicalSkillCount: results.length,
      bestFocus: best,
    } satisfies AssessmentReadinessSummary;
  });
  return {
    courseSlug: input.courseSlug,
    assessments: summaries,
    expiredAssessmentIds: effective
      .filter((assessment) => assessmentTemporalState(assessment, input.now) === "expired")
      .map((assessment) => assessment.id)
      .sort(),
    diagnostics,
  };
}

function skillReadiness(input: {
  context: ResolvedSkillPath;
  progress: SkillPathProgress | null;
  review: ReviewDueState | null;
  mistakes: MistakeItem[];
  nextAction: ReturnType<typeof deriveSkillPathNextAction> | null;
  learnerConfidence: ConfidenceLevel | null;
  prerequisitesSatisfied: boolean;
  now: Date;
}): AssessmentSkillReadiness {
  const base = {
    skillPathId: input.context.skillPath.slug,
    skillName: input.context.skillPath.name,
    courseAreaId: input.context.courseArea.slug,
    courseAreaName: input.context.courseArea.name,
    topicId: topicScopeId(input.context.courseArea.slug, input.context.routeTopic.slug),
    topicName: input.context.routeTopic.name,
    learnerConfidence: input.learnerConfidence,
  };
  if (!input.context.skillPath.isAvailable || !input.progress || !input.review) {
    return { ...base, coverage: "content_unavailable", state: null, reasons: ["content_unavailable"], action: null };
  }
  const progress = input.progress;
  const review = input.review;

  const hardContentRecheck = progress.reassessmentRequiredQuestionIds.length > 0 || review.reason === "content_changed";
  const softContentRecheck = progress.reassessmentRecommendedQuestionIds.length > 0;
  const reviewHistoryUnavailable = review.reason === "history_unavailable";
  const reviewOverdue = review.due && review.reason === "due_after_time" && isOverdue(review.dueAt, input.now);
  const reasons: AssessmentReadinessReason[] = [];
  if (hardContentRecheck || softContentRecheck) reasons.push("content_recheck");
  if (reviewOverdue) reasons.push("review_overdue");
  else if (review.due) reasons.push("review_due");
  if (input.mistakes.length) reasons.push("open_mistake");
  if (reviewHistoryUnavailable) reasons.push("review_status_unavailable");

  let state: AssessmentReadinessState;
  if (hardContentRecheck || review.due || input.mistakes.length > 0) {
    state = "needs_attention";
  } else if (progress.attemptedCount === 0) {
    state = "limited_evidence";
    reasons.push("limited_evidence");
  } else if (!reviewHistoryUnavailable && !softContentRecheck
      && (progress.status === "secure" || progress.status === "mastered")
      && !review.dueSoon) {
    state = "secure";
    reasons.push("secure_evidence");
  } else {
    state = "developing";
    if (review.dueSoon) reasons.push("review_due_soon");
    if (!reasons.includes("content_recheck") && !reasons.includes("review_status_unavailable")) reasons.push("learning_in_progress");
  }

  return {
    ...base,
    coverage: "supported",
    state,
    reasons: unique(reasons),
    action: actionFor({
      context: input.context,
      progress,
      review,
      mistakes: input.mistakes,
      nextAction: input.nextAction,
      prerequisitesSatisfied: input.prerequisitesSatisfied,
      state,
      hardContentRecheck,
      reviewHistoryUnavailable,
    }),
  };
}

function actionFor(input: {
  context: ResolvedSkillPath;
  progress: SkillPathProgress;
  review: ReviewDueState;
  mistakes: MistakeItem[];
  nextAction: ReturnType<typeof deriveSkillPathNextAction> | null;
  state: AssessmentReadinessState;
  hardContentRecheck: boolean;
  reviewHistoryUnavailable: boolean;
  prerequisitesSatisfied: boolean;
}) : AssessmentReadinessAction | null {
  const pathId = input.context.skillPath.slug;
  if (input.review.due && input.review.reason !== "history_unavailable") {
    return { kind: "review", label: "Start Review", href: `/practice?review=1&path=${encodeURIComponent(pathId)}` };
  }
  if (input.mistakes.length || input.progress.status === "completed" || input.reviewHistoryUnavailable) {
    return { kind: "practice", label: "Practice this skill", href: `/practice?path=${encodeURIComponent(pathId)}` };
  }
  if (input.state === "secure") return null;
  if (input.state === "limited_evidence" && !input.prerequisitesSatisfied) return null;
  if (input.nextAction?.href) {
    return { kind: "learning", label: input.nextAction.label, href: input.nextAction.href };
  }
  if (input.hardContentRecheck) {
    return { kind: "practice", label: "Practice this skill", href: `/practice?path=${encodeURIComponent(pathId)}` };
  }
  return null;
}

function scopedSkills(
  assessment: Assessment,
  contexts: readonly ResolvedSkillPath[],
  snapshot: ReadonlyMap<string, SnapshotSkill>,
  diagnostics: string[],
) {
  if (assessment.scope.kind === "whole_course") return contexts.map((context) => snapshot.get(context.skillPath.slug)!).filter(Boolean);
  if (assessment.scope.kind === "topics") {
    const knownTopics = new Set(contexts.map((context) => topicScopeId(context.courseArea.slug, context.routeTopic.slug)));
    for (const id of assessment.scope.topicIds) if (!knownTopics.has(id)) diagnostics.push(`${assessment.id}:unknown_topic:${id}`);
    const selected = new Set(assessment.scope.topicIds);
    return contexts.filter((context) => selected.has(topicScopeId(context.courseArea.slug, context.routeTopic.slug)))
      .map((context) => snapshot.get(context.skillPath.slug)!).filter(Boolean);
  }
  const knownSkills = new Set(contexts.map((context) => context.skillPath.slug));
  if (assessment.scope.kind === "requirements") {
    const knownPointIds = new Set(higherMathematicsSpecificationRegister.points
      .filter((point) => point.status === "active").map((point) => point.specPointId));
    for (const id of assessment.scope.specPointIds) if (!knownPointIds.has(id)) diagnostics.push(`${assessment.id}:unknown_requirement:${id}`);
    const selectedRequirements = new Set(resolveSkillsForRequirements(assessment.scope.specPointIds));
    return contexts.filter((context) => selectedRequirements.has(context.skillPath.slug))
      .map((context) => snapshot.get(context.skillPath.slug)!).filter(Boolean);
  }
  for (const id of assessment.scope.skillPathIds) if (!knownSkills.has(id)) diagnostics.push(`${assessment.id}:unknown_skill:${id}`);
  const selected = new Set(assessment.scope.skillPathIds);
  return contexts.filter((context) => selected.has(context.skillPath.slug))
    .map((context) => snapshot.get(context.skillPath.slug)!).filter(Boolean);
}

function compareFocus(left: SnapshotSkill, right: SnapshotSkill) {
  return focusTier(left) - focusTier(right)
    || dateValue(left.review?.dueAt) - dateValue(right.review?.dueAt)
    || latestMistake(right.mistakes) - latestMistake(left.mistakes)
    || left.order - right.order
    || left.result.skillPathId.localeCompare(right.result.skillPathId);
}

function focusTier(item: SnapshotSkill) {
  if (item.result.reasons.includes("content_recheck") && item.result.action?.kind === "review") return 0;
  if (item.result.reasons.includes("review_overdue")) return 1;
  if (item.result.reasons.includes("review_due")) return 2;
  if (item.result.reasons.includes("open_mistake")) return 3;
  if (item.progress?.status === "in_progress") return 4;
  if (item.result.state === "developing") return 5;
  if (item.result.state === "limited_evidence" && item.result.action) return 6;
  return 7;
}

function isOverdue(dueAt: string | null, now: Date) {
  const due = dueAt ? Date.parse(dueAt) : Number.NaN;
  return Number.isFinite(due) && now.getTime() - due >= OVERDUE_GRACE_MS;
}

function latestMistake(items: readonly MistakeItem[]) {
  return items.reduce((latest, item) => Math.max(latest, Date.parse(item.latestIncorrectAt) || 0), 0);
}

function dateValue(value: string | null | undefined) {
  const parsed = value ? Date.parse(value) : Number.POSITIVE_INFINITY;
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function emptyCounts(): AssessmentReadinessCounts {
  return { secure: 0, developing: 0, needs_attention: 0, limited_evidence: 0 };
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}
