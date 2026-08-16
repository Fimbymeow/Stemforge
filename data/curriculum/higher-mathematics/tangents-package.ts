import type { SkillPackageManifest } from "@/lib/curriculum/skill-package";

/**
 * The Tangents whole-skill package manifest, mirroring chainRulePackage's shape and
 * evidence discipline exactly. Every fact below is either a reference to an already-
 * authoritative record (tangentsAndNormalsContract, claim-tangent, the hard prerequisite
 * graph) or a fact directly verified against the real, migrated tangents-and-normals-v1.md
 * draft. Nothing here is aspirational: where evidence was absent (Foundations content, a
 * rearrangement-error misconception, normals), the corresponding field says so explicitly.
 *
 * Verified boundary (tangentsAndNormalsContract, calculus-skill-contracts.ts):
 * - hard prerequisite: basic-differentiation only.
 * - Chain Rule (and, for trigonometric composites, Trigonometric Differentiation) is a
 *   genuine but conditional dependency, recorded here as a question-level requirement only
 *   — never a hard or soft prerequisite-graph edge (see the doc comment on
 *   higherMathematicsCalculusPrerequisites in calculus-prerequisites.ts).
 * - normals are excluded from scope: not an assessable statement in the source-verified
 *   specification (hm-calc-tangent, SQA May 2023 spec p6).
 *
 * All five current questions were migrated unchanged from the Chain Rule draft (see the
 * repartition note on chainRulePackage in chain-rule-package.ts) — none is a trigonometric
 * composite, so no Trigonometric Differentiation question-level requirement is declared;
 * adding one without a real trig-composite question to justify it would be exactly the kind
 * of speculative requirement this package's evidence discipline exists to avoid.
 */
