import type { SkillPath } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { calculateSkillPathProgress, getQuestionProgressForVersion } from "@/lib/progress/calculations";
import { isGradedAttempt, isGradedCorrectAttempt, isGradedIncorrectAttempt } from "@/lib/progress/attempt-outcomes";
import { isIndependentOrdinaryAttempt } from "@/lib/progress/independent-attempt";
import type { ProgressEvidence, QuestionAttempt, QuestionSupportEvent, VersionEvidence } from "@/lib/progress/types";
import { compareCoordinate, compareEvidence } from "@/lib/review/outcomes";
import { resolveCanonicalReviewTip } from "@/lib/review/replay";
import { reviewDueAt } from "@/lib/review/scheduler";
import { REVIEW_SESSION_ID_PREFIX, type ReviewDueState, type ReviewTargetRef } from "@/lib/review/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BASELINE_EVENTS = 10_000;

export type ReviewDerivationCache = {
  baselineBySkill: Map<string, BaselineResult>;
};

export type SubjectReviewSummary = {
  dueSkillCount: number;
  dueSkillNames: string[];
  dueStates: ReviewDueState[];
  href: string | null;
};

type BaselineResult =
  | { status: "eligible"; firstCompletedAt: string }
  | { status: "not_eligible"; firstCompletedAt: null }
  | { status: "unavailable"; firstCompletedAt: null; diagnostic: string };

export function createReviewDerivationCache(): ReviewDerivationCache {
  return { baselineBySkill: new Map() };
}

export function deriveSubjectReviewSummary(
  subjectSlug: string,
  evidence: ProgressEvidence,
  now = new Date(),
): SubjectReviewSummary {
  const cache = createReviewDerivationCache();
  const contexts = contentResolver.getAllPathContexts().filter((context) =>
    context.subject.subjectSlug === subjectSlug && context.skillPath.isAvailable);
  const dueStates = contexts
    .map((context) => deriveSkillReviewState(context.skillPath, evidence, now, cache))
    .filter((state) => state.eligible && state.due && state.reason !== "history_unavailable");
  return {
    dueSkillCount: dueStates.length,
    dueSkillNames: dueStates.map((state) =>
      contentResolver.getPathContext(state.target.targetId)?.skillPath.name ?? state.target.targetId),
    dueStates,
    href: dueStates.length ? "/practice?review=1" : null,
  };
}

export function deriveSkillFirstCompletedAt(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  questionVersions: Readonly<Record<string, number>> = contentResolver.getQuestionVersions(),
  cache?: ReviewDerivationCache,
): BaselineResult {
  const cached = cache?.baselineBySkill.get(skillPath.slug);
  if (cached) return cached;
  const activeIds = new Set((skillPath.learningStages ?? []).flatMap((stage) => stage.questionIds));
  const events: Array<
    | { kind: "attempt"; value: QuestionAttempt; occurredAt: string; sequence: number; eventId: string }
    | { kind: "support"; value: QuestionSupportEvent; occurredAt: string; sequence: number; eventId: string }
  > = [
    ...evidence.attempts.filter((attempt) =>
      activeIds.has(attempt.questionId) &&
      attempt.skillPathId === skillPath.slug &&
      baselineCompatible(attempt.versionEvidence, questionVersions[attempt.questionId] ?? 1),
    ).map((value) => ({
      kind: "attempt" as const,
      value,
      occurredAt: value.attemptedAt,
      sequence: value.sequence,
      eventId: value.eventId,
    })),
    ...evidence.supportEvents.filter((event) =>
      activeIds.has(event.questionId) &&
      event.skillPathId === skillPath.slug &&
      baselineCompatible(event.versionEvidence, questionVersions[event.questionId] ?? 1),
    ).map((value) => ({
      kind: "support" as const,
      value,
      occurredAt: value.occurredAt,
      sequence: value.sequence,
      eventId: value.eventId,
    })),
  ].sort((left, right) => compareCoordinate(
    left.occurredAt, left.sequence, left.eventId,
    right.occurredAt, right.sequence, right.eventId,
  ));
  if (events.length > MAX_BASELINE_EVENTS) {
    const result = {
      status: "unavailable" as const,
      firstCompletedAt: null,
      diagnostic: `baseline_event_limit_exceeded:${events.length}`,
    };
    cache?.baselineBySkill.set(skillPath.slug, result);
    return result;
  }

  const prefix: ProgressEvidence = emptyEvidence();
  const incomplete = new Set(activeIds);
  let derivedCompletion: string | null = null;
  for (const event of events) {
    if (event.kind === "attempt") prefix.attempts.push(event.value);
    else prefix.supportEvents.push(event.value);
    if (!incomplete.has(event.value.questionId) || !canCompleteQuestion(event)) continue;
    const state = getQuestionProgressForVersion(
      event.value.questionId,
      questionVersions[event.value.questionId] ?? 1,
      prefix,
      skillPath.slug,
    );
    if (state.historicalCompleted) {
      incomplete.delete(event.value.questionId);
      if (!incomplete.size) {
        derivedCompletion = event.occurredAt;
        break;
      }
    }
  }

  const snapshot = evidence.achievementSnapshots
    .filter((item) =>
      item.pathId === skillPath.slug &&
      ["path_completed", "path_secure", "path_mastered"].includes(item.kind))
    .sort((left, right) => Date.parse(left.achievedAt) - Date.parse(right.achievedAt) ||
      left.snapshotId.localeCompare(right.snapshotId))[0];
  const firstCompletedAt = [derivedCompletion, snapshot?.achievedAt]
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(left) - Date.parse(right) || left.localeCompare(right))[0];
  const result = firstCompletedAt
    ? { status: "eligible" as const, firstCompletedAt }
    : { status: "not_eligible" as const, firstCompletedAt: null };
  cache?.baselineBySkill.set(skillPath.slug, result);
  return result;
}

