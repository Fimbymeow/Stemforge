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
  assert.match(source, /data-testid="completed-path-card" className=\{editorial/);
  assert.match(source, /: "animate-fade-rise border-forge\/30 p-4"/);
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

test("Design V2 Skill Page separates Review and uses real derived primary actions", () => {
  const source = readFileSync("components/working-context/working-context-overview.tsx", "utf8");
  assert.match(source, /href=\{model.primaryHref\} data-testid="skill-primary-action"/);
  assert.match(source, /\{model.primaryLabel\}<ArrowRight/);
  assert.match(source, /md:grid-cols-4/);
  assert.match(source, /model.reviewEligible \? <aside/);
  assert.match(source, /aria-label="Curriculum pathway"/);
  assert.doesNotMatch(source, /md:grid-cols-5|BookOpen|ProgressBar|SQA C1|Stage 5/);
  assert.match(source, /aria-valuenow=\{model.completionPercentage\}/);
});

test("detailed confidence changes presentation only, retaining shared choice and disagreement logic", () => {
  const source = readFileSync("components/confidence/confidence-control.tsx", "utf8");
  assert.match(source, /variant === "detailed" \? <fieldset>/);
  assert.match(source, /aria-pressed=\{option === level\}/);
  assert.match(source, /onClick=\{\(\) => choose\(option\)\}/);
  assert.match(source, /shouldPromptConfidenceDisagreement/);
  assert.match(source, /confidence.clearRating\(skillPathId\)/);
});

test("confidence confirmation uses one shared persistence write and restrained shared colours", () => {
  const hook = readFileSync("components/confidence/use-learner-confidence.ts", "utf8");
  const control = readFileSync("components/confidence/confidence-control.tsx", "utf8");
  const dialog = readFileSync("components/confidence/confidence-disagreement-dialog.tsx", "utf8");
  const page = readFileSync("components/working-context/working-context-overview.tsx", "utf8");
  assert.match(hook, /persist\(override \? recordConfidenceOverride\(next, override\) : next\)/);
  assert.match(hook, /setLearnerConfidence\(readConfidenceLocalState\(window.localStorage\)/);
  assert.doesNotMatch(control, /confidence.recordOverride\(|onUseSuggestion/);
  assert.match(dialog, /Save confidence as/);
  assert.match(dialog, /Save as/);
  assert.doesNotMatch(page, /"Lesson"|"Learning stage"|"Current stage"/);
  assert.doesNotMatch(page, /aria-label="Skill resources"[^>]+border-/);
});
