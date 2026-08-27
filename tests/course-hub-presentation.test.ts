import assert from "node:assert/strict";
import test from "node:test";
import { getActiveSubject } from "../lib/learning-paths";
import {
  ROADMAP_UNAVAILABLE_PREVIEW_COUNT,
  deriveRoadmapPreview,
  deriveStrandAvailability,
  getStrandSkillPaths,
} from "../lib/course-hub-presentation";

const subject = getActiveSubject();

test("Higher Maths strand availability is derived from product content, not learner progress", () => {
  assert.deepEqual(
    subject.courseAreas.map((strand) => ({ name: strand.name, ...deriveStrandAvailability(strand) })),
    [
      { name: "Algebra and Trigonometry", totalSkillCount: 17, availableSkillCount: 0, unavailableSkillCount: 17, label: "Coming soon" },
      { name: "Vectors", totalSkillCount: 6, availableSkillCount: 0, unavailableSkillCount: 6, label: "Coming soon" },
      { name: "Calculus", totalSkillCount: 17, availableSkillCount: 2, unavailableSkillCount: 15, label: "2 available" },
      { name: "Lines, Circles and Sequences", totalSkillCount: 9, availableSkillCount: 0, unavailableSkillCount: 9, label: "Coming soon" },
    ],
  );
});

test("roadmap preview keeps canonical order, all available skills and three planned skills", () => {
  const calculus = subject.courseAreas.find((strand) => strand.slug === "calculus");
  assert.ok(calculus);
  const all = getStrandSkillPaths(calculus);
  const { preview, remainingUnavailable } = deriveRoadmapPreview(all);
  assert.equal(ROADMAP_UNAVAILABLE_PREVIEW_COUNT, 3);
  assert.deepEqual(preview.map((path) => path.name), [
    "Basic differentiation",
    "Chain rule",
    "Trigonometric differentiation",
    "Stationary Points and Their Nature",
    "Optimisation",
  ]);
  assert.equal(remainingUnavailable.length, 12);
  assert.deepEqual([...preview, ...remainingUnavailable].map((path) => path.slug), all.map((path) => path.slug));
});

test("an unavailable strand shows only its first three canonical skills before disclosure", () => {
  const algebra = subject.courseAreas.find((strand) => strand.slug === "algebra-and-trigonometry");
  assert.ok(algebra);
  const all = getStrandSkillPaths(algebra);
  const { preview, remainingUnavailable } = deriveRoadmapPreview(all);
  assert.deepEqual(preview.map((path) => path.name), [
    "Factorising cubics and quartics",
    "Polynomial equations",
    "Discriminant and nature of roots",
  ]);
  assert.equal(remainingUnavailable.length, 14);
});
