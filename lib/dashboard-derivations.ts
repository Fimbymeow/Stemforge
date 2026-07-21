import type { LearningStage, SkillPath, Subject } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import {
  getActiveSubject,
  getAllSkillPathContexts,
  getQuestionHref,
  getQuestionBankHref,
  getResourceHref,
} from "@/lib/learning-paths";
import {
  calculateSkillPathProgress,
  getQuestionProgressForVersion,
  selectNextQuestionId,
} from "@/lib/progress/calculations";
import type {
  AchievementSnapshot,
  ProgressEvidence,
  ProgressStatus,
  QuestionAttempt,
  SkillPathProgress,
} from "@/lib/progress/types";
import { deriveLearnerNextAction, type LearnerNextAction } from "@/lib/learning/next-action";

export type DashboardSyncInput = {
  status:
    | "saved_locally"
    | "checking"
    | "caught_up"
    | "syncing"
    | "offline"
    | "pending_upload"
    | "association_required"
    | "authentication_required"
    | "paused"
    | "temporary_error"
    | "cleanup_required";
  pendingCount: number;
  lastSuccessfulSyncAt: string | null;
  differentAccount: boolean;
  accountFingerprint: string | null;
};

export type DashboardSyncSummary = {
  label: string;
  detail: string;
  tone: "local" | "syncing" | "synced" | "attention";
  accountLinked: boolean;
};

export type DashboardPathSummary = {
  skillPathId: string;
  name: string;
  description: string;
  href: string;
  nextQuestionId: string | null;
  nextHref: string;
  currentStageId: string | null;
  currentStageName: string | null;
  completedQuestions: number;
  totalQuestions: number;
  completionPercentage: number;
  masteryScore: number;
  independentPerformancePercentage: number;
  reviewRecommendedCount: number;
  status: ProgressStatus;
  latestEvidenceAt: string | null;
  started: boolean;
  stageSummaries: DashboardStageSummary[];
};

export type DashboardStageSummary = {
  stageId: string;
  name: string;
  completedQuestions: number;
  totalQuestions: number;
  completionPercentage: number;
  masteryScore: number;
  status: ProgressStatus;
};

export type DashboardCourseSummary = {
  subjectSlug: string;
  subjectName: string;
  level: string;
  availablePathCount: number;
  plannedPathCount: number;
  startedPathCount: number;
  completedPathCount: number;
  securePathCount: number;
  masteredPathCount: number;
  completedQuestions: number;
  totalQuestions: number;
  completionPercentage: number;
  completedStages: number;
  totalStages: number;
  stageCompletionPercentage: number;
  reviewRecommendedCount: number;
  notice: string;
  paths: DashboardPathSummary[];
};

export type DashboardActivityItem = {
  id: string;
  type: "attempts" | "achievement" | "support";
  occurredAt: string;
  title: string;
  detail: string;
  href: string;
};

export type DashboardFocusItem = {
  pathId: string;
  title: string;
  detail: string;
  href: string;
  status: ProgressStatus;
  reviewRecommendedCount: number;
};

export type DashboardAchievementItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  achievedAt: string | null;
  current: boolean;
};

export type DashboardWeeklyActivity = {
  activeDays: number;
  attempts: number;
  achievements: number;
  label: string;
};

export type DashboardQuickLink = {
  title: string;
  href: string;
  detail: string;
};

export type LearnerDashboardModel = {
  generatedAt: string;
  course: DashboardCourseSummary;
  nextAction: LearnerNextAction;
  paths: DashboardPathSummary[];
  recentActivity: DashboardActivityItem[];
  needsWork: DashboardFocusItem[];
  secureAndMastered: DashboardAchievementItem[];
  weeklyActivity: DashboardWeeklyActivity;
  sync: DashboardSyncSummary;
  quickLinks: DashboardQuickLink[];
};

const EMPTY_SYNC: DashboardSyncInput = {
  status: "saved_locally",
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  differentAccount: false,
  accountFingerprint: null,
};

