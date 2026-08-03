import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sha256 } from "../lib/content-import/canonical";
import { higherMaths } from "../data/higher-maths";
import { validateContent } from "../lib/content-validation";
import { canonicalContent } from "../data/canonical-content";
import { chainRulePackage } from "../data/curriculum/higher-mathematics/chain-rule-package";
import { chainRuleContract, higherMathematicsCalculusSkillContracts } from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
import { higherMathematicsCalculusCoverageClaims } from "../data/curriculum/higher-mathematics/calculus-coverage-claims";
import { higherMathematicsCalculusPrerequisites } from "../data/curriculum/higher-mathematics/calculus-prerequisites";
import { proposedCalculusSkillPathIds } from "../data/curriculum/higher-mathematics/calculus-skill-map";
import { resolveSkillPackageEvidence } from "../lib/curriculum/skill-package-resolver";
import {
  deriveSkillPackageReadiness,
  validateSkillPackageManifest,
  type SkillPackageEvidence,
  type SkillPackageKnownReferences,
  type SkillPackageManifest,
  type SkillPackageSourceEvidence,
} from "../lib/curriculum/skill-package";

function baseManifest(overrides: Partial<SkillPackageManifest> = {}): SkillPackageManifest {
  return {
    packageSchemaVersion: 1,
    packageRevision: 1,
    courseId: "test-course",
    skillPathId: "test-skill",
    contractSkillPathId: "test-skill",
    coverageClaimIds: ["claim-a"],
    hardPrerequisiteSkillIds: ["prior-skill"],
    questionLevelRequirements: [],
    sources: [
      { kind: "notes", sourcePath: "notes.ts" },
      { kind: "foundations", sourcePath: "bank.md", declaredStageName: "Foundations", expectedQuestionCount: 5 },
      { kind: "applications", sourcePath: "bank.md", declaredStageName: "Applications", expectedQuestionCount: 5 },
      { kind: "pastPaperPractice", sourcePath: "bank.md", declaredStageName: "PPQ", expectedQuestionCount: 5 },
    ],
    expectedShapes: [
      { shapeId: "shape-a", description: "A shape.", required: true, observedInSource: true },
    ],
    expectedMisconceptions: [
      { misconceptionId: "misc-a", description: "A misconception.", required: true, observedInSource: true },
    ],
    qaEvidence: { mathematicalQaComplete: true, curriculumQaComplete: true, originalityAuditComplete: true, markingQaComplete: true },
    importReference: { bankId: "test-bank", expectedConfigurationPath: "bank.import.json" },
    ...overrides,
  };
}

function baseKnown(overrides: Partial<SkillPackageKnownReferences> = {}): SkillPackageKnownReferences {
  return {
    knownCourseIds: new Set(["test-course"]),
    knownSkillIds: new Set(["test-skill", "prior-skill"]),
    knownContractSkillPathIds: new Set(["test-skill"]),
    knownCoverageClaimIds: new Set(["claim-a"]),
    knownHardPrerequisiteEdges: new Set(["test-skill::prior-skill"]),
    ...overrides,
  };
}

function sourceEvidence(overrides: Partial<SkillPackageSourceEvidence> & { kind: SkillPackageSourceEvidence["kind"] }): SkillPackageSourceEvidence {
  return { exists: true, discoveredQuestionCount: 5, unsupportedMarkingCapabilities: [], ...overrides };
}

function baseEvidence(overrides: Partial<SkillPackageEvidence> = {}): SkillPackageEvidence {
  return {
    sources: [
      sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
      sourceEvidence({ kind: "foundations" }),
      sourceEvidence({ kind: "applications" }),
      sourceEvidence({ kind: "pastPaperPractice" }),
    ],
    importConfigurationExists: true,
    ...overrides,
  };
}

// ---- Schema and identity ----

test("a valid minimal manifest parses/validates with no errors", () => {
  const report = validateSkillPackageManifest(baseManifest(), baseKnown());
  assert.deepEqual(report.errors, []);
});

