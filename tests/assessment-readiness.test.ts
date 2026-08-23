import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent, type CanonicalContentSource } from "../data/canonical-content";
import type { LearningStage, Question, SkillPath } from "../data/types";
import { contentResolver } from "../lib/content-resolver";
import { deriveMistakeLog } from "../lib/mistakes/derivation";
import { calculateSkillPathProgress } from "../lib/progress/calculations";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";
import { deriveCourseAssessmentReadiness } from "../lib/readiness/derivation";
import { presentAssessmentTiming } from "../lib/readiness/presenter";
import { deriveSkillReviewState } from "../lib/review/derivation";
import type { ReviewEvent } from "../lib/review/types";
import { topicScopeId } from "../lib/study-plan/assessments";
import type { Assessment } from "../lib/study-plan/types";
import { attempt, evidence } from "./progress-fixtures";

const NOW = new Date("2026-07-13T12:00:00.000Z");

test("supported skills distinguish Limited evidence, Developing, completed-below-Secure and Secure", () => {
  assert.equal(skill(summaryFor(evidence()), "basic-differentiation").state, "limited_evidence");

  const questions = questionsFor(canonicalContent, "basic-differentiation");
  assert.equal(skill(summaryFor(evidence([attemptFor(questions[0], true, "2026-07-13T10:00:00.000Z", 1)])), "basic-differentiation").state, "developing");

  const supportedCompletion = evidence(questions.map((question, index) => attemptFor(question, true, "2026-07-13T10:00:00.000Z", index + 1, true)));
  assert.equal(skill(summaryFor(supportedCompletion), "basic-differentiation").state, "developing");

  const independentCompletion = completedPath(canonicalContent, "basic-differentiation", "2026-07-13T10:00:00.000Z");
  assert.equal(skill(summaryFor(independentCompletion), "basic-differentiation").state, "secure");
});

test("open mistakes, due Review, overdue Review and content rechecks are hard attention signals", () => {
  const first = questionsFor(canonicalContent, "basic-differentiation")[0];
  const mistake = skill(summaryFor(evidence([attemptFor(first, false, "2026-07-13T10:00:00.000Z", 1)])), "basic-differentiation");
  assert.equal(mistake.state, "needs_attention");
  assert(mistake.reasons.includes("open_mistake"));
  assert.deepEqual(mistake.action, { kind: "practice", label: "Practice this skill", href: "/practice?path=basic-differentiation" });

  const completed = completedPath(canonicalContent, "basic-differentiation", "2026-07-01T10:00:00.000Z");
  const due = skill(summaryFor(completed, new Date("2026-07-03T10:00:00.000Z")), "basic-differentiation");
  assert.equal(due.state, "needs_attention");
  assert(due.reasons.includes("review_due"));
  assert.equal(due.action?.kind, "review");

  const overdue = skill(summaryFor(completed, new Date("2026-07-04T10:00:00.000Z")), "basic-differentiation");
  assert(overdue.reasons.includes("review_overdue"));

  const versioned = questionsFor(canonicalContent, "basic-differentiation").find((question) => question.questionVersion > 1)!;
  const stale = evidence([attemptFor(versioned, true, "2026-07-13T10:00:00.000Z", 1, false, versioned.questionVersion - 1)]);
  const recheck = skill(summaryFor(stale), "basic-differentiation");
  assert.equal(recheck.state, "needs_attention");
  assert(recheck.reasons.includes("content_recheck"));
});

test("Review due soon prevents a Secure claim without becoming an alarm", () => {
  const completed = completedPath(canonicalContent, "basic-differentiation", "2026-07-01T10:00:00.000Z");
  const result = skill(summaryFor(completed, new Date("2026-07-02T12:00:00.000Z")), "basic-differentiation");
  assert.equal(result.state, "developing");
  assert(result.reasons.includes("review_due_soon"));
});

test("unavailable canonical skills remain coverage, while stale unknown IDs fail safely", () => {
  const assessment = assessedSkills(["basic-differentiation", "tangents-and-normals", "not-a-skill"]);
  const model = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessment], evidence: evidence(), now: NOW });
  const summary = model.assessments[0];
  assert.equal(summary.totalCanonicalSkillCount, 2);
  assert.equal(summary.supportedSkillCount, 1);
  assert.equal(summary.unavailableSkillCount, 1);
  assert.equal(summary.counts.limited_evidence, 1);
  assert.equal(summary.skills.find((item) => item.skillPathId === "tangents-and-normals")?.coverage, "content_unavailable");
  assert(model.diagnostics.includes("assessment:test:unknown_skill:not-a-skill"));
});