export function derivePathDashboardSummary(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  activeQuestionVersions: Readonly<Record<string, number>>,
): DashboardPathSummary {
  const progress = calculateSkillPathProgress(skillPath, evidence, activeQuestionVersions);
  const nextQuestionId = selectNextQuestionId(skillPath, evidence, activeQuestionVersions);
  const currentStage = findCurrentStage(skillPath, progress, nextQuestionId);
  return {
    skillPathId: skillPath.slug,
    name: skillPath.name,
    description: skillPath.description,
    href: skillPath.href,
    nextQuestionId,
    nextHref: nextQuestionId ? getQuestionHref(nextQuestionId) : skillPath.href,
    currentStageId: currentStage?.id ?? null,
    currentStageName: currentStage?.name ?? null,
    completedQuestions: progress.completedQuestionIds.length,
    totalQuestions: progress.totalQuestions,
    completionPercentage: progress.completionPercentage,
    masteryScore: progress.masteryScore,
    independentPerformancePercentage: progress.independentPerformancePercentage,
    reviewRecommendedCount: progress.reviewQuestionIds.length + progress.reassessmentRecommendedQuestionIds.length + progress.reassessmentRequiredQuestionIds.length,
    status: progress.status,
    latestEvidenceAt: latestPathEvidenceAt(skillPath.slug, evidence),
    started: progress.attemptedCount > 0 || progress.completedQuestionIds.length > 0,
    stageSummaries: (skillPath.learningStages ?? []).map((stage) => deriveStageSummary(stage, progress)),
  };
}

export function deriveCourseDashboardSummary(
  skillPaths: readonly SkillPath[],
  evidence: ProgressEvidence,
  activeQuestionVersions: Readonly<Record<string, number>>,
  subject = getActiveSubject(),
): DashboardCourseSummary {
  const available = skillPaths.filter((path) => path.isAvailable);
  const plannedPathCount = skillPaths.length - available.length;
  const paths = available.map((path) => derivePathDashboardSummary(path, evidence, activeQuestionVersions));
  const totalQuestions = paths.reduce((total, path) => total + path.totalQuestions, 0);
  const completedQuestions = paths.reduce((total, path) => total + path.completedQuestions, 0);
  const totalStages = paths.reduce((total, path) => total + path.stageSummaries.length, 0);
  const completedStages = paths.reduce(
    (total, path) => total + path.stageSummaries.filter((stage) => stage.status === "completed" || stage.status === "secure" || stage.status === "mastered").length,
    0,
  );
  return {
    subjectSlug: subject.subjectSlug,
    subjectName: subject.subjectName,
    level: subject.level,
    availablePathCount: available.length,
    plannedPathCount,
    startedPathCount: paths.filter((path) => path.started).length,
    completedPathCount: paths.filter((path) => path.status === "completed" || path.status === "secure" || path.status === "mastered").length,
    securePathCount: paths.filter((path) => path.status === "secure" || path.status === "mastered").length,
    masteredPathCount: paths.filter((path) => path.status === "mastered").length,
    completedQuestions,
    totalQuestions,
    completionPercentage: percentage(completedQuestions, totalQuestions),
    completedStages,
    totalStages,
    stageCompletionPercentage: percentage(completedStages, totalStages),
    reviewRecommendedCount: paths.reduce((total, path) => total + path.reviewRecommendedCount, 0),
    notice: plannedPathCount > 0
      ? `${available.length} ${subject.subjectName} path${available.length === 1 ? "" : "s"} ready to start, with more on the way.`
      : `${subject.subjectName} course content is available.`,
    paths,
  };
}

