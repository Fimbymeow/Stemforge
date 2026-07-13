import type { SkillPath } from "@/data/types";
import { calculateSkillPathProgress } from "@/lib/progress/calculations";
import type { EventIdFactory } from "@/lib/progress/event-identity";
import type {
  AchievementSnapshot,
  AchievementSnapshotKind,
  ProgressEvidence,
  ProgressStatus,
} from "@/lib/progress/types";

export type StructuralAchievementContext = {
  subjectId: string;
  courseId: string;
  skillPath: SkillPath;
  questionVersions: Readonly<Record<string, number>>;
};

export type HistoricalStructuralState = {
  currentStatus: ProgressStatus;
  currentStructuralVersion: number;
  strongestHistoricalStatus: "not_started" | AchievementTier;
  strongestHistoricalVersion: number | null;
  historicalAchievementDate: string | null;
  reassessmentRecommendedQuestionIds: string[];
  reassessmentRequiredQuestionIds: string[];
  newPracticeAvailable: boolean;
};

const tiers = ["completed", "secure", "mastered"] as const;
type AchievementTier = (typeof tiers)[number];
const rank: Record<ProgressStatus, number> = { not_started: 0, in_progress: 0, completed: 1, secure: 2, mastered: 3 };

export function appendAchievementTransitions(
  before: ProgressEvidence,
  after: ProgressEvidence,
  context: StructuralAchievementContext,
  achievedAt: string,
  idFactory: EventIdFactory,
): ProgressEvidence {
  const previous = calculateSkillPathProgress(context.skillPath, before, context.questionVersions);
  const next = calculateSkillPathProgress(context.skillPath, after, context.questionVersions);
  const additions: AchievementSnapshot[] = [];

  for (const stage of context.skillPath.learningStages ?? []) {
    const beforeStage = previous.stageProgress[stage.id];
    const afterStage = next.stageProgress[stage.id];
    if (!beforeStage || !afterStage) continue;
    for (const tier of crossedTiers(beforeStage.currentVersionStatus, afterStage.currentVersionStatus)) {
      additions.push(createSnapshot(`stage_${tier}`, {
        ...context, stageId: stage.id, stageVersion: stage.stageVersion,
        masteryScore: afterStage.masteryScore,
        independentPerformancePercentage: afterStage.independentPerformancePercentage,
        completionCount: afterStage.currentVersionCompletedQuestionIds.length,
        totalRequiredCount: afterStage.totalQuestions,
      }, achievedAt, idFactory));
    }
  }

  for (const tier of crossedTiers(previous.currentVersionStatus, next.currentVersionStatus)) {
    additions.push(createSnapshot(`path_${tier}`, {
      ...context,
      masteryScore: next.masteryScore,
      independentPerformancePercentage: next.independentPerformancePercentage,
      completionCount: next.currentVersionCompletedQuestionIds.length,
      totalRequiredCount: next.totalQuestions,
    }, achievedAt, idFactory));
  }

  const unique = additions.filter((snapshot) => !after.achievementSnapshots.some((existing) => sameStructuralAchievement(existing, snapshot)));
  return { ...after, achievementSnapshots: [...after.achievementSnapshots, ...unique] };
}

function crossedTiers(before: ProgressStatus, after: ProgressStatus): AchievementTier[] {
  if (rank[after] <= rank[before]) return [];
  return tiers.filter((tier) => rank[tier] > rank[before] && rank[tier] <= rank[after]);
}

function createSnapshot(
  kind: AchievementSnapshotKind,
  input: StructuralAchievementContext & {
    stageId?: string; stageVersion?: number; masteryScore: number; independentPerformancePercentage: number;
    completionCount: number; totalRequiredCount: number;
  },
  achievedAt: string,
  idFactory: EventIdFactory,
): AchievementSnapshot {
  return {
    snapshotId: idFactory("snapshot"), kind, subjectId: input.subjectId, courseId: input.courseId,
    pathId: input.skillPath.slug, pathVersion: input.skillPath.pathVersion,
    ...(input.stageId ? { stageId: input.stageId, stageVersion: input.stageVersion } : {}),
    achievedAt, masteryScore: input.masteryScore,
    independentPerformancePercentage: input.independentPerformancePercentage,
    completionCount: input.completionCount, totalRequiredCount: input.totalRequiredCount, source: "derived_current",
  };
}

function sameStructuralAchievement(left: AchievementSnapshot, right: AchievementSnapshot) {
  return left.kind === right.kind && left.pathId === right.pathId && left.pathVersion === right.pathVersion &&
    left.stageId === right.stageId && left.stageVersion === right.stageVersion;
}

const snapshotRank = (snapshot: AchievementSnapshot) => snapshot.kind.endsWith("mastered") ? 3 : snapshot.kind.endsWith("secure") ? 2 : 1;
const chronological = (left: AchievementSnapshot, right: AchievementSnapshot) =>
  left.achievedAt.localeCompare(right.achievedAt) || left.snapshotId.localeCompare(right.snapshotId);

