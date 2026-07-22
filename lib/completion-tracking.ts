import type { ProgressStatus } from "@/lib/local-progress";

// Deliberately separate from PROGRESS_STORAGE_KEY ("stemforge.localProgress.v1") in
// lib/progress/storage.ts. This store only decides whether an acknowledgement moment
// has already been shown. Completion, mastery, review and progression remain derived
// exclusively from the protected progress evidence.
export const CELEBRATION_STORAGE_KEY = "stemforge.pathCelebration.v1";
// Separate key/store for stage-level one-time acknowledgement, reusing the exact same
// versioned-payload/repair/migration logic as path celebration via a distinct storage key.
// Entries are keyed by a composite `${skillPathId}:${stageId}` id since stage ids are not
// globally unique across paths.
export const STAGE_CELEBRATION_STORAGE_KEY = "stemforge.stageCelebration.v1";
export const CURRENT_CELEBRATION_VERSION = 1 as const;

export type AcknowledgedPathStatus = "completed" | "secure" | "mastered";

export type PathCelebrationEntry = {
  celebratedAt: string;
  lastAcknowledgedStatus: AcknowledgedPathStatus;
};

export type CelebrationState = Record<string, PathCelebrationEntry>;

export type CelebrationPayload = {
  version: typeof CURRENT_CELEBRATION_VERSION;
  data: { paths: CelebrationState };
};

export type CelebrationLoadStatus =
  | "current"
  | "current-repaired"
  | "empty"
  | "invalid-structure"
  | "malformed-json"
  | "migrated-legacy"
  | "unavailable"
  | "unsupported-version";

export type CelebrationLoadResult = {
  payload: CelebrationPayload;
  status: CelebrationLoadStatus;
};

export type CelebrationMutationResult =
  | "recorded"
  | "updated"
  | "unchanged"
  | "unavailable"
  | "unsupported-version"
  | "write-failed";

export type CelebrationStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STATUS_RANK: Record<AcknowledgedPathStatus, number> = {
  completed: 1,
  secure: 2,
  mastered: 3,
};

function createDefaultPayload(): CelebrationPayload {
  return { version: CURRENT_CELEBRATION_VERSION, data: { paths: {} } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAcknowledgedStatus(value: unknown): value is AcknowledgedPathStatus {
  return value === "completed" || value === "secure" || value === "mastered";
}

function isPathCelebrationEntry(value: unknown): value is PathCelebrationEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.celebratedAt === "string" &&
    !Number.isNaN(Date.parse(value.celebratedAt)) &&
    isAcknowledgedStatus(value.lastAcknowledgedStatus)
  );
}

function repairPaths(value: unknown): { paths: CelebrationState; dropped: number } | null {
  if (!isRecord(value)) return null;
  const paths: CelebrationState = {};
  let dropped = 0;
  for (const [pathId, entry] of Object.entries(value)) {
    if (pathId.trim() && isPathCelebrationEntry(entry)) paths[pathId] = { ...entry };
    else dropped += 1;
  }
  return { paths, dropped };
}

function parsePayload(value: unknown): CelebrationLoadResult {
  if (!isRecord(value)) return { payload: createDefaultPayload(), status: "invalid-structure" };

  if ("version" in value) {
    if (value.version !== CURRENT_CELEBRATION_VERSION) {
      return { payload: createDefaultPayload(), status: "unsupported-version" };
    }
    if (!isRecord(value.data)) return { payload: createDefaultPayload(), status: "invalid-structure" };
    const repaired = repairPaths(value.data.paths);
    if (!repaired) return { payload: createDefaultPayload(), status: "invalid-structure" };
    return {
      payload: { version: CURRENT_CELEBRATION_VERSION, data: { paths: repaired.paths } },
      status: repaired.dropped ? "current-repaired" : "current",
    };
  }

  // Claude's original release stored the path map directly. It remains readable and
  // migrates to the internal wrapper on the next acknowledgement mutation.
  const repaired = repairPaths(value);
  if (!repaired) return { payload: createDefaultPayload(), status: "invalid-structure" };
  return {
    payload: { version: CURRENT_CELEBRATION_VERSION, data: { paths: repaired.paths } },
    status: "migrated-legacy",
  };
}

export function isAcknowledgedStatusUpgrade(
  previous: ProgressStatus,
  current: ProgressStatus,
): current is AcknowledgedPathStatus {
  if (!isAcknowledgedStatus(previous) || !isAcknowledgedStatus(current)) return false;
  return STATUS_RANK[current] > STATUS_RANK[previous];
}

export class LocalStorageCelebrationStorage {
  constructor(
    private readonly storage: CelebrationStorageLike | null,
    private readonly storageKey: string = CELEBRATION_STORAGE_KEY,
  ) {}

