import type { QuestionCurriculumMetadata } from "@/lib/curriculum/question-curriculum-metadata";

/**
 * Explicit, hand-reviewed curriculum metadata for every currently-live Basic Differentiation
 * question. This is a manual review record, not an inference engine — no code here decides
 * a question's canonical owner from the mathematics it happens to use. In particular,
 * solving f'(x) = 0 is not, by itself, treated as evidence of the Stationary Points skill;
 * the classification below is driven entirely by each question's stated task intent, per
 * this pass's boundary-question A resolution.
 *
 * Nothing in this file changes a question's live skillPathId — it records what the correct
 * classification *should* be, for a future, explicitly out-of-scope migration.
 */
export type BoundaryReviewRecord = {
  questionId: string;
  taskIntent: string;
  metadata: QuestionCurriculumMetadata;
  prerequisiteOperationsUsed: string[];
  recommendedAction: "remain" | "move";
  correctCanonicalOwner: string;
  futureMigrationNeeded: boolean;
  migrationNote?: string;
};

export const basicDifferentiationQuestionReview: BoundaryReviewRecord[] = [
  {
    questionId: "hm-calc-diff-basic-f-001",
    taskIntent: "Differentiate a single power-of-x term.",
    metadata: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    prerequisiteOperationsUsed: ["power rule"],
    recommendedAction: "remain",
    correctCanonicalOwner: "basic-differentiation",
    futureMigrationNeeded: false,
  },
  {
    questionId: "hm-calc-diff-basic-f-002",
    taskIntent: "Differentiate a sum of power-of-x terms including a constant.",
    metadata: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    prerequisiteOperationsUsed: ["power rule", "differentiating a sum", "constant differentiates to 0"],
    recommendedAction: "remain",
    correctCanonicalOwner: "basic-differentiation",
    futureMigrationNeeded: false,
  },
  {
    questionId: "hm-calc-diff-basic-f-003",
    taskIntent: "Differentiate a function, then evaluate the derivative at a stated x-value.",
    metadata: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    prerequisiteOperationsUsed: ["power rule", "substitution/evaluation"],
    recommendedAction: "remain",
    correctCanonicalOwner: "basic-differentiation",
    futureMigrationNeeded: false,
  },
  {
    questionId: "hm-calc-diff-basic-a-001",
    taskIntent: "Find the gradient of a curve at a stated x-value (differentiate, then evaluate).",
    metadata: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    prerequisiteOperationsUsed: ["power rule", "substitution/evaluation"],
    recommendedAction: "remain",
    correctCanonicalOwner: "basic-differentiation",
    futureMigrationNeeded: false,
  },
  {
    questionId: "hm-calc-diff-basic-a-002",
    taskIntent: "Find the gradient VALUE of the tangent at a stated x-value — \"tangent\" is used descriptively for the derivative's value; no tangent-line equation is requested.",
    metadata: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    prerequisiteOperationsUsed: ["power rule", "substitution/evaluation"],
    recommendedAction: "remain",
    correctCanonicalOwner: "basic-differentiation",
    futureMigrationNeeded: false,
    migrationNote: "Does not require the Tangents skill (hm-calc-tangent) — that statement is specifically about determining a tangent's equation, which this question never asks for.",
  },
  {
    questionId: "hm-calc-diff-basic-a-003",
    taskIntent: "Explicitly \"find the x-coordinate of the stationary point\" — the target is the stationary point itself, not a differentiation drill that happens to set the derivative to zero.",
    metadata: { primarySkillId: "stationary-points", requiredSkillIds: ["basic-differentiation"] },
    prerequisiteOperationsUsed: ["power rule", "solving a linear equation from dy/dx = 0"],
    recommendedAction: "move",
    correctCanonicalOwner: "stationary-points",
    futureMigrationNeeded: true,
    migrationNote: "Currently filed under the live basic-differentiation path (stage: Applications). A future correction should re-home this question under stationary-points once that skill is published, via a proper ContentCorrectionRecord — not changed in this pass.",
  },
  {
    questionId: "hm-calc-diff-basic-ppq-001",
    taskIntent: "Find the gradient VALUE of a stated tangent at a given x — again descriptive use of \"tangent\", no equation requested.",
    metadata: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    prerequisiteOperationsUsed: ["power rule", "substitution/evaluation"],
    recommendedAction: "remain",
    correctCanonicalOwner: "basic-differentiation",
    futureMigrationNeeded: false,
    migrationNote: "Does not require the Tangents skill, for the same reason as hm-calc-diff-basic-a-002.",
  },
  {
    questionId: "hm-calc-diff-basic-ppq-002",
    taskIntent: "Explicitly \"find the positive x-coordinate of a stationary point\" — same task-intent pattern as hm-calc-diff-basic-a-003.",
    metadata: { primarySkillId: "stationary-points", requiredSkillIds: ["basic-differentiation"] },
    prerequisiteOperationsUsed: ["power rule", "solving a quadratic equation from dy/dx = 0", "selecting the positive root"],
    recommendedAction: "move",
    correctCanonicalOwner: "stationary-points",
    futureMigrationNeeded: true,
    migrationNote: "Currently filed under the live basic-differentiation path (stage: Past Paper-style Questions). Same future-correction note as hm-calc-diff-basic-a-003.",
  },
];
