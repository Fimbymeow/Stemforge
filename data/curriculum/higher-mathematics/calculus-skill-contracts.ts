import type { CanonicalSkillContract } from "@/lib/curriculum/skill-contracts";

/**
 * Four authored contracts (Basic Differentiation, Trigonometric Differentiation, Chain
 * Rule, Tangents). Every other skill in the proposed Calculus map is referenced by a
 * coverage claim (see calculus-coverage-claims.ts) but does not yet have a contract — this
 * is reported, not hidden, by lib/curriculum/coverage.ts's skillContractsMissing field.
 */

/**
 * Basic Differentiation's boundary was re-verified against the live, published question
 * bank (content/questions/higher-maths/basic-differentiation.ts) rather than assumed from
 * prior documentation. Two of its eight live questions exceed the clean boundary below:
 *   - hm-calc-diff-basic-a-003 ("find the x-coordinate of the stationary point")
 *   - hm-calc-diff-basic-ppq-002 ("find the positive x-coordinate of a stationary point")
 * Both require solving f'(x) = 0, which belongs to the not-yet-published "stationary-points"
 * skill under the new canonical map, not to Basic Differentiation. This contract is written
 * for the clean target boundary, not retrofitted to match those two questions — per
 * instruction, existing content is reported as a mismatch, not silently absorbed into a
 * wider boundary. No correction is made in Phase 1.
 * Two other live questions (hm-calc-diff-basic-a-002, hm-calc-diff-basic-ppq-001) use the
 * word "tangent" but only ask for a gradient value, never a tangent line equation — these
 * stay within this contract's boundary and do not indicate a mismatch.
 */
export const basicDifferentiationContract: CanonicalSkillContract = {
  skillPathId: "basic-differentiation",
  name: "Basic differentiation",
  learningObjective: "Differentiate polynomial functions using the power rule, and evaluate a derivative at a given x-value to find a gradient.",
  boundaries: {
    includes: [
      "power rule for x^n (non-negative integer powers observed in current live content)",
      "differentiating a constant",
      "differentiating a sum or difference of power terms",
      "evaluating a derivative at a stated x-value",
      "'gradient of the curve/tangent at a point', meaning the value of the derivative there — not a tangent line equation",
    ],
    excludes: [
      "chain rule / composite functions",
      "trigonometric differentiation",
      "finding a tangent or normal line equation",
      "identifying or using stationary points",
      "negative or fractional-index differentiation (not observed in current live content)",
    ],
  },
  prerequisiteSkillIds: [],
  unlocksSkillIds: ["chain-rule", "trigonometric-differentiation", "tangents-and-normals", "stationary-points"],
  permittedIngredients: [
    "polynomial expressions with non-negative integer powers",
    "sums and differences of monomials",
    "explicit numeric x-values for evaluation",
  ],
  forbiddenIngredients: [
    "composite functions requiring the chain rule",
    "trigonometric terms",
    "negative or fractional exponents",
    "requests for a tangent or normal line equation",
    "requests to find or classify a stationary point",
  ],
  typicalMisconceptions: [
    "Forgetting to reduce the power by 1 after multiplying down.",
    "Treating a constant's derivative as the constant itself instead of 0.",
    "Confusing 'find f'(a)' with 'solve f(x) = a'.",
    "Setting y = 0 instead of dy/dx = 0 on a stationary-point-flavoured question (see boundary note above).",
  ],
  pastPaperPatternFamilyIds: [],
  autoMarkingRequirements: [
    "polynomial_form marking strategy, tolerant of coefficient/term-order rearrangement",
    "numeric marking strategy for f'(a)-style evaluation questions",
  ],
  contractRevision: 1,
  contentStatus: "active",
};

