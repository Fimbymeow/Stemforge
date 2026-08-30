import type { Question } from "@/data/types";
import type { QuestionCurriculumMetadata } from "@/lib/curriculum/question-curriculum-metadata";

/**
 * Human-reviewed curriculum ownership and dependency metadata for every live Higher Maths
 * question. Keeping the review explicit by question ID makes an intentionally empty dependency
 * list distinguishable from content that has never been reviewed.
 */
export const higherMathsLiveQuestionCurriculum = {
  "hm-calc-diff-basic-f-001": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-f-002": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-f-003": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-a-001": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-a-002": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-a-003": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-ppq-001": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-basic-ppq-002": { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
  "hm-calc-diff-chain-f-001": { primarySkillId: "chain-rule", requiredSkillIds: [] },
  "hm-calc-diff-chain-f-002": { primarySkillId: "chain-rule", requiredSkillIds: [] },
  "hm-calc-diff-chain-f-003": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-004": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-005": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-006": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-007": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-008": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-009": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-f-010": { primarySkillId: "chain-rule", requiredSkillIds: [] },
  "hm-calc-diff-chain-a-001": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-002": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-003": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-004": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-005": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-006": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-007": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-008": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-a-009": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-003": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-004": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-007": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-008": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-010": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-011": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-012": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-014": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-015": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-016": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-017": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-018": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-019": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-020": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
  "hm-calc-diff-chain-ppq-021": { primarySkillId: "chain-rule", requiredSkillIds: ["basic-differentiation"] },
} satisfies Record<string, QuestionCurriculumMetadata>;

export function applyReviewedHigherMathsCurriculum(questions: Question[]): Question[] {
  return questions.map((question) => {
    const curriculum = higherMathsLiveQuestionCurriculum[question.id as keyof typeof higherMathsLiveQuestionCurriculum];
    return curriculum ? { ...question, curriculum: { ...curriculum, requiredSkillIds: [...curriculum.requiredSkillIds] } } : question;
  });
}
