import type { AnswerType, LearningStageName, Question } from "@/data/types";
import type { ResolvedQuestionContext, ResolvedSkillPath } from "@/lib/content-resolver";
import { createContentResolver } from "@/lib/content-resolver";
import { calculateSkillPathProgress, createQuestionProgressIndex, getQuestionProgressForVersionFromIndex } from "@/lib/progress/calculations";
import type { ProgressEvidence, QuestionProgressState, SkillPathProgress } from "@/lib/progress/types";

export type QuestionBankProgressFilter = "all" | "not-started" | "in-progress" | "completed" | "review-recommended" | "previously-incorrect";
export type QuestionBankStageFilter = "all" | LearningStageName;
export type QuestionBankSort = "default" | "recently-practised" | "review-priority" | "completion-status";
export type QuestionBankTypeFilter = "all" | AnswerType;
export type QuestionBankCalculatorFilter = "all" | "allowed" | "not-allowed";

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
  courseAreaId?: string;
  specAreaId?: string;
  skillPathId?: string;
  skillPathIds?: readonly string[];
  stageId?: string;
  stageIds?: readonly string[];
  typeFilter?: QuestionBankTypeFilter;
  calculatorFilter?: QuestionBankCalculatorFilter;
  sort?: QuestionBankSort;
  openMistakeQuestionIds?: ReadonlySet<string>;
};

export type AvailableQuestionBankQuery = QuestionBankQuery & { subjectSlug: string };

export type QuestionBankQuestionEntry = {
  question: Question;
  context: ResolvedQuestionContext;
  progress: QuestionProgressState;
  lastPractisedAt: string | null;
};

export type QuestionBankFilterOptions = {
  courseAreas: Array<{ id: string; name: string }>;
  specAreas: Array<{ id: string; name: string; courseAreaId: string }>;
  skillPaths: Array<{ id: string; name: string; specAreaId: string; courseAreaId: string }>;
  stages: Array<{ id: string; name: string; skillPathId: string }>;
  types: AnswerType[];
  hasCalculatorQuestions: boolean;
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
  if (!entry.context.skillPath.isAvailable || entry.progress.totalQuestions === 0) return false;
  if (filter === "all") return true;
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
  query: AvailableQuestionBankQuery,
): QuestionBankQuestionEntry[] {
  const search = normalizeSearch(query.search ?? "");
  const progressFilter = query.progressFilter ?? "all";
  const stageFilter = query.stageFilter ?? "all";
  const sort = query.sort ?? "default";
  const progressIndex = createQuestionProgressIndex(evidence);
  const skillPathIds = query.skillPathIds?.length ? new Set(query.skillPathIds) : null;
  const stageIds = query.stageIds?.length ? new Set(query.stageIds) : null;
  const entries = resolver.getQuestions().flatMap((question) => {
    const context = resolver.getQuestionContext(question.id);
    if (!context?.skillPath.isAvailable) return [];
    if (context.subject.subjectSlug !== query.subjectSlug) return [];
    if (query.courseAreaId && context.courseArea.slug !== query.courseAreaId) return [];
    if (query.specAreaId && context.routeTopic.slug !== query.specAreaId) return [];
    if (query.skillPathId && context.skillPath.slug !== query.skillPathId) return [];
    if (skillPathIds && !skillPathIds.has(context.skillPath.slug)) return [];
    if (query.stageId && context.stage.id !== query.stageId) return [];
    if (stageIds && !stageIds.has(context.stage.id)) return [];
    if (stageFilter !== "all" && context.stage.name !== stageFilter) return [];
    if (query.typeFilter && query.typeFilter !== "all" && question.answerType !== query.typeFilter) return [];
    if (query.calculatorFilter === "allowed" && !question.calculatorAllowed) return [];
    if (query.calculatorFilter === "not-allowed" && question.calculatorAllowed) return [];
    const searchable = [
      question.id,
      question.title,
      question.skill,
      context.stage.name,
      context.skillPath.name,
      context.specificationStrand.name,
    ].map(normalizeSearch);
    if (search && !searchable.some((value) => value.includes(search))) return [];
    const progress = getQuestionProgressForVersionFromIndex(question.id, question.questionVersion, progressIndex, context.skillPath.slug);
    if (!matchesQuestionProgress(progress, progressFilter, question.id, query.openMistakeQuestionIds)) return [];
    return [{
      question,
      context,
      progress,
      lastPractisedAt: latestActivityForQuestion(question.id, context.skillPath.slug, progressIndex),
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

export function deriveQuestionBankFilterOptions(entries: readonly QuestionBankQuestionEntry[]): QuestionBankFilterOptions {
  const courseAreas = new Map<string, string>();
  const specAreas = new Map<string, { id: string; name: string; courseAreaId: string }>();
  const skillPaths = new Map<string, { id: string; name: string; specAreaId: string; courseAreaId: string }>();
  const stages = new Map<string, { id: string; name: string; skillPathId: string }>();
  const types = new Set<AnswerType>();
  let hasCalculatorQuestions = false;
  for (const { context, question } of entries) {
    courseAreas.set(context.courseArea.slug, context.courseArea.name);
    specAreas.set(context.routeTopic.slug, { id: context.routeTopic.slug, name: context.routeTopic.name, courseAreaId: context.courseArea.slug });
    skillPaths.set(context.skillPath.slug, { id: context.skillPath.slug, name: context.skillPath.name, specAreaId: context.routeTopic.slug, courseAreaId: context.courseArea.slug });
    stages.set(context.stage.id, { id: context.stage.id, name: context.stage.name, skillPathId: context.skillPath.slug });
    types.add(question.answerType);
    if (question.calculatorAllowed) hasCalculatorQuestions = true;
  }
  return {
    courseAreas: [...courseAreas].map(([id, name]) => ({ id, name })),
    specAreas: [...specAreas.values()],
    skillPaths: [...skillPaths.values()],
    stages: [...stages.values()],
    types: [...types],
    hasCalculatorQuestions,
  };
}

function matchesQuestionProgress(progress: QuestionProgressState, filter: QuestionBankProgressFilter, questionId: string, openMistakeQuestionIds?: ReadonlySet<string>) {
  if (filter === "all") return true;
  if (filter === "previously-incorrect") return openMistakeQuestionIds?.has(questionId) ?? false;
  if (filter === "not-started") return !progress.attempted;
  if (filter === "in-progress") return progress.attempted && !progress.completed;
  if (filter === "review-recommended") return progress.reviewRecommended;
  return progress.completed;
}

function latestActivityForQuestion(questionId: string, skillPathId: string, index: ReturnType<typeof createQuestionProgressIndex>) {
  const times = [
    ...(index.attemptsByQuestion.get(questionId) ?? []).filter((attempt) => attempt.skillPathId === skillPathId).map((attempt) => attempt.attemptedAt),
    ...(index.eventsByQuestion.get(questionId) ?? []).filter((event) => event.skillPathId === skillPathId).map((event) => event.occurredAt),
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