export const trigonometricDifferentiationContract: CanonicalSkillContract = {
  skillPathId: "trigonometric-differentiation",
  name: "Trigonometric differentiation",
  learningObjective: "Differentiate the supported basic trigonometric functions (sin x, cos x) and scalar multiples of these.",
  boundaries: {
    includes: [
      "derivative of sin x",
      "derivative of cos x",
      "scalar multiples such as 3 sin x",
      "sums combining trigonometric terms with Basic Differentiation power-rule terms",
    ],
    excludes: [
      "trigonometric composites such as sin(2x) or a trig function of a function (Chain Rule territory)",
      "tan x differentiation — scope not yet confirmed against the official specification",
      "second derivatives",
    ],
  },
  prerequisiteSkillIds: ["basic-differentiation"],
  unlocksSkillIds: [],
  permittedIngredients: ["sin x", "cos x", "scalar coefficients", "sums with power-rule terms"],
  forbiddenIngredients: [
    "trigonometric composite functions (sin(kx), cos(f(x)))",
    "tan x (unconfirmed scope)",
    "products or quotients of trigonometric functions",
  ],
  typicalMisconceptions: [
    "Differentiating sin x to cos x correctly but dropping the scalar coefficient.",
    "Sign error: writing d/dx(cos x) = cos x instead of -sin x.",
    "Applying the power rule to a trigonometric function by mistake.",
  ],
  pastPaperPatternFamilyIds: [],
  autoMarkingRequirements: [
    "A trig-aware equivalence check is likely required beyond plain polynomial_form normalisation — flagged as an open marking-capability question, not yet resolved.",
  ],
  contractRevision: 1,
  contentStatus: "active",
};

/**
 * Chain Rule's relationship to Trigonometric Differentiation is deliberately NOT modelled
 * as a skill-level prerequisite edge. Only some Chain Rule questions involve a trig
 * composite; making every Chain Rule question depend on Trigonometric Differentiation would
 * misrepresent the skill. That conditional, question-level dependency belongs entirely to
 * QuestionCurriculumMetadata.requiredSkillIds on the specific questions that need it (future
 * authoring work, out of Phase 1's scope) — never to this graph.
 */
export const chainRuleContract: CanonicalSkillContract = {
  skillPathId: "chain-rule",
  name: "Chain rule",
  learningObjective: "Differentiate composite functions using the chain rule.",
  boundaries: {
    includes: [
      "differentiating (f(x))^n for algebraic f",
      "composite functions of the outer-power form",
      "chain rule applied to trigonometric composites, only for questions that also declare Trigonometric Differentiation as a required skill at question level",
    ],
    excludes: [
      "Product Rule",
      "Quotient Rule",
      "Implicit Differentiation",
      "Optimisation",
      "stationary-point classification",
      "unsupported second-derivative methods",
    ],
  },
  prerequisiteSkillIds: ["basic-differentiation"],
  unlocksSkillIds: [],
  permittedIngredients: [
    "algebraic composite functions of the form (ax + b)^n",
    "trigonometric composites, only on questions that separately declare Trigonometric Differentiation as required",
  ],
  forbiddenIngredients: [
    "Product Rule",
    "Quotient Rule",
    "Implicit Differentiation",
    "Optimisation",
    "stationary-point classification",
    "unsupported second-derivative methods",
  ],
  typicalMisconceptions: [
    "Forgetting to multiply by the derivative of the inner function.",
    "Differentiating only the outer function and ignoring the chain factor.",
    "Applying the chain rule to an expression that is actually a simple sum, not a composite.",
  ],
  pastPaperPatternFamilyIds: [],
  autoMarkingRequirements: [
    "polynomial_form marking strategy; a composite_algebraic_equivalence capability is likely required for some accepted-answer forms — flagged as an open marking-capability question.",
  ],
  contractRevision: 1,
  contentStatus: "active",
};

