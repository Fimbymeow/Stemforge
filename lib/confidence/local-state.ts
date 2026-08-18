import { CONFIDENCE_LEVELS, isConfidenceLevel } from "@/lib/confidence/types";
import type { ConfidenceLevel, ConfidenceOverrideRecord, LearnerConfidence } from "@/lib/confidence/types";

export const CONFIDENCE_LOCAL_STATE_VERSION = 1 as const;
export const CONFIDENCE_LOCAL_STATE_STORAGE_KEY = "orthic.confidence.v1";
export const CONFIDENCE_LOCAL_STATE_UPDATED_EVENT = "orthic:confidence-updated";

const SKILL_ID_LIMIT = 240;
const RECORD_LIMIT = 200;

/**
 * Deliberately its own small persistence boundary, separate from Study Plan local state and from
 * the full server-syncable `ProgressRepository` — confidence is a lightweight, browser-local
 * learner self-report in V1, not progress evidence. Canonical skill IDs are the only identity
 * (no history log; Part C explicitly doesn't need one), and the shape is flat enough to grow a
 * server-sync boundary later without reshaping.
 */
export type ConfidenceLocalState = {
  version: typeof CONFIDENCE_LOCAL_STATE_VERSION;
  ratings: Record<string, LearnerConfidence>;
  overrides: Record<string, ConfidenceOverrideRecord>;
};

export function emptyConfidenceLocalState(): ConfidenceLocalState {
  return { version: CONFIDENCE_LOCAL_STATE_VERSION, ratings: {}, overrides: {} };
}

export function parseStoredConfidenceLocalState(raw: string | null): ConfidenceLocalState {
  if (!raw) return emptyConfidenceLocalState();
  try {
    const parsed = JSON.parse(raw) as { version?: unknown };
    if (parsed.version !== CONFIDENCE_LOCAL_STATE_VERSION) return emptyConfidenceLocalState();
    return normalizeConfidenceLocalState(parsed);
  } catch {
    return emptyConfidenceLocalState();
  }
}

export function normalizeConfidenceLocalState(value: unknown): ConfidenceLocalState {
  if (!value || typeof value !== "object") return emptyConfidenceLocalState();
  const candidate = value as { ratings?: unknown; overrides?: unknown };
  return {
    version: CONFIDENCE_LOCAL_STATE_VERSION,
    ratings: normalizeRatings(candidate.ratings),
    overrides: normalizeOverrides(candidate.overrides),
  };
}

export function readConfidenceLocalState(storage: Pick<Storage, "getItem">): ConfidenceLocalState {
  try {
    return parseStoredConfidenceLocalState(storage.getItem(CONFIDENCE_LOCAL_STATE_STORAGE_KEY));
  } catch {
    return emptyConfidenceLocalState();
  }
}

export function writeConfidenceLocalState(storage: Pick<Storage, "setItem">, value: ConfidenceLocalState): boolean {
  try {
    storage.setItem(CONFIDENCE_LOCAL_STATE_STORAGE_KEY, JSON.stringify(normalizeConfidenceLocalState(value)));
    return true;
  } catch {
    return false;
  }
}

export function setLearnerConfidence(
  state: ConfidenceLocalState,
  skillPathId: string,
  level: ConfidenceLevel,
  setAt: string,
): ConfidenceLocalState {
  const ratings = { ...state.ratings, [skillPathId]: { skillPathId, level, setAt } };
  return normalizeConfidenceLocalState({ ...state, ratings });
}

export function clearLearnerConfidence(state: ConfidenceLocalState, skillPathId: string): ConfidenceLocalState {
  const ratings = { ...state.ratings };
  delete ratings[skillPathId];
  // Clearing a rating also clears any override acknowledgement — there's no disagreement left to suppress.
  const overrides = { ...state.overrides };
  delete overrides[skillPathId];
  return normalizeConfidenceLocalState({ ...state, ratings, overrides });
}

export function recordConfidenceOverride(state: ConfidenceLocalState, record: ConfidenceOverrideRecord): ConfidenceLocalState {
  const overrides = { ...state.overrides, [record.skillPathId]: record };
  return normalizeConfidenceLocalState({ ...state, overrides });
}

function normalizeRatings(value: unknown): Record<string, LearnerConfidence> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([skillPathId]) => validId(skillPathId))
    .map(([skillPathId, entry]) => [skillPathId, normalizeRating(skillPathId, entry)] as const)
    .filter((entry): entry is [string, LearnerConfidence] => entry[1] !== null)
    .slice(0, RECORD_LIMIT);
  return Object.fromEntries(entries);
}

function normalizeRating(skillPathId: string, value: unknown): LearnerConfidence | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { level?: unknown; setAt?: unknown };
  if (!isConfidenceLevel(candidate.level)) return null;
  const setAt = typeof candidate.setAt === "string" && Number.isFinite(Date.parse(candidate.setAt)) ? candidate.setAt : null;
  if (!setAt) return null;
  return { skillPathId, level: candidate.level, setAt };
}

function normalizeOverrides(value: unknown): Record<string, ConfidenceOverrideRecord> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([skillPathId]) => validId(skillPathId))
    .map(([skillPathId, entry]) => [skillPathId, normalizeOverride(skillPathId, entry)] as const)
    .filter((entry): entry is [string, ConfidenceOverrideRecord] => entry[1] !== null)
    .slice(0, RECORD_LIMIT);
  return Object.fromEntries(entries);
}

function normalizeOverride(skillPathId: string, value: unknown): ConfidenceOverrideRecord | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { learnerLevel?: unknown; suggestedLevel?: unknown; evidenceFingerprint?: unknown; decidedAt?: unknown };
  if (!isConfidenceLevel(candidate.learnerLevel) || !isConfidenceLevel(candidate.suggestedLevel)) return null;
  if (typeof candidate.evidenceFingerprint !== "string" || !candidate.evidenceFingerprint) return null;
  const decidedAt = typeof candidate.decidedAt === "string" && Number.isFinite(Date.parse(candidate.decidedAt)) ? candidate.decidedAt : null;
  if (!decidedAt) return null;
  return {
    skillPathId,
    learnerLevel: candidate.learnerLevel,
    suggestedLevel: candidate.suggestedLevel,
    evidenceFingerprint: candidate.evidenceFingerprint,
    decidedAt,
  };
}

function validId(value: string): boolean {
  return value.length > 0 && value.length <= SKILL_ID_LIMIT;
}

/** Re-exported for callers that want the level list without importing the types module directly. */
export { CONFIDENCE_LEVELS };
