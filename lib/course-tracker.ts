import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsReasoningAreaIds, higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import type { Subject } from "@/data/types";
import { confidenceEvidenceFingerprint, deriveConfidenceSuggestion } from "@/lib/confidence/suggestion";
import type { ConfidenceLevel, ConfidenceSuggestion } from "@/lib/confidence/types";
import { contentResolver } from "@/lib/content-resolver";
import { getSkillPathProgress } from "@/lib/local-progress";
import { deriveMistakeLog } from "@/lib/mistakes/derivation";
import type { ProgressEvidence, ProgressStatus } from "@/lib/progress/types";
import { createReviewDerivationCache, deriveSkillReviewState } from "@/lib/review/derivation";

const higherMathsOfficialMappingBySkill = new Map(
  higherMathematicsOfficialSkillMappings.map((mapping) => [mapping.skillPathId, mapping]),
);
const higherMathsOfficialPointOrder = new Map(
  higherMathematicsSpecificationRegister.points.map((point, index) => [point.specPointId, index]),
);
const higherMathsActiveOfficialPoints = higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active");
const higherMathsActiveOfficialPointById = new Map(
  higherMathsActiveOfficialPoints.map((point) => [point.specPointId, point]),
);

export type TrackerStructuralStatus = "Not started" | "In progress" | "Completed";
export type TrackerKnowledgeStatus = "Needs practice" | "Healthy";
export type CourseTrackerOfficialPoint = { id: string; reference: string; text: string };

/**
 * Learner confidence and Orthic's own suggestion, kept as one small derived object rather than
 * flattened onto `CourseTrackerSkill` (Part Q) — `null` only for skills with no confidence surface
 * at all (Coming soon). `suggestion` is Orthic's own evidence-derived read, entirely separate from
 * `learnerLevel`; the learner's own rating is what's displayed (Part I).
 */
export type CourseTrackerSkillConfidence = {
  learnerLevel: ConfidenceLevel | null;
  suggestion: ConfidenceSuggestion;
  evidenceFingerprint: string;
};

export type CourseTrackerSkill = {
  skillPathId: string;
  name: string;
  availability: "actionable" | "curriculum_reference";
  structuralStatus: TrackerStructuralStatus | null;
  knowledgeStatus: TrackerKnowledgeStatus | null;
  knowledgeReason: string | null;
  reviewDue: boolean;
  reviewDueSoon: boolean;
  reviewEligible: boolean;
  masteryStatus: ProgressStatus | null;
  progressLabel: string | null;
  reviewReason: string | null;
  action: { label: string; href: string } | null;
  officialPoints: CourseTrackerOfficialPoint[];
  confidence: CourseTrackerSkillConfidence | null;
};

export type CourseTrackerRequirement = {
  areaId: string;
  title: string;
  officialPoints: CourseTrackerOfficialPoint[];
  skills: CourseTrackerSkill[];
};

export type CourseTrackerArea = {
  courseAreaId: string;
  title: string;
  requirements: CourseTrackerRequirement[];
};

export type CourseTrackerModel = {
  totalSkillCount: number;
  areas: CourseTrackerArea[];
  courseWideRequirements: Array<{ areaId: string; title: string; officialPoints: CourseTrackerRequirement["officialPoints"]; mappedSkillNames: string[] }>;
};

export function getHigherMathsSkillOfficialPoints(
  skillPathId: string,
  wordingMode: "official" | "learner-friendly" = "official",
): CourseTrackerOfficialPoint[] {
  const mapping = higherMathsOfficialMappingBySkill.get(skillPathId);
  if (!mapping) return [];
  return mapping.officialSpecificationPointIds
    .map((pointId) => higherMathsActiveOfficialPointById.get(pointId))
    .filter((point): point is NonNullable<typeof point> => Boolean(point))
    .sort((left, right) => (higherMathsOfficialPointOrder.get(left.specPointId) ?? 0) - (higherMathsOfficialPointOrder.get(right.specPointId) ?? 0))
    .map((point) => pointView(point, wordingMode));
}

