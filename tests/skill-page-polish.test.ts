import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contentResolver } from "../lib/content-resolver";
import { getHigherMathsSkillOfficialPoints } from "../lib/course-tracker";

test("both live Skill Page breadcrumbs resolve from canonical curriculum context", () => {
  for (const pathId of ["basic-differentiation", "chain-rule"]) {
    const context = contentResolver.getPathContext(pathId);
    assert.ok(context);
    assert.equal(context.subject.subjectName, "Higher Maths");
    assert.equal(context.courseArea.name, "Calculus");
    assert.equal(context.specificationStrand.name, "Differentiating functions");
    assert.equal(context.skillPath.slug, pathId);
  }
});

test("Skill Page breadcrumb renders resolver context and omits guessed fallback labels", () => {
  const source = readFileSync("components/working-context/working-context-overview.tsx", "utf8");
  assert.match(source, /context\.courseArea\.name/);
  assert.match(source, /context\.specificationStrand\.name/);
  assert.doesNotMatch(source, /<span>Calculus<\/span>/);
  assert.doesNotMatch(source, /<span>Differentiating functions<\/span>/);
  assert.match(source, /\{context \? \(/, "missing context should omit rather than fabricate a breadcrumb");
});

test("recommended and completed Skill Page cards use flat surfaces", () => {
  const source = readFileSync("components/learning/local-skill-path-progress.tsx", "utf8");
  assert.doesNotMatch(source, /bg-gradient-to-br|from-forge\/10|to-white/);
  assert.match(source, /data-testid="completed-path-card" className="animate-fade-rise border-forge\/30 p-4"/);
});

test("completed card keeps Review information without duplicating the header mastery mark", () => {
  const source = readFileSync("components/learning/local-skill-path-progress.tsx", "utf8");
  const completedCard = source.match(/function CompletedPathCard[\s\S]*?export function LocalSkillPathProgressOverview/)?.[0];
  assert.ok(completedCard);
  assert.doesNotMatch(completedCard, /<MasteryBadge/);
  assert.match(completedCard, /<ReviewBadge/);
});

test("Skill Page owns the exact official requirements in one collapsed native disclosure", () => {
  const source = readFileSync("components/working-context/working-context-overview.tsx", "utf8");
  const points = getHigherMathsSkillOfficialPoints("basic-differentiation");
  assert.equal(points.length, 1);
  assert.match(points[0].text, /differentiating an algebraic function/);
  assert.match(source, /<details[^>]+data-testid="skill-official-requirements"/);
  assert.match(source, /data-testid="skill-official-requirement"/);
  assert.doesNotMatch(source, /<details[^>]+open=/);
});
