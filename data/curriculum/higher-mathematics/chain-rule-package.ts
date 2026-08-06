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
      // No expectedSourceHash: the resolver never computes a currentContentHash for non-markdown
      // sources (see resolveSkillPackageEvidence), so one would never be compared here regardless.
    },
    {
      kind: "foundations",
      sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md",
      declaredStageName: "Foundations",
      expectedQuestionCount: 10,
      expectedSourceHash: "7c45e31b926d24829e30031890d80429fcb74fe3d2780d7531032efea6e00d89",
    },
    {
      kind: "applications",
      sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md",
      declaredStageName: "Applications",
      expectedQuestionCount: 9,
      expectedSourceHash: "7c45e31b926d24829e30031890d80429fcb74fe3d2780d7531032efea6e00d89",
    },
    {
      kind: "pastPaperPractice",
      sourcePath: "content-drafts/higher-maths/calculus/chain-rule-v6.md",
      declaredStageName: "Past Paper-style Questions",
      expectedQuestionCount: 15,
      expectedSourceHash: "7c45e31b926d24829e30031890d80429fcb74fe3d2780d7531032efea6e00d89",
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
      required: false,
      observedInSource: false,
      evidenceNote: "No retained question in chain-rule-v6.md uses a trigonometric composite (its own header states patterns are \"deliberately excluded from this Chain Rule bank: trig Chain rule, stationary points, closed intervals, optimisation, integration, and normal lines\"). chainRuleContract.boundaries.includes permits this shape only through a question-level Trigonometric Differentiation dependency — it is not required by the verified official Chain Rule coverage statement, which names only composite-function differentiation in general. Deferred until Trigonometric Differentiation has live learner content, or until a later mixed-practice package is produced; its absence does not block the current algebraic Chain Rule package.",
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
      observedInSource: true,
      evidenceNote: "No common-mistake note in chain-rule-v6.md describes this exact error, and it remains genuinely absent from the question bank — but data/lessons/chain-rule.ts's \"chain-rule-common-mistakes-inner-derivative\" callout (block chain-rule-common-mistakes-inner-derivative) explicitly names it as a distinct error from omitting the inner derivative entirely, contrasting \"4(2x+5)^3\\times(2x+5)\" (wrong) against \"4(2x+5)^3\\times2\" (right). Verified by direct reading during the Step 2 QA pass, not inferred from a keyword match.",
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
      observedInSource: true,
      evidenceNote: "F010 tests recognition of when the chain rule is needed, but no common-mistake note in the question bank names this failure mode explicitly as a worked misconception. data/lessons/chain-rule.ts's \"chain-rule-note-recognition\" warning callout (block chain-rule-note-recognition) does: it states that y=(2x+5)^4 \"is not the same shape as\" y=x^4 and that differentiating it as a simple power ignores the inner function. Verified by direct reading during the Step 2 QA pass, not inferred from a keyword match.",
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
      required: false,
      observedInSource: false,
      evidenceNote: "Coupled to the optional \"trig-composite\" shape above: this misconception cannot be exposed by any current retained question, since none uses a trigonometric composite. It should be reconsidered alongside future trig-composite content, not tracked as an independent requirement — it is not required for the current algebraic Chain Rule package.",
    },
  ],

  /**
   * Step 2 bounded QA pass results. Each true flag below reflects a real, independent check
   * performed and recorded during that pass — never a flag flipped because automated tests
   * merely passed. See the pass's own report for full detail; summarised per flag here.
   */
  qaEvidence: {
    // All 34 retained questions' correct answers, and all 5 Notes worked examples/self-check,
    // were independently re-derived from first principles (not merely re-run through the
    // marker) during the Step 2 QA pass. No mathematical defect was found.
    mathematicalQaComplete: true,
    // All 34 questions were re-confirmed to stay within chainRuleContract's boundary (algebraic
    // composites only; no Product/Quotient Rule, Implicit Differentiation, Optimisation, or
    // stationary-point content), reference only the declared hard prerequisite
    // (basic-differentiation), and match the verified specification statement
    // (hm-calc-diff-chain-rule: composite-function differentiation in general).
    curriculumQaComplete: true,
    // Step 3 complete originality audit. All 34 retained prompts and all 34 worked solutions
    // were individually reviewed for wording, values, structure and solution phrasing; all 34
    // question IDs were re-confirmed unique with no internal duplication; the 6 previously
    // removed duplicate IDs (ppq-001, ppq-002, ppq-005, ppq-006, ppq-009, ppq-013) were
    // re-confirmed absent from the source. The distinctive, higher-risk questions (comparison,
    // parameter-finding, solving-from-condition, three-term inner functions, sign/reciprocal/
    // root forms — a009, ppq-007, ppq-014, ppq-017, ppq-019, ppq-020, ppq-021) were each
    // individually checked against real web search results, including a domain-restricted
    // search against maths.scot (the settled Higher Maths source policy resource). No
    // identified source was found that any question's wording, values or structure was copied
    // or lightly transformed from. The search did surface two real, identified SQA Higher
    // Maths past questions confirming the recurring standard pattern (2017 Paper 1 Q3:
    // y=(4x-1)^12; 2024 Paper 1 Q3: y=(5x^2+3)^7) — neither matches any retained question's
    // values or form, supporting that the retained set abstracts the recurring pattern rather
    // than reskinning one identified paper. Simple direct-differentiation questions (the
    // majority of Foundations and several PPQs) were compared proportionately as a class
    // against this same recurring pattern, per the audit's own standard, rather than searched
    // individually. A prior internal draft (chain-rule-v5, in CONTENT CREATED/) was compared
    // against the live v6 source: Foundations and Applications content is stable and unchanged
    // since that draft, while the Past Paper-style section was substantially rewritten across
    // several real repository commits, with QA notes documenting deliberate edits made
    // specifically to avoid internal duplication (e.g. "Function changed to avoid duplicate
    // with PPQ001") — evidence of genuine iterative internal authorship, not passive copying.
    // Worked solutions were confirmed to use STEM Forge's own explanatory-prose house style
    // (full sentences, LaTeX-typeset, a named "Common mistake"), not terse official SQA
    // marking-instruction phrasing. One limitation: a maths.scot chain-rule worksheet PDF was
    // located but was not text-extractable by the available tooling, so its specific questions
    // could not be individually compared — this does not weaken the searches actually
    // performed. This audit does not claim that no mathematically similar Chain Rule question
    // has ever existed anywhere, and does not claim exhaustive internet-wide comparison — only
    // that no copied or lightly transformed identifiable source was found for any of the 34.
    originalityAuditComplete: true,
    // The real classifier was run against the live bank during the Step 2 QA pass: all 34
    // questions are marker-compatible (0 blocked), every accepted answer for every question
    // grades correct, and a plausible wrong answer (grounded in that question's own authored
    // "Common mistake" note) grades incorrect — not unmarkable — for all 34. One deliberately
    // investigated case (a-004) confirmed the marker correctly accepts a mathematically
    // equivalent negative-power rewrite despite the question's "positive powers" wording
    // instruction — expected behaviour for an equivalence-based marker, not a defect.
    markingQaComplete: true,
    note:
      "Step 3 originality audit: all 34 retained prompts and all 34 worked solutions were individually reviewed for wording, values, structure and solution phrasing. All 34 question IDs were re-confirmed unique with no internal duplication, and the 6 previously removed duplicate IDs (ppq-001, ppq-002, ppq-005, ppq-006, ppq-009, ppq-013) were re-confirmed absent. The distinctive, higher-risk questions (comparison, parameter-finding, solving-from-condition, three-term inner functions, sign/reciprocal/root forms) were individually checked against real web search results, including a domain-restricted search against maths.scot. No identified source was found that any question was copied or lightly transformed from; two real identified SQA past questions were found confirming the recurring standard pattern, and neither matches any retained question's values or form. Simple direct-differentiation questions were compared proportionately as a class against that same recurring pattern. A prior internal draft (chain-rule-v5) shows genuine iterative internal authorship, including QA notes documenting edits made specifically to avoid duplication. Worked solutions use STEM Forge's own explanatory-prose house style, not official SQA marking-instruction phrasing. This audit does not claim that no mathematically similar question has ever existed anywhere, and does not claim exhaustive internet-wide comparison — only that no copied or lightly transformed identifiable source was found for any of the 34.",
  },

  importReference: {
    bankId: "hm-calc-diff-chain",
    expectedConfigurationPath: "content-drafts/higher-maths/calculus/chain-rule-v6.import.json",
  },
};
