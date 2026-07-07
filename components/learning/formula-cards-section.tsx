import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import type { FormulaCard } from "@/data/types";

export function FormulaCardsSection({ formulaCards }: { formulaCards?: FormulaCard[] }) {
  if (!formulaCards?.length) return null;

  return (
    <section>
      <h2 className="m-0 text-3xl font-extrabold">Formula Card</h2>
      <p className="mt-2 text-muted">Keep the core relationship visible before you practise.</p>
      <div className="mt-6 grid gap-5">
        {formulaCards.map((formula) => (
          <FormulaCardView key={formula.id} formula={formula} />
        ))}
      </div>
    </section>
  );
}

export function FormulaCardView({ formula }: { formula: FormulaCard }) {
  return (
    <Card className="p-7">
      <span className="mb-5 grid size-12 place-items-center rounded-xl bg-[#fff4ec] text-forge">
        <BookOpen className="size-6" />
      </span>
      <h3 className="m-0 text-2xl font-extrabold">{formula.title}</h3>
      <p className="mt-2 text-muted">{formula.description}</p>
      <div className="mt-5 rounded-xl border border-line bg-[#fffdf9] p-5 text-center">
        <MathContent>{formula.formula}</MathContent>
      </div>
      {formula.example ? (
        <div className="mt-4 rounded-xl border border-line bg-white p-4 text-sm text-muted">
          <MathContent>{formula.example}</MathContent>
        </div>
      ) : null}
    </Card>
  );
}