test("an unknown course ID fails", () => {
  const report = validateSkillPackageManifest(baseManifest({ courseId: "not-a-real-course" }), baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "unknown-course"));
});

test("an unknown skill ID fails", () => {
  const report = validateSkillPackageManifest(baseManifest({ skillPathId: "not-a-real-skill" }), baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "unknown-skill"));
});

test("an unknown coverage-claim ID fails", () => {
  const report = validateSkillPackageManifest(baseManifest({ coverageClaimIds: ["not-a-real-claim"] }), baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "unknown-coverage-claim-reference"));
});

test("an unknown contract reference fails", () => {
  const report = validateSkillPackageManifest(baseManifest({ contractSkillPathId: "not-a-real-contract" }), baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "unknown-contract-reference"));
});

test("an unknown hard prerequisite (no matching graph edge) fails", () => {
  const report = validateSkillPackageManifest(baseManifest({ hardPrerequisiteSkillIds: ["some-unrelated-skill"] }), baseKnown({ knownSkillIds: new Set(["test-skill", "prior-skill", "some-unrelated-skill"]) }));
  assert.ok(report.errors.some((issue) => issue.code === "unknown-prerequisite"));
});

test("a question-level requirement referencing a known skill validates with no errors", () => {
  const manifest = baseManifest({ questionLevelRequirements: [{ triggerDescription: "Trigger.", requiredSkillId: "prior-skill" }] });
  const report = validateSkillPackageManifest(manifest, baseKnown());
  assert.deepEqual(report.errors, []);
});

test("a question-level requirement referencing an unknown skill fails", () => {
  const manifest = baseManifest({ questionLevelRequirements: [{ triggerDescription: "Trigger.", requiredSkillId: "not-a-real-skill" }] });
  const report = validateSkillPackageManifest(manifest, baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "unknown-question-level-requirement-skill"));
});

test("duplicate shape IDs fail", () => {
  const manifest = baseManifest({
    expectedShapes: [
      { shapeId: "shape-a", description: "First.", required: true, observedInSource: true },
      { shapeId: "shape-a", description: "Second, same ID.", required: true, observedInSource: false },
    ],
  });
  const report = validateSkillPackageManifest(manifest, baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-shape-id"));
});

test("duplicate misconception IDs fail", () => {
  const manifest = baseManifest({
    expectedMisconceptions: [
      { misconceptionId: "misc-a", description: "First.", required: true, observedInSource: true },
      { misconceptionId: "misc-a", description: "Second, same ID.", required: true, observedInSource: false },
    ],
  });
  const report = validateSkillPackageManifest(manifest, baseKnown());
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-misconception-id"));
});

// ---- Readiness ----

test("readiness is derived from the blocker list, not manually asserted — identical facts always produce identical readiness", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const readinessA = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  const readinessB = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  assert.deepEqual(readinessA, readinessB);
  assert.equal(readinessA.readyForPublication, true);
  assert.deepEqual(readinessA.blockers, []);
});

test("a missing Notes source produces a missing-notes-source blocker and blocks package preview", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", exists: false, discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations" }),
    sourceEvidence({ kind: "applications" }),
    sourceEvidence({ kind: "pastPaperPractice" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  assert.ok(readiness.blockers.some((blocker) => blocker.code === "missing-notes-source"));
  assert.equal(readiness.readyForPackagePreview, false);
});

test("missing question-stage sources each produce their own blocker and still block import", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", exists: false }),
    sourceEvidence({ kind: "applications", exists: false }),
    sourceEvidence({ kind: "pastPaperPractice", exists: false }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(codes.includes("missing-foundations-source"));
  assert.ok(codes.includes("missing-applications-source"));
  assert.ok(codes.includes("missing-ppq-source"));
  assert.equal(readiness.readyForImport, false, "missing question-bank sources must still block import, unlike a missing Notes source");
});

