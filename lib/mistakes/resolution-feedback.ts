import { deriveMistakeLog } from "@/lib/mistakes/derivation";
import type { ProgressEvidence } from "@/lib/progress/types";

/** True only when this evidence transition closes the exact current-version group. */
export function didCurrentSubmissionResolveMistake(input: {
  before: ProgressEvidence;
  after: ProgressEvidence;
  questionId: string;
  questionVersion: number;
  skillPathId: string;
  subjectSlug?: string;
}) {
  const groupId = `${input.questionId}:v${input.questionVersion}`;
  const before = findItem(input.before, input.subjectSlug, input.skillPathId, groupId);
  const after = findItem(input.after, input.subjectSlug, input.skillPathId, groupId);
  return before?.state === "open" && before.isCurrentVersion &&
    after?.state === "resolved" && after.isCurrentVersion &&
    after.resolutionSource === "ordinary_independent_success";
}

function findItem(evidence: ProgressEvidence, subjectSlug: string | undefined, skillPathId: string, groupId: string) {
  const model = deriveMistakeLog(evidence, subjectSlug ?? "higher-maths");
  return [...model.openGroups, ...model.historyGroups]
    .find((group) => group.skillPathId === skillPathId)?.items
    .find((item) => item.groupId === groupId);
}
