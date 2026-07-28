import type { LearningStage, SkillPath } from "@/data/types";
import {
  calculateSkillPathProgress,
  calculateStageProgress,
  getQuestionProgressForVersion as deriveQuestionProgress,
  isGenuineAnswer,
  selectNextQuestionId,
} from "@/lib/progress/calculations";
import { ProgressRepository } from "@/lib/progress/repository";
import { createBrowserProgressStorage } from "@/lib/progress/storage";
import type {
  GuidedSelfAssessmentOutcome,
  LegacyQuestionAttempt,
  ProgressEvidence,
  QuestionAttempt,
} from "@/lib/progress/types";
import { UNKNOWN_LEGACY_VERSION_EVIDENCE, type VersionEvidence } from "@/lib/progress/types";
import { createEventId } from "@/lib/progress/event-identity";
import { getSkillPathContext } from "@/lib/learning-paths";
import { contentResolver } from "@/lib/content-resolver";
import type { StructuralAchievementContext } from "@/lib/progress/achievements";
import {
  reconcileLocalEvidenceProvenance,
  recordLocalEvidenceProvenance,
  withLocalProgressTransaction,
} from "@/lib/progress/local-progress-transaction";
import type { NewAttemptMarkerFields } from "@/lib/progress/attempt-outcomes";
import { wasHintViewedBeforeSubmission } from "@/lib/progress/hint-evidence";

export type {
  DashboardProgressSummary,
  LegacyQuestionAttempt,
  ProgressEvidence,
  ProgressLoadResult,
  ProgressLoadStatus,
  ProgressPayload,
  ProgressPayloadV1,
  ProgressPayloadV2,
  ProgressPayloadV3,
  ProgressPayloadV4,
  ProgressPayloadV5,
  ProgressPayloadV6,
  ProgressStatus,
  QuestionAttempt,
  QuestionOutcome,
  QuestionProgressState,
  QuestionSupportEvent,
  GuidedSelfAssessmentEvent,
  GuidedSelfAssessmentOutcome,
  VersionEvidence,
  SkillPathProgress,
  StageProgress,
} from "@/lib/progress/types";
import type { ReviewEvent } from "@/lib/review/types";

type SubmissionInput = LegacyQuestionAttempt & NewAttemptMarkerFields & {
  practiceSessionId?: string;
};
type SupportInput = Omit<LegacyQuestionAttempt, "isCorrect" | "answer"> & {
  practiceSessionId?: string;
};

function createRepository() {
  return new ProgressRepository(createBrowserProgressStorage());
}

function readEvidence(): ProgressEvidence {
  return createRepository().getEvidence();
}

function emptyEvidence(): ProgressEvidence {
  return { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] };
}

function dispatchProgressUpdate() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("stemforge:local-progress-updated"));
}

function nextSequence(evidence: ProgressEvidence) {
  return Math.max(
    0,
    ...evidence.attempts.map((item) => item.sequence),
    ...evidence.supportEvents.map((item) => item.sequence),
    ...evidence.guidedSelfAssessments.map((item) => item.sequence),
    ...evidence.reviewEvents.map((item) => item.sequence),
  ) + 1;
}

export function getVersionEvidenceForQuestion(questionId: string): VersionEvidence {
  const question = contentResolver.getQuestion(questionId);
  return question
    ? { kind: "known", questionVersion: question.questionVersion }
    : { ...UNKNOWN_LEGACY_VERSION_EVIDENCE };
}

function sameVersionEvidence(left: VersionEvidence, right: VersionEvidence) {
  return left.kind === right.kind && left.questionVersion === right.questionVersion;
}

const activeQuestionVersions: Readonly<Record<string, number>> = Object.fromEntries(
  contentResolver.getQuestions().map((question) => [question.id, question.questionVersion]),
);

function getStructuralContext(skillPathId: string): StructuralAchievementContext | undefined {
  const context = getSkillPathContext(skillPathId);
  return context
    ? { subjectId: context.subject.subjectSlug, courseId: context.courseArea.slug, skillPath: context.skillPath, questionVersions: activeQuestionVersions }
    : undefined;
}

export function getAllAttempts() {
  return readEvidence().attempts;
}

export function getProgressEvidence() {
  return readEvidence();
}

export function getAttemptsForSkillPath(skillPathId: string) {
  return readEvidence().attempts.filter((attempt) => attempt.skillPathId === skillPathId);
}

export async function saveQuestionAttempt(input: SubmissionInput) {
  if (!isGenuineAnswer(input.answer)) return false;
  return withLocalProgressTransaction(() => {
    const repository = createRepository();
    const before = repository.load().payload;
    const evidence = before.data;
    const sequence = nextSequence(evidence);
    const versionEvidence = getVersionEvidenceForQuestion(input.questionId);
    const attempt: QuestionAttempt = {
      ...input,
      sequence,
      isGenuine: true,
      hintViewedBeforeSubmission: wasHintViewedBeforeSubmission(
        evidence, input.questionId, versionEvidence, input.attemptedAt, sequence,
      ),
      supportKnowledge: "known",
      versionEvidence,
      eventId: createEventId("attempt"),
    };
    if (!repository.recordAttempt(attempt, getStructuralContext(input.skillPathId))) return false;
    try { recordLocalEvidenceProvenance(before, repository.load().payload); } catch { /* Canonical local learning remains authoritative. */ }
    dispatchProgressUpdate();
    return true;
  });
}

