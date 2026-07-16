import { createDefaultProgressPayload } from "@/lib/progress/payload";
import type { AchievementSnapshot, ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import {
  MAX_REMOTE_EVIDENCE_BATCH_BYTES,
  MAX_REMOTE_EVIDENCE_BATCH_ITEMS,
} from "@/lib/remote-evidence/validation";

type EvidenceRecord =
  | { kind: "attempt"; value: QuestionAttempt }
  | { kind: "support_event"; value: QuestionSupportEvent }
  | { kind: "achievement_snapshot"; value: AchievementSnapshot };

export function batchProgressEvidence(
  payload: ProgressPayload,
  maxItems = MAX_REMOTE_EVIDENCE_BATCH_ITEMS,
  maxBytes = MAX_REMOTE_EVIDENCE_BATCH_BYTES,
) {
  if (!Number.isInteger(maxItems) || maxItems < 1 || !Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new Error("Progress import batch limits must be positive integers.");
  }
  const records: EvidenceRecord[] = [
    ...payload.data.attempts.map((value) => ({ kind: "attempt" as const, value })),
    ...payload.data.supportEvents.map((value) => ({ kind: "support_event" as const, value })),
    ...payload.data.achievementSnapshots.map((value) => ({ kind: "achievement_snapshot" as const, value })),
  ];
  const batches: ProgressPayload[] = [];
  let current = createDefaultProgressPayload();

  for (const record of records) {
    const candidate = append(current, record);
    if (countEvidence(current) > 0 && (countEvidence(candidate) > maxItems || byteLength(candidate) > maxBytes)) {
      batches.push(current);
      current = append(createDefaultProgressPayload(), record);
    } else {
      current = candidate;
    }
    if (countEvidence(current) > maxItems || byteLength(current) > maxBytes) {
      throw new Error(`Evidence record ${evidenceId(record)} exceeds the progress import batch limit.`);
    }
  }
  if (countEvidence(current) > 0) batches.push(current);
  return batches;
}

export function countEvidence(payload: ProgressPayload) {
  return payload.data.attempts.length + payload.data.supportEvents.length + payload.data.achievementSnapshots.length;
}

function append(payload: ProgressPayload, record: EvidenceRecord): ProgressPayload {
  const next = structuredClone(payload);
  if (record.kind === "attempt") next.data.attempts.push(record.value);
  else if (record.kind === "support_event") next.data.supportEvents.push(record.value);
  else next.data.achievementSnapshots.push(record.value);
  return next;
}

function byteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function evidenceId(record: EvidenceRecord) {
  return record.kind === "achievement_snapshot" ? record.value.snapshotId : record.value.eventId;
}
