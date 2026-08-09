import { createDefaultProgressPayload, isCurrentProgressPayload, migrateProgressPayload } from "@/lib/progress/payload";
import type { ProgressLoadResult, ProgressPayload } from "@/lib/progress/types";

export const PROGRESS_STORAGE_KEY = "stemforge.localProgress.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface ProgressStorage {
  load(): ProgressLoadResult;
  save(payload: ProgressPayload): boolean;
  clear(): boolean;
}

export class LocalStorageProgressStorage implements ProgressStorage {
  constructor(private readonly storage: StorageLike | null) {}

  load(): ProgressLoadResult {
    if (!this.storage) return unavailable("unavailable");

    let raw: string | null;
    try {
      raw = this.storage.getItem(PROGRESS_STORAGE_KEY);
    } catch {
      return unavailable("unavailable");
    }
    if (raw === null) return unavailable("empty");

    try {
      return migrateProgressPayload(JSON.parse(raw));
    } catch {
      return unavailable("malformed-json");
    }
  }

  save(payload: ProgressPayload) {
    if (!this.storage || !isCurrentProgressPayload(payload)) return false;
    try {
      this.storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    if (!this.storage) return false;
    try {
      this.storage.removeItem(PROGRESS_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
}

function unavailable(status: ProgressLoadResult["status"]): ProgressLoadResult {
  return { payload: createDefaultProgressPayload(), status, droppedAttempts: 0, droppedEvents: 0,
    droppedSelfAssessments: 0, droppedSnapshots: 0, droppedReviewEvents: 0, droppedFlashcardReviews: 0 };
}

export function createBrowserProgressStorage(): ProgressStorage {
  if (typeof window === "undefined") return new LocalStorageProgressStorage(null);
  try {
    return new LocalStorageProgressStorage(window.localStorage);
  } catch {
    return new LocalStorageProgressStorage(null);
  }
}