export function getLatestStageAchievement(snapshots: readonly AchievementSnapshot[], pathId: string, stageId: string) {
  return snapshots.filter((item) => item.pathId === pathId && item.stageId === stageId).sort(chronological).at(-1) ?? null;
}
export function getStrongestStageAchievement(snapshots: readonly AchievementSnapshot[], pathId: string, stageId: string) {
  return strongest(snapshots.filter((item) => item.pathId === pathId && item.stageId === stageId));
}
export function getLatestPathAchievement(snapshots: readonly AchievementSnapshot[], pathId: string) {
  return snapshots.filter((item) => item.pathId === pathId && item.stageId === undefined).sort(chronological).at(-1) ?? null;
}
export function getStrongestPathAchievement(snapshots: readonly AchievementSnapshot[], pathId: string) {
  return strongest(snapshots.filter((item) => item.pathId === pathId && item.stageId === undefined));
}
export function getAchievementsByStructuralVersion(snapshots: readonly AchievementSnapshot[], pathId: string, pathVersion: number, stageVersion?: number) {
  return snapshots.filter((item) => item.pathId === pathId && item.pathVersion === pathVersion &&
    (stageVersion === undefined || item.stageVersion === stageVersion));
}
export function wasStructuralVersionAchieved(
  snapshots: readonly AchievementSnapshot[], pathId: string, pathVersion: number, tier: AchievementTier, stageId?: string, stageVersion?: number,
) {
  const required = tiers.indexOf(tier) + 1;
  return snapshots.some((item) => item.pathId === pathId && item.pathVersion === pathVersion && item.stageId === stageId &&
    item.stageVersion === stageVersion && snapshotRank(item) >= required);
}
export function getHistoricalCompletionTimestamp(snapshots: readonly AchievementSnapshot[], pathId: string, stageId?: string) {
  return snapshots.filter((item) => item.pathId === pathId && item.stageId === stageId && item.kind.endsWith("completed"))
    .sort(chronological)[0]?.achievedAt ?? null;
}
function strongest(items: AchievementSnapshot[]) {
  return items.sort((left, right) => snapshotRank(right) - snapshotRank(left) || chronological(right, left))[0] ?? null;
}

export function derivePathStructuralState(
  evidence: ProgressEvidence,
  context: StructuralAchievementContext,
): HistoricalStructuralState {
  const live = calculateSkillPathProgress(context.skillPath, evidence, context.questionVersions);
  const historical = getStrongestPathAchievement(evidence.achievementSnapshots, context.skillPath.slug);
  return {
    currentStatus: live.currentVersionStatus,
    currentStructuralVersion: context.skillPath.pathVersion,
    strongestHistoricalStatus: historical ? tierFromKind(historical.kind) : "not_started",
    strongestHistoricalVersion: historical?.pathVersion ?? null,
    historicalAchievementDate: getHistoricalCompletionTimestamp(evidence.achievementSnapshots, context.skillPath.slug),
    reassessmentRecommendedQuestionIds: live.reassessmentRecommendedQuestionIds,
    reassessmentRequiredQuestionIds: live.reassessmentRequiredQuestionIds,
    newPracticeAvailable: live.newPracticeAvailable,
  };
}

export function deriveStageStructuralState(
  evidence: ProgressEvidence,
  context: StructuralAchievementContext,
  stageId: string,
): HistoricalStructuralState | null {
  const stage = context.skillPath.learningStages?.find((item) => item.id === stageId);
  if (!stage) return null;
  const live = calculateSkillPathProgress(context.skillPath, evidence, context.questionVersions).stageProgress[stageId];
  if (!live) return null;
  const historical = getStrongestStageAchievement(evidence.achievementSnapshots, context.skillPath.slug, stageId);
  return {
    currentStatus: live.currentVersionStatus,
    currentStructuralVersion: stage.stageVersion,
    strongestHistoricalStatus: historical ? tierFromKind(historical.kind) : "not_started",
    strongestHistoricalVersion: historical?.stageVersion ?? null,
    historicalAchievementDate: getHistoricalCompletionTimestamp(evidence.achievementSnapshots, context.skillPath.slug, stageId),
    reassessmentRecommendedQuestionIds: live.reassessmentRecommendedQuestionIds,
    reassessmentRequiredQuestionIds: live.reassessmentRequiredQuestionIds,
    newPracticeAvailable: live.newPracticeAvailable,
  };
}

export function classifyOrphanedSnapshots(snapshots: readonly AchievementSnapshot[], knownPathIds: ReadonlySet<string>) {
  return snapshots.map((snapshot) => ({ snapshot, orphaned: !knownPathIds.has(snapshot.pathId) }));
}

function tierFromKind(kind: AchievementSnapshotKind): AchievementTier {
  return kind.endsWith("mastered") ? "mastered" : kind.endsWith("secure") ? "secure" : "completed";
}