  load(): CelebrationLoadResult {
    if (!this.storage) return { payload: createDefaultPayload(), status: "unavailable" };
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.storageKey);
    } catch {
      return { payload: createDefaultPayload(), status: "unavailable" };
    }
    if (raw === null) return { payload: createDefaultPayload(), status: "empty" };
    try {
      return parsePayload(JSON.parse(raw));
    } catch {
      return { payload: createDefaultPayload(), status: "malformed-json" };
    }
  }

  getPath(skillPathId: string) {
    return this.load().payload.data.paths[skillPathId];
  }

  recordCompletion(skillPathId: string, status: ProgressStatus): CelebrationMutationResult {
    if (!skillPathId.trim() || !isAcknowledgedStatus(status)) return "unchanged";
    const loaded = this.load();
    if (loaded.status === "unsupported-version") return "unsupported-version";
    if (loaded.status === "unavailable") return "unavailable";
    if (loaded.payload.data.paths[skillPathId]) return "unchanged";

    const payload: CelebrationPayload = {
      ...loaded.payload,
      data: {
        paths: {
          ...loaded.payload.data.paths,
          [skillPathId]: {
            celebratedAt: new Date().toISOString(),
            lastAcknowledgedStatus: status,
          },
        },
      },
    };
    return this.save(payload) ? "recorded" : "write-failed";
  }

  acknowledgeStatus(skillPathId: string, status: ProgressStatus): CelebrationMutationResult {
    const loaded = this.load();
    if (loaded.status === "unsupported-version") return "unsupported-version";
    if (loaded.status === "unavailable") return "unavailable";
    const existing = loaded.payload.data.paths[skillPathId];
    if (!existing || !isAcknowledgedStatusUpgrade(existing.lastAcknowledgedStatus, status)) return "unchanged";
    const payload: CelebrationPayload = {
      ...loaded.payload,
      data: {
        paths: {
          ...loaded.payload.data.paths,
          [skillPathId]: { ...existing, lastAcknowledgedStatus: status },
        },
      },
    };
    return this.save(payload) ? "updated" : "write-failed";
  }

  clearPath(skillPathId: string) {
    const loaded = this.load();
    if (loaded.status === "unsupported-version" || loaded.status === "unavailable") return false;
    if (!(skillPathId in loaded.payload.data.paths)) return true;
    const paths = { ...loaded.payload.data.paths };
    delete paths[skillPathId];
    return this.save({ ...loaded.payload, data: { paths } });
  }

  clearAll() {
    if (!this.storage) return false;
    const loaded = this.load();
    if (loaded.status === "unsupported-version") return false;
    try {
      this.storage.removeItem(this.storageKey);
      return true;
    } catch {
      return false;
    }
  }

  private save(payload: CelebrationPayload) {
    if (!this.storage) return false;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
}

export function createBrowserCelebrationStorage(storageKey: string = CELEBRATION_STORAGE_KEY) {
  if (typeof window === "undefined") return new LocalStorageCelebrationStorage(null, storageKey);
  try {
    return new LocalStorageCelebrationStorage(window.localStorage, storageKey);
  } catch {
    return new LocalStorageCelebrationStorage(null, storageKey);
  }
}

export function getPathCelebration(skillPathId: string) {
  return createBrowserCelebrationStorage().getPath(skillPathId);
}

/** Claims the one-time crossing from incomplete to complete without changing progress truth. */
export function recordPathCelebrated(skillPathId: string, status: ProgressStatus) {
  return createBrowserCelebrationStorage().recordCompletion(skillPathId, status);
}

/** Records only genuine upward mastery-tier acknowledgements. */
export function acknowledgeStatus(skillPathId: string, status: ProgressStatus) {
  return createBrowserCelebrationStorage().acknowledgeStatus(skillPathId, status);
}

export function clearPathCelebration(skillPathId: string) {
  return createBrowserCelebrationStorage().clearPath(skillPathId);
}

// Stage-level equivalents. Composite id keeps stage entries distinct across paths while
// reusing the identical versioned-payload/repair/one-time-claim/upgrade-rank logic above.
function stageEntryId(skillPathId: string, stageId: string) {
  return `${skillPathId}:${stageId}`;
}

function createBrowserStageCelebrationStorage() {
  return createBrowserCelebrationStorage(STAGE_CELEBRATION_STORAGE_KEY);
}

export function getStageCelebration(skillPathId: string, stageId: string) {
  return createBrowserStageCelebrationStorage().getPath(stageEntryId(skillPathId, stageId));
}

/** Claims the one-time crossing from incomplete to complete for a single stage. */
export function recordStageCelebrated(skillPathId: string, stageId: string, status: ProgressStatus) {
  return createBrowserStageCelebrationStorage().recordCompletion(stageEntryId(skillPathId, stageId), status);
}

/** Records only genuine upward mastery-tier acknowledgements for a single stage. */
export function acknowledgeStageStatus(skillPathId: string, stageId: string, status: ProgressStatus) {
  return createBrowserStageCelebrationStorage().acknowledgeStatus(stageEntryId(skillPathId, stageId), status);
}

export function clearStageCelebration(skillPathId: string, stageId: string) {
  return createBrowserStageCelebrationStorage().clearPath(stageEntryId(skillPathId, stageId));
}
