import type { SkillPackageManifest } from "@/lib/curriculum/skill-package";

/**
 * The Chain Rule whole-skill package manifest — Content Production Engine Phase 2's pilot.
 * Every fact below is either a reference to an already-authoritative record (the skill
 * contract, the coverage claim, the prerequisite graph) or a fact directly verified against
 * the repository during this pass. Nothing here is aspirational: where evidence was absent,
 * the corresponding field says so explicitly (an empty/false value, never an assumed true).
 *
 * Verified boundary (chainRuleContract, calculus-skill-contracts.ts):
 * - hard prerequisite: basic-differentiation only.
 * - Trigonometric Differentiation is NOT a hard prerequisite of Chain Rule — its relevance
 *   is confined to trig-composite questions, recorded here as a question-level requirement.
 * - excluded from scope: Product Rule, Quotient Rule, Implicit Differentiation,
 *   Optimisation, stationary-point classification.
 *
 * Repartition (Chain Rule → Tangents migration): a-010, ppq-022, ppq-023, ppq-024 and
 * ppq-025 moved unchanged to the new Tangents package (tangents-package.ts) — their
 * assessed deliverable is a tangent-line equation, which Tangents owns, not Chain Rule.
 * ppq-001, ppq-002, ppq-005, ppq-006, ppq-009 and ppq-013 were removed outright: ppq-001
 * duplicated Foundations f-003 verbatim, and the other five duplicated an existing
 * Foundations shape closely enough (same inner-function type, same reasoning steps, same
 * misconception target) to add no distinct coverage. Every expectedShapes/
 * expectedMisconceptions evidenceNote below was re-reviewed against the retained 34
 * questions; entries citing a removed/moved question were updated to their remaining real
 * witnesses, never left referencing content that no longer exists in this source.
 */
