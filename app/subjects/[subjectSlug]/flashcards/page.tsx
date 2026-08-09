import { notFound } from "next/navigation";
import { FlashcardExperience } from "@/components/flashcards/flashcard-experience";
import { resolveFlashcardSubject } from "@/lib/flashcards/catalog.server";
import { subjectSupportsResource } from "@/lib/resource-capabilities";

export default async function SubjectFlashcardsPage({ params }: { params: Promise<{ subjectSlug: string }> }) {
  const { subjectSlug } = await params;
  const subject = await resolveFlashcardSubject(subjectSlug);
  if (!subject || !subjectSupportsResource(subject.family, "flashcards") || subject.cards.length === 0) notFound();
  return <FlashcardExperience subjectName={subject.name} subjectSlug={subject.slug} skillName={subject.skillName} cards={subject.cards} />;
}
