import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyAccountStateMutations, applyAccountStateToLocalStorage, diffLocalAccountState,
  emptyAccountStateSyncMetadata, hasMeaningfulAccountState, mergePendingMutations,
  readLocalAccountState,
} from "../lib/account-state/client-state";
import { normalizeAccountLearnerState, type AccountStateMutation, type SyncedPlanItemState } from "../lib/account-state/types";
import { STUDY_PLAN_LOCAL_STATE_STORAGE_KEY } from "../lib/study-plan/local-state";
import { CONFIDENCE_LOCAL_STATE_STORAGE_KEY } from "../lib/confidence/local-state";

const NOW = "2026-08-17T10:00:00.000Z";

test("account-state migration is additive, owner scoped, mutable and erasure aware without a generated-plan table", () => {
  const migration = readFileSync(new URL("../migrations/1753698400000_account-learner-state.js", import.meta.url), "utf8");
  for (const table of ["study_plan_settings", "learner_assessments", "learner_confidence", "study_plan_item_states"]) {
    assert.match(migration, new RegExp(`CREATE TABLE stemforge_account_data\\.${table}`));
    assert.match(migration, new RegExp(`DELETE FROM stemforge_account_data\\.${table}`));
  }
  assert.doesNotMatch(migration, /weekly_plans|generated_plan_json|planner_snapshot/);
  assert.match(migration, /REFERENCES stemforge_identity\.application_owners/);
});

test("cross-device record mutations preserve unrelated item changes", () => {
  const base = normalizeAccountLearnerState({ planItems: [planItem("item-a", null, NOW), planItem("item-b", null, NOW)] });
  const desktop: AccountStateMutation = { kind: "plan_item_upsert", item: withoutTime(planItem("item-a", "completed", NOW)), changedAt: "2026-08-17T10:01:00.000Z" };
  const moved = { ...withoutTime(planItem("item-b", null, NOW)), movedDate: "2026-08-19" };
  const mobile: AccountStateMutation = { kind: "plan_item_upsert", item: moved, changedAt: "2026-08-17T10:02:00.000Z" };
  const merged = applyAccountStateMutations(base, [desktop, mobile]);
  assert.equal(merged.planItems.find((item) => item.itemKey === "item-a")?.state, "completed");
  assert.equal(merged.planItems.find((item) => item.itemKey === "item-b")?.movedDate, "2026-08-19");
  assert.equal(mergePendingMutations([desktop], [mobile]).length, 2);
});

test("server authority hydrates inputs and manual state but never a generated weekly plan", () => {
  const storage = memoryStorage();
  const state = normalizeAccountLearnerState({
    settings: { weeklyMinutes: 240, availableDays: ["mon", "wed", "sat"], changedAt: NOW },
    assessments: [{ assessment: assessment("assessment:stable"), changedAt: NOW }],
    ratings: [{ skillPathId: "chain-rule", level: "developing", setAt: NOW }],
    planItems: [planItem("item-a", "completed", NOW)],
  });
  assert.equal(applyAccountStateToLocalStorage(storage, state, new Date(NOW)), true);
  const study = JSON.parse(storage.getItem(STUDY_PLAN_LOCAL_STATE_STORAGE_KEY)!) as { plan: unknown; setup: { weeklyMinutes: number }; preservation: { itemStates: Record<string, string> } };
  assert.equal(study.plan, null);
  assert.equal(study.setup.weeklyMinutes, 240);
  assert.equal(study.preservation.itemStates["item-a"], "completed");
  const confidence = JSON.parse(storage.getItem(CONFIDENCE_LOCAL_STATE_STORAGE_KEY)!) as { ratings: Record<string, { level: string }> };
  assert.equal(confidence.ratings["chain-rule"].level, "developing");
});

test("local changes become bounded record mutations while server confidence stays authoritative", () => {
  const remote = normalizeAccountLearnerState({ ratings: [{ skillPathId: "chain-rule", level: "confident", setAt: NOW }] });
  const local = normalizeAccountLearnerState({ ratings: [
    { skillPathId: "chain-rule", level: "confident", setAt: NOW },
    { skillPathId: "basic-differentiation", level: "needs_work", setAt: NOW },
  ] });
  const mutations = diffLocalAccountState(local, remote, "2026-08-17T10:03:00.000Z");
  assert.deepEqual(mutations.map((entry) => entry.kind), ["confidence_upsert"]);
  assert.equal(mutations[0].kind === "confidence_upsert" ? mutations[0].skillPathId : null, "basic-differentiation");
  assert.equal(hasMeaningfulAccountState(local), true);
  assert.deepEqual(emptyAccountStateSyncMetadata().pending, []);
});

test("unknown canonical skill IDs hydrate safely as inert learner-owned records", () => {
  const state = normalizeAccountLearnerState({ ratings: [{ skillPathId: "retired-skill-id", level: "developing", setAt: NOW }] });
  assert.equal(state.ratings[0].skillPathId, "retired-skill-id");
});

test("assessment identity remains stable through account hydration", () => {
  const state = normalizeAccountLearnerState({ settings: { weeklyMinutes: 120, availableDays: ["mon"], changedAt: NOW },
    assessments: [{ assessment: assessment("assessment:stable"), changedAt: NOW }] });
  const storage = memoryStorage();
  applyAccountStateToLocalStorage(storage, state, new Date(NOW));
  assert.equal(readLocalAccountState(storage, new Date(NOW)).assessments[0].assessment.id, "assessment:stable");
});

test("assessment records remain readable before settings arrive", () => {
  const state = normalizeAccountLearnerState({
    assessments: [{ assessment: assessment("assessment:orphan-safe"), changedAt: NOW }],
  });
  assert.equal(state.settings, null);
  assert.equal(state.assessments[0].assessment.id, "assessment:orphan-safe");
});

function assessment(id: string) {
  return { id, courseSlug: "higher-maths", type: "class_test" as const, title: "Calculus test",
    date: { precision: "exact" as const, date: "2026-09-10" }, scope: { kind: "skills" as const, skillPathIds: ["chain-rule"] }, source: "learner" as const };
}
function planItem(itemKey: string, state: "completed" | "skipped" | null, changedAt: string): SyncedPlanItemState {
  return { itemKey, weekStart: "2026-08-17", plannerVersion: 1, state, movedDate: null, excluded: false, unscheduled: false, changedAt };
}
function withoutTime(item: SyncedPlanItemState) { const { changedAt: _, ...rest } = item; return rest; }
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return { length: 0, clear: () => values.clear(), getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null, removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); } };
}
