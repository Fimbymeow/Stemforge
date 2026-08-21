import type { ConfidenceLocalState } from "@/lib/confidence/local-state";
import { emptyConfidenceLocalState, normalizeConfidenceLocalState, readConfidenceLocalState, writeConfidenceLocalState } from "@/lib/confidence/local-state";
import { readStudyPlanLocalState, writeStudyPlanLocalState, type StudyPlanLocalState } from "@/lib/study-plan/local-state";
import { utcWeekStart } from "@/lib/study-plan/dates";
import { normalizeAccountLearnerState,
  type AccountLearnerState, type AccountStateMutation, type SyncedPlanItemState } from "@/lib/account-state/types";

export const ACCOUNT_STATE_SYNC_STORAGE_KEY = "orthic.accountStateSync.v1";
export const ACCOUNT_STATE_SYNCED_EVENT = "orthic:account-state-synced";
export const ACCOUNT_STATE_IMPORT_COMPLETED_EVENT = "orthic:account-state-import-completed";

export type AccountStateSyncMetadata = {
  version: 1;
  accountFingerprint: string | null;
  accountGeneration: string | null;
  pending: AccountStateMutation[];
  guestCandidate: { capturedAt: string; associatedFingerprint: string | null; state: AccountLearnerState } | null;
  retryCount: number;
};

export function emptyAccountStateSyncMetadata(): AccountStateSyncMetadata {
  return { version: 1, accountFingerprint: null, accountGeneration: null, pending: [], guestCandidate: null, retryCount: 0 };
}

export function readAccountStateSyncMetadata(storage: Pick<Storage, "getItem">): AccountStateSyncMetadata {
  try {
    const value = JSON.parse(storage.getItem(ACCOUNT_STATE_SYNC_STORAGE_KEY) ?? "null") as Partial<AccountStateSyncMetadata> | null;
    if (!value || value.version !== 1) return emptyAccountStateSyncMetadata();
    return {
      version: 1,
      accountFingerprint: typeof value.accountFingerprint === "string" ? value.accountFingerprint : null,
      accountGeneration: typeof value.accountGeneration === "string" && /^[1-9]\d*$/.test(value.accountGeneration) ? value.accountGeneration : null,
      pending: Array.isArray(value.pending) ? value.pending.slice(0, 500) as AccountStateMutation[] : [],
      guestCandidate: value.guestCandidate && typeof value.guestCandidate === "object"
        ? { capturedAt: value.guestCandidate.capturedAt, associatedFingerprint: value.guestCandidate.associatedFingerprint,
          state: normalizeAccountLearnerState(value.guestCandidate.state) } : null,
      retryCount: Number.isInteger(value.retryCount) && Number(value.retryCount) >= 0 ? Number(value.retryCount) : 0,
    };
  } catch { return emptyAccountStateSyncMetadata(); }
}

export function writeAccountStateSyncMetadata(storage: Pick<Storage, "setItem">, metadata: AccountStateSyncMetadata) {
  try { storage.setItem(ACCOUNT_STATE_SYNC_STORAGE_KEY, JSON.stringify(metadata)); return true; } catch { return false; }
}

export function readLocalAccountState(storage: Pick<Storage, "getItem">, now = new Date()): AccountLearnerState {
  const study = readStudyPlanLocalState(storage);
  const confidence = readConfidenceLocalState(storage);
  const changedAt = now.toISOString();
  return normalizeAccountLearnerState({
    settings: study.setup ? { weeklyMinutes: study.setup.weeklyMinutes, availableDays: study.setup.availableDays, changedAt } : null,
    assessments: (study.setup?.assessments ?? []).filter((item) => item.source !== "orthic_provisional").map((assessment) => ({ assessment, changedAt })),
    ratings: Object.values(confidence.ratings), overrides: Object.values(confidence.overrides),
    planItems: localPlanItems(study, changedAt),
  });
}