/**
 * Tangents' technical slug ("tangents-and-normals") is legacy — the live skill map has
 * already renamed its learner-facing display to "Tangents" only. This contract does not
 * restore normals to scope: the source-verified specification register statement
 * (hm-calc-tangent, SQA May 2023 spec p6) is explicit that "the official wording names
 * only the tangent — normal-line work is not listed anywhere in this document as a
 * Calculus assessable statement." The slug must never be read as authorisation to teach
 * normals; only the objective below (and its exclusion of normals) is authoritative.
 *
 * Chain Rule (and, for trigonometric composites, Trigonometric Differentiation) is a
 * genuine dependency for some Tangents questions — but only some, since many tangent
 * questions apply to plain polynomial curves that need nothing beyond Basic
 * Differentiation. This is a production-policy statement, not a universal prerequisite: it
 * does not belong in prerequisiteSkillIds, and it must never become a prerequisite-graph
 * edge (hard or soft) — see the comment on higherMathematicsCalculusPrerequisites in
 * calculus-prerequisites.ts. It belongs entirely to the future Tangents skill package's
 * questionLevelRequirements (SkillPackageQuestionLevelRequirement,
 * lib/curriculum/skill-package.ts), mirroring chainRuleContract's own identical policy above
 * and chain-rule-package.ts's existing, working declaration for its own trigonometric-
 * composite dependency:
 *   { triggerDescription: "...", requiredSkillId: "chain-rule" }
 *   { triggerDescription: "...", requiredSkillId: "trigonometric-differentiation" }
 * — one entry each for composite-curve and trigonometric-curve Tangents questions, both
 * where a trigonometric composite genuinely needs both. That declaration is validated only
 * against known skill IDs; it is never itself a route lock, and it only attaches to actual
 * questions later through QuestionCurriculumMetadata.requiredSkillIds on the specific
 * questions that need it (future authoring work, out of this contract's scope). No such
 * package exists yet — this contract does not create one.
 */
export const tangentsAndNormalsContract: CanonicalSkillContract = {
  skillPathId: "tangents-and-normals",
  name: "Tangents",
  learningObjective: "Find the gradient of a curve at a specified point using an already-known differentiation method, and use it to find the equation of the tangent to the curve at that point.",
  boundaries: {
    includes: [
      "the gradient of a curve at a specified point, found using an already-unlocked differentiation method",
      "the equation of the tangent to a curve at a specified point",
      "tangent questions on composite curves, only where the required differentiation method is already a separate, unlocked skill",
    ],
    excludes: [
      "normals — not an assessable statement in the official specification (verified, May 2023 spec, p6)",
      "teaching Basic Differentiation",
      "teaching Chain Rule",
      "teaching Trigonometric Differentiation",
      "stationary-point identification or classification",
      "optimisation",
      "implicit differentiation",
      "coordinate-geometry line problems not derived from a curve's gradient",
    ],
  },
  prerequisiteSkillIds: ["basic-differentiation"],
  unlocksSkillIds: [],
  permittedIngredients: [
    "any curve whose derivative is reachable via an already-unlocked differentiation skill",
    "a specified x-value identifying the point of contact",
    "line-equation forms (y = mx + c, point-gradient, general form)",
  ],
  forbiddenIngredients: [
    "normal-line requests",
    "stationary-point requests",
    "differentiation methods not yet unlocked by the learner, without a declared question-level requirement",
    "optimisation framing",
  ],
  typicalMisconceptions: [
    "Using the function value at the point as the gradient, instead of the derivative there.",
    "Differentiating correctly but evaluating the derivative at the wrong x-value.",
    "Using the gradient value as a coordinate when forming the point of contact.",
    "Forgetting to find the y-coordinate of the point of contact before forming the line equation.",
    "Substituting the point and gradient into the line equation incorrectly.",
    "Sign or rearrangement errors when simplifying the final tangent equation.",
    "Treating the derivative expression itself as the final answer, rather than using it to construct the tangent equation.",
  ],
  pastPaperPatternFamilyIds: [],
  autoMarkingRequirements: [
    "Equation-form / line-equation marking capability for the tangent-equation deliverable — not yet available in the live marking engine.",
    "Numeric marking strategy for gradient and point-of-contact sub-steps — already supported.",
  ],
  contractRevision: 1,
  contentStatus: "active",
};

export const higherMathematicsCalculusSkillContracts: CanonicalSkillContract[] = [
  basicDifferentiationContract,
  trigonometricDifferentiationContract,
  chainRuleContract,
  tangentsAndNormalsContract,
];
