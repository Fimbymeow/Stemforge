import type { ConfidenceLevel } from "@/lib/confidence/types";
import { contentResolver } from "@/lib/content-resolver";
import { deriveLearnerNextAction, deriveSkillPathNextAction } from "@/lib/learning/next-action";
import { deriveMistakeLog, type MistakeLogModel } from "@/lib/mistakes/derivation";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { ProgressEvidence, SkillPathProgress } from "@/lib/progress/types";
import { createReviewDerivationCache, deriveSkillReviewState } from "@/lib/review/derivation";
import type { ReviewDueState } from "@/lib/review/types";
import { assessmentQualifierFor, nearestRelevantAssessment, topicScopeId } from "@/lib/study-plan/assessments";
import { OVERDUE_GRACE_MS } from "@/lib/study-plan/constants";
import { hardPrerequisitesSatisfied, orderStudyPlanContexts } from "@/lib/study-plan/curriculum-order";
import { estimateReviewMinutes, estimateStageMinutes, estimateTargetedPracticeMinutes } from "@/lib/study-plan/duration";
import type {
  Assessment,
  StudyPlanAssessmentQualifier,
  StudyPlanCandidate,
  StudyPlanDiagnostic,
} from "@/lib/study-plan/types";

type CandidateBuildInput = {
  now: Date;
  courseSlug: string;
  evidence: ProgressEvidence;
  /** Already resolved via `effectiveAssessments` (learner assessments + provisional default, if any). */
  assessments: readonly Assessment[];
  learnerConfidence?: ReadonlyMap<string, ConfidenceLevel>;
};

type CandidateBuildResult = {
  courseExists: boolean;
  availableContentExists: boolean;
  candidates: StudyPlanCandidate[];
  diagnostics: StudyPlanDiagnostic[];
};

type CandidateDependencies = {
  deriveMistakes: typeof deriveMistakeLog;
};

const defaultDependencies: CandidateDependencies = { deriveMistakes: deriveMistakeLog };

