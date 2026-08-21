import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import type { Flashcard, FormulaCard, NoteBlock, Question, SkillPath, WorkedExample } from "@/data/types";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import { getActiveRecords } from "@/lib/content-selectors";
import {
  createAdaptiveQuickPracticeSelection,
  quickPracticeQuestionCount,
  type AdaptiveQuickPracticeSelection,
  type QuickPracticeDurationMinutes,
} from "@/lib/practice/adaptive-practice";
import type { ProgressEvidence } from "@/lib/progress/types";
import type { ConfidenceLevel } from "@/lib/confidence/types";
import type { Assessment } from "@/lib/study-plan/types";

export const QUICK_PRACTICE_QUESTION_COUNT = quickPracticeQuestionCount(20);

export type StudyResourceType = "revision-notes" | "formula-cards" | "worked-examples" | "flashcards";
export type StudyResource = NoteBlock | FormulaCard | WorkedExample | Flashcard;

export type StudyResourceLink = {
  type: StudyResourceType;
  resource: StudyResource;
  pathId: string;
  pathName: string;
  href: string;
};

export type QuickPracticeSelection = AdaptiveQuickPracticeSelection;

export function createQuickPracticeSelection(input: {
  evidence: ProgressEvidence;
  preferredPathId?: string | null;
  source?: CanonicalContentSource;
  now?: Date;
  assessments?: readonly Assessment[];
  learnerConfidence?: ReadonlyMap<string, ConfidenceLevel>;
  durationMinutes?: QuickPracticeDurationMinutes;
  seed?: string;
}): QuickPracticeSelection {
  return createAdaptiveQuickPracticeSelection(input);
}

export function getRelatedResourcesForQuestion(
  questionId: string,
  source?: CanonicalContentSource,
): StudyResourceLink[] {
  const resolver = source ? createContentResolver(source) : contentResolver;
  const context = resolver.getQuestionContext(questionId);
  return context ? getStudyResourcesForPath(context.skillPath, context.subject.subjectSlug) : [];
}

export function getRelatedQuestionsForResource(
  resourceId: string,
  source?: CanonicalContentSource,
): Question[] {
  const resolver = source ? createContentResolver(source) : contentResolver;
  const context = resolver.getAllPathContexts().find((candidate) =>
    getStudyResourcesForPath(candidate.skillPath, candidate.subject.subjectSlug)
      .some((item) => item.resource.id === resourceId),
  );
  return context ? resolver.getPathQuestions(context.skillPath) : [];
}

export function getStudyResourcesForPath(
  path: SkillPath,
  subjectSlug = "higher-maths",
): StudyResourceLink[] {
  return [
    ...resourceLinks(path, subjectSlug, "formula-cards", getActiveRecords(path.formulaCards ?? [])),
    ...resourceLinks(path, subjectSlug, "revision-notes", getActiveRecords(path.notes ?? [])),
    ...resourceLinks(path, subjectSlug, "worked-examples", getActiveRecords(path.workedExamples ?? [])),
    ...resourceLinks(path, subjectSlug, "flashcards", getActiveRecords(path.flashcards ?? [])),
  ];
}

export function getContextualResourceHref(
  type: StudyResourceType,
  subjectSlug: string,
  resourceId: string,
  returnTo?: string | null,
) {
  const base = `/subjects/${subjectSlug}/${type}`;
  const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
  return `${base}${query}#${encodeURIComponent(resourceId)}`;
}

function resourceLinks<T extends StudyResource>(
  path: SkillPath,
  subjectSlug: string,
  type: StudyResourceType,
  resources: T[],
): StudyResourceLink[] {
  return resources.map((resource) => ({
    type,
    resource,
    pathId: path.slug,
    pathName: path.name,
    href: getContextualResourceHref(type, subjectSlug, resource.id),
  }));
}
