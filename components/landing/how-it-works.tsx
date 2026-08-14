const steps = [
  ["Learn", "Read focused Notes built around one skill."],
  ["Practise", "Start a useful session or choose exact questions from the Question Bank."],
  ["Exam Questions", "Apply the skill to original exam-style questions, then study the worked solution."],
  ["Review", "Revisit learned skills when the Review schedule says it will help."],
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 border-b border-line px-5 py-[clamp(56px,7vw,84px)]">
      <div className="mx-auto w-[min(1180px,100%)]">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-forge">How Orthic works</p>
          <h2 id="how-title" className="mt-3 text-[clamp(32px,4vw,52px)] font-extrabold leading-tight tracking-[-0.03em]">A clear route from understanding to Review.</h2>
        </div>
        <ol className="mt-10 grid grid-cols-4 border-y border-line p-0 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {steps.map(([title, copy], index) => (
            <li key={title} className="list-none border-r border-line px-5 py-7 last:border-r-0 max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b max-sm:border-b max-sm:border-r-0 max-sm:last:border-b-0">
              <span className="text-xs font-extrabold text-forge">0{index + 1}</span>
              <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
