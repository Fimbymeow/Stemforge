import assert from "node:assert/strict";
import test from "node:test";
import { getActiveSubject } from "../lib/learning-paths";
import { getActionableStrandSkillPaths, getStrandSkillPaths } from "../lib/course-hub-presentation";
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
  assert.match(navigator, /getActionableStrandSkillPaths\(strand\)/);
  assert.match(navigator, /href=\{path.href\}/);
  assert.match(navigator, /InlineMathContent/);
  assert.doesNotMatch(navigator, /IconNodePath|Surface|shadow-|animate-/);
  assert.match(continuation, /model.primaryHref/);
  assert.match(continuation, /model.primaryLabel/);
  assert.doesNotMatch(continuation, /ProgressBar|MasteryMark|shadow-|animate-/);
});
