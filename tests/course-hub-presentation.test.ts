import assert from "node:assert/strict";
import test from "node:test";
import { getActiveSubject } from "../lib/learning-paths";
import { getActionableStrandSkillPaths, getStrandSkillPaths, getActionableSpecificationGroups } from "../lib/course-hub-presentation";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { readFileSync } from "node:fs";

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

test("Hub presentation uses shared Design V2 motion without changing curriculum selection", () => {
  const hub = readFileSync("components/higher-maths-hub.tsx", "utf8");
  const navigator = readFileSync("components/learning/subject-roadmap-navigator.tsx", "utf8");
  const continuation = readFileSync("components/working-context/working-context-hub-card.tsx", "utf8");
  assert.match(hub, /SubjectRoadmapNavigator subject=\{subject\}/);
  assert.doesNotMatch(hub, /PageHeaderIconChip|28 \/ 49|57%|SQA|Competency Ledger/);
  assert.match(navigator, /getActionableSpecificationGroups\(strand\)/);
  assert.match(navigator, /href=\{path.href\}/);
  assert.doesNotMatch(navigator, /path.description|InlineMathContent/);
  assert.doesNotMatch(navigator, /IconNodePath|Surface|shadow-|animate-/);
  assert.match(continuation, /model.primaryHref/);
  assert.match(continuation, /model.primaryLabel/);
  assert.doesNotMatch(continuation, /ProgressBar|MasteryMark|shadow-|animate-/);
});

test("available Calculus skills use real specification ownership headings", () => {
  const calculus = subject.courseAreas.find((area) => area.slug === "calculus")!;
  const groups = getActionableSpecificationGroups(calculus);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].title, "Differentiating functions");
  assert.deepEqual(groups[0].paths.map((path) => path.slug), ["basic-differentiation", "chain-rule"]);
});

test("the full curriculum groups each skill once without changing ownership", () => {
  let count = 0;
  for (const area of subject.courseAreas) {
    const fixture = { ...area, specAreas: area.specAreas.map((topic) => ({ ...topic, skillPaths: topic.skillPaths?.map((path) => ({ ...path, isAvailable: true })) })) };
    const groups = getActionableSpecificationGroups(fixture);
    const paths = getStrandSkillPaths(fixture);
    assert.equal(groups.flatMap((group) => group.paths).length, paths.length);
    assert.equal(new Set(groups.flatMap((group) => group.paths.map((path) => path.slug))).size, paths.length);
    for (const group of groups) {
      const heading = higherMathematicsSpecificationRegister.areas.find((item) => item.areaId === group.id);
      assert.ok(heading, "All current skills have real registered ownership");
      assert.equal(group.title, heading.title);
      assert.ok(group.paths.every((path) => path.specificationStrandId === group.id));
    }
    count += paths.length;
  }
  assert.equal(count, 49);
});
