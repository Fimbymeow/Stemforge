import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import type { ResolvedSkillPath } from "@/lib/content-resolver";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import type { ConfidenceLevel } from "@/lib/confidence/types";
import { deriveLearnerNextAction } from "@/lib/learning/next-action";
import { deriveMistakeLog, type MistakeItem } from "@/lib/mistakes/derivation";
import { discoverEligiblePracticeQuestions } from "@/lib/practice/practice-eligibility";
import { createPracticeSessionSelection } from "@/lib/practice/practice-selection";
import type { EligiblePracticeQuestion, PracticeSelectionResult } from "@/lib/practice/practice-types";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { ProgressEvidence, SkillPathProgress } from "@/lib/progress/types";
import { createReviewDerivationCache, deriveSkillReviewState } from "@/lib/review/derivation";
import { effectiveAssessments, assessmentQualifierFor, nearestRelevantAssessment, topicScopeId } from "@/lib/study-plan/assessments";
import { MINUTES_PER_PRACTICE_QUESTION } from "@/lib/study-plan/constants";
import { hardPrerequisitesSatisfied, orderStudyPlanContexts } from "@/lib/study-plan/curriculum-order";
import type { Assessment, StudyPlanAssessmentQualifier } from "@/lib/study-plan/types";

export const QUICK_PRACTICE_DURATION_OPTIONS = [10, 20, 30] as const;
export type QuickPracticeDurationMinutes = typeof QUICK_PRACTICE_DURATION_OPTIONS[number];
export type QuickPracticeReason = "open_mistake" | "on_your_test" | "you_marked_needs_work" | "continue_learning";

export type QuickPracticeReviewOffer = {
  pathId: string;
  skillName: string;
  href: string;
  dueAt: string | null;
};

export type QuickPracticeRecommendation = {
  primaryPathId: string;
  primarySkillName: string;
  includedPathIds: string[];
  reasons: QuickPracticeReason[];
  assessment: StudyPlanAssessmentQualifier | null;
  durationMinutes: QuickPracticeDurationMinutes;
  requestedCount: number;
};

export type AdaptiveQuickPracticeSelection = {
  path: ResolvedSkillPath["skillPath"] | null;
  result: PracticeSelectionResult;
  recommendation: QuickPracticeRecommendation | null;
  reviewOffer: QuickPracticeReviewOffer | null;
};

type Candidate = {
  context: ResolvedSkillPath;
  progress: SkillPathProgress;
  questions: EligiblePracticeQuestion[];
  mistakes: MistakeItem[];
  assessment: StudyPlanAssessmentQualifier | null;
  assessmentScope: Assessment["scope"] | null;
  confidence: ConfidenceLevel | null;
  isCanonicalNext: boolean;
  isPreferred: boolean;
  tier: 0 | 1 | 2 | 3 | 4;
  order: number;
};

export function quickPracticeQuestionCount(durationMinutes: QuickPracticeDurationMinutes): number {
  return Math.max(1, Math.floor(durationMinutes / MINUTES_PER_PRACTICE_QUESTION));
}

