export const ACCOUNT_DATA_PROTOCOL_VERSION = 1 as const;
export const ERASURE_CONFIRMATION_TEXT = "DELETE MY LEARNING DATA";
export const ERASURE_CANCELLATION_MINUTES = 10;

export type AccountDataStatus = "active" | "erasure_pending" | "processing" | "closed";
export type AccountDataState = {
  ownerId: string;
  generation: string;
  status: AccountDataStatus;
  stateVersion: string;
  updatedAt: string;
  lastErasedAt: string | null;
};

export type ErasureRequestStatus =
  | "awaiting_reauthentication"
  | "awaiting_confirmation"
  | "scheduled"
  | "processing"
  | "completed"
  | "failed_retryable"
  | "cancelled";

export type SafeErasureRequest = {
  requestId: string;
  status: ErasureRequestStatus;
  generationBefore: string;
  generationAfter: string | null;
  createdAt: string;
  updatedAt: string;
  cancellationDeadline: string | null;
  irreversibleAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  deletedCounts: { attempts: number; supportEvents: number; achievementSnapshots: number; conflicts: number } | null;
  failureCode: string | null;
};

export type AccountDataBlockCode = "account_generation_mismatch" | "erasure_in_progress" | "account_closed" | "generation_required";

export class AccountDataAccessError extends Error {
  constructor(readonly code: AccountDataBlockCode) {
    super(code);
  }
}
