import assert from "node:assert/strict";
import test from "node:test";
import { getActiveSubject } from "../lib/learning-paths";
import { getActionableStrandSkillPaths, getStrandSkillPaths } from "../lib/course-hub-presentation";

const subject = getActiveSubject();

test("all four canonical Higher Maths strands remain available for curriculum navigation", () => {
  assert.deepEqual(subject.courseAreas.map((strand) => strand.name), [
    "Algebra and Trigonometry",
    "Vectors",
    "Calculus",
    "Lines, Circles and Sequences",
  ]);
});

test("Course Hub presentation exposes only actionable skills in canonical order", () => {
  const calculus = subject.courseAreas.find((strand) => strand.slug === "calculus");
  assert.ok(calculus);
  assert.deepEqual(getActionableStrandSkillPaths(calculus).map((path) => path.name), [
    "Basic differentiation",
    "Chain rule",
  ]);
  assert.ok(getStrandSkillPaths(calculus).length > getActionableStrandSkillPaths(calculus).length);
});

test("a strand without usable content produces no dead Course Hub rows", () => {
  const algebra = subject.courseAreas.find((strand) => strand.slug === "algebra-and-trigonometry");
  assert.ok(algebra);
  assert.equal(getActionableStrandSkillPaths(algebra).length, 0);
  assert.equal(getStrandSkillPaths(algebra).length, 17);
});
