import type { LearningStageName, Question } from "@/data/types";
import type { ResolvedQuestionContext, ResolvedSkillPath } from "@/lib/content-resolver";
import { createContentResolver } from "@/lib/content-resolver";
import { calculateSkillPathProgress, getQuestionProgressForVersion } from "@/lib/progress/calculations";
import type { ProgressEvidence, QuestionProgressState, SkillPathProgress } from "@/lib/progress/types";

export type QuestionBankProgressFilter = "all" | "not-started" | "in-progress" | "completed" | "review-recommended";
export type QuestionBankStageFilter = "all" | LearningStageName;
export type QuestionBankSort = "default" | "recently-practised" | "review-priority" | "completion-status";

export type QuestionBankEntry = {
  id: string;
  context: ResolvedSkillPath;
  questions: Question[];
  matchedQuestionIds: string[];
  progress: SkillPathProgress;
  lastPractisedAt: string | null;
};

export type QuestionBankQuery = {
  search?: string;
  progressFilter?: QuestionBankProgressFilter;
  stageFilter?: QuestionBankStageFilter;
  sort?: QuestionBankSort;
};

export type QuestionBankQuestionEntry = {
  question: Question;
  context: ResolvedQuestionContext;
  progress: QuestionProgressState;
  lastPractisedAt: string | null;
};