export function deriveOrdinaryRecovery(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  boundary: { occurredAt: string; sequence: number; eventId: string } | null,
  questionVersions: Readonly<Record<string, number>> = contentResolver.getQuestionVersions(),
) {
  const reviewSourceIds = new Set(evidence.reviewEvents.map((event) => event.source.sourceId));
  const activeIds = new Set((skillPath.learningStages ?? []).flatMap((stage) => stage.questionIds));
  const open: string[] = [];
  for (const questionId of activeIds) {
    const currentVersion = questionVersions[questionId] ?? 1;
    const attempts = evidence.attempts.filter((attempt) =>
      attempt.questionId === questionId &&
      attempt.skillPathId === skillPath.slug &&
      isCompatible(attempt, currentVersion) &&
      isGradedAttempt(attempt) &&
      (!attempt.practiceSessionId ||
        (!reviewSourceIds.has(attempt.practiceSessionId) && !isReviewSessionId(attempt.practiceSessionId))) &&
      (!boundary || compareCoordinate(
        attempt.attemptedAt, attempt.sequence, attempt.eventId,
        boundary.occurredAt, boundary.sequence, boundary.eventId,
      ) > 0),
    ).sort(compareEvidence);
    let active = false;
    for (const attempt of attempts) {
      if (isGradedIncorrectAttempt(attempt)) active = true;
      else if (isGradedCorrectAttempt(attempt) && isIndependentOrdinaryAttempt(attempt, evidence, attempts)) active = false;
    }
    if (active) open.push(questionId);
  }
  return open.sort();
}

