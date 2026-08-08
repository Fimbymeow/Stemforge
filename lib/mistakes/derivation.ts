import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { contentResolver, createContentResolver } from "@/lib/content-resolver";
import { isGradedCorrectAttempt, isGradedIncorrectAttempt } from "@/lib/progress/attempt-outcomes";
import { isIndependentOrdinaryAttempt } from "@/lib/progress/independent-attempt";
import type { ProgressEvidence, QuestionAttempt } from "@/lib/progress/types";
import { deriveSkillReviewState } from "@/lib/review/derivation";
import { compareCoordinate, compareEvidence } from "@/lib/review/outcomes";
import { REVIEW_SESSION_ID_PREFIX, type ReviewEvent } from "@/lib/review/types";

export const HIGHER_MATHS_MISTAKES_HREF = "/subjects/higher-maths/mistakes";

export type MistakeResolutionSource = "ordinary_independent_success" | "review_independent_success";
export type MistakeState = "open" | "resolved" | "historical";

export type MistakeItem = {
  groupId: string;
  questionId: string;
  questionVersion: number;
  questionTitle: string;
  questionNumber: number;
  skillPathId: string;
  skillName: string;
  skillHref: string;
  courseId: string;
  stageId: string;
  stageName: string;
  incorrectAttemptCount: number;
  firstIncorrectAt: string;
  latestIncorrectAt: string;
  latestOccurrence: "incorrect" | "resolution";
  state: MistakeState;
  resolvedAt: string | null;
  resolutionSource: MistakeResolutionSource | null;
  wasReopened: boolean;
  isCurrentVersion: boolean;
  representedInReviewRecovery: boolean;
  retryHref: string;
  notesHref: string | null;
  practiceHref: string;
};

export type MistakeSkillGroup = {
  skillPathId: string;
  skillName: string;
  skillHref: string;
  officialRequirementCount: number;
  items: MistakeItem[];
};

export type MistakeLogModel = {
  subjectSlug: string;
  href: string;
  openCount: number;
  resolvedCount: number;
  historicalCount: number;
  openGroups: MistakeSkillGroup[];
  historyGroups: MistakeSkillGroup[];
};

type TimelineEvent = {
  kind: "incorrect" | "ordinary_resolution" | "review_resolution";
  occurredAt: string;
  sequence: number;
  eventId: string;
};

