import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHigherMathsProductionTracker,
  validateHigherMathsProductionTracker,
} from "../lib/curriculum/higher-maths-production";

test("production tracker deterministically covers every canonical Higher Maths skill", () => {
  const first = buildHigherMathsProductionTracker(process.cwd());
  const second = buildHigherMathsProductionTracker(process.cwd());
  assert.deepEqual(second, first);
  assert.equal(first.entries.length, 49);
  assert.equal(new Set(first.entries.map((entry) => entry.skillPathId)).size, 49);
  assert.ok(first.entries.every((entry) => entry.registered));
  assert.ok(first.entries.every((entry) => entry.officialSpecificationPointIds.length > 0));
});

test("representative production states are evidence-derived and honest", () => {
  const tracker = buildHigherMathsProductionTracker(process.cwd());
  const byId = new Map(tracker.entries.map((entry) => [entry.skillPathId, entry]));

  const chainRule = byId.get("chain-rule");
  assert.ok(chainRule);
  assert.equal(chainRule.publicationPolicy, "standard");
  assert.equal(chainRule.publicationReady, true);
  assert.equal(chainRule.liveReadinessAccepted, true);
  assert.equal(chainRule.importState, "applied_then_modified");
  assert.ok(chainRule.sources.every((source) => source.exists && source.hashMatches !== false));
  assert.deepEqual(chainRule.stageCounts, { Foundations: 10, Applications: 9, "Past Paper-style Questions": 15 });
  assert.equal(chainRule.nextStage, "complete");

  const basic = byId.get("basic-differentiation");
  assert.ok(basic);
  assert.equal(basic.publicationPolicy, "grandfathered_live_baseline");
  assert.equal(basic.publicationReady, false);
  assert.equal(basic.liveReadinessAccepted, true);
  assert.equal(basic.importState, "not_required");
  assert.equal(basic.nextStage, "content_correction");
  assert.ok(basic.blockers.some((blocker) => blocker.code === "known-content-issue"));

  const tangents = byId.get("tangents-and-normals");
  assert.ok(tangents);
  assert.equal(tangents.live, false);
  assert.ok(tangents.officialRequirements.every((requirement) => requirement.id && requirement.statement));
  assert.match(tangents.contractBoundary?.learningObjective ?? "", /equation of the tangent/i);
  assert.ok(tangents.contractBoundary?.excludes.some((boundary) => /normal/i.test(boundary)));
  assert.equal(tangents.importState, "configuration_missing");
  assert.deepEqual(tangents.stageCounts, { Foundations: 0, Applications: 1, "Past Paper-style Questions": 4 });
  assert.equal(tangents.nextStage, "historical_pattern_audit");
  assert.equal(tracker.recommendedNext?.skillPathId, "tangents-and-normals");
  assert.equal(tracker.recommendedNext?.stage, "historical_pattern_audit");
});

test("main production gate accepts only the explicit live baseline exception", () => {
  const report = validateHigherMathsProductionTracker(buildHigherMathsProductionTracker(process.cwd()));
  assert.deepEqual(report.filter((issue) => issue.severity === "error"), []);
  assert.deepEqual(report.filter((issue) => issue.severity === "warning").map((issue) => issue.code), ["grandfathered-live-skill"]);
});

test("a standard live imported skill cannot bypass approval and apply", () => {
  const tracker = buildHigherMathsProductionTracker(process.cwd());
  const chainRule = tracker.entries.find((entry) => entry.skillPathId === "chain-rule");
  assert.ok(chainRule);
  chainRule.importState = "configured_not_approved";
  const report = validateHigherMathsProductionTracker(tracker);
  assert.ok(report.some((issue) => issue.code === "live-skill-import-not-applied" && issue.skillPathId === "chain-rule"));
});