export function deriveHigherMathsCourseTracker(
  subject: Subject,
  evidence: ProgressEvidence,
  now = new Date(),
  wordingMode: "official" | "learner-friendly" = "official",
  learnerConfidence?: ReadonlyMap<string, ConfidenceLevel>,
): CourseTrackerModel {
  const contexts = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === subject.subjectSlug);
  const contextById = new Map(contexts.map((context) => [context.skillPath.slug, context]));
  const mappedSkillIdsByPoint = new Map<string, string[]>();
  for (const mapping of higherMathematicsOfficialSkillMappings) {
    for (const pointId of mapping.officialSpecificationPointIds) {
      const ids = mappedSkillIdsByPoint.get(pointId) ?? [];
      ids.push(mapping.skillPathId);
      mappedSkillIdsByPoint.set(pointId, ids);
    }
  }
  const reviewCache = createReviewDerivationCache();
  // Computed once, course-wide, rather than per-row (Part Q) — same amortized-single-pass pattern as `reviewCache`.
  const openMistakeCountBySkill = new Map(
    deriveMistakeLog(evidence, subject.subjectSlug).openGroups.map((group) => [group.skillPathId, group.items.length]),
  );

  const areas = subject.courseAreas.map((courseArea) => ({
    courseAreaId: courseArea.slug,
    title: courseArea.name,
    requirements: [...(courseArea.specificationStrands ?? [])]
      .sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))
      .map((strand) => {
        const skills = contexts
          .filter((context) => context.courseArea.slug === courseArea.slug && context.specificationStrand.id === strand.id)
          .sort((left, right) => (left.skillPath.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.skillPath.displayOrder ?? Number.MAX_SAFE_INTEGER) || left.skillPath.slug.localeCompare(right.skillPath.slug))
          .map((context) => deriveTrackerSkill(context.skillPath.slug, evidence, now, reviewCache));
        const officialPoints = higherMathsActiveOfficialPoints
          .filter((point) => point.areaId === strand.id)
          .sort((left, right) => (higherMathsOfficialPointOrder.get(left.specPointId) ?? 0) - (higherMathsOfficialPointOrder.get(right.specPointId) ?? 0))
          .map((point) => pointView(point, wordingMode));
        return { areaId: strand.id, title: strand.name, officialPoints, skills };
      }),
  }));

  const reasoningAreaIds = new Set<string>(Object.values(higherMathematicsReasoningAreaIds));
  const courseWideRequirements = higherMathematicsSpecificationRegister.areas
    .filter((area) => reasoningAreaIds.has(area.areaId))
    .sort((left, right) => left.order - right.order)
    .map((area) => {
      const points = higherMathsActiveOfficialPoints.filter((point) => point.areaId === area.areaId);
      const mappedSkillNames = [...new Set(points.flatMap((point) => mappedSkillIdsByPoint.get(point.specPointId) ?? []))]
        .map((skillId) => contextById.get(skillId)?.skillPath.name)
        .filter((name): name is string => Boolean(name));
      return { areaId: area.areaId, title: area.title, officialPoints: points.map((point) => pointView(point, wordingMode)), mappedSkillNames };
    });

  return {
    totalSkillCount: contexts.length,
    areas,
    courseWideRequirements,
  };

  function deriveTrackerSkill(skillPathId: string, progressEvidence: ProgressEvidence, at: Date, cache: ReturnType<typeof createReviewDerivationCache>): CourseTrackerSkill {
    const context = contextById.get(skillPathId);
    const mapping = higherMathsOfficialMappingBySkill.get(skillPathId);
    if (!context || !mapping) throw new Error(`Course tracker cannot resolve mapped skill ${skillPathId}.`);
    const path = context.skillPath;
    const officialPoints = getHigherMathsSkillOfficialPoints(skillPathId, wordingMode);
    if (!path.isAvailable) {
      return { skillPathId, name: path.name, availability: "curriculum_reference", structuralStatus: null, knowledgeStatus: null, knowledgeReason: null, reviewDue: false, reviewDueSoon: false, reviewEligible: false, masteryStatus: null, progressLabel: null, reviewReason: null, action: null, officialPoints, confidence: null };
    }
    const progress = getSkillPathProgress(path, progressEvidence);
    const structuralStatus: TrackerStructuralStatus = progress.status === "not_started" ? "Not started"
      : progress.status === "in_progress" ? "In progress" : "Completed";
    const knowledgeStatus = progress.attemptedCount === 0 ? null : progress.reviewQuestionIds.length > 0 ? "Needs practice" : "Healthy";
    const review = deriveSkillReviewState(path, progressEvidence, at, cache);
    const reviewDue = review.due && review.reason !== "history_unavailable";
    const suggestionInput = {
      attemptedCount: progress.attemptedCount,
      masteryStatus: progress.status,
      reviewDue,
      reviewDueSoon: review.dueSoon,
      reviewOverdueAt: review.dueAt,
      openMistakeCount: openMistakeCountBySkill.get(skillPathId) ?? 0,
    };
    return {
      skillPathId,
      name: path.name,
      availability: "actionable",
      structuralStatus,
      knowledgeStatus,
      knowledgeReason: knowledgeStatus === "Needs practice" ? needsPracticeReason(path, progress) : null,
      reviewDue,
      reviewDueSoon: review.dueSoon,
      reviewEligible: review.eligible,
      masteryStatus: progress.status,
      progressLabel: trackerProgressLabel(path, progress),
      reviewReason: review.due ? review.reason : null,
      action: { label: "Open skill", href: path.href },
      officialPoints,
      confidence: {
        learnerLevel: learnerConfidence?.get(skillPathId) ?? null,
        suggestion: deriveConfidenceSuggestion(suggestionInput, at),
        evidenceFingerprint: confidenceEvidenceFingerprint(suggestionInput, at),
      },
    };
  }
}

