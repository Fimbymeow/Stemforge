import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent } from "../data/canonical-content";
import { higherMathematicsOfficialSkillMappings } from "../data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { higherMaths } from "../data/higher-maths";
import type { Subject } from "../data/types";
import { validateContent } from "../lib/content-validation";
import { createContentResolver, contentResolver } from "../lib/content-resolver";
import { validateCanonicalSkillSpecificationMappings } from "../lib/curriculum/official-skill-mapping";

const contexts = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === "higher-maths");

test("official Higher Mathematics requirements and all 49 canonical skills form a valid mapping", () => {
  assert.equal(higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active").length, 58);
  assert.equal(contexts.length, 49);
  assert.equal(higherMathematicsOfficialSkillMappings.length, 49);
  assert.deepEqual(validateCanonicalSkillSpecificationMappings({
    register: higherMathematicsSpecificationRegister,
    mappings: higherMathematicsOfficialSkillMappings,
    pathContexts: contexts,
  }).errors, []);
});

test("official requirement identity, order and wording remain stable", () => {
  const points = higherMathematicsSpecificationRegister.points;
  assert.equal(points.length, 58);
  assert.equal(points[0].specPointId, "hm-alg-factorising-polynomials");
  assert.equal(points[28].specPointId, "hm-calc-diff-power-rule");
  assert.equal(points[57].specPointId, "hm-reason-explain-solution");
  assert.ok(points.every((point) => point.verificationStatus === "verified" && point.officialStatement?.trim()));
  assert.equal(new Set(points.map((point) => point.specPointId)).size, 58);
});

test("every available skill has a valid official mapping and every mandatory point is covered", () => {
  const mappedSkills = new Set(higherMathematicsOfficialSkillMappings.map((mapping) => mapping.skillPathId));
  assert.ok(contexts.filter((context) => context.skillPath.isAvailable).every((context) => mappedSkills.has(context.skillPath.slug)));
  const mappedPoints = new Set(higherMathematicsOfficialSkillMappings.flatMap((mapping) => mapping.officialSpecificationPointIds));
  assert.ok(higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active" && point.mandatory).every((point) => mappedPoints.has(point.specPointId)));
});

test("missing skills and invalid official point references fail mapping validation", () => {
  const mappings = structuredClone(higherMathematicsOfficialSkillMappings);
  mappings.splice(mappings.findIndex((mapping) => mapping.skillPathId === "basic-differentiation"), 1);
  mappings[0].officialSpecificationPointIds.push("missing-official-point");
  const report = validateCanonicalSkillSpecificationMappings({ register: higherMathematicsSpecificationRegister, mappings, pathContexts: contexts });
  assert.ok(report.errors.some((issue) => issue.code === "available-skill-missing-official-mapping"));
  assert.ok(report.errors.some((issue) => issue.code === "unknown-official-point"));
});

test("a stale specification strand fails validation and cannot disappear silently", () => {
  const subject = structuredClone(higherMaths) as Subject;
  const basic = subject.courseAreas.flatMap((area) => area.specAreas).flatMap((area) => area.skillPaths ?? []).find((path) => path.slug === "basic-differentiation");
  assert.ok(basic);
  basic.specificationStrandId = "stale-strand";
  const report = validateContent({ subjects: [subject], questions: [...canonicalContent.questions] });
  assert.ok(report.errors.some((issue) => issue.code === "invalid-specification-strand-reference"));
  assert.ok(report.errors.some((issue) => issue.code === "active-path-resolution-count-mismatch"));
  assert.equal(createContentResolver({ subjects: [subject], questions: canonicalContent.questions }).getAllPathContexts().length, 48);
});