export function deriveLearnerDashboardModel(input: {
  evidence: ProgressEvidence;
  subject?: Subject;
  now?: Date;
  sync?: Partial<DashboardSyncInput>;
}): LearnerDashboardModel {
  const subject = input.subject ?? getActiveSubject();
  const now = input.now ?? new Date();
  const sync = { ...EMPTY_SYNC, ...input.sync };
  const questionVersions = contentResolver.getQuestionVersions();
  const contexts = getAllSkillPathContexts(subject);
  const allPaths = contexts.map((context) => context.skillPath);
  const availablePaths = allPaths.filter((path) => path.isAvailable);
  const paths = availablePaths.map((path) => derivePathDashboardSummary(path, input.evidence, questionVersions));
  const course = deriveCourseDashboardSummary(allPaths, input.evidence, questionVersions, subject);

  return {
    generatedAt: now.toISOString(),
    course,
    nextAction: deriveLearnerNextAction({ evidence: input.evidence }),
    paths,
    recentActivity: deriveRecentActivity(input.evidence, 6),
    needsWork: deriveNeedsWork(paths),
    secureAndMastered: deriveSecureAndMastered(paths, input.evidence),
    weeklyActivity: deriveWeeklyActivity(input.evidence, now),
    sync: deriveSyncSummary(sync),
    quickLinks: [
      { title: "Practice sessions", href: "/practice", detail: "Targeted, mixed, needs-work, or retry sessions from available content." },
      { title: "Question bank", href: getQuestionBankHref(subject.subjectSlug), detail: "Filter practice by path and stage." },
      { title: "Revision notes", href: getResourceHref("revision-notes", subject.subjectSlug), detail: "Review the ideas behind your progress." },
    ],
  };
}

function deriveRecentActivity(evidence: ProgressEvidence, limit: number): DashboardActivityItem[] {
  const attemptGroups = new Map<string, QuestionAttempt[]>();
  for (const attempt of evidence.attempts.filter((item) => item.isGenuine)) {
    const key = `${attempt.skillPathId}:${dayKey(attempt.attemptedAt)}`;
    attemptGroups.set(key, [...(attemptGroups.get(key) ?? []), attempt]);
  }
  const attemptItems: DashboardActivityItem[] = [...attemptGroups.entries()].map(([key, attempts]) => {
    const latest = attempts.reduce((winner, attempt) => Date.parse(attempt.attemptedAt) > Date.parse(winner.attemptedAt) ? attempt : winner);
    const pathName = getPathName(latest.skillPathId);
    const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
    return {
      id: `attempts:${key}`,
      type: "attempts",
      occurredAt: latest.attemptedAt,
      title: `${attempts.length} question${attempts.length === 1 ? "" : "s"} attempted`,
      detail: `${pathName} · ${correctCount} correct`,
      href: getQuestionHref(latest.questionId),
    };
  });
  const achievementItems: DashboardActivityItem[] = evidence.achievementSnapshots.map((snapshot) => ({
    id: `achievement:${snapshot.snapshotId}`,
    type: "achievement",
    occurredAt: snapshot.achievedAt,
    title: achievementTitle(snapshot.kind),
    detail: getPathName(snapshot.pathId),
    href: contentResolver.getPathContext(snapshot.pathId)?.skillPath.href ?? getQuestionBankHref(snapshot.subjectId),
  }));
  const supportItems: DashboardActivityItem[] = evidence.supportEvents
    .filter((event) => event.afterGenuineAttempt)
    .map((event) => ({
      id: `support:${event.eventId}`,
      type: "support",
      occurredAt: event.occurredAt,
      title: event.type === "hint_viewed" ? "Hint reviewed" : "Worked solution reviewed",
      detail: getPathName(event.skillPathId),
      href: getQuestionHref(event.questionId),
    }));
  return [...attemptItems, ...achievementItems, ...supportItems]
    .sort(compareActivity)
    .slice(0, limit);
}

