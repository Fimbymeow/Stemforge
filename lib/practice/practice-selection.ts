import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { deriveMistakeLog } from "@/lib/mistakes/derivation";
import { getQuestionProgressForVersion } from "@/lib/progress/calculations";
import type { ProgressEvidence } from "@/lib/progress/types";
import { isGradedAttempt, isGradedIncorrectAttempt } from "@/lib/progress/attempt-outcomes";
import { discoverEligiblePracticeQuestions } from "@/lib/practice/practice-eligibility";
import {
  MAX_PRACTICE_QUESTIONS,
  PRACTICE_SESSION_SCHEMA_VERSION,
  type EligiblePracticeQuestion,
  type PracticeMode,
  type PracticeSelectionInput,
  type PracticeSelectionResult,
  type PracticeSession,
  type PracticeTiming,
} from "@/lib/practice/practice-types";

export function createPracticeSessionSelection(
  input: PracticeSelectionInput & { evidence: ProgressEvidence; source?: CanonicalContentSource },
): PracticeSelectionResult {
  if (input.mode === "review") {
    return {
      session: null,
      eligibleQuestions: [],
      excludedByReason: {},
      shortageReason: "Scheduled Review sessions use the dedicated Review selector.",
    };
  }
  const source = input.source ?? canonicalContent;
  const now = input.now ?? new Date();
  const requestedCount = clampQuestionCount(input.requestedCount);
  const discovered = discoverEligiblePracticeQuestions(source);
  const courseFiltered = discovered.eligible.filter((item) => item.reference.courseId === input.courseId);
  const pathFiltered = input.selectedPathIds.length
    ? courseFiltered.filter((item) => input.selectedPathIds.includes(item.reference.pathId))
    : courseFiltered;
  const candidates = filterForMode(input.mode, pathFiltered, input.evidence, source);
  const selected = selectForMode(input.mode, candidates, requestedCount, input.seed, input.evidence);
  const shortageReason = selected.length === 0
    ? emptyReason(input.mode)
    : selected.length < requestedCount
      ? `${selected.length} question${selected.length === 1 ? " is" : "s are"} currently available, so this session uses all available questions.`
      : null;
  if (!selected.length) return { session: null, eligibleQuestions: candidates, excludedByReason: discovered.excludedByReason, shortageReason };
  const subjectIds = unique(selected.map((item) => item.reference.subjectId));
  if (subjectIds.length !== 1) {
    return {
      session: null,
      eligibleQuestions: candidates,
      excludedByReason: discovered.excludedByReason,
      shortageReason: "Questions from more than one subject cannot be combined in one practice session.",
    };
  }
  const includedPathIds = unique(selected.map((item) => item.reference.pathId));
  const session: PracticeSession = {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    sessionId: createSessionId(input.mode, input.seed, now),
    origin: input.origin ?? (input.mode === "retry_incorrect" ? "retry_incorrect" : "configured_practice"),
    subjectId: subjectIds[0],
    mode: input.mode,
    courseId: input.courseId,
    selectedPathIds: input.selectedPathIds.length ? input.selectedPathIds : includedPathIds,
    questionReferences: selected.map((item) => item.reference),
    currentQuestionIndex: 0,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: null,
    status: "active",
    timing: normalizeTiming(input.timing),
    selectionMetadata: {
      seed: input.seed,
      requestedCount,
      availableCount: candidates.length,
      selectedCount: selected.length,
      fullySatisfied: selected.length >= requestedCount,
      shortageReason,
      excludedByReason: discovered.excludedByReason,
      includedPathIds,
      createdAt: now.toISOString(),
    },
    skippedQuestionIds: [],
  };
  return { session, eligibleQuestions: candidates, excludedByReason: discovered.excludedByReason, shortageReason };
}

export function selectTargetedPractice(input: Omit<PracticeSelectionInput, "mode"> & { evidence: ProgressEvidence; source?: CanonicalContentSource }) {
  return createPracticeSessionSelection({ ...input, mode: "targeted" });
}

export function selectMixedPractice(input: Omit<PracticeSelectionInput, "mode"> & { evidence: ProgressEvidence; source?: CanonicalContentSource }) {
  return createPracticeSessionSelection({ ...input, mode: "mixed" });
}

