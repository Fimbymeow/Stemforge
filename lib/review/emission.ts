"use client";

import { contentResolver } from "@/lib/content-resolver";
import {
  getProgressEvidence,
  recordReviewEvent,
} from "@/lib/local-progress";
import type { PracticeSession } from "@/lib/practice/practice-types";
import { createReviewEventId } from "@/lib/review/identity";
import { deriveReviewTargetResolution } from "@/lib/review/outcomes";
import { resolveCanonicalReviewTip } from "@/lib/review/replay";
import {
  REVIEW_SCHEDULER_VERSION,
  transitionReviewStage,
} from "@/lib/review/scheduler";
import type { ReviewEvent } from "@/lib/review/types";

export type ReviewEmissionResult = {
  status: "not_review" | "unresolved" | "recorded" | "already_recorded" | "write_failed";
  recordedTargetIds: string[];
  unresolvedTargetIds: string[];
};

export async function recordResolvedReviewTargets(session: PracticeSession): Promise<ReviewEmissionResult> {
  if (session.mode !== "review" || session.origin !== "scheduled_review" || !session.reviewTargets?.length) {
    return { status: "not_review", recordedTargetIds: [], unresolvedTargetIds: [] };
  }
  const recordedTargetIds: string[] = [];
  const unresolvedTargetIds: string[] = [];
  let alreadyRecorded = 0;
  for (const assignment of session.reviewTargets) {
    const evidence = getProgressEvidence();
    const existing = evidence.reviewEvents.find((event) =>
      event.source.sourceType === "practice_session" &&
      event.source.sourceId === session.sessionId &&
      event.target.targetType === assignment.target.targetType &&
      event.target.targetId === assignment.target.targetId);
    if (existing) {
      alreadyRecorded += 1;
      continue;
    }
    const resolution = deriveReviewTargetResolution(session, assignment, evidence);
    if (!resolution.resolved) {
      unresolvedTargetIds.push(assignment.target.targetId);
      continue;
    }
    const path = contentResolver.getPathContext(assignment.target.targetId)?.skillPath;
    if (!path) {
      unresolvedTargetIds.push(assignment.target.targetId);
      continue;
    }
    const targetEvents = evidence.reviewEvents.filter((event) =>
      event.target.targetType === assignment.target.targetType &&
      event.target.targetId === assignment.target.targetId);
    const canonical = resolveCanonicalReviewTip(evidence.reviewEvents, assignment.target).canonicalEvent;
    if (targetEvents.length > 0 && !canonical) {
      return { status: "write_failed", recordedTargetIds, unresolvedTargetIds };
    }
    const stageAfter = transitionReviewStage(canonical?.stageAfter ?? null, resolution.outcome);
    if (stageAfter === null) return { status: "write_failed", recordedTargetIds, unresolvedTargetIds };
    const source = { sourceType: "practice_session" as const, sourceId: session.sessionId };
    const eventId = await createReviewEventId(source, assignment.target);
    const event: ReviewEvent = {
      eventId,
      source,
      target: assignment.target,
      targetVersion: { versionType: "skill_path", version: path.pathVersion },
      outcome: resolution.outcome,
      occurredAt: resolution.occurredAt,
      sequence: nextSequence(evidence),
      priorEventId: canonical?.eventId ?? null,
      schedulerVersion: REVIEW_SCHEDULER_VERSION,
      stageAfter,
      evidenceRefs: resolution.evidenceRefs,
      questionIds: [...assignment.questionIds],
    };
    if (!await recordReviewEvent(event)) {
      return { status: "write_failed", recordedTargetIds, unresolvedTargetIds };
    }
    recordedTargetIds.push(assignment.target.targetId);
  }
  const status = recordedTargetIds.length
    ? "recorded"
    : unresolvedTargetIds.length
      ? "unresolved"
      : alreadyRecorded
        ? "already_recorded"
        : "unresolved";
  return { status, recordedTargetIds, unresolvedTargetIds };
}

function nextSequence(evidence: ReturnType<typeof getProgressEvidence>) {
  return Math.max(
    0,
    ...evidence.attempts.map((item) => item.sequence),
    ...evidence.supportEvents.map((item) => item.sequence),
    ...evidence.guidedSelfAssessments.map((item) => item.sequence),
    ...evidence.reviewEvents.map((item) => item.sequence),
  ) + 1;
}