function deriveNeedsWork(paths: DashboardPathSummary[]): DashboardFocusItem[] {
  return paths
    .filter((path) => path.started && (path.reviewRecommendedCount > 0 || path.status === "in_progress" || path.status === "completed"))
    .filter((path) => path.status !== "secure" && path.status !== "mastered")
    .sort((left, right) => right.reviewRecommendedCount - left.reviewRecommendedCount || right.completionPercentage - left.completionPercentage || left.name.localeCompare(right.name))
    .slice(0, 4)
    .map((path) => ({
      pathId: path.skillPathId,
      title: path.name,
      detail: path.reviewRecommendedCount > 0
        ? `${path.reviewRecommendedCount} question${path.reviewRecommendedCount === 1 ? "" : "s"} to review`
        : `${path.completionPercentage}% complete · not secure yet`,
      href: path.nextHref,
      status: path.status,
      reviewRecommendedCount: path.reviewRecommendedCount,
    }));
}

function deriveSecureAndMastered(paths: DashboardPathSummary[], evidence: ProgressEvidence): DashboardAchievementItem[] {
  const current = paths
    .filter((path) => path.status === "secure" || path.status === "mastered")
    .map((path) => ({
      id: `current:${path.skillPathId}:${path.status}`,
      title: `${path.name} ${path.status}`,
      detail: `${path.masteryScore}% mastery · ${path.independentPerformancePercentage}% independent`,
      href: path.href,
      achievedAt: path.latestEvidenceAt,
      current: true,
    }));
  const historical = evidence.achievementSnapshots
    .filter((snapshot) => snapshot.kind === "path_secure" || snapshot.kind === "path_mastered")
    .filter((snapshot) => !current.some((item) => item.id.includes(snapshot.pathId)))
    .map((snapshot) => ({
      id: `snapshot:${snapshot.snapshotId}`,
      title: achievementTitle(snapshot.kind),
      detail: `${getPathName(snapshot.pathId)} · ${snapshot.masteryScore}% mastery snapshot`,
      href: contentResolver.getPathContext(snapshot.pathId)?.skillPath.href ?? getQuestionBankHref(snapshot.subjectId),
      achievedAt: snapshot.achievedAt,
      current: false,
    }));
  return [...current, ...historical].sort((left, right) => compareNullableDates(right.achievedAt, left.achievedAt)).slice(0, 4);
}

function deriveWeeklyActivity(evidence: ProgressEvidence, now: Date): DashboardWeeklyActivity {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);
  const activeDays = new Set<string>();
  let attempts = 0;
  for (const attempt of evidence.attempts) {
    if (!attempt.isGenuine || !isWithinWindow(attempt.attemptedAt, start, now)) continue;
    attempts += 1;
    activeDays.add(dayKey(attempt.attemptedAt));
  }
  let achievements = 0;
  for (const snapshot of evidence.achievementSnapshots) {
    if (!isWithinWindow(snapshot.achievedAt, start, now)) continue;
    achievements += 1;
    activeDays.add(dayKey(snapshot.achievedAt));
  }
  return {
    activeDays: activeDays.size,
    attempts,
    achievements,
    label: activeDays.size === 0
      ? "No activity in the last 7 days"
      : `${activeDays.size} active day${activeDays.size === 1 ? "" : "s"} in the last 7 days`,
  };
}