test("missing QA evidence produces one blocker per incomplete QA flag", () => {
  const manifest = baseManifest({ qaEvidence: { mathematicalQaComplete: false, curriculumQaComplete: false, originalityAuditComplete: false, markingQaComplete: false } });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const readiness = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(codes.includes("mathematical-qa-incomplete"));
  assert.ok(codes.includes("curriculum-qa-incomplete"));
  assert.ok(codes.includes("originality-audit-incomplete"));
  assert.ok(codes.includes("marking-qa-incomplete"));
  assert.equal(readiness.readyForPublication, false);
});

test("missing required shape coverage produces a deterministic uncovered-question-shape blocker", () => {
  const manifest = baseManifest({ expectedShapes: [{ shapeId: "shape-a", description: "A shape.", required: true, observedInSource: false }] });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const readiness = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  assert.ok(readiness.blockers.some((blocker) => blocker.code === "uncovered-question-shape" && blocker.message.includes("shape-a")));
});

test("a non-required shape gap produces no blocker", () => {
  const manifest = baseManifest({ expectedShapes: [{ shapeId: "shape-a", description: "Legitimately out of scope.", required: false, observedInSource: false }] });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const readiness = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  assert.ok(!readiness.blockers.some((blocker) => blocker.code === "uncovered-question-shape"));
});

test("an unsupported marking capability produces a blocker and blocks import readiness", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", unsupportedMarkingCapabilities: [{ questionId: "q-1", code: "requires_equation_form_answer", requiredCapability: "equation_form_answer" }] }),
    sourceEvidence({ kind: "applications" }),
    sourceEvidence({ kind: "pastPaperPractice" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  assert.ok(readiness.blockers.some((blocker) => blocker.code === "unsupported-marking-capability"));
  assert.equal(readiness.readyForImport, false);
  assert.equal(readiness.readyForPackagePreview, true, "a marking blocker is an import-tier concern, not a preview-tier one");
});

test("a package with complete, current, cleanly-marking question sources and a valid import configuration is ready for import even when Notes is missing", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", exists: false, discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations" }),
    sourceEvidence({ kind: "applications" }),
    sourceEvidence({ kind: "pastPaperPractice" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  assert.equal(readiness.readyForImport, true, "the real Content Import mechanism never reads a LessonDocument, so a missing Notes source must not block import");
});

test("that same Notes-missing package is not ready for publication", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", exists: false, discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations" }),
    sourceEvidence({ kind: "applications" }),
    sourceEvidence({ kind: "pastPaperPractice" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  assert.equal(readiness.readyForPublication, false);
  assert.ok(readiness.blockers.some((blocker) => blocker.code === "missing-notes-source" && blocker.tier === "publication"));
});

function manifestWithHashedQuestionBankSources(overrides: Partial<SkillPackageManifest> = {}): SkillPackageManifest {
  return baseManifest({
    sources: [
      { kind: "notes", sourcePath: "notes.ts" },
      { kind: "foundations", sourcePath: "bank.md", declaredStageName: "Foundations", expectedQuestionCount: 5, expectedSourceHash: "hash-a" },
      { kind: "applications", sourcePath: "bank.md", declaredStageName: "Applications", expectedQuestionCount: 5, expectedSourceHash: "hash-a" },
      { kind: "pastPaperPractice", sourcePath: "bank.md", declaredStageName: "PPQ", expectedQuestionCount: 5, expectedSourceHash: "hash-a" },
    ],
    ...overrides,
  });
}

