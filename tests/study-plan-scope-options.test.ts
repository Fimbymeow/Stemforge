import assert from "node:assert/strict";
import test from "node:test";

import { topicScopeId } from "@/lib/study-plan/assessments";
import { presentAssessmentScopeSummary } from "@/lib/study-plan/presenter";
import {
  parseStoredStudyPlanLocalState,
  readStudyPlanLocalState,
  writeStudyPlanLocalState,
} from "@/lib/study-plan/local-state";
import { studyPlanCourseOptions, studyPlanScopeOptions } from "@/lib/study-plan/scope-options";
import type { Assessment } from "@/lib/study-plan/types";

test("studyPlanCourseOptions exposes only genuinely live subjects, derived from the same availability flag the rest of the app uses", () => {
  const options = studyPlanCourseOptions();
  assert.deepEqual(options, [{ courseSlug: "higher-maths", courseName: "Higher Maths" }]);
  assert.equal(options.some((option) => option.courseSlug === "higher-physics"), false, "Coming Soon subjects must not be offered");
});

test("studyPlanScopeOptions groups the full canonical course and labels live versus unavailable skills", () => {
  const areas = studyPlanScopeOptions("higher-maths");
  assert(areas.length > 1, "real assessment scope must not shrink to Orthic's live content");
  const calculus = areas.find((area) => area.courseAreaId === "calculus")!;
  assert.equal(calculus.courseAreaId, "calculus");
  assert.equal(calculus.courseAreaName, "Calculus");

  // The topic layer is real grouping, not a flat area->skills list: both live skills sit under
  // one "Differentiation" topic rather than being enumerated directly on the area.
  assert(calculus.topics.length > 1);
  const differentiation = calculus.topics.find((topic) => topic.topicScopeId === topicScopeId("calculus", "differentiation"))!;
  assert.equal(differentiation.topicName, "Differentiation");
  assert.equal(differentiation.topicScopeId, topicScopeId("calculus", "differentiation"));
  assert.deepEqual(
    differentiation.skills.filter((skill) => skill.isAvailable).map((skill) => skill.skillPathId).sort(),
    ["basic-differentiation", "chain-rule"],
  );

  const tangents = differentiation.skills.find((skill) => skill.skillPathId === "tangents-and-normals");
  assert.equal(tangents?.isAvailable, false, "canonical unavailable skills remain selectable without looking live");
});

test("studyPlanScopeOptions does not invent skill paths for a course whose canonical structure has none", () => {
  const options = studyPlanScopeOptions("higher-physics");
  assert.deepEqual(options, []);
});

test("assessment scope summaries stay short and learner-facing", () => {
  const wholeCourse: Assessment["scope"] = { kind: "whole_course" };
  assert.equal(presentAssessmentScopeSummary(wholeCourse, "higher-maths"), "Whole course");

  const oneTopic: Assessment["scope"] = { kind: "topics", topicIds: [topicScopeId("calculus", "differentiation")] };
  assert.equal(presentAssessmentScopeSummary(oneTopic, "higher-maths"), "Differentiation");

  const twoTopics: Assessment["scope"] = { kind: "topics", topicIds: [topicScopeId("calculus", "differentiation"), topicScopeId("calculus", "integration")] };
  assert.equal(presentAssessmentScopeSummary(twoTopics, "higher-maths"), "2 areas");

  const oneSkill: Assessment["scope"] = { kind: "skills", skillPathIds: ["chain-rule"] };
  assert.equal(presentAssessmentScopeSummary(oneSkill, "higher-maths"), "Chain rule");

  const threeSkills: Assessment["scope"] = { kind: "skills", skillPathIds: ["basic-differentiation", "chain-rule", "tangents-and-normals"] };
  assert.equal(presentAssessmentScopeSummary(threeSkills, "higher-maths"), "3 skills");

  // An ID that no longer resolves to a real name still degrades to an honest count, never a crash.
  const unknownTopic: Assessment["scope"] = { kind: "topics", topicIds: ["not-a-real-topic"] };
  assert.equal(presentAssessmentScopeSummary(unknownTopic, "higher-maths"), "1 area");
});

test("a topics-scoped assessment persists and rehydrates through the full local-state round trip", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const assessment: Assessment = {
    id: "assessment:topic-test",
    courseSlug: "higher-maths",
    type: "class_test",
    title: "Differentiation test",
    date: { precision: "exact", date: "2026-08-28" },
    scope: { kind: "topics", topicIds: [topicScopeId("calculus", "differentiation")] },
    source: "learner",
  };
  const state = {
    version: 3 as const,
    setup: { weeklyMinutes: 90, availableDays: ["mon", "wed", "sat"] as ("mon" | "wed" | "sat")[], assessments: [assessment] },
    plan: null,
    previousWeek: null,
    preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [] },
  };
  assert.equal(writeStudyPlanLocalState(storage, state), true);
  const rehydrated = readStudyPlanLocalState(storage);
  assert.deepEqual(rehydrated.setup?.assessments, [assessment]);
});

test("a malformed legacy course_areas scope is safely dropped rather than crashing normalization", () => {
  const parsed = parseStoredStudyPlanLocalState(JSON.stringify({
    version: 3,
    setup: {
      weeklyMinutes: 90,
      availableDays: ["mon"],
      assessments: [{
        id: "stale", courseSlug: "higher-maths", type: "class_test", title: "Stale",
        date: { precision: "exact", date: "2026-08-01" },
        scope: { kind: "course_areas", courseAreaIds: ["calculus"] },
        source: "learner",
      }],
    },
  }));
  assert.deepEqual(parsed.setup?.assessments, []);
});