export function buildStudyPlanCandidates(
  input: CandidateBuildInput,
  dependencies: CandidateDependencies = defaultDependencies,
): CandidateBuildResult {
  const allContexts = contentResolver.getAllPathContexts();
  const courseExists = contentResolver.getSubjects().some((subject) =>
    subject.subjectSlug === input.courseSlug);
  const courseContexts = allContexts.filter((context) => context.subject.subjectSlug === input.courseSlug);
  const diagnostics: StudyPlanDiagnostic[] = allContexts
    .filter((context) => context.subject.subjectSlug === input.courseSlug && !context.skillPath.isAvailable)
    .map((context) => diagnostic(context.skillPath.slug, null, "excluded", "content_unavailable"));
  const availableContexts = orderStudyPlanContexts(
    courseContexts.filter((context) => context.skillPath.isAvailable),
  );
  if (!courseContexts.length || !availableContexts.length) {
    return {
      courseExists,
      availableContentExists: availableContexts.length > 0,
      candidates: [],
      diagnostics,
    };
  }

  // Course-wide derivations intentionally happen once, before the per-skill loop.
  const mistakes = dependencies.deriveMistakes(input.evidence, input.courseSlug);
  const mistakesBySkill = indexOpenMistakes(mistakes);
  const canonicalLearnerAction = deriveLearnerNextAction({ evidence: input.evidence });
  diagnostics.push(diagnostic(
    canonicalLearnerAction.pathId,
    null,
    "candidate",
    "canonical_learner_next_action",
    canonicalLearnerAction.kind,
  ));

  const questionVersions = contentResolver.getQuestionVersions();
  const progressBySkill = new Map<string, SkillPathProgress>();
  for (const context of availableContexts) {
    progressBySkill.set(
      context.skillPath.slug,
      calculateSkillPathProgress(context.skillPath, input.evidence, questionVersions),
    );
  }

  const reviewCache = createReviewDerivationCache();
  const candidates: StudyPlanCandidate[] = [];
  const unstarted: Array<{
    context: (typeof availableContexts)[number];
    progress: SkillPathProgress;
    assessmentQualifier: StudyPlanAssessmentQualifier | null;
  }> = [];

  for (const context of availableContexts) {
    const pathId = context.skillPath.slug;
    const progress = progressBySkill.get(pathId)!;
    const review = deriveSkillReviewState(context.skillPath, input.evidence, input.now, reviewCache);
    const openMistakes = mistakesBySkill.get(pathId) ?? [];
    const nextAction = deriveSkillPathNextAction({ pathId, evidence: input.evidence });
    const assessmentContext = nearestRelevantAssessment(
      input.assessments,
      topicScopeId(context.courseArea.slug, context.routeTopic.slug),
      pathId,
      input.now,
    );
    const assessmentQualifier = assessmentContext
      ? assessmentQualifierFor(assessmentContext.assessment, assessmentContext.phase, input.now)
      : null;

    if (review.reason === "history_unavailable") {
      diagnostics.push(diagnostic(pathId, null, "excluded", "review_history_unavailable", review.diagnostic));
    }

    const reviewCandidate = candidateForReview(context.skillPath.name, pathId, review, input, assessmentQualifier);
    if (reviewCandidate) {
      candidates.push(reviewCandidate);
      diagnostics.push(diagnostic(pathId, reviewCandidate.candidateKey, "candidate", `tier_${reviewCandidate.tier}`));
      if (openMistakes.length && review.reason === "recently_incorrect") {
        diagnostics.push(diagnostic(pathId, reviewCandidate.candidateKey, "excluded", "mistake_absorbed_by_review"));
      }
      continue;
    }

    if (progress.attemptedCount === 0) {
      unstarted.push({ context, progress, assessmentQualifier });
      continue;
    }

    if (progress.status === "in_progress") {
      const stage = context.skillPath.learningStages?.find((item) => item.id === nextAction.stageId);
      if (!stage || stage.status !== "available" || !isValidStudyPlanHref(nextAction.href)) {
        diagnostics.push(diagnostic(pathId, null, "excluded", "continuation_destination_unavailable"));
        continue;
      }
      const latestMistakeAt = latestMistake(openMistakes);
      const candidate = createCandidate({
        pathId,
        skillName: context.skillPath.name,
        actionType: "continue_stage",
        href: nextAction.href!,
        reasonCode: latestMistakeAt ? "continue_with_mistake" : "continue",
        tier: latestMistakeAt ? 2 : 3,
        stageId: stage.id,
        stageName: stage.name,
        suggestedMinutes: estimateStageMinutes(stage),
        dueAt: null,
        latestActivityAt: latestPathActivity(pathId, input.evidence),
        latestMistakeAt,
        examPractice: stage.name === "Past Paper-style Questions",
        assessmentQualifier,
        learnerFlaggedNeedsWork: input.learnerConfidence?.get(pathId) === "needs_work",
      });
      candidates.push(candidate);
      diagnostics.push(diagnostic(pathId, candidate.candidateKey, "candidate", `tier_${candidate.tier}`));
      continue;
    }

    if (openMistakes.length) {
      const candidate = createCandidate({
        pathId,
        skillName: context.skillPath.name,
        actionType: "targeted_practice",
        href: `/practice?path=${encodeURIComponent(pathId)}`,
        reasonCode: "recent_mistakes",
        tier: 5,
        stageId: null,
        stageName: null,
        suggestedMinutes: estimateTargetedPracticeMinutes(),
        dueAt: null,
        latestActivityAt: latestPathActivity(pathId, input.evidence),
        latestMistakeAt: latestMistake(openMistakes),
        examPractice: false,
        assessmentQualifier,
        learnerFlaggedNeedsWork: input.learnerConfidence?.get(pathId) === "needs_work",
      });
      candidates.push(candidate);
      diagnostics.push(diagnostic(pathId, candidate.candidateKey, "candidate", "tier_5"));
    } else {
      diagnostics.push(diagnostic(pathId, null, "excluded", "no_useful_action"));
    }
  }

  // Close-assessment suppression is per-skill (Part G): a test on one topic in 4 days must not
  // globally freeze new-skill starts elsewhere in the course, so each unstarted skill is only
  // suppressed by its own nearest relevant assessment, never by another skill's.
  const nextUnstarted = unstarted.find(({ context, assessmentQualifier }) =>
    assessmentQualifier?.phase !== "close" && hardPrerequisitesSatisfied(context.skillPath.slug, progressBySkill));
  if (nextUnstarted) {
    const { context, assessmentQualifier } = nextUnstarted;
    const nextAction = deriveSkillPathNextAction({ pathId: context.skillPath.slug, evidence: input.evidence });
    const stage = context.skillPath.learningStages?.find((item) => item.id === nextAction.stageId);
    if (stage?.status === "available" && isValidStudyPlanHref(nextAction.href)) {
      const candidate = createCandidate({
        pathId: context.skillPath.slug,
        skillName: context.skillPath.name,
        actionType: "continue_stage",
        href: nextAction.href!,
        reasonCode: "next_skill",
        tier: 6,
        stageId: stage.id,
        stageName: stage.name,
        suggestedMinutes: estimateStageMinutes(stage),
        dueAt: null,
        latestActivityAt: null,
        latestMistakeAt: null,
        examPractice: false,
        assessmentQualifier,
        learnerFlaggedNeedsWork: input.learnerConfidence?.get(context.skillPath.slug) === "needs_work",
      });
      candidates.push(candidate);
      diagnostics.push(diagnostic(context.skillPath.slug, candidate.candidateKey, "candidate", "tier_6"));
    } else {
      diagnostics.push(diagnostic(context.skillPath.slug, null, "excluded", "next_skill_destination_unavailable"));
    }
  }
  for (const { context, assessmentQualifier } of unstarted) {
    if (context.skillPath.slug === nextUnstarted?.context.skillPath.slug) continue;
    const code = assessmentQualifier?.phase === "close"
      ? "new_start_suppressed_close_exam"
      : hardPrerequisitesSatisfied(context.skillPath.slug, progressBySkill)
        ? "not_next_curriculum_skill"
        : "hard_prerequisite_incomplete";
    diagnostics.push(diagnostic(context.skillPath.slug, null, "excluded", code));
  }

  return {
    courseExists: true,
    availableContentExists: true,
    candidates: candidates.filter((candidate) => isValidStudyPlanHref(candidate.href)),
    diagnostics,
  };
}

