import assert from "node:assert/strict";
import test from "node:test";

import { contentResolver } from "@/lib/content-resolver";
import type { ResolvedSkillPath } from "@/lib/content-resolver";
import type { ConfidenceLevel } from "@/lib/confidence/types";
import type { ProgressEvidence, QuestionAttempt } from "@/lib/progress/types";
import { buildStudyPlanCandidates, compareStudyPlanCandidates } from "@/lib/study-plan/candidate-builder";
import { generateStudyPlan } from "@/lib/study-plan/planner";
import type { StudyPlanCandidate, StudyPlanGenerationInput } from "@/lib/study-plan/types";

const BASIC = context("basic-differentiation");
const CHAIN = context("chain-rule");
const NOW = new Date("2026-07-13T09:00:00.000Z");

test("a self-rated Needs work skill with little evidence receives candidate.learnerFlaggedNeedsWork = true", () => {
  const learnerConfidence = new Map<string, ConfidenceLevel>([[CHAIN.skillPath.slug, "needs_work"]]);
  const built = buildStudyPlanCandidates({
    now: NOW,
    courseSlug: "higher-maths",
    evidence: twoInProgressSkillsEvidence(),
    assessments: [],
    learnerConfidence,
  });
  const chainCandidate = built.candidates.find((candidate) => candidate.skillPathId === CHAIN.skillPath.slug);
  assert.ok(chainCandidate);
  assert.equal(chainCandidate.learnerFlaggedNeedsWork, true);
});

test("a skill with no confidence rating gets learnerFlaggedNeedsWork = false", () => {
  const built = buildStudyPlanCandidates({
    now: NOW,
    courseSlug: "higher-maths",
    evidence: twoInProgressSkillsEvidence(),
    assessments: [],
  });
  for (const candidate of built.candidates) assert.equal(candidate.learnerFlaggedNeedsWork, false);
});

test("within the same tier, a self-rated Needs work candidate sorts ahead of an otherwise-equal candidate", () => {
  const flagged = syntheticCandidate({ candidateKey: "a", skillPathId: "a", tier: 3, learnerFlaggedNeedsWork: true });
  const unflagged = syntheticCandidate({ candidateKey: "b", skillPathId: "b", tier: 3, learnerFlaggedNeedsWork: false });
  const sorted = [unflagged, flagged].sort(compareStudyPlanCandidates);
  assert.deepEqual(sorted.map((candidate) => candidate.candidateKey), ["a", "b"]);
});

test("self-rated Needs work never crosses tiers — a Tier 1 (review due) candidate still outranks a flagged Tier 3", () => {
  const reviewDue = syntheticCandidate({ candidateKey: "review", skillPathId: "review-skill", tier: 1, learnerFlaggedNeedsWork: false });
  const flaggedContinue = syntheticCandidate({ candidateKey: "continue", skillPathId: "continue-skill", tier: 3, learnerFlaggedNeedsWork: true });
  const sorted = [flaggedContinue, reviewDue].sort(compareStudyPlanCandidates);
  assert.deepEqual(sorted.map((candidate) => candidate.candidateKey), ["review", "continue"]);
});

test("within Tier 0/1 itself, confidence never reorders overdue-Review candidates — recency still governs", () => {
  const earlierDue = syntheticCandidate({ candidateKey: "earlier", skillPathId: "earlier-skill", tier: 0, dueAt: "2026-07-01T09:00:00.000Z", learnerFlaggedNeedsWork: false });
  const laterDueButFlagged = syntheticCandidate({ candidateKey: "later", skillPathId: "later-skill", tier: 0, dueAt: "2026-07-05T09:00:00.000Z", learnerFlaggedNeedsWork: true });
  const sorted = [laterDueButFlagged, earlierDue].sort(compareStudyPlanCandidates);
  // Tier-0 recency compares dueAt ascending (most overdue first) regardless of the confidence flag.
  assert.deepEqual(sorted.map((candidate) => candidate.candidateKey), ["earlier", "later"]);
});

test("a learner rating a skill Confident does not suppress or deprioritise real overdue-Review evidence for that same skill", () => {
  // Study Plan only ever reads the boolean learnerFlaggedNeedsWork (Needs work only) — a Confident
  // self-rating simply never sets that flag, so it can never soften an overdue Review candidate.
  const learnerConfidence = new Map<string, ConfidenceLevel>([[BASIC.skillPath.slug, "confident"]]);
  const built = buildStudyPlanCandidates({
    now: NOW,
    courseSlug: "higher-maths",
    evidence: workedEvidence(),
    assessments: [],
    learnerConfidence,
  });
  const basicCandidate = built.candidates.find((candidate) => candidate.skillPathId === BASIC.skillPath.slug);
  assert.ok(basicCandidate);
  assert.equal(basicCandidate.reasonCode, "review_due");
  assert.equal(basicCandidate.learnerFlaggedNeedsWork, false);
});

