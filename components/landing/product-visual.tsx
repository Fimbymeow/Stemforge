import { BookOpen, Check, PenLine, RotateCcw } from "lucide-react";

export function ProductVisual() {
  return (
    <figure
      aria-label="Orthic Chain Rule Notes, Practice and Review overview"
      className="m-0 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm"
      data-testid="homepage-product-visual"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-3 text-white sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Higher Mathematics</p>
          <p className="mt-1 text-sm font-semibold">Chain Rule · Skill overview</p>
        </div>
        <p className="text-xs text-white/70">Higher Maths</p>
      </div>

      <div className="px-4 py-5 sm:px-7 sm:py-7">
        <div className="border-b border-line pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Calculus · Differentiating functions</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Chain Rule</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Differentiate composite functions accurately, using the derivative of the outside and inside functions.</p>
          <p className="mt-3 text-xs text-muted">Prior knowledge · Basic differentiation</p>
        </div>

        <div className="divide-y divide-line">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4">
            <span className="grid size-9 place-items-center rounded-md bg-forge-soft text-forge"><BookOpen aria-hidden="true" className="size-4" /></span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Notes</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">Method and worked examples</span>
            </span>
            <span className="text-xs font-medium text-forge">Open notes</span>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4">
            <span className="grid size-9 place-items-center rounded-md bg-forge-soft text-forge"><PenLine aria-hidden="true" className="size-4" /></span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Practice</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">18 of 34 questions completed</span>
              <span aria-hidden="true" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line"><span className="block h-full w-[53%] rounded-full bg-forge" /></span>
            </span>
            <span className="text-xs font-semibold text-forge">Continue</span>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4">
            <span className="grid size-9 place-items-center rounded-md bg-paper text-muted"><RotateCcw aria-hidden="true" className="size-4" /></span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Review</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">Returns when previous learning needs attention</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-success"><Check aria-hidden="true" className="size-3.5" />No review due</span>
          </div>
        </div>
      </div>
    </figure>
  );
}
