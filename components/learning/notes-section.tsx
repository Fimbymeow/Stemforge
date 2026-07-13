import { FileText } from "lucide-react";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import type { NoteBlock } from "@/data/types";

export function NotesSection({ notes }: { notes?: NoteBlock[] }) {
  if (!notes?.length) return null;

  return (
    <section>
      <h2 className="m-0 text-3xl font-extrabold">Learn / Notes</h2>
      <p className="mt-2 text-muted">Start with the core idea before practising.</p>
      <div className="mt-6 grid gap-5">
        {notes.map((note) => (
          <NoteBlockCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}

export function NoteBlockCard({ note }: { note: NoteBlock }) {
  return (
    <Card className="p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-forge-soft text-forge">
          <FileText className="size-6" />
        </span>
        <div>
          <p className="m-0 text-sm font-extrabold uppercase text-forge">Learn / Notes</p>
          <h3 className="m-0 text-2xl font-extrabold">{note.title}</h3>
        </div>
      </div>
      <div className="prose prose-neutral max-w-none text-muted prose-p:my-2 prose-strong:text-ink">
        <MathContent>{note.body}</MathContent>
        {note.mathContent ? <MathContent>{note.mathContent}</MathContent> : null}
      </div>
    </Card>
  );
}