function deriveSyncSummary(sync: DashboardSyncInput): DashboardSyncSummary {
  if (sync.differentAccount) {
    return {
      label: "Review account connection",
      detail: "This browser has progress from a different account. Confirm before syncing.",
      tone: "attention",
      accountLinked: sync.accountFingerprint !== null,
    };
  }
  if (sync.status === "caught_up") {
    return {
      label: "Synced",
      detail: sync.lastSuccessfulSyncAt ? `Last synced ${formatShortDate(sync.lastSuccessfulSyncAt)}.` : "Account progress is up to date.",
      tone: "synced",
      accountLinked: true,
    };
  }
  if (sync.status === "syncing" || sync.status === "checking") {
    return { label: "Checking sync", detail: "Your browser is checking account progress.", tone: "syncing", accountLinked: sync.accountFingerprint !== null };
  }
  if (sync.status === "pending_upload") {
    return {
      label: "Waiting to sync",
      detail: `${sync.pendingCount} local change${sync.pendingCount === 1 ? "" : "s"} waiting for account sync.`,
      tone: "syncing",
      accountLinked: sync.accountFingerprint !== null,
    };
  }
  if (sync.status === "offline" || sync.status === "temporary_error") {
    return { label: "Saved here", detail: "Sync is unavailable right now, so new progress stays safely on this browser.", tone: "attention", accountLinked: sync.accountFingerprint !== null };
  }
  if (sync.status === "authentication_required") {
    return { label: "Sign in to sync", detail: "Local progress still works. Sign in again to update your account.", tone: "attention", accountLinked: false };
  }
  if (sync.status === "association_required" || sync.status === "cleanup_required" || sync.status === "paused") {
    return { label: "Sync needs confirmation", detail: "Review account data controls before this browser syncs progress.", tone: "attention", accountLinked: sync.accountFingerprint !== null };
  }
  return { label: "Saved on this browser", detail: "No account is needed. Guest progress stays local unless you choose to sync it.", tone: "local", accountLinked: false };
}

function deriveStageSummary(stage: LearningStage, progress: SkillPathProgress): DashboardStageSummary {
  const stageProgress = progress.stageProgress[stage.id];
  return {
    stageId: stage.id,
    name: stage.name,
    completedQuestions: stageProgress?.completedQuestionIds.length ?? 0,
    totalQuestions: stageProgress?.totalQuestions ?? stage.questionIds.length,
    completionPercentage: stageProgress?.completionPercentage ?? 0,
    masteryScore: stageProgress?.masteryScore ?? 0,
    status: stageProgress?.status ?? "not_started",
  };
}

function findCurrentStage(skillPath: SkillPath, progress: SkillPathProgress, nextQuestionId: string | null) {
  return (skillPath.learningStages ?? []).find((stage) => nextQuestionId && stage.questionIds.includes(nextQuestionId))
    ?? (skillPath.learningStages ?? []).find((stage) => {
      const stageProgress = progress.stageProgress[stage.id];
      return stageProgress && stageProgress.completionPercentage < 100;
    })
    ?? (skillPath.learningStages ?? [])[0];
}

function latestPathEvidenceAt(pathId: string, evidence: ProgressEvidence) {
  const dates = [
    ...evidence.attempts.filter((item) => item.skillPathId === pathId).map((item) => item.attemptedAt),
    ...evidence.supportEvents.filter((item) => item.skillPathId === pathId).map((item) => item.occurredAt),
    ...evidence.achievementSnapshots.filter((item) => item.pathId === pathId).map((item) => item.achievedAt),
  ];
  return dates.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

function getPathName(pathId: string) {
  return contentResolver.getPathContext(pathId)?.skillPath.name ?? pathId;
}

function achievementTitle(kind: AchievementSnapshot["kind"]) {
  const [scope, status] = kind.split("_");
  return `${scope[0]?.toUpperCase()}${scope.slice(1)} ${status}`;
}

function compareActivity(left: DashboardActivityItem, right: DashboardActivityItem) {
  return Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
    || activityPriority(left.type) - activityPriority(right.type)
    || left.id.localeCompare(right.id);
}

function activityPriority(type: DashboardActivityItem["type"]) {
  if (type === "achievement") return 0;
  if (type === "attempts") return 1;
  return 2;
}

function compareNullableDates(left: string | null, right: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return Date.parse(left) - Date.parse(right);
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function isWithinWindow(iso: string, start: Date, end: Date) {
  const value = Date.parse(iso);
  return Number.isFinite(value) && value >= start.getTime() && value <= end.getTime();
}

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function getQuestionProgressForDashboard(questionId: string, evidence: ProgressEvidence) {
  const version = contentResolver.getQuestion(questionId)?.questionVersion ?? 1;
  return getQuestionProgressForVersion(questionId, version, evidence);
}