export function applyAccountStateToLocalStorage(storage: Pick<Storage, "getItem" | "setItem">, state: AccountLearnerState, now = new Date()) {
  const normalized = normalizeAccountLearnerState(state);
  const currentStudy = readStudyPlanLocalState(storage);
  const weekStart = utcWeekStart(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
  const items = normalized.planItems.filter((item) => item.weekStart === weekStart && item.plannerVersion === 1);
  const preservation: StudyPlanLocalState["preservation"] = { itemStates: {}, movedDates: {}, excludedItemKeys: [] };
  for (const item of items) {
    if (item.state) preservation.itemStates[item.itemKey] = item.state;
    if (item.movedDate) preservation.movedDates[item.itemKey] = item.movedDate;
    if (item.excluded) preservation.excludedItemKeys.push(item.itemKey);
    if (item.unscheduled) (preservation.unscheduledItemKeys ??= []).push(item.itemKey);
  }
  const nextStudy: StudyPlanLocalState = {
    ...currentStudy,
    setup: normalized.settings ? { weeklyMinutes: normalized.settings.weeklyMinutes,
      availableDays: normalized.settings.availableDays, assessments: normalized.assessments.map((entry) => entry.assessment) } : null,
    plan: null,
    preservation,
  };
  const nextConfidence: ConfidenceLocalState = normalizeConfidenceLocalState({
    ratings: Object.fromEntries(normalized.ratings.map((entry) => [entry.skillPathId, entry])),
    overrides: Object.fromEntries(normalized.overrides.map((entry) => [entry.skillPathId, entry])),
  });
  return writeStudyPlanLocalState(storage, nextStudy) && writeConfidenceLocalState(storage, nextConfidence);
}

export function diffLocalAccountState(local: AccountLearnerState, authority: AccountLearnerState, changedAt = new Date().toISOString()) {
  const mutations: AccountStateMutation[] = [];
  if (local.settings && !same(local.settings, authority.settings, ["changedAt"])) {
    mutations.push({ kind: "settings_replace", settings: { weeklyMinutes: local.settings.weeklyMinutes, availableDays: local.settings.availableDays }, changedAt });
  }
  diffRecords(local.assessments, authority.assessments, (entry) => entry.assessment.id,
    (entry) => mutations.push({ kind: "assessment_upsert", assessment: entry.assessment, changedAt }),
    (id) => mutations.push({ kind: "assessment_delete", assessmentId: id, changedAt }), ["changedAt"]);
  diffRecords(local.ratings, authority.ratings, (entry) => entry.skillPathId,
    (entry) => mutations.push({ kind: "confidence_upsert", skillPathId: entry.skillPathId, level: entry.level, setAt: entry.setAt, changedAt }),
    (id) => mutations.push({ kind: "confidence_delete", skillPathId: id, changedAt }));
  diffRecords(local.overrides, authority.overrides, (entry) => entry.skillPathId,
    (entry) => mutations.push({ kind: "override_upsert", override: entry, changedAt }),
    (id) => mutations.push({ kind: "override_delete", skillPathId: id, changedAt }));
  diffRecords(local.planItems, authority.planItems, planItemId,
    (entry) => mutations.push({ kind: "plan_item_upsert", item: withoutChangedAt(entry), changedAt }),
    (id) => {
      const entry = authority.planItems.find((item) => planItemId(item) === id);
      if (entry) mutations.push({ kind: "plan_item_upsert", item: { ...withoutChangedAt(entry), state: null, movedDate: null, excluded: false, unscheduled: false }, changedAt });
    }, ["changedAt"]);
  return mutations;
}

export function applyAccountStateMutations(state: AccountLearnerState, mutations: readonly AccountStateMutation[]) {
  const next = structuredClone(normalizeAccountLearnerState(state));
  for (const mutation of mutations) {
    if (mutation.kind === "settings_replace") next.settings = { ...mutation.settings, changedAt: mutation.changedAt };
    else if (mutation.kind === "assessment_upsert") upsert(next.assessments, { assessment: mutation.assessment, changedAt: mutation.changedAt }, (entry) => entry.assessment.id);
    else if (mutation.kind === "assessment_delete") remove(next.assessments, mutation.assessmentId, (entry) => entry.assessment.id);
    else if (mutation.kind === "confidence_upsert") upsert(next.ratings, { skillPathId: mutation.skillPathId, level: mutation.level, setAt: mutation.setAt }, (entry) => entry.skillPathId);
    else if (mutation.kind === "confidence_delete") remove(next.ratings, mutation.skillPathId, (entry) => entry.skillPathId);
    else if (mutation.kind === "override_upsert") upsert(next.overrides, mutation.override, (entry) => entry.skillPathId);
    else if (mutation.kind === "override_delete") remove(next.overrides, mutation.skillPathId, (entry) => entry.skillPathId);
    else if (mutation.kind === "plan_item_upsert") upsert(next.planItems, { ...mutation.item, changedAt: mutation.changedAt }, planItemId);
  }
  return normalizeAccountLearnerState(next);
}

export function mergePendingMutations(existing: readonly AccountStateMutation[], incoming: readonly AccountStateMutation[]) {
  const entries = new Map<string, AccountStateMutation>();
  for (const mutation of [...existing, ...incoming]) entries.set(mutationId(mutation), mutation);
  return [...entries.values()].slice(-500);
}

export function sameMutationVersion(left: AccountStateMutation, right: AccountStateMutation) {
  return mutationId(left) === mutationId(right) && left.changedAt === right.changedAt;
}

export function hasMeaningfulAccountState(state: AccountLearnerState) {
  return Boolean(state.settings || state.assessments.length || state.ratings.length || state.overrides.length || state.planItems.length);
}

export function clearAssociatedAccountState(storage: Storage, accountFingerprint: string) {
  const metadata = readAccountStateSyncMetadata(storage);
  if (metadata.accountFingerprint !== accountFingerprint) return true;
  try {
    storage.removeItem("orthic.studyPlan.v1");
    storage.removeItem("orthic.confidence.v1");
    metadata.accountFingerprint = null;
    metadata.accountGeneration = null;
    metadata.pending = [];
    metadata.retryCount = 0;
    writeAccountStateSyncMetadata(storage, metadata);
    return true;
  } catch { return false; }
}

function localPlanItems(study: StudyPlanLocalState, changedAt: string): SyncedPlanItemState[] {
  const plan = study.plan;
  if (!plan) return [];
  const preservation = plan.preservation;
  const keys = new Set([...Object.keys(preservation.itemStates), ...Object.keys(preservation.movedDates),
    ...preservation.excludedItemKeys, ...(preservation.unscheduledItemKeys ?? [])]);
  return [...keys].map((itemKey) => ({ itemKey, weekStart: plan.weekStart, plannerVersion: plan.generationVersion,
    state: preservation.itemStates[itemKey] ?? null, movedDate: preservation.movedDates[itemKey] ?? null,
    excluded: preservation.excludedItemKeys.includes(itemKey), unscheduled: (preservation.unscheduledItemKeys ?? []).includes(itemKey), changedAt }));
}

function diffRecords<T>(local: T[], remote: T[], id: (value: T) => string, update: (value: T) => void,
  deleted: (id: string) => void, ignored: string[] = []) {
  const left = new Map(local.map((entry) => [id(entry), entry]));
  const right = new Map(remote.map((entry) => [id(entry), entry]));
  for (const [key, value] of left) if (!right.has(key) || !same(value, right.get(key), ignored)) update(value);
  for (const key of right.keys()) if (!left.has(key)) deleted(key);
}

function same(left: unknown, right: unknown, ignored: string[] = []) {
  const omit = (value: unknown) => value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).filter(([key]) => !ignored.includes(key))) : value;
  return JSON.stringify(omit(left)) === JSON.stringify(omit(right));
}
function planItemId(item: SyncedPlanItemState) { return `${item.weekStart}:${item.plannerVersion}:${item.itemKey}`; }
function withoutChangedAt(item: SyncedPlanItemState): Omit<SyncedPlanItemState, "changedAt"> { const { changedAt: _, ...rest } = item; return rest; }
function upsert<T>(values: T[], value: T, id: (entry: T) => string) { const index = values.findIndex((entry) => id(entry) === id(value)); if (index < 0) values.push(value); else values[index] = value; }
function remove<T>(values: T[], key: string, id: (entry: T) => string) { const index = values.findIndex((entry) => id(entry) === key); if (index >= 0) values.splice(index, 1); }
function mutationId(mutation: AccountStateMutation) {
  switch (mutation.kind) {
    case "settings_replace": return "settings";
    case "assessment_upsert": return `assessment:${mutation.assessment.id}`;
    case "assessment_delete": return `assessment:${mutation.assessmentId}`;
    case "confidence_upsert": case "confidence_delete": return `confidence:${mutation.skillPathId}`;
    case "override_upsert": return `override:${mutation.override.skillPathId}`;
    case "override_delete": return `override:${mutation.skillPathId}`;
    case "plan_item_upsert": return `plan:${mutation.item.weekStart}:${mutation.item.plannerVersion}:${mutation.item.itemKey}`;
  }
}
