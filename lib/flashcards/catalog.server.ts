import "server-only";
import type { Flashcard } from "@/lib/flashcards/types";
import type { SubjectFamily } from "@/lib/resource-capabilities";

export type FlashcardSubject = {
  slug: string;
  name: string;
  family: SubjectFamily;
  skillName: string;
  skillPathId: string;
  cards: readonly Flashcard[];
};

/** Production has no approved flashcard catalog yet. The only V1 host is build-gated E2E content. */
export async function resolveFlashcardSubject(subjectSlug: string): Promise<FlashcardSubject | null> {
  if (process.env.STEMFORGE_E2E_FIXTURES !== "true" || subjectSlug !== "synthetic-science") return null;
  const fixture = await import("@/e2e/fixtures/synthetic-flashcards");
  return { ...fixture.SYNTHETIC_FLASHCARD_SUBJECT, cards: fixture.syntheticFlashcards };
}