export function compareStudyPlanCandidates(left: StudyPlanCandidate, right: StudyPlanCandidate): number {
  return left.tier - right.tier
    || examPracticeOrder(left, right)
    || confidenceOrder(left, right)
    || compareCandidateRecency(left, right)
    || left.skillPathId.localeCompare(right.skillPathId)
    || left.candidateKey.localeCompare(right.candidateKey);
}

/**
 * Self-reported "needs work" is a modest tie-breaker among otherwise-equal-tier candidates only —
 * never a reason to cross tiers (Part R). `left.tier - right.tier` already short-circuited by this
 * point in the OR-chain, so `left.tier === right.tier` here; gating on `tier > 1` keeps this from
 * ever reordering Tier 0/1 (review overdue/due), so hard evidence structurally cannot be outranked
 * by a self-report.
 */
function confidenceOrder(left: StudyPlanCandidate, right: StudyPlanCandidate): number {
  if (left.tier <= 1) return 0;
  return Number(right.learnerFlaggedNeedsWork) - Number(left.learnerFlaggedNeedsWork);
}

export function isValidStudyPlanHref(href: string | null): href is string {
  if (!href || href.includes("mode=")) return false;
  return /^\/question\/[A-Za-z0-9_-]+(?:\?.*)?$/.test(href)
    || /^\/practice(?:\?(?:review=1&path=|path=)[A-Za-z0-9_%.-]+)$/.test(href)
    || /^\/subjects\/[A-Za-z0-9_-]+\/[A-Za-z0-9_?=&%.-]+$/.test(href);
}

function candidateForReview(
  skillName: string,
  pathId: string,
  review: ReviewDueState,
  input: CandidateBuildInput,
  assessmentQualifier: StudyPlanAssessmentQualifier | null,
): StudyPlanCandidate | null {
  if (!review.eligible || (!review.due && !review.dueSoon) || !review.dueAt) return null;
  const dueTime = Date.parse(review.dueAt);
  const overdue = review.reason === "due_after_time"
    && Number.isFinite(dueTime)
    && input.now.getTime() - dueTime >= OVERDUE_GRACE_MS;
  return createCandidate({
    pathId,
    skillName,
    actionType: "review",
    href: `/practice?review=1&path=${encodeURIComponent(pathId)}`,
    reasonCode: overdue ? "review_overdue" : review.due ? "review_due" : "review_due_soon",
    tier: overdue ? 0 : review.due ? 1 : 4,
    stageId: null,
    stageName: null,
    suggestedMinutes: estimateReviewMinutes(),
    dueAt: review.dueAt,
    latestActivityAt: latestPathActivity(pathId, input.evidence),
    latestMistakeAt: null,
    examPractice: false,
    assessmentQualifier,
    learnerFlaggedNeedsWork: input.learnerConfidence?.get(pathId) === "needs_work",
  });
}