test("topic scope expands to unpublished canonical skills instead of shrinking to live content", () => {
  const basic = contentResolver.getPathContext("basic-differentiation")!;
  const assessment: Assessment = {
    ...assessedSkills([]),
    scope: { kind: "topics", topicIds: [topicScopeId(basic.courseArea.slug, basic.routeTopic.slug)] },
  };
  const summary = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessment], evidence: evidence(), now: NOW }).assessments[0];
  assert(summary.skills.some((item) => item.skillPathId === "tangents-and-normals" && item.coverage === "content_unavailable"));
  assert(summary.totalCanonicalSkillCount > summary.supportedSkillCount);
});

test("a requirements-scoped assessment resolves through canonical skills exactly like an equivalent skills-scoped one, including unavailable-skill honesty", () => {
  // hm-calc-diff-chain-rule -> chain-rule; hm-calc-tangent -> tangents-and-normals (not yet available).
  const requirementsScoped: Assessment = { ...assessedSkills([]), scope: { kind: "requirements", specPointIds: ["hm-calc-diff-chain-rule", "hm-calc-tangent"] } };
  const model = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [requirementsScoped], evidence: evidence(), now: NOW });
  const summary = model.assessments[0];
  assert.equal(summary.totalCanonicalSkillCount, 2);
  assert.equal(summary.supportedSkillCount, 1, "chain-rule is live; tangents-and-normals is not");
  assert.equal(summary.unavailableSkillCount, 1);
  assert.equal(summary.skills.find((item) => item.skillPathId === "chain-rule")?.coverage, "supported");
  assert.equal(summary.skills.find((item) => item.skillPathId === "tangents-and-normals")?.coverage, "content_unavailable");
  // Readiness must never quietly claim full coverage just because one requirement's skill isn't live yet.
  assert.notEqual(summary.unavailableSkillCount, 0);
});

test("an unknown official requirement ID in scope fails safely — no skills resolved, a diagnostic recorded, never a crash", () => {
  const assessment: Assessment = { ...assessedSkills([]), scope: { kind: "requirements", specPointIds: ["not-a-real-requirement"] } };
  const model = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessment], evidence: evidence(), now: NOW });
  const summary = model.assessments[0];
  assert.equal(summary.totalCanonicalSkillCount, 0);
  assert(model.diagnostics.includes("assessment:test:unknown_requirement:not-a-real-requirement"));
});

test("a requirement mapped to two skills (many-to-one) scopes readiness across both", () => {
  // hm-geom-circle-intersections maps to both circle-circle-intersections and line-circle-intersections.
  const assessment: Assessment = { ...assessedSkills([]), scope: { kind: "requirements", specPointIds: ["hm-geom-circle-intersections"] } };
  const model = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessment], evidence: evidence(), now: NOW });
  const skillIds = model.assessments[0].skills.map((item) => item.skillPathId).sort();
  assert.deepEqual(skillIds, ["circle-circle-intersections", "line-circle-intersections"]);
});

test("confidence is context only and never changes hard or insufficient-evidence states", () => {
  const first = questionsFor(canonicalContent, "basic-differentiation")[0];
  const confident = new Map([["basic-differentiation", "confident" as const]]);
  const mistake = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessedSkills(["basic-differentiation"])], evidence: evidence([attemptFor(first, false, "2026-07-13T10:00:00.000Z", 1)]), learnerConfidence: confident, now: NOW });
  assert.equal(skill(mistake.assessments[0], "basic-differentiation").state, "needs_attention");
  const needsWork = new Map([["basic-differentiation", "needs_work" as const]]);
  const untouched = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessedSkills(["basic-differentiation"])], evidence: evidence(), learnerConfidence: needsWork, now: NOW });
  assert.equal(skill(untouched.assessments[0], "basic-differentiation").state, "limited_evidence");
});

test("Review history failure fails conservatively and never produces Secure", () => {
  const completed = completedPath(canonicalContent, "basic-differentiation", "2026-07-13T10:00:00.000Z");
  completed.reviewEvents.push(reviewEvent({ schedulerVersion: 999 }));
  const result = skill(summaryFor(completed), "basic-differentiation");
  assert.equal(result.state, "developing");
  assert(result.reasons.includes("review_status_unavailable"));
});