export function deriveMistakeLog(
  evidence: ProgressEvidence,
  subjectSlug = "higher-maths",
  source: CanonicalContentSource = canonicalContent,
): MistakeLogModel {
  const resolver = source === canonicalContent ? contentResolver : createContentResolver(source);
  const contexts = resolver.getAllPathContexts().filter((context) =>
    context.subject.subjectSlug === subjectSlug && context.skillPath.isAvailable);
  const contextByPath = new Map(contexts.map((context) => [context.skillPath.slug, context]));
  const activeVersions = resolver.getQuestionVersions();
  const reviewSourceIds = new Set(evidence.reviewEvents.map((event) => event.source.sourceId));
  const attemptById = new Map(evidence.attempts.map((attempt) => [attempt.eventId, attempt]));
  const reviewRecoveryBySkill = new Map(contexts.map((context) => [
    context.skillPath.slug,
    new Set(deriveSkillReviewState(context.skillPath, evidence).ordinaryRecoveryQuestionIds),
  ]));
  const attemptsByGroup = new Map<string, QuestionAttempt[]>();

  for (const attempt of evidence.attempts) {
    if (!isTrustworthyAttempt(attempt, contextByPath, activeVersions, resolver)) continue;
    const version = attempt.versionEvidence.kind === "known" ? attempt.versionEvidence.questionVersion : null;
    if (version === null) continue;
    const key = groupKey(attempt.questionId, version);
    const grouped = attemptsByGroup.get(key);
    if (grouped) grouped.push(attempt);
    else attemptsByGroup.set(key, [attempt]);
  }

  const items: MistakeItem[] = [];
  for (const attempts of attemptsByGroup.values()) {
    attempts.sort(compareEvidence);
    const incorrect = attempts.filter((attempt) => attempt.isGenuine && isGradedIncorrectAttempt(attempt));
    if (!incorrect.length) continue;
    const first = incorrect[0];
    const version = first.versionEvidence.kind === "known" ? first.versionEvidence.questionVersion : null;
    if (version === null) continue;
    const questionContext = resolver.getQuestionContext(first.questionId);
    const pathContext = contextByPath.get(first.skillPathId);
    if (!questionContext || !pathContext) continue;
    const currentVersion = activeVersions[first.questionId];
    const ordinaryAttempts = attempts.filter((attempt) =>
      !attempt.practiceSessionId ||
      (!reviewSourceIds.has(attempt.practiceSessionId) && !attempt.practiceSessionId.startsWith(REVIEW_SESSION_ID_PREFIX)));
    const timeline: TimelineEvent[] = [
      ...incorrect.map((attempt) => timelineAttempt("incorrect", attempt)),
      ...ordinaryAttempts
        .filter((attempt) => attempt.isGenuine && isGradedCorrectAttempt(attempt) &&
          isIndependentOrdinaryAttempt(attempt, evidence, ordinaryAttempts))
        .map((attempt) => timelineAttempt("ordinary_resolution", attempt)),
      ...evidence.reviewEvents
        .filter((event) => reviewResolvesGroup(event, first, version, attemptById))
        .map((event) => ({
          kind: "review_resolution" as const,
          occurredAt: event.occurredAt,
          sequence: event.sequence,
          eventId: event.eventId,
        })),
    ].sort(compareTimeline);

    let latestOccurrence: MistakeItem["latestOccurrence"] = "incorrect";
    let resolvedAt: string | null = null;
    let resolutionSource: MistakeResolutionSource | null = null;
    let hasOpenMistake = false;
    let hasResolvedMistake = false;
    let wasReopened = false;
    for (const event of timeline) {
      if (event.kind === "incorrect") {
        if (hasResolvedMistake) wasReopened = true;
        hasOpenMistake = true;
        latestOccurrence = "incorrect";
        resolvedAt = null;
        resolutionSource = null;
      } else if (hasOpenMistake) {
        hasOpenMistake = false;
        latestOccurrence = "resolution";
        resolvedAt = event.occurredAt;
        resolutionSource = event.kind === "ordinary_resolution"
          ? "ordinary_independent_success"
          : "review_independent_success";
        hasResolvedMistake = true;
      }
    }

    const isCurrentVersion = version === currentVersion;
    const state: MistakeState = !isCurrentVersion
      ? "historical"
      : latestOccurrence === "resolution"
        ? "resolved"
        : "open";
    const stage = questionContext.stage;
    items.push({
      groupId: groupKey(first.questionId, version),
      questionId: first.questionId,
      questionVersion: version,
      questionTitle: questionContext.question.title,
      questionNumber: questionContext.questionIndexInPath + 1,
      skillPathId: pathContext.skillPath.slug,
      skillName: pathContext.skillPath.name,
      skillHref: pathContext.skillPath.href,
      courseId: pathContext.courseArea.slug,
      stageId: stage.id,
      stageName: stage.name,
      incorrectAttemptCount: incorrect.length,
      firstIncorrectAt: incorrect[0].attemptedAt,
      latestIncorrectAt: incorrect.at(-1)!.attemptedAt,
      latestOccurrence,
      state,
      resolvedAt,
      resolutionSource,
      wasReopened,
      isCurrentVersion,
      representedInReviewRecovery: state === "open" &&
        Boolean(reviewRecoveryBySkill.get(first.skillPathId)?.has(first.questionId)),
      retryHref: `/question/${encodeURIComponent(first.questionId)}`,
      notesHref: pathContext.skillPath.lessonDocument || pathContext.skillPath.notes?.length
        ? `/subjects/${subjectSlug}/revision-notes?path=${encodeURIComponent(first.skillPathId)}`
        : null,
      practiceHref: `/practice?path=${encodeURIComponent(first.skillPathId)}`,
    });
  }

  const open = items.filter((item) => item.state === "open").sort(compareItems);
  const history = items.filter((item) => item.state !== "open").sort(compareItems);
  return {
    subjectSlug,
    href: subjectSlug === "higher-maths" ? HIGHER_MATHS_MISTAKES_HREF : `/subjects/${subjectSlug}/mistakes`,
    openCount: open.length,
    resolvedCount: history.filter((item) => item.state === "resolved" || item.resolvedAt).length,
    historicalCount: history.filter((item) => item.state === "historical").length,
    openGroups: groupBySkill(open),
    historyGroups: groupBySkill(history),
  };
}

