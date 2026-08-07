import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsReasoningAreaIds, higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import type { Subject } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { deriveSkillPathNextAction } from "@/lib/learning/next-action";
import { getSkillPathProgress } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";
import { createReviewDerivationCache, deriveSkillReviewState } from "@/lib/review/derivation";

export type TrackerStructuralStatus = "Not started" | "In progress" | "Completed";
export type TrackerKnowledgeStatus = "Needs practice" | "Healthy";

export type CourseTrackerSkill = {
  skillPathId: string;
  name: string;
  availability: "Available" | "Coming soon";
  structuralStatus: TrackerStructuralStatus | null;
  knowledgeStatus: TrackerKnowledgeStatus | null;
  knowledgeReason: string | null;
  reviewDue: boolean;
  reviewReason: string | null;
  action: { label: string; href: string } | null;
};

export type CourseTrackerRequirement = {
  areaId: string;
  title: string;
  officialPoints: Array<{ id: string; reference: string; text: string }>;
  skills: CourseTrackerSkill[];
};

export type CourseTrackerArea = {
  courseAreaId: string;
  title: string;
  requirements: CourseTrackerRequirement[];
};

export type CourseTrackerModel = {
  availableSkillCount: number;
  totalSkillCount: number;
  areas: CourseTrackerArea[];
  courseWideRequirements: Array<{ areaId: string; title: string; officialPoints: CourseTrackerRequirement["officialPoints"]; mappedSkillNames: string[] }>;
};

export function deriveHigherMathsCourseTracker(
  subject: Subject,
  evidence: ProgressEvidence,
  now = new Date(),
  wordingMode: "official" | "learner-friendly" = "official",
): CourseTrackerModel {
  const contexts = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === subject.subjectSlug);
  const contextById = new Map(contexts.map((context) => [context.skillPath.slug, context]));
  const mappingBySkill = new Map(higherMathematicsOfficialSkillMappings.map((mapping) => [mapping.skillPathId, mapping]));
  const mappedSkillIdsByPoint = new Map<string, string[]>();
  for (const mapping of higherMathematicsOfficialSkillMappings) {
    for (const pointId of mapping.officialSpecificationPointIds) {
      const ids = mappedSkillIdsByPoint.get(pointId) ?? [];
      ids.push(mapping.skillPathId);
      mappedSkillIdsByPoint.set(pointId, ids);
    }
  }
  const pointOrder = new Map(higherMathematicsSpecificationRegister.points.map((point, index) => [point.specPointId, index]));
  const activePoints = higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active");
  const reviewCache = createReviewDerivationCache();

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
        const officialPoints = activePoints
          .filter((point) => point.areaId === strand.id)
          .sort((left, right) => (pointOrder.get(left.specPointId) ?? 0) - (pointOrder.get(right.specPointId) ?? 0))
          .map((point) => pointView(point, wordingMode));
        return { areaId: strand.id, title: strand.name, officialPoints, skills };
      }),
  }));

  const reasoningAreaIds = new Set<string>(Object.values(higherMathematicsReasoningAreaIds));
  const courseWideRequirements = higherMathematicsSpecificationRegister.areas
    .filter((area) => reasoningAreaIds.has(area.areaId))
    .sort((left, right) => left.order - right.order)
    .map((area) => {
      const points = activePoints.filter((point) => point.areaId === area.areaId);
      const mappedSkillNames = [...new Set(points.flatMap((point) => mappedSkillIdsByPoint.get(point.specPointId) ?? []))]
        .map((skillId) => contextById.get(skillId)?.skillPath.name)
        .filter((name): name is string => Boolean(name));
      return { areaId: area.areaId, title: area.title, officialPoints: points.map((point) => pointView(point, wordingMode)), mappedSkillNames };
    });

  return {
    availableSkillCount: contexts.filter((context) => context.skillPath.isAvailable).length,
    totalSkillCount: contexts.length,
    areas,
    courseWideRequirements,
  };

  function deriveTrackerSkill(skillPathId: string, progressEvidence: ProgressEvidence, at: Date, cache: ReturnType<typeof createReviewDerivationCache>): CourseTrackerSkill {
    const context = contextById.get(skillPathId);
    if (!context || !mappingBySkill.has(skillPathId)) throw new Error(`Course tracker cannot resolve mapped skill ${skillPathId}.`);
    const path = context.skillPath;
    if (!path.isAvailable) {
      return { skillPathId, name: path.name, availability: "Coming soon", structuralStatus: null, knowledgeStatus: null, knowledgeReason: null, reviewDue: false, reviewReason: null, action: null };
    }
    const progress = getSkillPathProgress(path, progressEvidence);
    const structuralStatus: TrackerStructuralStatus = progress.status === "not_started" ? "Not started"
      : progress.status === "in_progress" ? "In progress" : "Completed";
    const knowledgeStatus = progress.attemptedCount === 0 ? null : progress.reviewQuestionIds.length > 0 ? "Needs practice" : "Healthy";
    const review = deriveSkillReviewState(path, progressEvidence, at, cache);
    const nextAction = deriveSkillPathNextAction({ pathId: skillPathId, evidence: progressEvidence });
    return {
      skillPathId,
      name: path.name,
      availability: "Available",
      structuralStatus,
      knowledgeStatus,
      knowledgeReason: knowledgeStatus === "Needs practice" ? needsPracticeReason(path, progress) : null,
      reviewDue: review.due && review.reason !== "history_unavailable",
      reviewReason: review.due ? review.reason : null,
      action: nextAction.href ? { label: nextAction.label, href: nextAction.href } : null,
    };
  }
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