test("no confidence state (learnerConfidence omitted) leaves baseline planner output unchanged", () => {
  const withoutConfidence = generateStudyPlan(workedInput());
  const withEmptyConfidence = generateStudyPlan({ ...workedInput(), learnerConfidence: new Map() });
  assert.deepEqual(withoutConfidence.items.map((item) => item.skillPathId), withEmptyConfidence.items.map((item) => item.skillPathId));
  assert.deepEqual(withoutConfidence, withEmptyConfidence);
});

function syntheticCandidate(overrides: Partial<StudyPlanCandidate> & Pick<StudyPlanCandidate, "candidateKey" | "skillPathId" | "tier">): StudyPlanCandidate {
  return {
    skillName: overrides.skillPathId,
    actionType: "continue_stage",
    href: `/question/synthetic-${overrides.skillPathId}`,
    reasonCode: "continue",
    stageId: null,
    stageName: null,
    suggestedMinutes: 20,
    dueAt: null,
    latestActivityAt: null,
    latestMistakeAt: null,
    examPractice: false,
    examQualifier: null,
    assessmentQualifier: null,
    learnerFlaggedNeedsWork: false,
    ...overrides,
  };
}

function workedInput(): StudyPlanGenerationInput {
  return {
    now: NOW,
    evidence: workedEvidence(),
    preferences: {
      courseSlug: "higher-maths",
      weeklyMinutes: 180,
      availableDays: ["mon", "wed", "sat"],
      assessments: [],
    },
  };
}

function workedEvidence(): ProgressEvidence {
  // Mirrors tests/study-plan.test.ts's workedEvidence() exactly, which is already established to
  // produce a Basic Differentiation Review-due candidate (see "worked 180-minute fixture..." there).
  let sequence = 0;
  const basic = completedPathEvidence(BASIC, "2026-07-01T09:00:00.000Z", () => ++sequence);
  const wrongQuestion = BASIC.skillPath.learningStages![0].questionIds[0];
  const wrong = attemptFor(wrongQuestion, ++sequence, false, "2026-07-12T08:00:00.000Z");
  const chainFoundations = CHAIN.skillPath.learningStages![0].questionIds
    .map((questionId) => attemptFor(questionId, ++sequence, true, "2026-07-10T08:00:00.000Z"));
  const firstApplication = CHAIN.skillPath.learningStages![1].questionIds[0];
  return evidence([
    ...basic.attempts,
    wrong,
    ...chainFoundations,
    attemptFor(firstApplication, ++sequence, true, "2026-07-11T08:00:00.000Z"),
  ]);
}

function twoInProgressSkillsEvidence(): ProgressEvidence {
  let sequence = 0;
  const basicFirst = BASIC.skillPath.learningStages![0].questionIds[0];
  const chainFoundations = CHAIN.skillPath.learningStages![0].questionIds
    .map((questionId) => attemptFor(questionId, ++sequence, true, "2026-07-09T08:00:00.000Z"));
  return evidence([...chainFoundations, attemptFor(basicFirst, ++sequence, true, "2026-07-12T08:00:00.000Z")]);
}

function completedPathEvidence(path: ResolvedSkillPath, at: string, nextSequence: () => number): ProgressEvidence {
  return evidence(path.skillPath.learningStages!.flatMap((stage) =>
    stage.questionIds.map((questionId) => attemptFor(questionId, nextSequence(), true, at))));
}

function attemptFor(questionId: string, sequence: number, isCorrect: boolean, attemptedAt: string): QuestionAttempt {
  const question = contentResolver.getQuestionContext(questionId)!;
  return {
    eventId: `study_plan_confidence_attempt_${sequence}_${isCorrect ? "right" : "wrong"}`,
    questionId,
    skillPathId: question.skillPath.slug,
    stageId: question.stage.id,
    isCorrect,
    answer: isCorrect ? question.question.correctAnswer : "incorrect",
    attemptedAt: offsetSeconds(attemptedAt, sequence),
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: question.question.questionVersion },
    outcomeKind: "graded",
  };
}

function evidence(attempts: QuestionAttempt[]): ProgressEvidence {
  return { attempts, supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] };
}

function offsetSeconds(value: string, seconds: number): string {
  return new Date(Date.parse(value) + seconds * 1000).toISOString();
}

function context(pathId: string): ResolvedSkillPath {
  const result = contentResolver.getPathContext(pathId);
  assert.ok(result);
  return result;
}