test("a matching source hash allows reviewed shape and misconception observations to count", () => {
  const manifest = manifestWithHashedQuestionBankSources();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", currentContentHash: "hash-a" }),
    sourceEvidence({ kind: "applications", currentContentHash: "hash-a" }),
    sourceEvidence({ kind: "pastPaperPractice", currentContentHash: "hash-a" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  assert.ok(!readiness.blockers.some((blocker) => blocker.code === "source-reference-stale"));
  assert.ok(!readiness.blockers.some((blocker) => blocker.code === "uncovered-question-shape"));
  assert.ok(!readiness.blockers.some((blocker) => blocker.code === "uncovered-misconception"));
});

test("a stale source invalidates a previously observed required shape, re-emitting uncovered-question-shape", () => {
  const manifest = manifestWithHashedQuestionBankSources({
    expectedShapes: [{ shapeId: "shape-a", description: "A shape.", required: true, observedInSource: true }],
  });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", currentContentHash: "hash-b" }),
    sourceEvidence({ kind: "applications", currentContentHash: "hash-a" }),
    sourceEvidence({ kind: "pastPaperPractice", currentContentHash: "hash-a" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  const shapeBlocker = readiness.blockers.find((blocker) => blocker.code === "uncovered-question-shape");
  assert.ok(shapeBlocker, "a previously-observed required shape must be re-flagged once its evidence is stale");
  assert.ok(shapeBlocker!.message.includes("shape-a"));
  assert.ok(shapeBlocker!.message.toLowerCase().includes("stale"));
});

test("a stale source invalidates a previously observed required misconception, re-emitting uncovered-misconception", () => {
  const manifest = manifestWithHashedQuestionBankSources({
    expectedMisconceptions: [{ misconceptionId: "misc-a", description: "A misconception.", required: true, observedInSource: true }],
  });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", currentContentHash: "hash-a" }),
    sourceEvidence({ kind: "applications", currentContentHash: "hash-b" }),
    sourceEvidence({ kind: "pastPaperPractice", currentContentHash: "hash-a" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  const misconceptionBlocker = readiness.blockers.find((blocker) => blocker.code === "uncovered-misconception");
  assert.ok(misconceptionBlocker, "a previously-observed required misconception must be re-flagged once its evidence is stale");
  assert.ok(misconceptionBlocker!.message.includes("misc-a"));
});

test("the source-reference-stale blocker itself remains present alongside any re-emitted coverage blockers", () => {
  const manifest = manifestWithHashedQuestionBankSources();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", currentContentHash: "hash-b" }),
    sourceEvidence({ kind: "applications", currentContentHash: "hash-a" }),
    sourceEvidence({ kind: "pastPaperPractice", currentContentHash: "hash-a" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  assert.ok(readiness.blockers.some((blocker) => blocker.code === "source-reference-stale"));
});

test("a resolved question count that differs from expectedQuestionCount emits question-count-mismatch identifying the source and blocks import", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", discoveredQuestionCount: 3 }),
    sourceEvidence({ kind: "applications" }),
    sourceEvidence({ kind: "pastPaperPractice" }),
  ] });
  const readiness = deriveSkillPackageReadiness(manifest, validation, evidence);
  const mismatch = readiness.blockers.find((blocker) => blocker.code === "question-count-mismatch");
  assert.ok(mismatch, "expected a question-count-mismatch blocker");
  assert.ok(mismatch!.message.includes("Foundations"));
  assert.ok(mismatch!.message.includes("bank.md"));
  assert.ok(mismatch!.message.includes("5") && mismatch!.message.includes("3"));
  assert.equal(mismatch!.tier, "import");
  assert.equal(readiness.readyForImport, false);
});

test("blockers are ordered deterministically regardless of the order facts are discovered in", () => {
  const manifest = baseManifest({ qaEvidence: { mathematicalQaComplete: false, curriculumQaComplete: false, originalityAuditComplete: false, markingQaComplete: false } });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const evidence = baseEvidence({ sources: [
    sourceEvidence({ kind: "notes", exists: false, discoveredQuestionCount: undefined }),
    sourceEvidence({ kind: "foundations", unsupportedMarkingCapabilities: [{ questionId: "q-1", code: "requires_equation_form_answer", requiredCapability: "equation_form_answer" }] }),
    sourceEvidence({ kind: "applications" }),
    sourceEvidence({ kind: "pastPaperPractice" }),
  ], importConfigurationExists: false });
  const first = deriveSkillPackageReadiness(manifest, validation, evidence).blockers.map((blocker) => blocker.code);
  const second = deriveSkillPackageReadiness(manifest, validation, evidence).blockers.map((blocker) => blocker.code);
  assert.deepEqual(first, second);
  // Question-bank blockers (unsupported-marking-capability, import-config-missing) sort before
  // missing-notes-source, which is now grouped with the other publication-tier blockers it
  // shares a gating rule with (QA blockers) — it no longer sorts with the question-bank
  // source blockers, since it no longer gates the same readiness result they do.
  const indexOf = (code: string) => first.indexOf(code);
  assert.ok(indexOf("unsupported-marking-capability") < indexOf("missing-notes-source"));
  assert.ok(indexOf("import-config-missing") < indexOf("missing-notes-source"));
  assert.ok(indexOf("missing-notes-source") < indexOf("mathematical-qa-incomplete"));
});

test("a fully complete fixture is ready for publication with zero blockers", () => {
  const manifest = baseManifest();
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const readiness = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  assert.deepEqual(readiness.blockers, []);
  assert.equal(readiness.structurallyComplete, true);
  assert.equal(readiness.readyForPackagePreview, true);
  assert.equal(readiness.readyForImport, true);
  assert.equal(readiness.readyForPublication, true);
});

test("package readiness never equates source existence with approval — every source can exist and pass marking while QA remains outstanding", () => {
  const manifest = baseManifest({ qaEvidence: { mathematicalQaComplete: false, curriculumQaComplete: false, originalityAuditComplete: false, markingQaComplete: false } });
  const validation = validateSkillPackageManifest(manifest, baseKnown());
  const readiness = deriveSkillPackageReadiness(manifest, validation, baseEvidence());
  assert.equal(readiness.readyForImport, true, "every source exists and the marker accepts every answer");
  assert.equal(readiness.readyForPublication, false, "but no human QA sign-off has been recorded, so publication must still be blocked");
});

// ---- Chain Rule ----

const knownHigherMathsRefs: SkillPackageKnownReferences = {
  knownCourseIds: new Set(["higher-maths"]),
  knownSkillIds: new Set(proposedCalculusSkillPathIds),
  knownContractSkillPathIds: new Set(higherMathematicsCalculusSkillContracts.map((contract) => contract.skillPathId)),
  knownCoverageClaimIds: new Set(higherMathematicsCalculusCoverageClaims.map((claim) => claim.claimId)),
  knownHardPrerequisiteEdges: new Set(
    higherMathematicsCalculusPrerequisites.filter((edge) => edge.strength === "hard").map((edge) => `${edge.skillPathId}::${edge.requiresSkillPathId}`),
  ),
};

test("the real Chain Rule package references the chain-rule canonical skill", () => {
  assert.equal(chainRulePackage.skillPathId, "chain-rule");
  assert.equal(chainRulePackage.courseId, "higher-maths");
});

test("the real Chain Rule package's hard prerequisite is exactly basic-differentiation", () => {
  assert.deepEqual(chainRulePackage.hardPrerequisiteSkillIds, ["basic-differentiation"]);
});

test("Trigonometric Differentiation is not declared as a universal hard prerequisite of Chain Rule", () => {
  assert.ok(!chainRulePackage.hardPrerequisiteSkillIds.includes("trigonometric-differentiation"));
});

test("the trig-composite dependency is represented as a question-level requirement, not a skill-level one", () => {
  const rule = chainRulePackage.questionLevelRequirements.find((entry) => entry.requiredSkillId === "trigonometric-differentiation");
  assert.ok(rule, "expected a question-level requirement rule targeting trigonometric-differentiation");
  assert.ok(rule!.triggerDescription.toLowerCase().includes("trig"));
});

test("the real Chain Rule package references the existing chainRuleContract rather than duplicating it", () => {
  assert.equal(chainRulePackage.contractSkillPathId, chainRuleContract.skillPathId);
  assert.ok(!("boundaries" in chainRulePackage), "the manifest must never embed the contract's own fields");
});

test("the real Chain Rule manifest validates cleanly against real Higher Maths curriculum references", () => {
  const report = validateSkillPackageManifest(chainRulePackage, knownHigherMathsRefs);
  assert.deepEqual(report.errors, []);
});

test("real Chain Rule package readiness accurately reflects repository evidence: not ready for publication, and the expected blockers are present", () => {
  const validation = validateSkillPackageManifest(chainRulePackage, knownHigherMathsRefs);
  const evidence = resolveSkillPackageEvidence(chainRulePackage);
  const readiness = deriveSkillPackageReadiness(chainRulePackage, validation, evidence);

  assert.equal(readiness.structurallyComplete, true);
  assert.equal(readiness.readyForPackagePreview, false);
  assert.equal(readiness.readyForImport, false);
  assert.equal(readiness.readyForPublication, false);

  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(codes.includes("missing-notes-source"), "no Chain Rule Notes/LessonDocument exists yet");
  assert.ok(codes.includes("unsupported-marking-capability"), "the live marker cannot currently import most of chain-rule-v6.md");
  assert.ok(codes.includes("import-config-missing"), "no chain-rule-v6.import.json exists");
  assert.ok(codes.includes("uncovered-question-shape"), "the trig-composite shape has no source questions yet");
  assert.ok(codes.includes("mathematical-qa-incomplete"));
  assert.ok(codes.includes("curriculum-qa-incomplete"));
  assert.ok(codes.includes("originality-audit-incomplete"));
  assert.ok(codes.includes("marking-qa-incomplete"));
  assert.ok(!codes.includes("missing-foundations-source"), "chain-rule-v6.md's Foundations section does exist");
  assert.ok(!codes.includes("missing-applications-source"), "chain-rule-v6.md's Applications section does exist");
  assert.ok(!codes.includes("missing-ppq-source"), "chain-rule-v6.md's Past Paper-style Questions section does exist");
});

test("real Chain Rule source evidence resolves the actual draft's declared question counts", () => {
  const evidence = resolveSkillPackageEvidence(chainRulePackage);
  const byKind = new Map(evidence.sources.map((source) => [source.kind, source]));
  assert.equal(byKind.get("notes")?.exists, false);
  assert.equal(byKind.get("foundations")?.exists, true);
  assert.equal(byKind.get("foundations")?.discoveredQuestionCount, 10);
  assert.equal(byKind.get("applications")?.discoveredQuestionCount, 10);
  assert.equal(byKind.get("pastPaperPractice")?.discoveredQuestionCount, 25);
});

test("the Chain Rule manifest's declared source hash matches the live draft's actual content hash", () => {
  const bytes = readFileSync("content-drafts/higher-maths/calculus/chain-rule-v6.md");
  const actualHash = sha256(bytes);
  for (const source of chainRulePackage.sources) {
    if (source.kind === "notes") continue;
    assert.equal(source.expectedSourceHash, actualHash, source.kind);
  }
});

test("after the source hash update, the package report no longer treats the draft as stale", () => {
  const validation = validateSkillPackageManifest(chainRulePackage, knownHigherMathsRefs);
  const evidence = resolveSkillPackageEvidence(chainRulePackage);
  const readiness = deriveSkillPackageReadiness(chainRulePackage, validation, evidence);
  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(!codes.includes("source-reference-stale"), "the manifest hash should match the freshly edited draft");
  assert.equal(readiness.readyForImport, false, "genuine marking/config blockers remain regardless of staleness");
});

// ---- Non-regression ----

test("Basic Differentiation remains unchanged by the package layer", () => {
  const calculus = higherMaths.courseAreas.find((area) => area.slug === "calculus")!;
  const differentiation = calculus.specAreas.find((area) => area.slug === "differentiation")!;
  const basicDifferentiation = differentiation.skillPaths!.find((path) => path.slug === "basic-differentiation")!;
  assert.equal(basicDifferentiation.name, "Basic differentiation");
  assert.equal(basicDifferentiation.isAvailable, true);
  assert.equal(basicDifferentiation.questions, 8);
});

test("Higher Maths remains at 49 total skill paths", () => {
  const report = validateContent({ subjects: [...canonicalContent.subjects], questions: [...canonicalContent.questions] });
  assert.equal(report.counts.skillPaths, 49);
  assert.deepEqual(report.errors, []);
});
