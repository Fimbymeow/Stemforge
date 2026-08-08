import assert from "node:assert/strict";
import test from "node:test";
import { higherMaths } from "../data/higher-maths";
import { higherMathematicsOfficialSkillMappings } from "../data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { contentResolver } from "../lib/content-resolver";
import { deriveHigherMathsCourseTracker } from "../lib/course-tracker";
import { deriveSkillPathNextAction } from "../lib/learning/next-action";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";

const empty = (): ProgressEvidence => ({ attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [] });
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

test("fresh tracker derives honest availability, progress and coverage from the registry", () => {
  const model = deriveHigherMathsCourseTracker(higherMaths, empty(), new Date("2026-08-07T12:00:00Z"));
  assert.equal(model.totalSkillCount, 49);
  assert.equal(model.availableSkillCount, 2);
  for (const id of ["basic-differentiation", "chain-rule"]) {
    const skill = findSkill(model, id); assert.ok(skill);
    assert.equal(skill.structuralStatus, "Not started"); assert.equal(skill.knowledgeStatus, null);
    assert.deepEqual(skill.action, deriveSkillPathNextAction({ pathId: id, evidence: empty() }).href ? { label: deriveSkillPathNextAction({ pathId: id, evidence: empty() }).label, href: deriveSkillPathNextAction({ pathId: id, evidence: empty() }).href } : null);
  }
  const unavailable = findSkill(model, "trigonometric-differentiation"); assert.ok(unavailable);
  assert.equal(unavailable.availability, "Coming soon"); assert.equal(unavailable.action, null); assert.equal(unavailable.knowledgeStatus, null);
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

test("partial weak evidence is in progress and explains needs-practice from real evidence", () => {
  const progress = empty();
  progress.attempts = [{ ...attemptsFor("basic-differentiation", "2026-08-07T10:00:00Z", 1)[0], isCorrect: false }];
  progress.supportEvents = [{
    questionId: progress.attempts[0].questionId, skillPathId: "basic-differentiation", stageId: progress.attempts[0].stageId,
    type: "solution_viewed", occurredAt: "2026-08-07T10:01:00Z", sequence: 2, afterGenuineAttempt: true,
    versionEvidence: progress.attempts[0].versionEvidence, eventId: "basic-solution-1",
  }];
  const skill = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress), "basic-differentiation"); assert.ok(skill);
  assert.equal(skill.structuralStatus, "In progress"); assert.equal(skill.knowledgeStatus, "Needs practice");
  assert.match(skill.knowledgeReason ?? "", /Foundations: 1\/3 complete/);
});

test("healthy partial evidence stays distinct from structural completion", () => {
  const progress = empty(); progress.attempts = attemptsFor("chain-rule", "2026-08-07T10:00:00Z", 1);
  const skill = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress), "chain-rule"); assert.ok(skill);
  assert.equal(skill.structuralStatus, "In progress"); assert.equal(skill.knowledgeStatus, "Healthy");
  const expected = deriveSkillPathNextAction({ pathId: "chain-rule", evidence: progress });
  assert.deepEqual(skill.action, { label: expected.label, href: expected.href });
});

test("completed and healthy may coexist with an independent Review due state", () => {
  const progress = empty(); progress.attempts = attemptsFor("basic-differentiation", "2026-06-01T10:00:00Z");
  const skill = findSkill(deriveHigherMathsCourseTracker(higherMaths, progress, new Date("2026-08-07T12:00:00Z")), "basic-differentiation"); assert.ok(skill);
  assert.equal(skill.structuralStatus, "Completed"); assert.equal(skill.knowledgeStatus, "Healthy"); assert.equal(skill.reviewDue, true);
});

test("tracker grouping follows course order, official heading order and live skill display order", () => {
  const model = deriveHigherMathsCourseTracker(higherMaths, empty());
  assert.deepEqual(model.areas.map((area) => area.courseAreaId), higherMaths.courseAreas.map((area) => area.slug));
  const differentiation = model.areas.flatMap((area) => area.requirements).find((requirement) => requirement.areaId === "differentiating-functions");
  assert.ok(differentiation);
  assert.deepEqual(differentiation.skills.slice(0, 3).map((skill) => skill.skillPathId), ["basic-differentiation", "chain-rule", "trigonometric-differentiation"]);
});