export function createAdaptiveQuickPracticeSelection(input: {
  evidence: ProgressEvidence;
  preferredPathId?: string | null;
  assessments?: readonly Assessment[];
  learnerConfidence?: ReadonlyMap<string, ConfidenceLevel>;
  durationMinutes?: QuickPracticeDurationMinutes;
  seed?: string;
  source?: CanonicalContentSource;
  now?: Date;
}): AdaptiveQuickPracticeSelection {
  const source = input.source ?? canonicalContent;
  const resolver = input.source ? createContentResolver(source) : contentResolver;
  const now = input.now ?? new Date();
  const durationMinutes = input.durationMinutes ?? 20;
  const requestedCount = quickPracticeQuestionCount(durationMinutes);
  const allAvailable = orderStudyPlanContexts(resolver.getAllPathContexts().filter((context) =>
    context.skillPath.isAvailable && context.skillPath.contentStatus === "active"));
  const canonicalAction = deriveLearnerNextAction({ evidence: input.evidence, source });
  const fallbackPathId = input.preferredPathId ?? canonicalAction.pathId;
  const anchor = allAvailable.find((context) => context.skillPath.slug === fallbackPathId) ?? allAvailable[0];
  if (!anchor) return emptySelection();

  const contexts = allAvailable.filter((context) =>
    context.subject.subjectSlug === anchor.subject.subjectSlug && context.courseArea.slug === anchor.courseArea.slug);
  const questionVersions = resolver.getQuestionVersions();
  const progressBySkill = new Map(contexts.map((context) => [
    context.skillPath.slug,
    calculateSkillPathProgress(context.skillPath, input.evidence, questionVersions),
  ]));
  const mistakeLog = deriveMistakeLog(input.evidence, anchor.subject.subjectSlug, source);
  const mistakesBySkill = new Map<string, MistakeItem[]>();
  for (const group of mistakeLog.openGroups) {
    const courseItems = group.items.filter((item) => item.courseId === anchor.courseArea.slug);
    if (!courseItems.length) continue;
    mistakesBySkill.set(group.skillPathId, [
      ...(mistakesBySkill.get(group.skillPathId) ?? []),
      ...courseItems,
    ]);
  }
  const discovered = discoverEligiblePracticeQuestions(source);
  const questionsBySkill = groupQuestions(discovered.eligible.filter((question) =>
    question.reference.subjectId === anchor.subject.subjectSlug && question.reference.courseId === anchor.courseArea.slug));
  const assessments = effectiveAssessments({
    courseSlug: anchor.subject.subjectSlug,
    assessments: [...(input.assessments ?? [])],
  });
  const desiredPathId = input.preferredPathId ?? canonicalAction.pathId;
  const safeFallbackPathId = contexts.find((context) =>
    context.skillPath.slug === desiredPathId
    && (questionsBySkill.get(context.skillPath.slug)?.length ?? 0) > 0
    && hardPrerequisitesSatisfied(context.skillPath.slug, progressBySkill))?.skillPath.slug
    ?? contexts.find((context) =>
      (questionsBySkill.get(context.skillPath.slug)?.length ?? 0) > 0
      && hardPrerequisitesSatisfied(context.skillPath.slug, progressBySkill))?.skillPath.slug;
  const candidates = contexts.flatMap((context, order) => {
    const progress = progressBySkill.get(context.skillPath.slug)!;
    const questions = questionsBySkill.get(context.skillPath.slug) ?? [];
    if (!questions.length || !hardPrerequisitesSatisfied(context.skillPath.slug, progressBySkill)) return [];
    const relevant = nearestRelevantAssessment(
      assessments,
      topicScopeId(context.courseArea.slug, context.routeTopic.slug),
      context.skillPath.slug,
      now,
    );
    const assessment = relevant ? assessmentQualifierFor(relevant.assessment, relevant.phase, now) : null;
    const mistakes = mistakesBySkill.get(context.skillPath.slug) ?? [];
    const confidence = input.learnerConfidence?.get(context.skillPath.slug) ?? null;
    const isPreferred = context.skillPath.slug === input.preferredPathId && context.skillPath.slug === safeFallbackPathId;
    const isCanonicalNext = context.skillPath.slug === safeFallbackPathId;
    const tier = candidateTier({
      mistakes,
      assessment,
      assessmentScope: relevant?.assessment.scope ?? null,
      progress,
      confidence,
      isCanonicalNext,
    });
    return tier === null ? [] : [{
      context,
      progress,
      questions,
      mistakes,
      assessment,
      assessmentScope: relevant?.assessment.scope ?? null,
      confidence,
      isCanonicalNext,
      isPreferred,
      tier,
      order,
    } satisfies Candidate];
  }).sort(compareCandidates);

  const primary = candidates[0];
  if (!primary) return { ...emptySelection(), reviewOffer: reviewOfferFor(contexts, input.evidence, now) };
  const included = focusedCandidates(candidates, requestedCount);
  const selectedPathIds = included.map((candidate) => candidate.context.skillPath.slug);
  const seed = input.seed ?? `quick-practice:${selectedPathIds.join(":")}:${durationMinutes}`;
  const deferredQuestionIds = primary.mistakes.map((mistake) => mistake.questionId);
  const result = createPracticeSessionSelection({
    origin: "quick_practice",
    mode: "targeted",
    courseId: anchor.courseArea.slug,
    selectedPathIds,
    requestedCount,
    seed,
    evidence: input.evidence,
    source,
    now,
    timing: { type: "untimed" },
    pathPriority: selectedPathIds,
    deferredQuestionIds,
  });
  return {
    path: primary.context.skillPath,
    result,
    recommendation: {
      primaryPathId: primary.context.skillPath.slug,
      primarySkillName: primary.context.skillPath.name,
      includedPathIds: result.session?.selectionMetadata.includedPathIds ?? [],
      reasons: reasonsFor(primary),
      assessment: primary.assessment,
      durationMinutes,
      requestedCount,
    },
    reviewOffer: reviewOfferFor(contexts, input.evidence, now),
  };
}