export function deriveSkillReviewState(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  now = new Date(),
  cache = createReviewDerivationCache(),
): ReviewDueState {
  const target: ReviewTargetRef = { targetType: "skill", targetId: skillPath.slug };
  const baseline = deriveSkillFirstCompletedAt(skillPath, evidence, contentResolver.getQuestionVersions(), cache);
  if (baseline.status !== "eligible") {
    return {
      target,
      eligible: false,
      due: false,
      dueSoon: false,
      dueAt: null,
      reason: baseline.status === "unavailable" ? "history_unavailable" : "not_learned",
      skillFirstCompletedAt: null,
      canonicalEvent: null,
      ordinaryRecoveryQuestionIds: [],
      reassessmentQuestionIds: [],
      ...(baseline.status === "unavailable" ? { diagnostic: baseline.diagnostic } : {}),
    };
  }

  const targetEvents = evidence.reviewEvents.filter((event) =>
    event.target.targetType === "skill" && event.target.targetId === skillPath.slug);
  const replay = resolveCanonicalReviewTip(evidence.reviewEvents, target);
  if (targetEvents.length > 0 && !replay.canonicalEvent) {
    return {
      target,
      eligible: true,
      due: false,
      dueSoon: false,
      dueAt: null,
      reason: "history_unavailable",
      skillFirstCompletedAt: baseline.firstCompletedAt,
      canonicalEvent: null,
      ordinaryRecoveryQuestionIds: [],
      reassessmentQuestionIds: [],
      diagnostic: replay.diagnostics.join(",") || "review_history_unavailable",
    };
  }

  const canonicalEvent = replay.canonicalEvent;
  const progress = calculateSkillPathProgress(skillPath, evidence, contentResolver.getQuestionVersions());
  const reassessmentQuestionIds = [...progress.reassessmentRequiredQuestionIds].sort();
  const pathChanged = Boolean(canonicalEvent &&
    canonicalEvent.targetVersion.versionType === "skill_path" &&
    canonicalEvent.targetVersion.version !== skillPath.pathVersion);
  const boundary = canonicalEvent
    ? { occurredAt: canonicalEvent.occurredAt, sequence: canonicalEvent.sequence, eventId: canonicalEvent.eventId }
    : null;
  const ordinaryRecoveryQuestionIds = deriveOrdinaryRecovery(skillPath, evidence, boundary);
  const dueAt = canonicalEvent
    ? reviewDueAt(canonicalEvent.occurredAt, canonicalEvent.stageAfter, canonicalEvent.schedulerVersion)
    : reviewDueAt(baseline.firstCompletedAt, 0, 1);
  if (!dueAt) {
    return {
      target,
      eligible: true,
      due: false,
      dueSoon: false,
      dueAt: null,
      reason: "history_unavailable",
      skillFirstCompletedAt: baseline.firstCompletedAt,
      canonicalEvent,
      ordinaryRecoveryQuestionIds,
      reassessmentQuestionIds,
      diagnostic: "unknown_scheduler_version",
    };
  }

  const structuralOverride = pathChanged || reassessmentQuestionIds.length > 0;
  const recoveryOverride = ordinaryRecoveryQuestionIds.length > 0;
  const nowTime = now.getTime();
  const dueTime = Date.parse(dueAt);
  const due = structuralOverride || recoveryOverride || dueTime <= nowTime;
  const dueSoon = !due && dueTime <= nowTime + DAY_MS;
  return {
    target,
    eligible: true,
    due,
    dueSoon,
    dueAt: structuralOverride || recoveryOverride ? now.toISOString() : dueAt,
    reason: structuralOverride
      ? "content_changed"
      : recoveryOverride
        ? "recently_incorrect"
        : due
          ? "due_after_time"
          : "not_due",
    skillFirstCompletedAt: baseline.firstCompletedAt,
    canonicalEvent,
    ordinaryRecoveryQuestionIds,
    reassessmentQuestionIds,
  };
}

function isCompatible(attempt: QuestionAttempt, currentVersion: number) {
  return attempt.versionEvidence.kind === "known"
    ? attempt.versionEvidence.questionVersion === currentVersion
    : currentVersion === 1;
}

function baselineCompatible(versionEvidence: VersionEvidence, currentVersion: number) {
  return versionEvidence.kind === "known"
    ? versionEvidence.questionVersion <= currentVersion
    : true;
}

function canCompleteQuestion(
  event:
    | { kind: "attempt"; value: QuestionAttempt }
    | { kind: "support"; value: QuestionSupportEvent },
) {
  return event.kind === "attempt"
    ? isGradedCorrectAttempt(event.value) || event.value.legacyCompleted === true
    : event.value.type === "solution_viewed" && event.value.afterGenuineAttempt;
}

function isReviewSessionId(sessionId: string) {
  return sessionId.startsWith(REVIEW_SESSION_ID_PREFIX);
}

function emptyEvidence(): ProgressEvidence {
  return {
    attempts: [],
    supportEvents: [],
    guidedSelfAssessments: [],
    achievementSnapshots: [],
    reviewEvents: [],
  };
}
