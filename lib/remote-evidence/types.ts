import type { AchievementSnapshot, GuidedSelfAssessmentEvent, ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import type { ReviewEvent } from "@/lib/review/types";
import type { FlashcardReviewEvent } from "@/lib/flashcards/types";

export type RemoteEvidenceKind = "attempt" | "support_event" | "guided_self_assessment" | "achievement_snapshot" | "review_event" | "flashcard_review";

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

export type RemoteEvidencePageRecord = AcceptedRemoteEvidence & {
  disposition: "accepted" | "conflict_retained";
  evidence: QuestionAttempt | QuestionSupportEvent | GuidedSelfAssessmentEvent | AchievementSnapshot | ReviewEvent | FlashcardReviewEvent;
};

export type RemoteEvidencePage = {
  records: RemoteEvidencePageRecord[];
};