export const chainRulePackage: SkillPackageManifest = {
  packageSchemaVersion: 1,
  packageRevision: 1,
  courseId: "higher-maths",
  skillPathId: "chain-rule",

  contractSkillPathId: "chain-rule",
  coverageClaimIds: ["claim-diff-chain-rule"],
  hardPrerequisiteSkillIds: ["basic-differentiation"],
  questionLevelRequirements: [
    {
      triggerDescription: "The question requires differentiating a trigonometric composite (the chain rule applied to sin/cos of a linear or otherwise composite argument) — chainRuleContract.boundaries.includes names this only for questions that also declare Trigonometric Differentiation as a required skill.",
      requiredSkillId: "trigonometric-differentiation",
    },
  ],

  sources: [
    {
      kind: "notes",
      sourcePath: "data/lessons/chain-rule.ts",
      // No expectedSourceHash: no such file exists yet. The only precedent, basic-differentiation.ts, is authored per skill once that skill is close to publication.
    },
    {
      kind: "foundations",
      sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md",
      declaredStageName: "Foundations",
      expectedQuestionCount: 10,
      expectedSourceHash: "b86736d97716de10c0cbd44e51a064954cf4131e19d44f48a35b774e365c6294",
    },
    {
      kind: "applications",
      sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md",
      declaredStageName: "Applications",
      expectedQuestionCount: 9,
      expectedSourceHash: "b86736d97716de10c0cbd44e51a064954cf4131e19d44f48a35b774e365c6294",
    },
    {
      kind: "pastPaperPractice",
      sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md",
      declaredStageName: "Past Paper-style Questions",
      expectedQuestionCount: 15,
      expectedSourceHash: "b86736d97716de10c0cbd44e51a064954cf4131e19d44f48a35b774e365c6294",
    },
  ],

  /**
   * Derived from chainRuleContract's boundaries and a full read of chain-rule-v6.md's 45
   * questions (10 Foundations, 10 Applications, 25 Past Paper-style). `observedInSource` is
   * a hand-reviewed fact, not a text-matching heuristic — see the doc comment on
   * SkillPackageShapeRequirement.
   */
  expectedShapes: [
    {
      shapeId: "direct-bracket-power",
      description: "Direct differentiation of a linear bracket raised to a power, e.g. (ax+b)^n.",
      required: true,
      observedInSource: true,
      evidenceNote: "F003, F004, PPQ003, PPQ004, PPQ010, PPQ011 and others. (PPQ001, PPQ002 and PPQ009 were removed as Foundations duplicates — see the repartition note above.)",
    },
    {
      shapeId: "coefficient-inner-gradient",
      description: "Chain rule questions combining an outer constant coefficient with the inner-function gradient.",
      required: true,
      observedInSource: true,
      evidenceNote: "F005, A003, PPQ010, PPQ021. (PPQ009, which also showed this shape, was removed as a Foundations duplicate.)",
    },
    {
      shapeId: "fractional-negative-outer-power",
      description: "Chain rule applied to negative or fractional outer powers, including square-root rewrites.",
      required: true,
      observedInSource: true,
      evidenceNote: "F008, F009, A004, A006, A007, PPQ012, PPQ014. (PPQ013, which also showed this shape, was removed as a Foundations duplicate.)",
    },
    {
      shapeId: "gradient-evaluation",
      description: "Evaluating a Chain Rule derivative at a stated x-value to find a gradient.",
      required: true,
      observedInSource: true,
      evidenceNote: "A001, A003, A005, A008, PPQ015, PPQ016, PPQ018.",
    },
    {
      shapeId: "chain-rule-recognition",
      description: "Identifying which functions require the chain rule versus ordinary power-rule differentiation.",
      required: true,
      observedInSource: true,
      evidenceNote: "F001, F002, F010.",
    },
    {
      shapeId: "trig-composite",
      description: "Chain rule applied to trigonometric composites; carries a question-level Trigonometric Differentiation requirement.",
      required: true,
      observedInSource: false,
      evidenceNote: "chain-rule-v6.md's own header states patterns are \"deliberately excluded from this Chain Rule bank: trig Chain rule, stationary points, closed intervals, optimisation, integration, and normal lines.\" No trig-composite question exists in the current draft.",
    },
    {
      shapeId: "multi-step-exam-application",
      description: "Multi-step original exam-style applications (tangent equations, gradient-condition solving, curve comparisons) within the contract boundary.",
      required: true,
      observedInSource: true,
      evidenceNote: "A009, PPQ017, PPQ019, PPQ020, PPQ021. (A010 and the tangent-equation PPQs, formerly PPQ022-025, moved to the Tangents package — see tangents-package.ts.)",
    },
  ],

  expectedMisconceptions: [
    {
      misconceptionId: "omitted-inner-derivative",
      description: "Omitting the inner-function derivative entirely.",
      required: true,
      observedInSource: true,
      evidenceNote: "Common-mistake notes on F003, F004, F006, F008, A002, A003.",
    },
    {
      misconceptionId: "multiplied-by-inner-function",
      description: "Multiplying by the inner function itself rather than its derivative.",
      required: true,
      observedInSource: false,
      evidenceNote: "No common-mistake note in chain-rule-v6.md describes this exact error; distinct from the omission pattern that is actually observed.",
    },
    {
      misconceptionId: "incorrect-outer-power-reduction",
      description: "Reducing the outer power incorrectly when applying the power rule to the bracket.",
      required: true,
      observedInSource: true,
      evidenceNote: "Common-mistake notes on F009, PPQ014.",
    },
    {
      misconceptionId: "mishandled-coefficient",
      description: "Dropping or mishandling an outer constant coefficient.",
      required: true,
      observedInSource: true,
      evidenceNote: "Common-mistake notes on F005, A003, PPQ021. (PPQ009, which also showed this misconception, was removed as a Foundations duplicate.)",
    },
    {
      misconceptionId: "composite-as-simple-power-rule",
      description: "Treating a composite function as if the plain power rule applies, ignoring the inner function entirely.",
      required: true,
      observedInSource: false,
      evidenceNote: "F010 tests recognition of when the chain rule is needed, but no common-mistake note in the draft names this failure mode explicitly as a worked misconception.",
    },
    {
      misconceptionId: "unsupported-product-quotient-method",
      description: "Attempting an unsupported Product or Quotient Rule method.",
      required: false,
      observedInSource: false,
      evidenceNote: "Explicitly excluded from chainRuleContract.boundaries.excludes — not required coverage for this skill, now or later.",
    },
    {
      misconceptionId: "mishandled-trig-composite-dependency",
      description: "Mishandling the question-level Trigonometric Differentiation dependency on a trig-composite question.",
      required: true,
      observedInSource: false,
      evidenceNote: "No trig-composite question exists in the source yet — see the trig-composite shape requirement, which is also uncovered.",
    },
  ],

  /**
   * No formal QA sign-off exists for this draft in the repository's approval/receipt
   * architecture. chain-rule-v6.md carries informal inline "QA note:" author remarks (e.g.
   * wording/mark fixes) — these are authoring-time notes, not the structured curriculum
   * approval this field represents, so every flag below stays false until a real review is
   * recorded.
   */
  qaEvidence: {
    mathematicalQaComplete: false,
    curriculumQaComplete: false,
    originalityAuditComplete: false,
    markingQaComplete: false,
    note: "chain-rule-v6.md contains informal inline \"QA note:\" author remarks (wording/mark corrections) but no structured, repository-level QA or approval record exists for this draft.",
  },

  importReference: {
    bankId: "hm-calc-diff-chain",
    expectedConfigurationPath: "content-drafts/higher-maths/calculus/chain-rule-v6.import.json",
  },
};