function candidateTier(input: Pick<Candidate, "mistakes" | "assessment" | "assessmentScope" | "progress" | "confidence" | "isCanonicalNext">): Candidate["tier"] | null {
  const specificAssessment = Boolean(input.assessment && input.assessmentScope?.kind !== "whole_course");
  if (input.mistakes.length && input.assessment && input.assessment.phase !== "far") return 0;
  if (input.mistakes.length) return 1;
  if (specificAssessment && !isSecure(input.progress)) return 2;
  if (input.isCanonicalNext) return 3;
  if (input.confidence === "needs_work" && sparseEvidence(input.progress)) return 4;
  return null;
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return left.tier - right.tier
    || Number(right.isPreferred) - Number(left.isPreferred)
    || assessmentOrder(left.assessment) - assessmentOrder(right.assessment)
    || Number(right.mistakes.some((mistake) => mistake.wasReopened)) - Number(left.mistakes.some((mistake) => mistake.wasReopened))
    || latestMistakeTime(right.mistakes) - latestMistakeTime(left.mistakes)
    || left.progress.masteryScore - right.progress.masteryScore
    || Number(right.confidence === "needs_work") - Number(left.confidence === "needs_work")
    || left.order - right.order
    || left.context.skillPath.slug.localeCompare(right.context.skillPath.slug);
}

function focusedCandidates(candidates: Candidate[], requestedCount: number): Candidate[] {
  const selected: Candidate[] = [];
  let available = 0;
  for (const candidate of candidates) {
    if (selected.length && candidate.tier > Math.max(3, candidates[0].tier + 1)) break;
    selected.push(candidate);
    available += candidate.questions.length;
    if (available >= requestedCount) break;
  }
  return selected;
}

function reasonsFor(candidate: Candidate): QuickPracticeReason[] {
  const reasons: QuickPracticeReason[] = [];
  if (candidate.mistakes.length) reasons.push("open_mistake");
  if (candidate.assessment && candidate.assessment.phase !== "far") reasons.push("on_your_test");
  if (!reasons.length && candidate.confidence === "needs_work" && sparseEvidence(candidate.progress)) reasons.push("you_marked_needs_work");
  if (!reasons.length) reasons.push("continue_learning");
  return reasons;
}

function reviewOfferFor(contexts: readonly ResolvedSkillPath[], evidence: ProgressEvidence, now: Date): QuickPracticeReviewOffer | null {
  const cache = createReviewDerivationCache();
  return contexts.map((context, order) => ({ context, order, state: deriveSkillReviewState(context.skillPath, evidence, now, cache) }))
    .filter(({ state }) => state.eligible && state.due && state.reason !== "history_unavailable")
    .sort((left, right) => dateValue(left.state.dueAt) - dateValue(right.state.dueAt) || left.order - right.order)
    .map(({ context, state }) => ({
      pathId: context.skillPath.slug,
      skillName: context.skillPath.name,
      href: `/practice?review=1&path=${encodeURIComponent(context.skillPath.slug)}`,
      dueAt: state.dueAt,
    }))[0] ?? null;
}

function groupQuestions(questions: EligiblePracticeQuestion[]) {
  const grouped = new Map<string, EligiblePracticeQuestion[]>();
  for (const question of questions) grouped.set(question.reference.pathId, [...(grouped.get(question.reference.pathId) ?? []), question]);
  return grouped;
}

function sparseEvidence(progress: SkillPathProgress) {
  return progress.attemptedCount <= 1;
}

function isSecure(progress: SkillPathProgress) {
  return progress.status === "secure" || progress.status === "mastered";
}

function assessmentOrder(assessment: StudyPlanAssessmentQualifier | null) {
  if (!assessment) return 3;
  return assessment.phase === "close" ? 0 : assessment.phase === "medium" ? 1 : 2;
}

function latestMistakeTime(mistakes: readonly MistakeItem[]) {
  return mistakes.reduce((latest, mistake) => Math.max(latest, Date.parse(mistake.latestIncorrectAt) || 0), 0);
}

function dateValue(value: string | null) {
  const parsed = value ? Date.parse(value) : Number.POSITIVE_INFINITY;
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function emptySelection(): AdaptiveQuickPracticeSelection {
  return {
    path: null,
    result: { session: null, eligibleQuestions: [], excludedByReason: {}, shortageReason: "No questions are available for practice yet." },
    recommendation: null,
    reviewOffer: null,
  };
}
