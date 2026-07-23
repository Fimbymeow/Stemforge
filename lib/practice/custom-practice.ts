import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { discoverEligiblePracticeQuestions } from "@/lib/practice/practice-eligibility";
import { PRACTICE_SESSION_SCHEMA_VERSION, type PracticeSession } from "@/lib/practice/practice-types";

export type CustomPracticeResult = {
  session: PracticeSession | null;
  removedCount: number;
  validQuestionIds: string[];
};

export function createCustomPracticeSession(
  selectedQuestionIds: readonly string[],
  options: { source?: CanonicalContentSource; now?: Date } = {},
): CustomPracticeResult {
  const source = options.source ?? canonicalContent;
  const now = options.now ?? new Date();
  const uniqueIds = [...new Set(selectedQuestionIds)];
  const selected = new Set(uniqueIds);
  const eligible = discoverEligiblePracticeQuestions(source).eligible.filter((item) => selected.has(item.question.id));
  const removedCount = uniqueIds.length - eligible.length;
  if (!eligible.length) return { session: null, removedCount, validQuestionIds: [] };
  const includedPathIds = [...new Set(eligible.map((item) => item.reference.pathId))];
  const shortageReason = removedCount
    ? `${removedCount} unavailable question${removedCount === 1 ? " was" : "s were"} removed. Practice started with ${eligible.length} question${eligible.length === 1 ? "" : "s"}.`
    : null;
  const stamp = now.toISOString();
  const session: PracticeSession = {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    sessionId: `practice_custom_${hash(`${stamp}:${eligible.map((item) => item.question.id).join("|")}`).toString(36)}`,
    mode: "targeted",
    courseId: eligible[0].reference.courseId,
    selectedPathIds: includedPathIds,
    questionReferences: eligible.map((item) => item.reference),
    currentQuestionIndex: 0,
    startedAt: stamp,
    updatedAt: stamp,
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed: "question-bank:custom",
      requestedCount: uniqueIds.length,
      availableCount: eligible.length,
      selectedCount: eligible.length,
      fullySatisfied: removedCount === 0,
      shortageReason,
      excludedByReason: removedCount ? { unavailable_selection: removedCount } : {},
      includedPathIds,
      createdAt: stamp,
    },
  };
  return { session, removedCount, validQuestionIds: eligible.map((item) => item.question.id) };
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
