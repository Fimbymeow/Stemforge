import type { SkillPackageManifest } from "@/lib/curriculum/skill-package";

/** Practice V2 proof package for the canonical Tangents skill. */
export const tangentsPackage: SkillPackageManifest = {
  packageSchemaVersion: 2,
  packageRevision: 4,
  courseId: "higher-maths",
  skillPathId: "tangents-and-normals",
  contractSkillPathId: "tangents-and-normals",
  coverageClaimIds: ["claim-tangent"],
  hardPrerequisiteSkillIds: ["basic-differentiation"],
  questionLevelRequirements: [
    {
      triggerDescription: "The curve requires the already-learned Chain Rule to obtain its derivative before the Tangents-owned line construction is assessed.",
      requiredSkillId: "chain-rule",
    },
  ],
  sources: [
    {
      kind: "notes",
      sourcePath: "data/lessons/tangents.ts",
    },
    {
      kind: "practice",
      sourcePath: "content-drafts/higher-maths/calculus/tangents-and-normals-v1.md",
      declaredStageName: "Practice",
      expectedQuestionCount: 30,
      expectedSourceHash: "21f060b02b6bddb52b82fe03fb4461310e96f1d459c82ac79eb3012f710f7231",
    },
  ],
  expectedShapes: [
    { shapeId: "direct-polynomial-contact-value", description: "Find a tangent equation when the contact x-value is supplied for a polynomial curve.", required: true, observedInSource: true },
    { shapeId: "supplied-contact-point", description: "Use a supplied point and a derivative-derived gradient.", required: true, observedInSource: true },
    { shapeId: "exact-fraction-line-arithmetic", description: "Construct and rearrange a tangent whose contact value, gradient or intercept is fractional.", required: true, observedInSource: true },
    { shapeId: "composite-curve", description: "Construct a tangent after an explicitly dependency-gated Chain Rule derivative.", required: true, observedInSource: true },
    { shapeId: "equivalent-affine-forms", description: "Accept mathematically equivalent point-gradient, slope-intercept and general line forms.", required: true, observedInSource: true },
  ],
  expectedMisconceptions: [
    { misconceptionId: "curve-value-used-as-gradient", description: "Confuse the curve value with the derivative value.", required: true, observedInSource: true },
    { misconceptionId: "contact-point-omitted-or-misused", description: "Find a gradient but fail to use the correct contact point.", required: true, observedInSource: true },
    { misconceptionId: "derivative-not-evaluated-at-point", description: "Leave a gradient function instead of evaluating it at the stated x-value.", required: true, observedInSource: true },
    { misconceptionId: "line-equation-rearrangement-error", description: "Introduce a sign or constant error while rearranging the line.", required: true, observedInSource: true },
    { misconceptionId: "stationary-point-method-substitution", description: "Set the derivative equal to zero when a tangent at a stated point is required.", required: true, observedInSource: true },
    { misconceptionId: "normal-gradient-confusion", description: "Use the negative reciprocal instead of the tangent gradient.", required: true, observedInSource: true },
  ],
  qaEvidence: {
    mathematicalQaComplete: true,
    curriculumQaComplete: true,
    originalityAuditComplete: true,
    markingQaComplete: true,
    note: "All 30 Practice questions and Tangents Notes were re-reviewed after the pre-approval revision pass. Mathematical QA recomputed every changed item; curriculum QA removed five false Chain Rule dependencies and deferred unsupported negative/fractional-power differentiation; originality QA replaced Notes clones and two historical-neighbour constructions; marking QA exercised every accepted affine form and representative wrong lines through the live marker. Content approval remains separate and incomplete.",
  },
  productionEvidence: {
    historicalPatternAuditComplete: true,
    contentApprovalComplete: true,
    note: "Official Higher Mathematics paper and marking-instruction patterns were re-audited through 2026 and abstracted without copying. The content owner explicitly approved all 30 reviewed Practice questions before importer approval and apply.",
  },
  knownIssues: [],
  publicationPolicy: "standard",
  importReference: {
    bankId: "tangents-and-normals-v1",
    expectedConfigurationPath: "content-drafts/higher-maths/calculus/tangents-and-normals-v1.import.json",
  },
};