test("expired assessments disappear, month copy stays honest and output ordering is deterministic", () => {
  const expired = { ...assessedSkills(["basic-differentiation"]), id: "expired", date: { precision: "exact" as const, date: "2026-07-12" } };
  const exact = { ...assessedSkills(["basic-differentiation"]), id: "exact", date: { precision: "exact" as const, date: "2026-07-17" } };
  const month = { ...assessedSkills(["basic-differentiation"]), id: "month", date: { precision: "month" as const, year: 2026, month: 8 } };
  const first = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [month, expired, exact], evidence: evidence(), now: NOW });
  const second = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [month, expired, exact], evidence: evidence(), now: NOW });
  assert.deepEqual(first, second);
  assert.deepEqual(first.assessments.map((item) => item.assessment.id), ["exact", "month", "provisional:higher-maths:final-exam"]);
  assert.deepEqual(first.expiredAssessmentIds, ["expired"]);
  assert.equal(presentAssessmentTiming(month, NOW), "Expected next month");
  assert.equal(presentAssessmentTiming({ ...month, date: { precision: "month", year: 2026, month: 7 } }, NOW), "Expected this month");
  assert.equal(presentAssessmentTiming({ ...month, date: { precision: "month", year: 2026, month: 6 } }, NOW), "Date needs confirmation");
  assert.equal(presentAssessmentTiming(exact, NOW), "Friday");
});

test("best focus routes Review before Practice, then learning, and stays calm when everything is Secure", () => {
  let mixed = completedPath(canonicalContent, "chain-rule", "2026-06-01T10:00:00.000Z");
  const basicFirst = questionsFor(canonicalContent, "basic-differentiation")[0];
  mixed = { ...mixed, attempts: [...mixed.attempts, attemptFor(basicFirst, false, "2026-07-12T10:00:00.000Z", 500)] };
  const summary = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessedSkills(["basic-differentiation", "chain-rule"])], evidence: mixed, now: NOW }).assessments[0];
  assert.equal(summary.bestFocus?.skillPathId, "chain-rule");
  assert.equal(summary.bestFocus?.action?.kind, "review");

  const partial = summaryFor(evidence([attemptFor(basicFirst, true, "2026-07-13T10:00:00.000Z", 1)]));
  assert.equal(partial.bestFocus?.action?.kind, "learning");
  assert.equal(summaryFor(evidence()).bestFocus?.action?.kind, "learning");

  const secure = summaryFor(completedPath(canonicalContent, "basic-differentiation", "2026-07-13T10:00:00.000Z"));
  assert.equal(secure.bestFocus, null);
});

test("three-skill acceptance fixture makes Review primary while preserving Tangents Practice", () => {
  const source = acceptanceSource();
  let learnerEvidence = mergeEvidence(
    completedPath(source, "basic-differentiation", "2026-07-13T09:00:00.000Z"),
    completedPath(source, "chain-rule", "2026-06-01T09:00:00.000Z", 100),
  );
  const tangents = questionsFor(source, "tangents-and-normals")[0];
  learnerEvidence = { ...learnerEvidence, attempts: [...learnerEvidence.attempts, attemptFor(tangents, false, "2026-07-12T10:00:00.000Z", 1_000)] };
  const confidence = new Map([["tangents-and-normals", "needs_work" as const]]);
  const assessment = assessedSkills(["basic-differentiation", "chain-rule", "tangents-and-normals"]);
  const summary = deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessment], evidence: learnerEvidence, learnerConfidence: confidence, source, now: NOW }).assessments[0];

  assert.deepEqual(summary.counts, { secure: 1, developing: 0, needs_attention: 2, limited_evidence: 0 });
  assert.equal(summary.bestFocus?.skillPathId, "chain-rule");
  assert.equal(summary.bestFocus?.action?.label, "Start Review");
  const tangentsResult = skill(summary, "tangents-and-normals");
  assert.equal(tangentsResult.state, "needs_attention");
  assert.equal(tangentsResult.learnerConfidence, "needs_work");
  assert.equal(tangentsResult.action?.kind, "practice");
  assert.equal(skill(summary, "basic-differentiation").state, "secure");
});

