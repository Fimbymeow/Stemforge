import type { ProgressEvidence, VersionEvidence } from "@/lib/progress/types";

export function wasHintViewedBeforeSubmission(
  evidence: ProgressEvidence,
  questionId: string,
  versionEvidence: VersionEvidence,
  submittedAt: string,
  submissionSequence: number,
) {
  const submittedTime = Date.parse(submittedAt);
  return evidence.supportEvents.some((event) =>
    event.questionId === questionId &&
    event.type === "hint_viewed" &&
    event.versionEvidence.kind === versionEvidence.kind &&
    event.versionEvidence.questionVersion === versionEvidence.questionVersion &&
    (Date.parse(event.occurredAt) < submittedTime ||
      (Date.parse(event.occurredAt) === submittedTime && event.sequence < submissionSequence)),
  );
}
