import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import type { Flashcard, FormulaCard, NoteBlock, Question, SkillPath, WorkedExample } from "@/data/types";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import { getActiveRecords } from "@/lib/content-selectors";
import { deriveLearnerNextAction } from "@/lib/learning/next-action";
import { createPracticeSessionSelection } from "@/lib/practice/practice-selection";
import type { PracticeSelectionResult } from "@/lib/practice/practice-types";
import type { ProgressEvidence } from "@/lib/progress/types";

export const QUICK_PRACTICE_QUESTION_COUNT = 6;

export type StudyResourceType = "revision-notes" | "formula-cards" | "worked-examples" | "flashcards";
export type StudyResource = NoteBlock | FormulaCard | WorkedExample | Flashcard;

export type StudyResourceLink = {
  type: StudyResourceType;
  resource: StudyResource;
  pathId: string;
  pathName: string;
  href: string;
};

export type QuickPracticeSelection = {
  path: SkillPath | null;
  result: PracticeSelectionResult;
};

export function createQuickPracticeSelection(input: {
  evidence: ProgressEvidence;
  preferredPathId?: string | null;
  source?: CanonicalContentSource;
  now?: Date;
}): QuickPracticeSelection {
  const source = input.source ?? canonicalContent;
  const resolver = input.source ? createContentResolver(source) : contentResolver;
  const available = resolver.getAllPathContexts().filter((context) => context.skillPath.isAvailable);
  const canonicalAction = deriveLearnerNextAction({ evidence: input.evidence, source });
  const preferredPathId = input.preferredPathId ?? canonicalAction.pathId;
  const context = available.find((candidate) => candidate.skillPath.slug === preferredPathId) ?? available[0];

  if (!context) {
    return {
      path: null,
      result: { session: null, eligibleQuestions: [], excludedByReason: {}, shortageReason: "No questions are available for practice yet." },
    };
  }

  return {
    path: context.skillPath,
    result: createPracticeSessionSelection({
      mode: "targeted",
      courseId: context.courseArea.slug,
      selectedPathIds: [context.skillPath.slug],
      requestedCount: QUICK_PRACTICE_QUESTION_COUNT,
      seed: `quick-practice:${context.skillPath.slug}`,
      evidence: input.evidence,
      source,
      now: input.now,
      timing: { type: "untimed" },
    }),
  };
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