export function selectNeedsWorkPractice(input: Omit<PracticeSelectionInput, "mode"> & { evidence: ProgressEvidence; source?: CanonicalContentSource }) {
  return createPracticeSessionSelection({ ...input, mode: "needs_work" });
}

export function selectRetryIncorrectPractice(input: Omit<PracticeSelectionInput, "mode"> & { evidence: ProgressEvidence; source?: CanonicalContentSource }) {
  return createPracticeSessionSelection({ ...input, mode: "retry_incorrect" });
}

export function createCompletedSessionRetry(
  completedSession: PracticeSession,
  incorrectQuestionIds: readonly string[],
  now = new Date(),
): PracticeSession | null {
  if (completedSession.status !== "completed") return null;
  return createSessionSubsetRetry(completedSession, incorrectQuestionIds, "retry_incorrect", now);
}

export function createCompletedSkippedRetry(
  completedSession: PracticeSession,
  skippedQuestionIds: readonly string[] = completedSession.finalSkippedQuestionIds ?? completedSession.skippedQuestionIds,
  now = new Date(),
): PracticeSession | null {
  return createSessionSubsetRetry(completedSession, skippedQuestionIds, "retry_skipped", now);
}

function createSessionSubsetRetry(
  completedSession: PracticeSession,
  questionIds: readonly string[],
  origin: "retry_incorrect" | "retry_skipped",
  now: Date,
): PracticeSession | null {
  if (completedSession.status !== "completed") return null;
  const selectedIds = new Set(questionIds);
  const questionReferences = completedSession.questionReferences.filter((reference) => selectedIds.has(reference.questionId));
  if (!questionReferences.length) return null;
  const includedPathIds = unique(questionReferences.map((reference) => reference.pathId));
  const seed = `${origin}:${completedSession.sessionId}`;
  return {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    sessionId: createSessionId("retry_incorrect", seed, now),
    origin,
    subjectId: completedSession.subjectId,
    parentSessionId: completedSession.sessionId,
    mode: "retry_incorrect" as const,
    courseId: completedSession.courseId,
    selectedPathIds: includedPathIds,
    questionReferences,
    currentQuestionIndex: 0,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed,
      requestedCount: questionReferences.length,
      availableCount: questionReferences.length,
      selectedCount: questionReferences.length,
      fullySatisfied: true,
      shortageReason: null,
      excludedByReason: {},
      includedPathIds,
      createdAt: now.toISOString(),
    },
    skippedQuestionIds: [],
  };
}

function filterForMode(
  mode: PracticeMode,
  candidates: EligiblePracticeQuestion[],
  evidence: ProgressEvidence,
  source: CanonicalContentSource,
) {
    if (mode === "needs_work") {
      return candidates.filter((item) => {
        const progress = getQuestionProgressForVersion(item.reference.questionId, item.reference.questionVersion, evidence, item.reference.pathId);
        const latestGraded = latestCurrentGradedAttempt(item, evidence);
        return progress.reviewRecommended || (Boolean(latestGraded) && !progress.completed);
    });
  }
  if (mode === "retry_incorrect") {
    const openMistakes = new Set(
      unique(candidates.map((item) => item.reference.subjectId)).flatMap((subjectSlug) =>
        deriveMistakeLog(evidence, subjectSlug, source).openGroups.flatMap((group) =>
          group.items.map((item) => `${item.questionId}\0${item.questionVersion}`))),
    );
    return candidates.filter((item) =>
      openMistakes.has(`${item.reference.questionId}\0${item.reference.questionVersion}`));
  }
  return candidates;
}

function selectForMode(
  mode: PracticeMode,
  candidates: EligiblePracticeQuestion[],
  requestedCount: number,
  seed: string,
  evidence: ProgressEvidence,
) {
  if (mode === "mixed") return balancedSelection(candidates, requestedCount, seed, evidence);
  return prioritySelection(candidates, requestedCount, seed, evidence);
}

