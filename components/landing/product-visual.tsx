import { ArrowRight, BookOpen, Check, FileText, PenLine, RotateCcw } from "lucide-react";

const stages: ReadonlyArray<{
  label: string;
  detail: string;
  icon: typeof FileText;
  state?: string;
}> = [
  { label: "Notes", detail: "Understand the power rule", icon: FileText, state: "Open" },
  { label: "Foundations", detail: "Build accurate technique", icon: BookOpen },
  { label: "Applications", detail: "Use the skill in context", icon: PenLine },
  { label: "Exam Questions", detail: "Apply it independently", icon: Check },
];

export function ProductVisual() {
  return (
    <figure
      aria-label="Orthic Basic differentiation learning journey"
      className="relative m-0 overflow-hidden rounded-[22px] border border-ink/10 bg-[#ebe8e1] p-2.5 shadow-hero sm:p-3"
      data-testid="homepage-product-visual"
    >
      <div className="overflow-hidden rounded-[15px] border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line bg-white px-3.5 py-2.5 sm:px-5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="size-2 rounded-full bg-ink/15" />
            <span className="size-2 rounded-full bg-ink/10" />
            <span className="size-2 rounded-full bg-ink/10" />
          </div>
          <p className="text-[10px] font-bold tracking-wide text-muted sm:text-xs">Higher Maths · Calculus</p>
        </div>

        <div className="grid min-h-[340px] grid-cols-[minmax(0,1fr)_minmax(180px,0.72fr)] max-sm:grid-cols-1 sm:min-h-[410px]">
          <div className="min-w-0 p-4 sm:p-6 lg:p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-forge sm:text-xs">Differentiation</p>
            <h2 className="mt-2 text-[clamp(25px,3vw,38px)] font-extrabold leading-tight tracking-[-0.035em]">Basic differentiation</h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted sm:text-sm">Learn the rule, build fluency, then apply it to exam-style questions.</p>

            <ol className="mt-5 grid gap-2 p-0 sm:mt-7 sm:gap-2.5">
              {stages.map(({ label, detail, icon: Icon, state }, index) => (
                <li key={label} className={`grid list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${index === 0 ? "border-forge/25 bg-white shadow-card" : "border-line bg-white/55"}`}>
                  <span className={`grid size-8 place-items-center rounded-lg ${index === 0 ? "bg-forge text-white" : "bg-forge-soft text-forge"}`}>
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold sm:text-sm">{label}</span>
                    <span className="hidden text-[11px] text-muted sm:block">{detail}</span>
                  </span>
                  {state ? <span className="flex items-center gap-1 text-[10px] font-extrabold text-forge sm:text-xs">{state}<ArrowRight aria-hidden="true" className="size-3" /></span> : <span className="text-[10px] font-bold text-muted">0{index + 1}</span>}
                </li>
              ))}
            </ol>
          </div>

          <aside className="border-l border-line bg-white p-5 max-sm:hidden sm:p-6" aria-label="Learning path summary">
            <div className="flex items-center gap-2 text-forge">
              <RotateCcw aria-hidden="true" className="size-4" />
              <p className="text-xs font-extrabold uppercase tracking-[0.12em]">A complete learning loop</p>
            </div>
            <div className="mt-6 border-l border-forge/25 pl-4">
              <p className="text-sm font-extrabold">Learn deliberately</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Each stage has a clear purpose and a direct next step.</p>
            </div>
            <div className="mt-5 border-l border-forge/25 pl-4">
              <p className="text-sm font-extrabold">See full solutions</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Marking and worked reasoning stay together.</p>
            </div>
            <div className="mt-5 border-l border-forge/25 pl-4">
              <p className="text-sm font-extrabold">Return at the right time</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Review reconnects earlier learning to new practice.</p>
            </div>
            <div className="mt-8 rounded-xl bg-ink p-4 text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55">Your route</p>
              <p className="mt-2 text-sm font-extrabold">Notes → Practice → Review</p>
            </div>
          </aside>
        </div>
      </div>
    </figure>
  );
}