export const tangentsPackage: SkillPackageManifest = {
  packageSchemaVersion: 2,
  packageRevision: 1,
  courseId: "higher-maths",
  skillPathId: "tangents-and-normals",

  contractSkillPathId: "tangents-and-normals",
  coverageClaimIds: ["claim-tangent"],
  hardPrerequisiteSkillIds: ["basic-differentiation"],
  /**
   * This is a package-level policy declaration only — same discipline as chainRulePackage's
   * own trigonometric-composite entry above. It is validated only against known skill IDs
   * (lib/curriculum/skill-package.ts), never against the prerequisite graph, and it does not
   * itself tag any question. Real per-question tagging via
   * QuestionCurriculumMetadata.requiredSkillIds is deliberately NOT added in this migration:
   * validateRequiredSkillsWithinPrerequisiteClosure (lib/curriculum/question-curriculum-
   * metadata.ts) checks a question's requiredSkillIds against its primary skill's real
   * hard/soft prerequisite closure, and "chain-rule" is correctly outside tangents-and-
   * normals' closure (no edge of any strength exists, by design — see
   * calculus-prerequisites.ts). Tagging real questions with "chain-rule" today would fail
   * that validator, not pass it — confirmed by running it directly, not assumed. Per-question
   * tagging is future work, contingent on how (or whether) that validator's invariant is
   * revisited; it is out of this migration's bounded scope.
   */
  questionLevelRequirements: [
    {
      triggerDescription: "The question requires differentiating a composite curve (Chain Rule) to find the gradient before the tangent equation can be constructed — tangentsAndNormalsContract.boundaries.includes names this only for questions where the differentiation method is a separate, already-unlocked skill. All five current questions trigger this rule.",
      requiredSkillId: "chain-rule",
    },
  ],

  sources: [
    {
      kind: "applications",
      sourcePath: "content-drafts/higher-maths/calculus/tangents-and-normals-v1.md",
      declaredStageName: "Applications",
      expectedQuestionCount: 1,
      expectedSourceHash: "75f6461459f398bc5c3bb8c7dfbf53a4c93327d87c2f1f5ff8839505db9b050e",
    },
    {
      kind: "pastPaperPractice",
      sourcePath: "content-drafts/higher-maths/calculus/tangents-and-normals-v1.md",
      declaredStageName: "Past Paper-style Questions",
      expectedQuestionCount: 4,
      expectedSourceHash: "75f6461459f398bc5c3bb8c7dfbf53a4c93327d87c2f1f5ff8839505db9b050e",
    },
  ],

  /**
   * Derived from tangentsAndNormalsContract's boundaries and a full read of
   * tangents-and-normals-v1.md's five migrated questions. `observedInSource` is a
   * hand-reviewed fact, not a text-matching heuristic — same discipline as chainRulePackage.
   */
  expectedShapes: [
    {
      shapeId: "tangent-linear-composite",
      description: "Tangent construction where the curve is a linear bracket raised to a power.",
      required: true,
      observedInSource: true,
      evidenceNote: "A001, PPQ001, PPQ004.",
    },
    {
      shapeId: "tangent-quadratic-composite",
      description: "Tangent construction where the curve's inner function is quadratic.",
      required: true,
      observedInSource: true,
      evidenceNote: "PPQ002.",
    },
    {
      shapeId: "tangent-radical-composite",
      description: "Tangent construction where the curve requires a radical-to-power rewrite before differentiating.",
      required: true,
      observedInSource: true,
      evidenceNote: "PPQ003.",
    },
    {
      shapeId: "multi-step-two-part-tangent",
      description: "A two-part exam-style question separately asking for the derivative, then the tangent equation.",
      required: true,
      observedInSource: true,
      evidenceNote: "PPQ004.",
    },
    {
      shapeId: "tangent-foundations-tier",
      description: "A single-step, minimally-scaffolded tangent construction suitable as a first Foundations-tier example.",
      required: true,
      observedInSource: false,
      evidenceNote: "No Foundations-tier source exists yet — this draft currently contains only Applications and Past Paper-style Questions content, migrated from Chain Rule. Foundations authoring is future work, not part of this migration.",
    },
  ],

  expectedMisconceptions: [
    {
      misconceptionId: "gradient-value-mistaken-for-y-coordinate",
      description: "Using the curve's y-value at the point of contact as if it were the gradient.",
      required: true,
      observedInSource: true,
      evidenceNote: "Common-mistake notes on PPQ001, PPQ003.",
    },
    {
      misconceptionId: "point-of-contact-omitted-or-misused",
      description: "Forgetting to find the point of contact, or substituting the wrong point into the tangent-line formula.",
      required: true,
      observedInSource: true,
      evidenceNote: "Common-mistake notes on A001, PPQ002.",
    },
    {
      misconceptionId: "derivative-not-evaluated-at-point",
      description: "Finding the derivative correctly but never substituting the stated x-value to get a numeric gradient.",
      required: true,
      observedInSource: true,
      evidenceNote: "Common-mistake note on PPQ004.",
    },
    {
      misconceptionId: "line-equation-rearrangement-error",
      description: "Sign or rearrangement errors converting the tangent line between point-gradient and simplified/general form.",
      required: true,
      observedInSource: false,
      evidenceNote: "No common-mistake note in the current five questions names a rearrangement or sign error explicitly as the worked misconception — all five focus on gradient/point-selection errors instead. Listed on tangentsAndNormalsContract's own typicalMisconceptions; flagged here as genuinely uncovered, not guessed at.",
    },
    {
      misconceptionId: "normal-gradient-confused-with-tangent-gradient",
      description: "Using the negative reciprocal (normal) gradient where the tangent gradient was required, or vice versa.",
      required: false,
      observedInSource: false,
      evidenceNote: "Explicitly excluded from tangentsAndNormalsContract.boundaries — normals are not in the verified specification scope. Not required coverage for this skill, now or later.",
    },
  ],

  /**
   * No formal QA sign-off exists for this draft in the repository's approval/receipt
   * architecture — this is a freshly migrated draft with zero import or approval history.
   */
  qaEvidence: {
    mathematicalQaComplete: false,
    curriculumQaComplete: false,
    originalityAuditComplete: false,
    markingQaComplete: false,
    note: "tangents-and-normals-v1.md is a freshly migrated draft (from chain-rule-v6.md); no structured, repository-level QA or approval record exists for it yet.",
  },

  productionEvidence: {
    historicalPatternAuditComplete: false,
    contentApprovalComplete: false,
    note: "The five migrated questions are source evidence only; no completed pattern audit or final content approval is recorded.",
  },
  knownIssues: [],
  publicationPolicy: "standard",

  importReference: {
    bankId: "hm-calc-tangent",
    expectedConfigurationPath: "content-drafts/higher-maths/calculus/tangents-and-normals-v1.import.json",
  },
};
