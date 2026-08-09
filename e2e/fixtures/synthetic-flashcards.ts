import type { Flashcard } from "@/lib/flashcards/types";

// Browser-test-only content. This module is reached only through the server-side E2E fixture gate.
export const SYNTHETIC_FLASHCARD_SUBJECT = {
  slug: "synthetic-science",
  name: "Synthetic Science",
  family: "science" as const,
  skillName: "Foundations of science",
  skillPathId: "test-science-skill",
};

export const syntheticFlashcards: readonly Flashcard[] = [
  {
    id: "test-activation-energy", version: 1, skillPathId: "test-science-skill", type: "basic",
    front: "What is activation energy?", back: "The minimum energy needed for a reaction to occur.",
  },
  {
    id: "test-si-force", version: 1, skillPathId: "test-science-skill", type: "typed",
    front: "What is the SI unit of force?", acceptedAnswers: ["newton", "N"],
  },
  {
    id: "test-aerobic-site", version: 1, skillPathId: "test-science-skill", type: "cloze",
    textBefore: "The site of aerobic respiration is the ", answer: "mitochondrion", textAfter: ".",
  },
];
