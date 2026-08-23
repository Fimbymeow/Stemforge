import assert from "node:assert/strict";
import test from "node:test";

import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import { contentResolver } from "@/lib/content-resolver";
import { resolveSkillsForRequirements } from "@/lib/curriculum/requirement-resolution";
import { validateCanonicalSkillSpecificationMappings } from "@/lib/curriculum/official-skill-mapping";

const REAL_MAPPINGS = higherMathematicsOfficialSkillMappings;

test("every official Higher Maths requirement referenced anywhere in the mapping resolves to at least one canonical skill", () => {
  const skillById = new Map(contentResolver.getAllPathContexts().map((context) => [context.skillPath.slug, context]));
  for (const mapping of REAL_MAPPINGS) {
    assert.ok(skillById.has(mapping.skillPathId), `mapping references unknown skill ${mapping.skillPathId}`);
    for (const pointId of mapping.officialSpecificationPointIds) {
      assert.ok(resolveSkillsForRequirements([pointId], REAL_MAPPINGS).length > 0, `spec point ${pointId} resolves to no skills`);
    }
  }
});

test("every mandatory active official requirement is mapped to at least one canonical skill (no unmapped requirements)", () => {
  const activeMandatory = higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active" && point.mandatory);
  for (const point of activeMandatory) {
    const resolved = resolveSkillsForRequirements([point.specPointId], REAL_MAPPINGS);
    assert.ok(resolved.length > 0, `mandatory requirement ${point.specPointId} has no mapped skill`);
  }
});

test("no orphan canonical skills — every available skill has an official mapping (existing repository invariant, re-verified here)", () => {
  const pathContexts = contentResolver.getAllPathContexts();
  const report = validateCanonicalSkillSpecificationMappings({
    register: higherMathematicsSpecificationRegister,
    mappings: [...REAL_MAPPINGS],
    pathContexts,
  });
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors, null, 2));
});

test("resolving a single requirement returns exactly its mapped skills, in declared order", () => {
  // hm-calc-diff-chain-rule maps to exactly one skill: chain-rule.
  assert.deepEqual(resolveSkillsForRequirements(["hm-calc-diff-chain-rule"], REAL_MAPPINGS), ["chain-rule"]);
});

test("a requirement mapped to multiple skills resolves to all of them (one-to-many)", () => {
  // hm-geom-circle-intersections is the primary/additional point for two distinct skills.
  const resolved = resolveSkillsForRequirements(["hm-geom-circle-intersections"], REAL_MAPPINGS);
  assert.deepEqual([...resolved].sort(), ["circle-circle-intersections", "line-circle-intersections"]);
});

test("many requirements with overlapping skills deduplicate — the brief's own worked example (A -> X,Y; B -> X,Z => X,Y,Z)", () => {
  const mappings = [
    { skillPathId: "X", primarySpecPointId: "A", officialSpecificationPointIds: ["A", "B"] },
    { skillPathId: "Y", primarySpecPointId: "A", officialSpecificationPointIds: ["A"] },
    { skillPathId: "Z", primarySpecPointId: "B", officialSpecificationPointIds: ["B"] },
  ];
  assert.deepEqual(resolveSkillsForRequirements(["A", "B"], mappings), ["X", "Y", "Z"]);
});

test("invalid/unknown requirement IDs resolve to no skills and never throw", () => {
  assert.deepEqual(resolveSkillsForRequirements(["not-a-real-requirement"], REAL_MAPPINGS), []);
  assert.doesNotThrow(() => resolveSkillsForRequirements(["", "also-not-real", "hm-calc-diff-chain-rule"], REAL_MAPPINGS));
  assert.deepEqual(resolveSkillsForRequirements(["", "also-not-real", "hm-calc-diff-chain-rule"], REAL_MAPPINGS), ["chain-rule"]);
});

test("an empty requirement selection resolves to no skills", () => {
  assert.deepEqual(resolveSkillsForRequirements([], REAL_MAPPINGS), []);
});

test("resolution is deterministic — repeated calls with the same input produce identical output", () => {
  const first = resolveSkillsForRequirements(["hm-calc-diff-chain-rule", "hm-geom-circle-intersections"], REAL_MAPPINGS);
  const second = resolveSkillsForRequirements(["hm-calc-diff-chain-rule", "hm-geom-circle-intersections"], REAL_MAPPINGS);
  assert.deepEqual(first, second);
});

test("cross-cutting reasoning requirements (mapped as additional points on several skills) resolve broadly, and this is documented, not hidden", () => {
  // hm-reason-select-strategy is deliberately an additional point on four different Calculus skills
  // (see the register's own "cross-cutting requirements, not extra canonical skills" comment).
  const resolved = resolveSkillsForRequirements(["hm-reason-select-strategy"], REAL_MAPPINGS);
  assert.ok(resolved.length >= 4, `expected the cross-cutting reasoning requirement to resolve broadly, got ${resolved.length} skill(s)`);
});
