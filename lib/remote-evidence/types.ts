import type { ProgressPayload } from "@/lib/progress/types";

export type RemoteEvidenceKind = "attempt" | "support_event" | "achievement_snapshot";

export type RemoteEvidenceRef = {
  kind: RemoteEvidenceKind;
  eventId: string;
};

export type AcceptedRemoteEvidence = RemoteEvidenceRef & {
  receiveCursor: string;
  receivedAt: string;
};

export type RemoteEvidenceConflict = RemoteEvidenceRef & {
  conflictId: string;
  acceptedPayloadHash: string;
  incomingPayloadHash: string;
  receiveCursor: string;
  receivedAt: string;
};

export type RejectedRemoteEvidence = {
  kind?: RemoteEvidenceKind;
  eventId?: string;
  reason: string;
};

export type AppendRemoteEvidenceResult = {
  accepted: AcceptedRemoteEvidence[];
  duplicates: AcceptedRemoteEvidence[];
  conflicts: RemoteEvidenceConflict[];
  rejected: RejectedRemoteEvidence[];
};

export type RemoteEvidenceRead = {
  payload: ProgressPayload;
  records: AcceptedRemoteEvidence[];
  nextCursor: string | null;
};
