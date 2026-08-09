import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SubjectResourceLinks } from "@/components/learning/subject-resource-links";
import { Card } from "@/components/ui";
import { resolveFlashcardSubject } from "@/lib/flashcards/catalog.server";

export default async function SubjectFlashcardFixtureHost({ params }: { params: Promise<{ subjectSlug: string }> }) {
  const { subjectSlug } = await params;
  const subject = await resolveFlashcardSubject(subjectSlug);
  if (!subject) notFound();
  return (
    <AppShell demo={false} active="Subjects" className="py-6 sm:py-8">
      <main className="mx-auto max-w-4xl">
        <p className="m-0 text-xs font-extrabold uppercase tracking-wide text-muted">Test-only science host</p>
        <h1 className="mb-0 mt-2 text-3xl font-extrabold sm:text-4xl">{subject.name}</h1>
        <Card className="mt-6 p-6 sm:p-8">
          <h2 className="m-0 text-xl font-extrabold">{subject.skillName}</h2>
          <p className="mt-2 text-muted">A synthetic subject used to verify the Flashcards learner experience.</p>
          <div className="mt-5 max-w-sm">
            <SubjectResourceLinks family={subject.family} variant="tiles" available={["flashcards"]} hrefs={{
              notes: `/subjects/${subject.slug}/notes`, flashcards: `/subjects/${subject.slug}/flashcards`, practice: `/subjects/${subject.slug}/practice`,
            }} />
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
