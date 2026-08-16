import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sha256 } from "../lib/content-import/canonical";
import { higherMaths } from "../data/higher-maths";
import { validateContent } from "../lib/content-validation";
import { canonicalContent } from "../data/canonical-content";
import { chainRulePackage } from "../data/curriculum/higher-mathematics/chain-rule-package";
import { chainRuleLesson } from "../data/lessons/chain-rule";
import { parseMarkdownBank } from "../lib/content-import/parser";
import { tangentsPackage } from "../data/curriculum/higher-mathematics/tangents-package";
import { chainRuleContract, tangentsAndNormalsContract, higherMathematicsCalculusSkillContracts } from "../data/curriculum/higher-mathematics/calculus-skill-contracts";
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
    packageSchemaVersion: 2,
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
    productionEvidence: { historicalPatternAuditComplete: true, contentApprovalComplete: true },
    knownIssues: [],
    publicationPolicy: "standard",
    importReference: { bankId: "test-bank", expectedConfigurationPath: "bank.import.json" },
    ...overrides,
  };
}

function baseKnown(overrides: Partial<SkillPackageKnownReferences> = {}): SkillPackageKnownReferences {
  return {
    knownCourseIds: new Set(["test-course"]),
    knownSkillIds: new Set(["test-skill", "prior-skill"]),
    knownContractSkillPathIds: new Set(["test-skill"]),
    knownOfficialMappedSkillIds: new Set(["test-skill"]),
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

test("pattern audit, content approval and blocking known issues are independent publication gates", () => {
  const manifest = baseManifest({
    productionEvidence: { historicalPatternAuditComplete: false, contentApprovalComplete: false },
    knownIssues: [{ issueId: "owner-drift", description: "A question has the wrong canonical owner.", blocksStandardPublication: true }],
  });
  const readiness = deriveSkillPackageReadiness(manifest, validateSkillPackageManifest(manifest, baseKnown()), baseEvidence());
  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(codes.includes("historical-pattern-audit-incomplete"));
  assert.ok(codes.includes("content-approval-incomplete"));
  assert.ok(codes.includes("known-content-issue"));
  assert.equal(readiness.readyForPublication, false);
});

test("canonical baseline packages do not invent an import requirement", () => {
  const manifest = baseManifest({ importReference: undefined });
  const readiness = deriveSkillPackageReadiness(manifest, validateSkillPackageManifest(manifest, baseKnown()), baseEvidence({ importConfigurationExists: false }));
  assert.ok(!readiness.blockers.some((blocker) => blocker.code === "import-config-missing"));
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
  knownOfficialMappedSkillIds: new Set(proposedCalculusSkillPathIds),
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

test("real Chain Rule package readiness accurately reflects repository evidence: the package-manifest layer is now clean, since Step 4 created the real import configuration", () => {
  const validation = validateSkillPackageManifest(chainRulePackage, knownHigherMathsRefs);
  const evidence = resolveSkillPackageEvidence(chainRulePackage);
  const readiness = deriveSkillPackageReadiness(chainRulePackage, validation, evidence);

  assert.equal(readiness.structurallyComplete, true);
  assert.equal(readiness.readyForPackagePreview, true, "Notes now exists at data/lessons/chain-rule.ts, and Foundations/Applications/PPQ sources are all present");
  // This resolver only checks package-manifest-level signals (config file presence and hash
  // match against the declared bank/target/stage mapping) — it does not run the real importer's
  // deeper content-validation apply-time check. Step 4 created a real, hash-matching
  // chain-rule-v6.import.json and ran the real preview/approve workflow successfully (34/34
  // eligible, 0 blocked), so this layer is now clean. The real `apply` step is still blocked —
  // not by Chain Rule's package or content, but by two pre-existing, unrelated schema gaps in
  // shared repository infrastructure (lib/content-import/configuration.ts's hierarchy-field
  // mapping, and lib/content-validation.ts's marking-strategy allowlist not yet recognising
  // composite_algebraic_equivalence/closed_vocabulary_text_answer). See the Step 4 report.
  assert.equal(readiness.readyForImport, true);
  assert.equal(readiness.readyForPublication, true);

  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(!codes.includes("missing-notes-source"), "Chain Rule Notes now exists at data/lessons/chain-rule.ts");
  assert.ok(!codes.includes("import-config-missing"), "content-drafts/higher-maths/calculus/chain-rule-v6.import.json now exists and its hash matches");
  assert.ok(
    !codes.includes("uncovered-question-shape"),
    "trig-composite is the only required-but-unobserved shape, and it was corrected to required: false — no uncovered-question-shape blocker should remain",
  );
  assert.ok(
    !codes.includes("uncovered-misconception"),
    "the Step 2 QA pass confirmed both remaining misconceptions are genuinely covered in data/lessons/chain-rule.ts",
  );
  assert.ok(!codes.includes("mathematical-qa-incomplete"), "the Step 2 QA pass independently re-derived all 34 questions' mathematics");
  assert.ok(!codes.includes("curriculum-qa-incomplete"), "the Step 2 QA pass re-confirmed contract/specification boundary discipline");
  assert.ok(
    !codes.includes("originality-audit-incomplete"),
    "the Step 3 audit reviewed all 34 prompts and worked solutions, found no copied or lightly transformed identifiable source",
  );
  assert.ok(!codes.includes("marking-qa-incomplete"), "the Step 2 QA pass ran the real classifier and real marker against all 34 questions");
  assert.ok(!codes.includes("missing-foundations-source"), "chain-rule-v6.md's Foundations section does exist");
  assert.ok(!codes.includes("missing-applications-source"), "chain-rule-v6.md's Applications section does exist");
  assert.ok(!codes.includes("missing-ppq-source"), "chain-rule-v6.md's Past Paper-style Questions section does exist");
  assert.ok(
    !codes.includes("unsupported-marking-capability"),
    "all 34 Chain Rule questions are now marker-compatible (closed_vocabulary_text_answer resolves ppq-017's remaining blocker)",
  );
});

test("trig-composite and its coupled misconception remain declared as legitimate future enrichment, not deleted, with required downgraded to false", () => {
  const trigCompositeShape = chainRulePackage.expectedShapes.find((shape) => shape.shapeId === "trig-composite");
  assert.ok(trigCompositeShape, "the trig-composite shape entry must remain declared in the manifest");
  assert.equal(trigCompositeShape!.required, false);
  assert.equal(trigCompositeShape!.observedInSource, false);

  const dependencyMisconception = chainRulePackage.expectedMisconceptions.find(
    (entry) => entry.misconceptionId === "mishandled-trig-composite-dependency",
  );
  assert.ok(dependencyMisconception, "the mishandled-trig-composite-dependency entry must remain declared in the manifest");
  assert.equal(dependencyMisconception!.required, false);
  assert.equal(dependencyMisconception!.observedInSource, false);
});

test("the corrected Chain Rule manifest still validates cleanly and still declares exactly 7 shapes and 7 misconceptions", () => {
  const report = validateSkillPackageManifest(chainRulePackage, knownHigherMathsRefs);
  assert.deepEqual(report.errors, []);
  assert.equal(chainRulePackage.expectedShapes.length, 7);
  assert.equal(chainRulePackage.expectedMisconceptions.length, 7);
});

test("real Chain Rule package blocker count is 0 after Step 4 created the real import configuration", () => {
  const validation = validateSkillPackageManifest(chainRulePackage, knownHigherMathsRefs);
  const evidence = resolveSkillPackageEvidence(chainRulePackage);
  const readiness = deriveSkillPackageReadiness(chainRulePackage, validation, evidence);

  assert.equal(readiness.blockers.length, 0);

  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.deepEqual(codes, []);
  assert.equal(readiness.readyForImport, true, "chain-rule-v6.import.json now exists and matches the manifest's declared bank/source hash");
  assert.equal(readiness.readyForPublication, true, "import readiness gates publication readiness at this layer");
});

test("the Step 3 originality audit did not change the declared source hashes, and recorded real evidence for all four QA flags", () => {
  for (const source of chainRulePackage.sources) {
    if (source.kind === "notes") continue;
    assert.equal(
      source.expectedSourceHash,
      "7c45e31b926d24829e30031890d80429fcb74fe3d2780d7531032efea6e00d89",
      `${source.kind}: no content correction was needed, so no hash should have changed`,
    );
  }
  assert.equal(chainRulePackage.qaEvidence.mathematicalQaComplete, true);
  assert.equal(chainRulePackage.qaEvidence.curriculumQaComplete, true);
  assert.equal(chainRulePackage.qaEvidence.markingQaComplete, true);
  assert.equal(chainRulePackage.qaEvidence.originalityAuditComplete, true);
});

test("the originality QA evidence note is non-empty, specific, and does not overclaim exhaustive or uniqueness guarantees", () => {
  const note = chainRulePackage.qaEvidence.note ?? "";
  assert.ok(note.length > 200, "the note must be a substantive, specific summary, not a placeholder");
  assert.match(note, /all 34/, "the note must state that all 34 questions were covered, not a sample");
  assert.match(note, /does not claim/i, "the note must state its own limits honestly");
  assert.doesNotMatch(
    note,
    /(?<!does not claim (?:that )?)no (?:mathematically )?similar question has ever existed/i,
    "the note must not assert uniqueness outside of its own explicit disclaimer",
  );
});

test("the final retained Chain Rule question count is still 34, all question IDs are unique, and the six previously removed duplicate IDs remain absent", () => {
  const bytes = readFileSync("content-drafts/higher-maths/calculus/chain-rule-v6.md");
  const bank = parseMarkdownBank({ sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md", bytes });
  assert.equal(bank.questions.length, 34);

  const ids = bank.questions.map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate question IDs may exist in the retained bank");

  const removedIds = [
    "hm-calc-diff-chain-ppq-001",
    "hm-calc-diff-chain-ppq-002",
    "hm-calc-diff-chain-ppq-005",
    "hm-calc-diff-chain-ppq-006",
    "hm-calc-diff-chain-ppq-009",
    "hm-calc-diff-chain-ppq-013",
  ];
  for (const removedId of removedIds) assert.ok(!ids.includes(removedId), `${removedId} must remain absent`);
});

test("both Notes-resolvable misconceptions are now recorded as observed, with an evidence note naming the specific Notes block", () => {
  const multipliedByInner = chainRulePackage.expectedMisconceptions.find((entry) => entry.misconceptionId === "multiplied-by-inner-function");
  assert.ok(multipliedByInner);
  assert.equal(multipliedByInner!.observedInSource, true);
  assert.match(multipliedByInner!.evidenceNote ?? "", /chain-rule-common-mistakes-inner-derivative/);

  const compositeAsSimplePower = chainRulePackage.expectedMisconceptions.find((entry) => entry.misconceptionId === "composite-as-simple-power-rule");
  assert.ok(compositeAsSimplePower);
  assert.equal(compositeAsSimplePower!.observedInSource, true);
  assert.match(compositeAsSimplePower!.evidenceNote ?? "", /chain-rule-note-recognition/);
});

test("the two Notes-resolved misconceptions are genuinely present as named blocks in data/lessons/chain-rule.ts, not just claimed in the manifest", () => {
  const blockIds = chainRuleLesson.blocks.map((block) => block.blockId);
  assert.ok(blockIds.includes("chain-rule-common-mistakes-inner-derivative"));
  assert.ok(blockIds.includes("chain-rule-note-recognition"));
});

test("real Chain Rule source evidence resolves the actual draft's declared question counts", () => {
  const evidence = resolveSkillPackageEvidence(chainRulePackage);
  const byKind = new Map(evidence.sources.map((source) => [source.kind, source]));
  assert.equal(byKind.get("notes")?.exists, true, "data/lessons/chain-rule.ts now exists");
  assert.equal(byKind.get("foundations")?.exists, true);
  assert.equal(byKind.get("foundations")?.discoveredQuestionCount, 10);
  assert.equal(byKind.get("applications")?.discoveredQuestionCount, 9);
  assert.equal(byKind.get("pastPaperPractice")?.discoveredQuestionCount, 15);
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
  assert.equal(readiness.readyForImport, true, "no package-manifest-level blockers remain now that chain-rule-v6.import.json exists and is current");
});

// ---- Real Tangents package (post-migration) ----

test("the real Tangents package references the tangents-and-normals canonical skill", () => {
  assert.equal(tangentsPackage.skillPathId, "tangents-and-normals");
  assert.equal(tangentsPackage.courseId, "higher-maths");
});

test("the real Tangents package's hard prerequisite is exactly basic-differentiation", () => {
  assert.deepEqual(tangentsPackage.hardPrerequisiteSkillIds, ["basic-differentiation"]);
});

test("Chain Rule is not declared as a universal hard prerequisite of Tangents", () => {
  assert.ok(!tangentsPackage.hardPrerequisiteSkillIds.includes("chain-rule"));
});

test("the Chain Rule dependency is represented as a question-level requirement, not a skill-level one", () => {
  const rule = tangentsPackage.questionLevelRequirements.find((entry) => entry.requiredSkillId === "chain-rule");
  assert.ok(rule, "expected a question-level requirement rule targeting chain-rule");
  assert.ok(rule!.triggerDescription.toLowerCase().includes("chain rule"));
});

test("no Trigonometric Differentiation question-level requirement exists — none of the five current questions is a trigonometric composite", () => {
  assert.ok(!tangentsPackage.questionLevelRequirements.some((entry) => entry.requiredSkillId === "trigonometric-differentiation"));
});

test("no universal or conditional Chain Rule prerequisite-graph edge of any strength exists for Tangents", () => {
  const tangentsEdges = higherMathematicsCalculusPrerequisites.filter((edge) => edge.skillPathId === "tangents-and-normals");
  assert.equal(tangentsEdges.length, 1);
  assert.equal(tangentsEdges[0].requiresSkillPathId, "basic-differentiation");
  assert.equal(tangentsEdges[0].strength, "hard");
});

test("the real Tangents package references the existing tangentsAndNormalsContract rather than duplicating it", () => {
  assert.equal(tangentsPackage.contractSkillPathId, tangentsAndNormalsContract.skillPathId);
  assert.ok(!("boundaries" in tangentsPackage), "the manifest must never embed the contract's own fields");
});

test("the real Tangents manifest validates cleanly against real Higher Maths curriculum references", () => {
  const report = validateSkillPackageManifest(tangentsPackage, knownHigherMathsRefs);
  assert.deepEqual(report.errors, []);
});

test("Tangents declares no Foundations and no Notes source — both are genuinely absent, not omitted by mistake", () => {
  const kinds = tangentsPackage.sources.map((source) => source.kind).sort();
  assert.deepEqual(kinds, ["applications", "pastPaperPractice"]);
});

test("real Tangents source evidence resolves the actual migrated draft's declared question counts", () => {
  const evidence = resolveSkillPackageEvidence(tangentsPackage);
  const byKind = new Map(evidence.sources.map((source) => [source.kind, source]));
  assert.equal(byKind.get("applications")?.exists, true);
  assert.equal(byKind.get("applications")?.discoveredQuestionCount, 1);
  assert.equal(byKind.get("pastPaperPractice")?.exists, true);
  assert.equal(byKind.get("pastPaperPractice")?.discoveredQuestionCount, 4);
});

test("the Tangents manifest's declared source hash matches the live migrated draft's actual content hash", () => {
  const bytes = readFileSync("content-drafts/higher-maths/calculus/tangents-and-normals-v1.md");
  const actualHash = sha256(bytes);
  for (const source of tangentsPackage.sources) {
    assert.equal(source.expectedSourceHash, actualHash, source.kind);
  }
});

test("Tangents is not ready for import or publication, and reports its real blockers honestly", () => {
  const validation = validateSkillPackageManifest(tangentsPackage, knownHigherMathsRefs);
  const evidence = resolveSkillPackageEvidence(tangentsPackage);
  const readiness = deriveSkillPackageReadiness(tangentsPackage, validation, evidence);

  assert.equal(readiness.structurallyComplete, true);
  assert.equal(readiness.readyForImport, false);
  assert.equal(readiness.readyForPublication, false);

  const codes = readiness.blockers.map((blocker) => blocker.code);
  assert.ok(codes.includes("missing-foundations-source"), "no Foundations-tier Tangents content is authored yet");
  assert.ok(codes.includes("missing-notes-source"), "no Tangents Notes/LessonDocument exists yet");
  assert.ok(codes.includes("unsupported-marking-capability"), "the live marker cannot currently import any of the five migrated questions");
  assert.ok(codes.includes("import-config-missing"), "no tangents-and-normals-v1.import.json exists");
  assert.ok(!codes.includes("source-reference-stale"), "the manifest hash matches the freshly written draft");
});

test("Tangents' equation-form blockers are the real, honestly-reported ones — not forced to match any expectation", () => {
  const evidence = resolveSkillPackageEvidence(tangentsPackage);
  const applications = evidence.sources.find((source) => source.kind === "applications")!;
  const ppq = evidence.sources.find((source) => source.kind === "pastPaperPractice")!;
  const applicationsCapabilities = applications.unsupportedMarkingCapabilities.map((entry) => entry.requiredCapability ?? entry.code);
  const ppqCapabilities = new Set(ppq.unsupportedMarkingCapabilities.map((entry) => entry.requiredCapability ?? entry.code));
  assert.deepEqual(applicationsCapabilities, ["equation_form_answer"], "A001's single-field tangent equation is blocked by equation-form marking, exactly as the migration spec predicted");
  assert.deepEqual(ppqCapabilities, new Set(["structured_multi_field_answer"]));
  assert.equal(ppq.unsupportedMarkingCapabilities.length, 4, "all four migrated PPQ questions remain blocked by undeclared multi-field assessment, unchanged by this migration");
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
