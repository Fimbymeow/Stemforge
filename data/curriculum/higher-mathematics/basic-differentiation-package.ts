import type { SkillPackageManifest } from "@/lib/curriculum/skill-package";

/**
 * Honest baseline for content that predates the package/import workflow. Canonical runtime
 * content is used only as evidence of what is live; it is not treated as an authoring bank.
 * Missing human sign-offs remain blockers, and the explicit grandfathered policy keeps the
 * existing learner path valid while those blockers are resolved deliberately.
 */
export const basicDifferentiationPackage: SkillPackageManifest = {
  packageSchemaVersion: 2,
  packageRevision: 1,
  courseId: "higher-maths",
  skillPathId: "basic-differentiation",
  contractSkillPathId: "basic-differentiation",
  coverageClaimIds: ["claim-diff-power-rule"],
  hardPrerequisiteSkillIds: [],
  questionLevelRequirements: [],
  sources: [
    { kind: "notes", sourcePath: "data/lessons/basic-differentiation.ts" },
    {
      kind: "foundations",
      sourcePath: "content/questions/higher-maths/basic-differentiation.ts",
      declaredStageName: "Foundations",
      expectedQuestionCount: 3,
      expectedSourceHash: "846c394aba000094b65ae96922faf8ff694230e894debb56da82d372f6e12720",
      evidenceMode: "canonical_runtime",
    },
    {
      kind: "applications",
      sourcePath: "content/questions/higher-maths/basic-differentiation.ts",
      declaredStageName: "Applications",
      expectedQuestionCount: 3,
      expectedSourceHash: "846c394aba000094b65ae96922faf8ff694230e894debb56da82d372f6e12720",
      evidenceMode: "canonical_runtime",
    },
    {
      kind: "pastPaperPractice",
      sourcePath: "content/questions/higher-maths/basic-differentiation.ts",
      declaredStageName: "Past Paper-style Questions",
      expectedQuestionCount: 2,
      expectedSourceHash: "846c394aba000094b65ae96922faf8ff694230e894debb56da82d372f6e12720",
      evidenceMode: "canonical_runtime",
    },
  ],
  expectedShapes: [
    { shapeId: "direct-power-rule", description: "Differentiate polynomial powers and sums term by term.", required: true, observedInSource: true },
    { shapeId: "gradient-evaluation", description: "Evaluate a derivative at a stated x-value.", required: true, observedInSource: true },
  ],
  expectedMisconceptions: [
    { misconceptionId: "power-not-reduced", description: "Multiply by the power but fail to reduce it by one.", required: true, observedInSource: true },
    { misconceptionId: "constant-retained", description: "Retain a constant term in the derivative.", required: true, observedInSource: true },
  ],
  qaEvidence: {
    mathematicalQaComplete: false,
    curriculumQaComplete: false,
    originalityAuditComplete: false,
    markingQaComplete: false,
    note: "The live path predates structured package sign-off. Existing tests and review metadata are evidence, but they are not converted into human QA declarations.",
  },
  productionEvidence: {
    historicalPatternAuditComplete: false,
    contentApprovalComplete: false,
    note: "No repository-owned historical-pattern or final content-approval sign-off exists for this baseline.",
  },
  knownIssues: [
    {
      issueId: "stationary-point-ownership",
      description: "hm-calc-diff-basic-a-003 and hm-calc-diff-basic-ppq-002 are documented as belonging to Stationary Points once that skill is published.",
      blocksStandardPublication: true,
    },
  ],
  publicationPolicy: "grandfathered_live_baseline",
};
