import { stableStringify } from "@/lib/progress/event-identity";
import { migrateProgressPayload } from "@/lib/progress/payload";
import type { AchievementSnapshot, ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";

export type EvidenceRecordType = "attempt" | "support_event" | "achievement_snapshot";
export type EvidenceConflict = {
  type: "same_id_conflict" | "malformed_evidence_dropped" | "unsupported_payload_version";
  recordType?: EvidenceRecordType;
  eventId?: string;
  detail: string;
};
export type MergeResult = { payload: ProgressPayload; conflicts: EvidenceConflict[] };
export type SupportedMergeResult = { payload: ProgressPayload | null; conflicts: EvidenceConflict[] };

export function mergeProgressEvidence(left: ProgressPayload, right: ProgressPayload): MergeResult {
  const attempts = mergeRecords(left.data.attempts, right.data.attempts, "attempt", (item) => item.eventId, attemptTime);
  const supportEvents = mergeRecords(left.data.supportEvents, right.data.supportEvents, "support_event", (item) => item.eventId, (item) => item.occurredAt);
  const achievementSnapshots = mergeRecords(left.data.achievementSnapshots, right.data.achievementSnapshots, "achievement_snapshot", (item) => item.snapshotId, (item) => item.achievedAt);
  return {
    payload: { version: 4, data: { attempts: attempts.records, supportEvents: supportEvents.records, achievementSnapshots: achievementSnapshots.records } },
    conflicts: [...attempts.conflicts, ...supportEvents.conflicts, ...achievementSnapshots.conflicts],
  };
}

export function mergeSupportedProgressPayloads(left: unknown, right: unknown): SupportedMergeResult {
  const leftResult = migrateProgressPayload(left);
  const rightResult = migrateProgressPayload(right);
  const conflicts = [...migrationConflicts(leftResult, "left"), ...migrationConflicts(rightResult, "right")];
  if (leftResult.status === "unsupported-version" || rightResult.status === "unsupported-version") {
    return { payload: null, conflicts };
  }
  const merged = mergeProgressEvidence(leftResult.payload, rightResult.payload);
  return { payload: merged.payload, conflicts: [...conflicts, ...merged.conflicts] };
}

function mergeRecords<T>(
  left: readonly T[], right: readonly T[], recordType: EvidenceRecordType,
  getId: (item: T) => string, getTimestamp: (item: T) => string,
) {
  const byId = new Map<string, T>();
  const conflicts: EvidenceConflict[] = [];
  for (const item of [...left, ...right]) {
    const id = getId(item);
    const existing = byId.get(id);
    if (!existing) { byId.set(id, clone(item)); continue; }
    const oldText = stableStringify(existing);
    const newText = stableStringify(item);
    if (oldText !== newText) {
      conflicts.push({ type: "same_id_conflict", recordType, eventId: id,
        detail: `Conflicting ${recordType} records share ID ${id}; canonical lexical record retained.` });
      if (newText < oldText) byId.set(id, clone(item));
    }
  }
  const records = [...byId.values()].sort((a, b) => canonicalCompare(getTimestamp(a), getId(a), getTimestamp(b), getId(b)));
  return { records, conflicts };
}

function canonicalCompare(leftTime: string, leftId: string, rightTime: string, rightId: string) {
  const left = validTime(leftTime);
  const right = validTime(rightTime);
  return left.localeCompare(right) || leftId.localeCompare(rightId);
}

function validTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : `~invalid:${value}`;
}

function attemptTime(item: QuestionAttempt) { return item.attemptedAt; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

function migrationConflicts(result: ReturnType<typeof migrateProgressPayload>, side: string): EvidenceConflict[] {
  if (result.status === "unsupported-version") return [{ type: "unsupported_payload_version", detail: `${side} payload has an unsupported version; merge refused.` }];
  const conflicts: EvidenceConflict[] = [];
  const counts: Array<[EvidenceRecordType, number]> = [
    ["attempt", result.droppedAttempts], ["support_event", result.droppedEvents], ["achievement_snapshot", result.droppedSnapshots],
  ];
  for (const [recordType, count] of counts) if (count) conflicts.push({ type: "malformed_evidence_dropped", recordType, detail: `${side} payload dropped ${count} malformed ${recordType} record(s).` });
  return conflicts;
}

export type { AchievementSnapshot, QuestionSupportEvent };