function createCandidate(input: {
  pathId: string;
  skillName: string;
  actionType: StudyPlanCandidate["actionType"];
  href: string;
  reasonCode: StudyPlanCandidate["reasonCode"];
  tier: StudyPlanCandidate["tier"];
  stageId: string | null;
  stageName: string | null;
  suggestedMinutes: number;
  dueAt: string | null;
  latestActivityAt: string | null;
  latestMistakeAt: string | null;
  examPractice: boolean;
  assessmentQualifier: StudyPlanAssessmentQualifier | null;
  learnerFlaggedNeedsWork: boolean;
}): StudyPlanCandidate {
  return {
    candidateKey: [input.pathId, input.actionType, input.stageId ?? "all"].join(":"),
    skillPathId: input.pathId,
    skillName: input.skillName,
    actionType: input.actionType,
    href: input.href,
    reasonCode: input.reasonCode,
    tier: input.tier,
    stageId: input.stageId,
    stageName: input.stageName,
    suggestedMinutes: input.suggestedMinutes,
    dueAt: input.dueAt,
    latestActivityAt: input.latestActivityAt,
    latestMistakeAt: input.latestMistakeAt,
    examPractice: input.examPractice,
    examQualifier: input.assessmentQualifier?.phase ?? null,
    assessmentQualifier: input.assessmentQualifier,
    learnerFlaggedNeedsWork: input.learnerFlaggedNeedsWork,
  };
}

function indexOpenMistakes(model: MistakeLogModel) {
  return new Map(model.openGroups.map((group) => [group.skillPathId, group.items]));
}

function latestMistake(items: readonly { latestIncorrectAt: string }[]): string | null {
  return items.map((item) => item.latestIncorrectAt)
    .sort((left, right) => Date.parse(right) - Date.parse(left) || right.localeCompare(left))[0] ?? null;
}

function latestPathActivity(pathId: string, evidence: ProgressEvidence): string | null {
  const values = [
    ...evidence.attempts.filter((item) => item.skillPathId === pathId).map((item) => item.attemptedAt),
    ...evidence.supportEvents.filter((item) => item.skillPathId === pathId).map((item) => item.occurredAt),
    ...evidence.achievementSnapshots.filter((item) => item.pathId === pathId).map((item) => item.achievedAt),
    ...evidence.reviewEvents.filter((item) => item.target.targetId === pathId).map((item) => item.occurredAt),
  ];
  return values.sort((left, right) => Date.parse(right) - Date.parse(left) || right.localeCompare(left))[0] ?? null;
}

function examPracticeOrder(left: StudyPlanCandidate, right: StudyPlanCandidate): number {
  const examRelevant = left.examQualifier === "medium" || left.examQualifier === "close";
  if (!examRelevant || left.tier !== right.tier) return 0;
  return Number(right.examPractice) - Number(left.examPractice);
}

function compareCandidateRecency(left: StudyPlanCandidate, right: StudyPlanCandidate): number {
  if ([0, 1, 4].includes(left.tier)) {
    return dateValue(left.dueAt) - dateValue(right.dueAt);
  }
  if ([2, 5].includes(left.tier)) {
    return dateValue(right.latestMistakeAt) - dateValue(left.latestMistakeAt);
  }
  if (left.tier === 3) {
    return dateValue(right.latestActivityAt) - dateValue(left.latestActivityAt);
  }
  return 0;
}

function dateValue(value: string | null): number {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function diagnostic(
  skillPathId: string | null,
  candidateKey: string | null,
  outcome: StudyPlanDiagnostic["outcome"],
  code: string,
  detail?: string,
): StudyPlanDiagnostic {
  return { skillPathId, candidateKey, outcome, code, ...(detail ? { detail } : {}) };
}