type Resolver = ReturnType<typeof createContentResolver>;

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function defaultCompare(left: QuestionBankEntry, right: QuestionBankEntry) {
  return left.context.specificationStrand.displayOrder - right.context.specificationStrand.displayOrder
    || (left.context.skillPath.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.context.skillPath.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || left.context.skillPath.slug.localeCompare(right.context.skillPath.slug);
}

function latestActivityForPath(pathId: string, evidence: ProgressEvidence) {
  const times = [
    ...evidence.attempts.filter((attempt) => attempt.skillPathId === pathId).map((attempt) => attempt.attemptedAt),
    ...evidence.supportEvents.filter((event) => event.skillPathId === pathId).map((event) => event.occurredAt),
  ].filter((value) => !Number.isNaN(Date.parse(value)));
  return times.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

function matchesProgressFilter(entry: QuestionBankEntry, filter: QuestionBankProgressFilter) {
  if (filter === "all") return true;
  if (!entry.context.skillPath.isAvailable || entry.progress.totalQuestions === 0) return false;
  if (filter === "not-started") return entry.progress.status === "not_started";
  if (filter === "in-progress") return entry.progress.status === "in_progress";
  if (filter === "review-recommended") return entry.progress.reviewQuestionIds.length > 0;
  return entry.progress.status === "completed" || entry.progress.status === "secure" || entry.progress.status === "mastered";
}

function completionRank(status: SkillPathProgress["status"]) {
  return { not_started: 0, in_progress: 1, completed: 2, secure: 3, mastered: 4 }[status];
}

export function queryQuestionBank(
  resolver: Resolver,
  evidence: ProgressEvidence,
  query: QuestionBankQuery = {},
): QuestionBankEntry[] {
  const search = normalizeSearch(query.search ?? "");
  const progressFilter = query.progressFilter ?? "all";
  const stageFilter = query.stageFilter ?? "all";
  const sort = query.sort ?? "default";
  const questionVersions = resolver.getQuestionVersions();

  const entries = resolver.getAllPathContexts().map((context) => {
    const questions = resolver.getPathQuestions(context.skillPath);
    const stageQuestionIds = stageFilter === "all"
      ? questions.map((question) => question.id)
      : (context.skillPath.learningStages ?? [])
        .filter((stage) => stage.name === stageFilter)
        .flatMap((stage) => stage.questionIds);
    const searchableValues = [
      context.subject.subjectName,
      context.courseArea.name,
      context.specificationStrand.name,
      context.skillPath.name,
      context.skillPath.description,
      ...(context.skillPath.learningStages ?? []).flatMap((stage) => [stage.name, stage.description]),
      ...questions.flatMap((question) => [question.skill, question.title, question.id]),
    ].map(normalizeSearch);
    return {
      id: context.skillPath.slug,
      context,
      questions,
      matchedQuestionIds: stageQuestionIds,
      progress: calculateSkillPathProgress(context.skillPath, evidence, questionVersions),
      lastPractisedAt: latestActivityForPath(context.skillPath.slug, evidence),
      searchMatch: !search || searchableValues.some((value) => value.includes(search)),
      stageMatch: stageFilter === "all" || (context.skillPath.learningStages ?? []).some((stage) => stage.name === stageFilter),
    };
  });

  const visible = entries
    .filter((entry) => entry.searchMatch && entry.stageMatch && matchesProgressFilter(entry, progressFilter))
    .map((entry): QuestionBankEntry => ({
      id: entry.id,
      context: entry.context,
      questions: entry.questions,
      matchedQuestionIds: entry.matchedQuestionIds,
      progress: entry.progress,
      lastPractisedAt: entry.lastPractisedAt,
    }));

  return visible.sort((left, right) => {
    if (sort === "recently-practised") {
      const leftTime = left.lastPractisedAt ? Date.parse(left.lastPractisedAt) : Number.NEGATIVE_INFINITY;
      const rightTime = right.lastPractisedAt ? Date.parse(right.lastPractisedAt) : Number.NEGATIVE_INFINITY;
      return rightTime - leftTime || defaultCompare(left, right);
    }
    if (sort === "review-priority") {
      return right.progress.reviewQuestionIds.length - left.progress.reviewQuestionIds.length || defaultCompare(left, right);
    }
    if (sort === "completion-status") {
      return completionRank(right.progress.status) - completionRank(left.progress.status) || defaultCompare(left, right);
    }
    return defaultCompare(left, right);
  });
}

export function queryAvailableQuestionBankQuestions(
  resolver: Resolver,
  evidence: ProgressEvidence,
  query: QuestionBankQuery = {},
): QuestionBankQuestionEntry[] {
  const search = normalizeSearch(query.search ?? "");
  const progressFilter = query.progressFilter ?? "all";
  const stageFilter = query.stageFilter ?? "all";
  const sort = query.sort ?? "default";
  const entries = resolver.getQuestions().flatMap((question) => {
    const context = resolver.getQuestionContext(question.id);
    if (!context?.skillPath.isAvailable) return [];
    if (stageFilter !== "all" && context.stage.name !== stageFilter) return [];
    const searchable = [
      question.id,
      question.title,
      question.skill,
      context.stage.name,
      context.skillPath.name,
      context.specificationStrand.name,
    ].map(normalizeSearch);
    if (search && !searchable.some((value) => value.includes(search))) return [];
    const progress = getQuestionProgressForVersion(question.id, question.questionVersion, evidence);
    if (!matchesQuestionProgress(progress, progressFilter)) return [];
    return [{
      question,
      context,
      progress,
      lastPractisedAt: latestActivityForQuestion(question.id, evidence),
    }];
  });

  return entries.sort((left, right) => {
    if (sort === "recently-practised") {
      const leftTime = left.lastPractisedAt ? Date.parse(left.lastPractisedAt) : Number.NEGATIVE_INFINITY;
      const rightTime = right.lastPractisedAt ? Date.parse(right.lastPractisedAt) : Number.NEGATIVE_INFINITY;
      return rightTime - leftTime || defaultQuestionCompare(left, right);
    }
    if (sort === "review-priority") {
      return Number(right.progress.reviewRecommended) - Number(left.progress.reviewRecommended) || defaultQuestionCompare(left, right);
    }
    if (sort === "completion-status") {
      return Number(right.progress.completed) - Number(left.progress.completed)
        || Number(right.progress.attempted) - Number(left.progress.attempted)
        || defaultQuestionCompare(left, right);
    }
    return defaultQuestionCompare(left, right);
  });
}

function matchesQuestionProgress(progress: QuestionProgressState, filter: QuestionBankProgressFilter) {
  if (filter === "all") return true;
  if (filter === "not-started") return !progress.attempted;
  if (filter === "in-progress") return progress.attempted && !progress.completed;
  if (filter === "review-recommended") return progress.reviewRecommended;
  return progress.completed;
}

function latestActivityForQuestion(questionId: string, evidence: ProgressEvidence) {
  const times = [
    ...evidence.attempts.filter((attempt) => attempt.questionId === questionId).map((attempt) => attempt.attemptedAt),
    ...evidence.supportEvents.filter((event) => event.questionId === questionId).map((event) => event.occurredAt),
  ].filter((value) => !Number.isNaN(Date.parse(value)));
  return times.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

function defaultQuestionCompare(left: QuestionBankQuestionEntry, right: QuestionBankQuestionEntry) {
  const leftStage = (left.context.skillPath.learningStages ?? []).findIndex((stage) => stage.id === left.context.stage.id);
  const rightStage = (right.context.skillPath.learningStages ?? []).findIndex((stage) => stage.id === right.context.stage.id);
  return left.context.specificationStrand.displayOrder - right.context.specificationStrand.displayOrder
    || (left.context.skillPath.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.context.skillPath.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || leftStage - rightStage
    || (left.question.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.question.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || left.question.id.localeCompare(right.question.id);
}
