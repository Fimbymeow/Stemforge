import Link from "next/link";
import { Card } from "@/components/ui";

export { FormulaCardView, FormulaCardsSection } from "@/components/learning/formula-cards-section";
export { FlashcardsPreview as FlashcardPreview, FlashcardsPreview } from "@/components/learning/flashcards-preview";
export { LearningStageCard, LearningStagesSection } from "@/components/learning/learning-stages-section";
export { NotesSection as LearnSection, NoteBlockCard, NotesSection } from "@/components/learning/notes-section";
export { PracticeSetCard, PracticeSetsSection } from "@/components/learning/practice-sets-section";
export { WorkedExampleCard, WorkedExamplesSection } from "@/components/learning/worked-examples-section";

export function MasterySummary({ completed, total, status }: { completed: number; total: number; status: string }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Mastery / Progress</h2>
      <div className="grid gap-4">
        <SummaryRow label="Questions completed" value={`${completed} / ${total}`} />
        <SummaryRow label="Mastery" value={status} />
        <SummaryRow label="Progress state" value={completed > 0 ? "In progress" : "Not started"} />
      </div>
    </Card>
  );
}

export function RecommendedNextAction({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
      <p className="mb-2 text-sm font-bold uppercase text-muted">Start</p>
      <h3 className="text-3xl font-extrabold text-[#188246]">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{copy}</p>
      <Link href={href} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-5 font-extrabold text-white">
        {label}
      </Link>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper p-4">
      <span className="text-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