export async function recordHintViewed(input: SupportInput) {
  return recordSupport("hint_viewed", input);
}

export async function recordWorkedSolutionViewed(input: SupportInput) {
  return recordSupport("solution_viewed", input, true);
}

function recordSupport(
  type: "hint_viewed" | "solution_viewed",
  input: SupportInput,
  knownAfterAttempt?: boolean,
) {
  return withLocalProgressTransaction(() => {
    const repository = createRepository();
    const before = repository.load().payload;
    const evidence = before.data;
    const versionEvidence = getVersionEvidenceForQuestion(input.questionId);
    const afterGenuineAttempt = evidence.attempts.some(
      (attempt) => attempt.questionId === input.questionId && attempt.isGenuine && sameVersionEvidence(attempt.versionEvidence, versionEvidence),
    );
    if (knownAfterAttempt && !afterGenuineAttempt) return false;
    const alreadyRecorded = evidence.supportEvents.some(
      (event) =>
        event.questionId === input.questionId &&
        event.type === type &&
        event.practiceSessionId === input.practiceSessionId &&
        sameVersionEvidence(event.versionEvidence, versionEvidence),
    );
    if (alreadyRecorded) return true;
    const saved = repository.recordSupportEvent({
      ...input,
      type,
      occurredAt: input.attemptedAt,
      sequence: nextSequence(evidence),
      afterGenuineAttempt: knownAfterAttempt ?? evidence.attempts.some(
        (attempt) => attempt.questionId === input.questionId && attempt.isGenuine && sameVersionEvidence(attempt.versionEvidence, versionEvidence),
      ),
      versionEvidence,
      eventId: createEventId("support"),
    }, getStructuralContext(input.skillPathId));
    if (saved) {
      try { recordLocalEvidenceProvenance(before, repository.load().payload); } catch { /* Preserve local-first learning. */ }
      dispatchProgressUpdate();
    }
    return saved;
  });
}

export async function recordGuidedSelfAssessment(input: {
  practiceSessionId: string;
  questionId: string;
  skillPathId: string;
  stageId: string;
  outcome: GuidedSelfAssessmentOutcome;
  occurredAt: string;
}) {
  if (!input.practiceSessionId.trim()) return false;
  return withLocalProgressTransaction(() => {
    const repository = createRepository();
    const before = repository.load().payload;
    const saved = repository.recordGuidedSelfAssessment({
      ...input,
      sequence: nextSequence(before.data),
      versionEvidence: getVersionEvidenceForQuestion(input.questionId),
      eventId: createEventId("self_assessment"),
    });
    if (saved) {
      try { recordLocalEvidenceProvenance(before, repository.load().payload); } catch { /* Preserve local-first learning. */ }
      dispatchProgressUpdate();
    }
    return saved;
  });
}

export async function recordReviewEvent(event: ReviewEvent) {
  return withLocalProgressTransaction(() => {
    const repository = createRepository();
    const before = repository.load().payload;
    const saved = repository.recordReviewEvent(event);
    if (saved) {
      try { recordLocalEvidenceProvenance(before, repository.load().payload); } catch { /* Preserve local-first learning. */ }
      dispatchProgressUpdate();
    }
    return saved;
  });
}

export function getQuestionProgress(questionId: string, evidenceOverride?: ProgressEvidence) {
  const version = contentResolver.getQuestion(questionId)?.questionVersion ?? 1;
  return deriveQuestionProgress(questionId, version, evidenceOverride ?? readEvidence());
}

export function getStageProgress(skillPath: SkillPath, stage: LearningStage, evidenceOverride?: ProgressEvidence) {
  return calculateStageProgress(skillPath, stage, evidenceOverride ?? readEvidence(), activeQuestionVersions);
}

export function getSkillPathProgress(skillPath: SkillPath, evidenceOverride?: ProgressEvidence) {
  return calculateSkillPathProgress(skillPath, evidenceOverride ?? readEvidence(), activeQuestionVersions);
}

export function getNextQuestionId(skillPath: SkillPath, evidenceOverride?: ProgressEvidence) {
  return selectNextQuestionId(skillPath, evidenceOverride ?? readEvidence(), activeQuestionVersions);
}

export function getEmptyProgressEvidence() {
  return emptyEvidence();
}

export function resetSkillPathProgress(skillPathId: string) {
  return withLocalProgressTransaction(() => {
    const repository = createRepository();
    const reset = repository.resetPath(skillPathId);
    if (reset) {
      try { reconcileLocalEvidenceProvenance(repository.load().payload); } catch { /* Reset remains valid without provenance cleanup. */ }
      dispatchProgressUpdate();
    }
    return reset;
  });
}
