import type { AnswerType, Question } from "@/data/types";
import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { createContentResolver } from "@/lib/content-resolver";
import type { EligiblePracticeQuestion, PracticeEligibility, PracticeQuestionReference } from "@/lib/practice/practice-types";

const supportedAnswerTypes: ReadonlySet<AnswerType> = new Set([
  "multiple_choice",
  "numerical",
  "algebraic",
  "written",
  "multi_step",
  "graph_structured",
  "nature_table",
]);

export function createPracticeQuestionReference(question: Question): PracticeQuestionReference | null {
  const context = createContentResolver(canonicalContent).getQuestionContext(question.id);
  if (!context) return null;
  return {
    subjectId: context.subject.subjectSlug,
    courseId: context.courseArea.slug,
    pathId: context.skillPath.slug,
    stageId: context.stage.id,
    questionId: question.id,
    questionVersion: question.questionVersion,
    contentRevision: question.contentRevision,
  };
}

export function checkPracticeEligibility(question: Question): PracticeEligibility {
  if (question.contentStatus !== "active") return { eligible: false, reason: "archived" };
  if (!question.skillPathId || !question.stageId || !Number.isInteger(question.questionVersion) || !Number.isInteger(question.contentRevision)) {
    return { eligible: false, reason: "missing_metadata" };
  }
  if (!supportedAnswerTypes.has(question.answerType)) return { eligible: false, reason: "unsupported_question_type" };
  if (question.answerType === "graph_structured" && (!question.graphConfig || !question.structuredAnswer)) {
    return { eligible: false, reason: "missing_metadata" };
  }
  if (question.answerType === "nature_table" && (!question.natureTableConfig || !question.structuredAnswer)) {
    return { eligible: false, reason: "missing_metadata" };
  }
  return { eligible: true };
}

export function discoverEligiblePracticeQuestions(source: CanonicalContentSource = canonicalContent) {
  const resolver = createContentResolver(source);
  const excludedByReason: Record<string, number> = {};
  const eligible: EligiblePracticeQuestion[] = [];
  for (const pathContext of resolver.getAllPathContexts()) {
    if (!pathContext.skillPath.isAvailable || pathContext.skillPath.contentStatus !== "active") continue;
    for (const question of resolver.getPathQuestions(pathContext.skillPath)) {
      const eligibility = checkPracticeEligibility(question);
      const questionContext = resolver.getQuestionContext(question.id);
      if (!questionContext) {
        excludedByReason.unresolvable = (excludedByReason.unresolvable ?? 0) + 1;
        continue;
      }
      if (!eligibility.eligible) {
        excludedByReason[eligibility.reason] = (excludedByReason[eligibility.reason] ?? 0) + 1;
        continue;
      }
      eligible.push({
        question,
        path: pathContext.skillPath,
        pathContext,
        questionContext,
        reference: {
          subjectId: pathContext.subject.subjectSlug,
          courseId: pathContext.courseArea.slug,
          pathId: pathContext.skillPath.slug,
          stageId: questionContext.stage.id,
          questionId: question.id,
          questionVersion: question.questionVersion,
          contentRevision: question.contentRevision,
        },
      });
    }
  }
  return { eligible, excludedByReason };
}

export function resolvePracticeReference(reference: PracticeQuestionReference, source: CanonicalContentSource = canonicalContent) {
  const resolver = createContentResolver(source);
  const context = resolver.getQuestionContext(reference.questionId);
  if (!context) return { status: "unresolvable" as const };
  if (
    context.subject.subjectSlug !== reference.subjectId ||
    context.courseArea.slug !== reference.courseId ||
    context.skillPath.slug !== reference.pathId ||
    context.stage.id !== reference.stageId
  ) return { status: "unresolvable" as const };
  if (context.question.questionVersion !== reference.questionVersion || context.question.contentRevision !== reference.contentRevision) {
    return { status: "version_incompatible" as const };
  }
  const eligibility = checkPracticeEligibility(context.question);
  if (!eligibility.eligible) return { status: eligibility.reason };
  return { status: "resolved" as const, context, question: context.question };
}