/**
 * Single-skill counterpart to the per-row suggestion computed inside `deriveHigherMathsCourseTracker`
 * — same evidence pipeline (`getSkillPathProgress`, `deriveSkillReviewState`, `deriveMistakeLog`),
 * reused rather than re-implemented, for the Skill Page's own confidence control (Part H). Returns
 * `null` only when the skill can't be resolved for the given subject.
 */
export function deriveSkillConfidenceSuggestion(
  skillPathId: string,
  subjectSlug: string,
  evidence: ProgressEvidence,
  now = new Date(),
): { suggestion: ConfidenceSuggestion; evidenceFingerprint: string } | null {
  const context = contentResolver.getPathContext(skillPathId);
  if (!context || context.subject.subjectSlug !== subjectSlug) return null;
  const path = context.skillPath;
  const progress = getSkillPathProgress(path, evidence);
  const review = deriveSkillReviewState(path, evidence, now);
  const openMistakeCount = deriveMistakeLog(evidence, subjectSlug).openGroups
    .find((group) => group.skillPathId === skillPathId)?.items.length ?? 0;
  const suggestionInput = {
    attemptedCount: progress.attemptedCount,
    masteryStatus: progress.status,
    reviewDue: review.due && review.reason !== "history_unavailable",
    reviewDueSoon: review.dueSoon,
    reviewOverdueAt: review.dueAt,
    openMistakeCount,
  };
  return {
    suggestion: deriveConfidenceSuggestion(suggestionInput, now),
    evidenceFingerprint: confidenceEvidenceFingerprint(suggestionInput, now),
  };
}

function pointView(point: (typeof higherMathematicsSpecificationRegister.points)[number], wordingMode: "official" | "learner-friendly") {
  const text = wordingMode === "official" && point.verificationStatus === "verified"
    ? point.officialStatement
    : point.authoringSummary;
  return {
    id: point.specPointId,
    reference: point.verificationStatus === "verified"
      ? `${point.officialReference.itemLabel ?? "Official requirement"}, p${point.officialReference.page ?? "?"}`
      : "Official requirement",
    text,
  };
}

function needsPracticeReason(path: NonNullable<ReturnType<typeof contentResolver.getPathContext>>["skillPath"], progress: ReturnType<typeof getSkillPathProgress>) {
  const reviewIds = new Set(progress.reviewQuestionIds);
  const stage = (path.learningStages ?? []).find((item) => item.questionIds.some((questionId) => reviewIds.has(questionId)));
  if (stage) {
    const stageProgress = progress.stageProgress[stage.id];
    if (stageProgress && stageProgress.completedQuestionIds.length < stageProgress.totalQuestions) {
      return `${stage.name}: ${stageProgress.completedQuestionIds.length}/${stageProgress.totalQuestions} complete`;
    }
  }
  return `${progress.reviewQuestionIds.length} question${progress.reviewQuestionIds.length === 1 ? "" : "s"} need more practice`;
}

function trackerProgressLabel(
  path: NonNullable<ReturnType<typeof contentResolver.getPathContext>>["skillPath"],
  progress: ReturnType<typeof getSkillPathProgress>,
) {
  if (progress.status === "not_started") return "Not started";
  if (progress.status === "completed") return "Learned";
  if (progress.status === "secure") return "Secure";
  if (progress.status === "mastered") return "Mastered";

  const stages = path.learningStages ?? [];
  const attemptedIncomplete = stages.find((stage) => {
    const item = progress.stageProgress[stage.id];
    return item && item.attemptedCount > 0 && item.completionPercentage < 100;
  });
  const currentStage = attemptedIncomplete ?? stages.find((stage) => {
    const item = progress.stageProgress[stage.id];
    return item && item.completionPercentage < 100;
  });
  if (!currentStage) return "In progress";
  const stageProgress = progress.stageProgress[currentStage.id];
  return `${currentStage.name} · ${stageProgress.completedQuestionIds.length}/${stageProgress.totalQuestions} complete`;
}
