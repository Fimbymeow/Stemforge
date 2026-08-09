import type { Flashcard } from "../../lib/flashcards/types";

// Test-only fixtures: these are not approved curriculum and are never imported by production registries.
export const syntheticFlashcards: readonly Flashcard[] = [
  { id: "test-activation-energy", version: 1, skillPathId: "test-science-skill", type: "basic",
    front: "What is activation energy?", back: "The minimum energy needed for a reaction to occur." },
  { id: "test-si-force", version: 1, skillPathId: "test-science-skill", type: "typed",
    front: "What is the SI unit of force?", acceptedAnswers: ["newton", "N"] },
  { id: "test-aerobic-site", version: 1, skillPathId: "test-science-skill", type: "cloze",
    textBefore: "The site of aerobic respiration is the ", answer: "mitochondrion", textAfter: "." },
];
