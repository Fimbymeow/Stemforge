import { contentResolver } from "@/lib/content-resolver";
import { getQuestionProgressForVersion } from "@/lib/progress/calculations";
import type { ProgressEvidence } from "@/lib/progress/types";
import { PRACTICE_SESSION_SCHEMA_VERSION, type PracticeQuestionReference, type PracticeSession } from "@/lib/practice/practice-types";
import { createReviewDerivationCache, deriveSkillReviewState } from "@/lib/review/derivation";
import {
  REVIEW_SESSION_ID_PREFIX,
  type ReviewDueState,
  type ReviewTargetAssignment,
} from "@/lib/review/types";
import { MAX_REVIEW_SESSION_QUESTIONS } from "@/lib/review/validation";

export type ReviewSelectionResult = {
  session: PracticeSession | null;
  dueStates: ReviewDueState[];
  selectedTargetCount: number;
  remainingDueCount: number;
};

export function createReviewSessionSelection(input: {
  evidence: ProgressEvidence;
  requestedCount?: number;
  targetPathId?: string;
  now?: Date;
}): ReviewSelectionResult {
  const now = input.now ?? new Date();
  const requestedCount = Math.max(1, Math.min(MAX_REVIEW_SESSION_QUESTIONS, Math.floor(input.requestedCount ?? 6)));
  const cache = createReviewDerivationCache();
  const contexts = contentResolver.getAllPathContexts().filter((context) =>
    context.skillPath.isAvailable && (!input.targetPathId || context.skillPath.slug === input.targetPathId));
  const dueStates = contexts.map((context) =>
    deriveSkillReviewState(context.skillPath, input.evidence, now, cache));
  const due = dueStates.filter((state) => state.eligible && state.due && state.reason !== "history_unavailable");
  if (!due.length) return { session: null, dueStates, selectedTargetCount: 0, remainingDueCount: 0 };

  const firstContext = contentResolver.getPathContext(due[0].target.targetId)!;
  const sameCourse = due.filter((state) => {
    const context = contentResolver.getPathContext(state.target.targetId);
    return context?.subject.subjectSlug === firstContext.subject.subjectSlug &&
      context.courseArea.slug === firstContext.courseArea.slug;
  });
  const rankedByTarget = new Map(sameCourse.map((state) => [
    state.target.targetId,
    rankReviewQuestions(state, input.evidence),
  ]));
  const assignments = new Map<string, ReviewTargetAssignment>();
  const references: PracticeQuestionReference[] = [];
  let round = 0;
  while (references.length < requestedCount) {
    let added = false;
    for (const state of sameCourse) {
      if (references.length >= requestedCount) break;
      const question = rankedByTarget.get(state.target.targetId)?.[round];
      if (!question) continue;
      const context = contentResolver.getQuestionContext(question.id);
      if (!context) continue;
      references.push({
        subjectId: context.subject.subjectSlug,
        courseId: context.courseArea.slug,
        pathId: context.skillPath.slug,
        stageId: context.stage.id,
        questionId: question.id,
        questionVersion: question.questionVersion,
        contentRevision: question.contentRevision,
      });
      const existing = assignments.get(state.target.targetId);
      if (existing) existing.questionIds.push(question.id);
      else assignments.set(state.target.targetId, { target: state.target, questionIds: [question.id] });
      added = true;
    }
    if (!added) break;
    round += 1;
  }
  if (!references.length) return {
    session: null,
    dueStates,
    selectedTargetCount: 0,
    remainingDueCount: sameCourse.length,
  };

  const timestamp = now.toISOString();
  const session: PracticeSession = {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    sessionId: createReviewSessionId(now),
    origin: "scheduled_review",
    subjectId: firstContext.subject.subjectSlug,
    mode: "review",
    courseId: firstContext.courseArea.slug,
    selectedPathIds: [...assignments.keys()],
    questionReferences: references,
    currentQuestionIndex: 0,
    startedAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed: "scheduled-review:v1",
      requestedCount,
      availableCount: [...rankedByTarget.values()].reduce((sum, items) => sum + items.length, 0),
      selectedCount: references.length,
      fullySatisfied: references.length === requestedCount,
      shortageReason: references.length === requestedCount
        ? null
        : `Review currently has ${references.length} suitable due question${references.length === 1 ? "" : "s"}.`,
      excludedByReason: {},
      includedPathIds: [...assignments.keys()],
      createdAt: timestamp,
    },
    skippedQuestionIds: [],
    reviewTargets: [...assignments.values()],
  };
  return {
    session,
    dueStates,
    selectedTargetCount: assignments.size,
    remainingDueCount: Math.max(0, sameCourse.length - assignments.size),
  };
}

function rankReviewQuestions(state: ReviewDueState, evidence: ProgressEvidence) {
  const context = contentResolver.getPathContext(state.target.targetId);
  if (!context) return [];
  const selectedHistory = evidence.reviewEvents
    .filter((event) => event.target.targetType === "skill" && event.target.targetId === state.target.targetId)
    .flatMap((event) => event.questionIds.map((questionId) => ({ questionId, occurredAt: event.occurredAt })));
  const lastSelected = new Map<string, number>();
  for (const item of selectedHistory) {
    lastSelected.set(item.questionId, Math.max(lastSelected.get(item.questionId) ?? 0, Date.parse(item.occurredAt)));
  }
  const displayOrder = new Map(contentResolver.getPathQuestions(context.skillPath)
    .map((question, index) => [question.id, index]));
  return contentResolver.getPathQuestions(context.skillPath)
    .filter((question) => {
      const progress = getQuestionProgressForVersion(question.id, question.questionVersion, evidence);
      return progress.historicalAttempted ||
        state.reassessmentQuestionIds.includes(question.id);
    })
    .sort((left, right) => {
      const leftProgress = getQuestionProgressForVersion(left.id, left.questionVersion, evidence);
      const rightProgress = getQuestionProgressForVersion(right.id, right.questionVersion, evidence);
      return Number(state.reassessmentQuestionIds.includes(right.id)) - Number(state.reassessmentQuestionIds.includes(left.id)) ||
        Number(state.ordinaryRecoveryQuestionIds.includes(right.id)) - Number(state.ordinaryRecoveryQuestionIds.includes(left.id)) ||
        Number(lastSelected.has(left.id)) - Number(lastSelected.has(right.id)) ||
        (lastSelected.get(left.id) ?? 0) - (lastSelected.get(right.id) ?? 0) ||
        latestAttemptTime(left.id, evidence) - latestAttemptTime(right.id, evidence) ||
        (displayOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (displayOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id) ||
        Number(rightProgress.historicalAttempted) - Number(leftProgress.historicalAttempted);
    });
}

function latestAttemptTime(questionId: string, evidence: ProgressEvidence) {
  return evidence.attempts.filter((attempt) => attempt.questionId === questionId)
    .reduce((latest, attempt) => Math.max(latest, Date.parse(attempt.attemptedAt)), 0);
}

function createReviewSessionId(now: Date) {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${now.getTime().toString(36)}_${Math.random().toString(36).slice(2)}`;
  return `${REVIEW_SESSION_ID_PREFIX}${uuid}`;
}
