import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { higherMathematicsOfficialSkillMappings } from "../data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { contentResolver } from "../lib/content-resolver";
import { deriveHigherMathsCourseTracker } from "../lib/course-tracker";
import { groupCourseTrackerSkills, hasCourseTrackerConfidenceDisagreement } from "../lib/course-tracker-presentation";
import type { CourseTrackerSkill } from "../lib/course-tracker";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";

const empty = (): ProgressEvidence => ({ attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] });
const findSkill = (model: ReturnType<typeof deriveHigherMathsCourseTracker>, id: string) => model.areas.flatMap((area) => area.requirements).flatMap((requirement) => requirement.skills).find((skill) => skill.skillPathId === id);
const allSkills = (model: ReturnType<typeof deriveHigherMathsCourseTracker>) => model.areas.flatMap((area) => area.requirements).flatMap((requirement) => requirement.skills);

function attemptsFor(pathId: string, date: string, only = Number.POSITIVE_INFINITY): QuestionAttempt[] {
  const context = contentResolver.getPathContext(pathId);
  assert.ok(context);
  return (context.skillPath.learningStages ?? []).flatMap((stage) => stage.questionIds.map((questionId) => ({ stage, questionId }))).slice(0, only).map(({ stage, questionId }, index) => ({
    questionId, skillPathId: pathId, stageId: stage.id, isCorrect: true, answer: "fixture", attemptedAt: date,
    sequence: index + 1, isGenuine: true, hintViewedBeforeSubmission: false, supportKnowledge: "known" as const,
    versionEvidence: { kind: "known" as const, questionVersion: contentResolver.getQuestion(questionId)?.questionVersion ?? 1 }, eventId: `${pathId}-${index}`,
  }));
}

test("fresh tracker derives the full curriculum and only actionable skills receive learner rows", () => {
  const model = deriveHigherMathsCourseTracker(higherMaths, empty(), new Date("2026-08-07T12:00:00Z"));
  assert.equal(model.totalSkillCount, 49);
  for (const id of ["basic-differentiation", "chain-rule"]) {
    const skill = findSkill(model, id); assert.ok(skill);
    assert.equal(skill.availability, "actionable");
    assert.equal(skill.structuralStatus, "Not started");
    assert.equal(skill.progressLabel, "Not started");
    assert.deepEqual(skill.action, { label: "Open skill", href: contentResolver.getPathContext(id)!.skillPath.href });
  }
  const reference = findSkill(model, "trigonometric-differentiation"); assert.ok(reference);
  assert.equal(reference.availability, "curriculum_reference");
  assert.equal(reference.action, null);
  assert.equal(reference.progressLabel, null);
  assert.equal(reference.knowledgeStatus, null);
  assert.equal(allSkills(model).length, 49);
  assert.ok(allSkills(model).every((skill) => skill.officialPoints.length > 0));
});

test("skill disclosures preserve the canonical many-to-many official mapping and all 58 active requirements", () => {
  const model = deriveHigherMathsCourseTracker(higherMaths, empty());
  for (const mapping of higherMathematicsOfficialSkillMappings) {
    const skill = findSkill(model, mapping.skillPathId); assert.ok(skill);
    assert.deepEqual(skill.officialPoints.map((point) => point.id).sort(), [...mapping.officialSpecificationPointIds].sort());
  }
  const representedPointIds = new Set([
    ...allSkills(model).flatMap((skill) => skill.officialPoints.map((point) => point.id)),
    ...model.courseWideRequirements.flatMap((requirement) => requirement.officialPoints.map((point) => point.id)),
  ]);
  assert.equal(representedPointIds.size, 58);
  assert.equal(representedPointIds.size, higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active").length);
});

test("partial weak evidence retains its derivation but presents one specific progress line", () => {
  const progress = empty();
  progress.attempts = [{ ...attemptsFor("basic-differentiation", "2026-08-07T10:00:00Z", 1)[0], isCorrect: false }];
  progress.supportEvents = [{
    questionId: progress.attempts[0].questionId, skillPathId: "basic-differentiation", stageId: progress.attempts[0].stageId,
    type: "solution_viewed", occurredAt: "2026-08-07T10:01:00Z", sequence: 2, afterGenuineAttempt: true,
    versionEvidence: progress.attempts[0].versionEvidence, eventId: "basic-solution-1",
  }];
  const skill = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress), "basic-differentiation"); assert.ok(skill);
  assert.equal(skill.structuralStatus, "In progress");
  assert.equal(skill.knowledgeStatus, "Needs practice");
  assert.equal(skill.progressLabel, "Foundations · 1/3 complete");
});

test("healthy partial evidence uses the active stage rather than generic In progress", () => {
  const progress = empty(); progress.attempts = attemptsFor("chain-rule", "2026-08-07T10:00:00Z", 1);
  const skill = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress), "chain-rule"); assert.ok(skill);
  assert.equal(skill.structuralStatus, "In progress");
  assert.equal(skill.knowledgeStatus, "Healthy");
  assert.match(skill.progressLabel ?? "", /^Foundations · 1\/\d+ complete$/);
});

