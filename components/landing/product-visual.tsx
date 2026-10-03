import { Check, FileText } from "lucide-react";
import { MathContent } from "@/components/questions/math-content";

const answerChoices = ["12", "14", "16"] as const;

export function ProductVisual() {
  return (
    <figure
      aria-label="Orthic Basic differentiation question workspace"
      className="m-0 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm"
      data-testid="homepage-product-visual"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-3 text-white sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Higher Mathematics</p>
          <p className="mt-1 text-sm font-semibold">Basic differentiation · Foundations</p>
        </div>
        <p className="text-xs text-white/70">Question 3 of 3</p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 px-4 py-5 sm:px-7 sm:py-7">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Question</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Evaluate a derivative</h2>
            </div>
            <span className="text-xs text-muted">1 mark</span>
          </div>

          <div className="py-6 text-[17px] sm:py-8 sm:text-lg">
            <MathContent>For $f(x)=x^3+2x$, find $f&apos;(2)$.</MathContent>
          </div>

          <div aria-label="Answer choices preview" className="grid gap-2">
            {answerChoices.map((answer) => (
              <div key={answer} className={`flex min-h-11 items-center justify-between rounded-md border px-4 text-sm ${answer === "14" ? "border-forge/35 bg-forge-soft font-semibold text-forge" : "border-line bg-paper"}`}>
                <span className="flex items-center gap-3"><span aria-hidden="true" className={`size-3 rounded-full border ${answer === "14" ? "border-forge bg-forge" : "border-secondary/40"}`} />{answer}</span>
                {answer === "14" ? <span className="flex items-center gap-1 text-xs"><Check aria-hidden="true" className="size-3.5" />Selected</span> : null}
              </div>
            ))}
          </div>
        </div>

        <aside aria-label="Worked solution preview" className="border-t border-line bg-[#f5f4ef] px-4 py-5 sm:px-5 sm:py-7 md:border-l md:border-t-0">
          <div className="flex items-center gap-2 text-forge">
            <FileText aria-hidden="true" className="size-4" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Worked solution</p>
          </div>
          <div className="mt-5 space-y-5 text-sm">
            <div>
              <p className="font-semibold">Differentiate first</p>
              <div className="mt-2 text-muted"><MathContent>$f&apos;(x)=3x^2+2$</MathContent></div>
            </div>
            <div className="border-t border-line pt-5">
              <p className="font-semibold">Evaluate at the point</p>
              <div className="mt-2 text-muted"><MathContent>$f&apos;(2)=3(2)^2+2=14$</MathContent></div>
            </div>
          </div>
          <div className="mt-6 border-t border-success/25 pt-4 text-sm font-semibold text-success">Correct answer · 1 mark</div>
        </aside>
      </div>
    </figure>
  );
}