function balancedSelection(candidates: EligiblePracticeQuestion[], requestedCount: number, seed: string, evidence: ProgressEvidence) {
  const byPath = new Map<string, EligiblePracticeQuestion[]>();
  for (const candidate of candidates) byPath.set(candidate.reference.pathId, [...(byPath.get(candidate.reference.pathId) ?? []), candidate]);
  for (const [pathId, pool] of byPath) byPath.set(pathId, prioritySelection(pool, pool.length, `${seed}:${pathId}`, evidence));
  const selected: EligiblePracticeQuestion[] = [];
  const pathIds = shuffle([...byPath.keys()].sort(), seed);
  while (selected.length < requestedCount && [...byPath.values()].some((pool) => pool.length)) {
    for (const pathId of pathIds) {
      const next = byPath.get(pathId)?.shift();
      if (next && !selected.some((item) => item.reference.questionId === next.reference.questionId)) selected.push(next);
      if (selected.length >= requestedCount) break;
    }
  }
  return selected;
}

function prioritySelection(candidates: EligiblePracticeQuestion[], requestedCount: number, seed: string, evidence: ProgressEvidence) {
  return [...candidates]
    .sort((left, right) => scoreQuestion(right, evidence) - scoreQuestion(left, evidence) || seededCompare(left.reference.questionId, right.reference.questionId, seed))
    .slice(0, requestedCount);
}

function scoreQuestion(candidate: EligiblePracticeQuestion, evidence: ProgressEvidence) {
  const progress = getQuestionProgressForVersion(candidate.reference.questionId, candidate.reference.questionVersion, evidence, candidate.reference.pathId);
  const latest = latestCurrentGradedAttempt(candidate, evidence);
  let score = 0;
  if (!latest) score += 1000;
  if (latest && isGradedIncorrectAttempt(latest)) score += 500;
  if (progress.reviewRecommended) score += 350;
  if (latest) score -= Math.max(0, Math.floor(Date.parse(latest.attemptedAt) / 86400000) % 300);
  score -= candidate.question.displayOrder ?? 0;
  return score;
}

function latestCurrentGradedAttempt(candidate: EligiblePracticeQuestion, evidence: ProgressEvidence) {
  const attempt = evidence.attempts
    .filter((item) =>
      item.questionId === candidate.reference.questionId &&
      item.skillPathId === candidate.reference.pathId &&
      item.isGenuine &&
      item.versionEvidence.kind === "known" &&
      item.versionEvidence.questionVersion === candidate.reference.questionVersion &&
      isGradedAttempt(item))
    .sort((left, right) => Date.parse(left.attemptedAt) - Date.parse(right.attemptedAt) || left.sequence - right.sequence)
    .at(-1);
  return attempt;
}

function normalizeTiming(timing?: PracticeTiming): PracticeTiming {
  if (!timing || timing.type === "untimed") return { type: "untimed" };
  return { type: "timed", timeLimitSeconds: Math.min(Math.max(60, Math.floor(timing.timeLimitSeconds)), 10800), elapsedSeconds: Math.max(0, Math.floor(timing.elapsedSeconds)) };
}

function clampQuestionCount(count: number) {
  return Math.min(MAX_PRACTICE_QUESTIONS, Math.max(1, Math.floor(count || 1)));
}

function emptyReason(mode: PracticeMode) {
  if (mode === "needs_work") return "Complete a few questions first so STEM Forge can identify useful areas to revisit.";
  if (mode === "retry_incorrect") return "There are no recent incorrect answers to retry right now.";
  return "No questions are available for this practice setup yet.";
}

function createSessionId(mode: PracticeMode, seed: string, now: Date) {
  return `practice_${mode}_${hash(`${seed}:${now.toISOString()}`).toString(36)}`;
}

function seededCompare(left: string, right: string, seed: string) {
  return hash(`${seed}:${left}`) - hash(`${seed}:${right}`) || left.localeCompare(right);
}

function shuffle(values: string[], seed: string) {
  return [...values].sort((left, right) => seededCompare(left, right, seed));
}

function hash(value: string) {
  let hashValue = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hashValue ^= value.charCodeAt(index);
    hashValue = Math.imul(hashValue, 16777619);
  }
  return hashValue >>> 0;
}

function unique(values: string[]) {
  return [...new Set(values)];
}