test("completed mastery wording and independent Review due state remain derived", () => {
  const progress = empty(); progress.attempts = attemptsFor("basic-differentiation", "2026-06-01T10:00:00Z");
  const skill = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress, new Date("2026-08-07T12:00:00Z")), "basic-differentiation"); assert.ok(skill);
  assert.equal(skill.structuralStatus, "Completed");
  assert.equal(skill.knowledgeStatus, "Healthy");
  assert.equal(skill.progressLabel, "Mastered");
  assert.equal(skill.reviewDue, true);
});

test("grouping preserves course, strand and skill order exactly", () => {
  const model = deriveHigherMathsCourseTracker(higherMaths, empty());
  assert.deepEqual(model.areas.map((area) => area.courseAreaId), higherMaths.courseAreas.map((area) => area.slug));
  const differentiation = model.areas.flatMap((area) => area.requirements).find((requirement) => requirement.areaId === "differentiating-functions");
  assert.ok(differentiation);
  const groupedOrder = groupCourseTrackerSkills(differentiation.skills).flatMap((group) => group.kind === "actionable" ? [group.skill.skillPathId] : group.skills.map((skill) => skill.skillPathId));
  assert.deepEqual(groupedOrder, differentiation.skills.map((skill) => skill.skillPathId));
  assert.deepEqual(groupedOrder.slice(0, 3), ["basic-differentiation", "chain-rule", "trigonometric-differentiation"]);
});

test("confidence remains derived but disagreement appears only for a supplied mismatching rating", () => {
  const progress = empty(); progress.attempts = attemptsFor("chain-rule", "2026-08-07T10:00:00Z", 1);
  const noRating = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress), "chain-rule"); assert.ok(noRating?.confidence);
  assert.equal(hasCourseTrackerConfidenceDisagreement(noRating.confidence), false);
  const matching = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress, undefined, undefined, new Map([["chain-rule", "developing" as const]])), "chain-rule"); assert.ok(matching?.confidence);
  assert.equal(hasCourseTrackerConfidenceDisagreement(matching.confidence), false);
  const differing = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress, undefined, undefined, new Map([["chain-rule", "confident" as const]])), "chain-rule"); assert.ok(differing?.confidence);
  assert.equal(hasCourseTrackerConfidenceDisagreement(differing.confidence), true);
});

test("untouched actionable skills retain no suggestion and curriculum references have no confidence surface", () => {
  const model = deriveHigherMathsCourseTracker(higherMaths, empty());
  const untouched = findSkill(model, "basic-differentiation"); assert.ok(untouched?.confidence);
  assert.equal(untouched.confidence.suggestion, null);
  assert.equal(untouched.confidence.learnerLevel, null);
  const reference = findSkill(model, "trigonometric-differentiation"); assert.ok(reference);
  assert.equal(reference.confidence, null);
});

test("a deterministic mature 49-skill model stays compact with 25 actionable rows", () => {
  const source = allSkills(deriveHigherMathsCourseTracker(higherMaths, empty()));
  const mature = source.map((skill, index): CourseTrackerSkill => index < 25
    ? { ...skill, availability: "actionable", action: { label: "Open skill", href: `/skills/${skill.skillPathId}` }, structuralStatus: "Not started", masteryStatus: "not_started", progressLabel: "Not started", confidence: { learnerLevel: null, suggestion: null, evidenceFingerprint: "fixture" } }
    : { ...skill, availability: "curriculum_reference", action: null, structuralStatus: null, masteryStatus: null, progressLabel: null, confidence: null });
  const groups = groupCourseTrackerSkills(mature);
  const flattened = groups.flatMap((group) => group.kind === "actionable" ? [group.skill] : group.skills);
  assert.equal(flattened.length, 49);
  assert.deepEqual(flattened.map((skill) => skill.skillPathId), source.map((skill) => skill.skillPathId));
  assert.equal(groups.filter((group) => group.kind === "actionable").length, 25);
  assert.equal(groups.filter((group) => group.kind === "curriculum_references").flatMap((group) => group.skills).length, 24);
  assert.ok(groups.length < mature.length);
});

test("Course Tracker source guards the calmer product boundary", () => {
  const component = readFileSync("components/learning/course-tracker.tsx", "utf8");
  const page = readFileSync("app/subjects/higher-maths/course-tracker/page.tsx", "utf8");
  assert.doesNotMatch(component + page, /skills available|coming soon|Set confidence/i);
  assert.doesNotMatch(component, /ConfidenceControl|ReviewStatus|bg-gradient|bg-forge-soft\/35/);
  assert.match(component, /Further skills in this strand/);
  assert.match(component, /Reasoning across the course/);
  assert.match(component, /Confirmed current by Qualifications Scotland/);
});