test("course snapshot performs bounded course-wide derivations once", () => {
  let mistakes = 0;
  let progress = 0;
  let reviews = 0;
  deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessedSkills(["basic-differentiation"]), { ...assessedSkills(["chain-rule"]), id: "second" }], evidence: evidence(), now: NOW }, {
    deriveMistakes: (...args) => { mistakes += 1; return deriveMistakeLog(...args); },
    calculateProgress: (...args) => { progress += 1; return calculateSkillPathProgress(...args); },
    deriveReview: (...args) => { reviews += 1; return deriveSkillReviewState(...args); },
  });
  assert.equal(mistakes, 1);
  assert.equal(progress, 2);
  assert.equal(reviews, 2);
});

function summaryFor(learnerEvidence: ProgressEvidence, now = NOW) {
  return deriveCourseAssessmentReadiness({ courseSlug: "higher-maths", assessments: [assessedSkills(["basic-differentiation"])], evidence: learnerEvidence, now }).assessments[0];
}

function skill(summary: ReturnType<typeof summaryFor>, pathId: string) {
  return summary.skills.find((item) => item.skillPathId === pathId)!;
}

function assessedSkills(skillPathIds: string[]): Assessment {
  return { id: "assessment:test", courseSlug: "higher-maths", type: "class_test", title: "Calculus test", date: { precision: "exact", date: "2026-07-17" }, scope: { kind: "skills", skillPathIds }, source: "learner" };
}

function completedPath(source: CanonicalContentSource, pathId: string, attemptedAt: string, offset = 0) {
  return evidence(questionsFor(source, pathId).map((question, index) => attemptFor(question, true, attemptedAt, offset + index + 1)));
}

function attemptFor(question: Question, isCorrect: boolean, attemptedAt: string, sequence: number, hintViewed = false, version = question.questionVersion): QuestionAttempt {
  return attempt({ eventId: `readiness_${question.id}_${sequence}`, questionId: question.id, skillPathId: question.skillPathId, stageId: question.stageId,
    versionEvidence: { kind: "known", questionVersion: version }, attemptedAt, sequence, isCorrect, hintViewedBeforeSubmission: hintViewed });
}

function questionsFor(source: CanonicalContentSource, pathId: string) {
  return source.questions.filter((question) => question.skillPathId === pathId && question.contentStatus === "active");
}

function mergeEvidence(left: ProgressEvidence, right: ProgressEvidence): ProgressEvidence {
  return { ...left, attempts: [...left.attempts, ...right.attempts] };
}

function reviewEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  const path = contentResolver.getPathContext("basic-differentiation")!.skillPath;
  return { eventId: "readiness_review", source: { sourceType: "practice_session", sourceId: "readiness_session" }, target: { targetType: "skill", targetId: path.slug },
    targetVersion: { versionType: "skill_path", version: path.pathVersion }, outcome: "independent_success", occurredAt: "2026-07-13T10:30:00.000Z", sequence: 999,
    priorEventId: null, schedulerVersion: 1, stageAfter: 0, evidenceRefs: [], questionIds: [], ...overrides };
}

function acceptanceSource(): CanonicalContentSource {
  const copy = structuredClone(canonicalContent);
  const tangents = findPath(copy.subjects[0], "tangents-and-normals");
  const template = questionsFor(copy, "basic-differentiation")[0];
  const stageId = "readiness-tangents-foundations";
  const questions = [1, 2].map((number) => ({ ...structuredClone(template), id: `readiness-tangents-${number}`, title: `Tangents question ${number}`,
    questionText: `Find the tangent in readiness fixture ${number}.`, skillPath: "Tangents", skillPathId: "tangents-and-normals", stageId, stage: "Foundations" as const, displayOrder: number }));
  tangents.isAvailable = true;
  tangents.status = "available";
  tangents.questions = questions.length;
  tangents.learningStages = [stage(stageId, questions.map((question) => question.id))];
  return { ...copy, questions: [...copy.questions, ...questions] };
}

function findPath(subject: CanonicalContentSource["subjects"][number], pathId: string): SkillPath {
  for (const course of subject.courseAreas) for (const topic of course.specAreas) {
    const path = topic.skillPaths?.find((candidate) => candidate.slug === pathId);
    if (path) return path;
  }
  throw new Error(`Missing path ${pathId}`);
}

function stage(id: string, questionIds: string[]): LearningStage {
  return { id, stageVersion: 1, contentStatus: "active", title: "Foundations", label: "Foundations", name: "Foundations", description: "Readiness fixture stage.",
    questionIds, questions: questionIds.length, completed: 0, button: "Start Foundations", accent: "green", status: "available", estimatedMinutes: 5, href: `/question/${questionIds[0]}` };
}