function isTrustworthyAttempt(
  attempt: QuestionAttempt,
  contextByPath: ReadonlyMap<string, ReturnType<typeof contentResolver.getAllPathContexts>[number]>,
  activeVersions: Readonly<Record<string, number>>,
  resolver: ReturnType<typeof createContentResolver>,
) {
  if (!attempt.isGenuine || attempt.versionEvidence.kind !== "known") return false;
  const context = resolver.getQuestionContext(attempt.questionId);
  const path = contextByPath.get(attempt.skillPathId);
  return Boolean(
    context && path &&
    context.skillPath.slug === attempt.skillPathId &&
    context.stage.id === attempt.stageId &&
    attempt.versionEvidence.questionVersion <= (activeVersions[attempt.questionId] ?? 0),
  );
}

function reviewResolvesGroup(
  event: ReviewEvent,
  mistake: QuestionAttempt,
  questionVersion: number,
  attemptById: ReadonlyMap<string, QuestionAttempt>,
) {
  if (event.outcome !== "independent_success" ||
      event.target.targetType !== "skill" ||
      event.target.targetId !== mistake.skillPathId ||
      !event.questionIds.includes(mistake.questionId)) return false;
  return event.evidenceRefs.some((reference) => {
    if (reference.evidenceKind !== "attempt") return false;
    const linked = attemptById.get(reference.eventId);
    return Boolean(
      linked &&
      linked.questionId === mistake.questionId &&
      linked.skillPathId === mistake.skillPathId &&
      linked.stageId === mistake.stageId &&
      linked.versionEvidence.kind === "known" &&
      linked.versionEvidence.questionVersion === questionVersion &&
      linked.practiceSessionId === event.source.sourceId &&
      linked.isGenuine &&
      isGradedCorrectAttempt(linked),
    );
  });
}

function groupBySkill(items: readonly MistakeItem[]) {
  const bySkill = new Map<string, MistakeItem[]>();
  for (const item of items) {
    const grouped = bySkill.get(item.skillPathId);
    if (grouped) grouped.push(item);
    else bySkill.set(item.skillPathId, [item]);
  }
  return [...bySkill.entries()].map(([skillPathId, grouped]) => ({
    skillPathId,
    skillName: grouped[0].skillName,
    skillHref: grouped[0].skillHref,
    officialRequirementCount: higherMathematicsOfficialSkillMappings.find((item) =>
      item.skillPathId === skillPathId)?.officialSpecificationPointIds.length ?? 0,
    items: grouped,
  })).sort((left, right) => left.skillName.localeCompare(right.skillName));
}

function timelineAttempt(kind: TimelineEvent["kind"], attempt: QuestionAttempt): TimelineEvent {
  return { kind, occurredAt: attempt.attemptedAt, sequence: attempt.sequence, eventId: attempt.eventId };
}

function compareTimeline(left: TimelineEvent, right: TimelineEvent) {
  return compareCoordinate(
    left.occurredAt,
    left.sequence,
    left.eventId,
    right.occurredAt,
    right.sequence,
    right.eventId,
  );
}

function compareItems(left: MistakeItem, right: MistakeItem) {
  const leftAt = left.state === "resolved" && left.resolvedAt ? left.resolvedAt : left.latestIncorrectAt;
  const rightAt = right.state === "resolved" && right.resolvedAt ? right.resolvedAt : right.latestIncorrectAt;
  return Date.parse(rightAt) - Date.parse(leftAt) ||
    left.skillName.localeCompare(right.skillName) ||
    left.questionNumber - right.questionNumber ||
    left.questionVersion - right.questionVersion;
}

function groupKey(questionId: string, questionVersion: number) {
  return `${questionId}:v${questionVersion}`;
}
