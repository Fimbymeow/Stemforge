import { Card } from "@/components/ui";
import { SectionShell } from "./section-shell";

const courseGroups = [
  ["Physics", "Higher coming soon"],
  ["Chemistry", "National 5, Higher, Advanced Higher"],
  ["Biology", "National 5, Higher, Advanced Higher"],
] as const;

export function Courses() {
  return (
    <SectionShell kicker="Courses" title="Start with Higher Maths. Higher Physics is coming soon." id="subjects">
      <div className="grid grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] gap-6 max-lg:grid-cols-1">
        <Card className="border-forge/40 bg-gradient-to-br from-forge/10 to-white p-8">
          <p className="mb-4 font-mono text-[13px] font-extrabold uppercase text-forge">Available now</p>
          <h3 className="m-0 text-2xl font-extrabold">Higher Maths</h3>
          <p className="mt-3 text-muted">Start with Basic differentiation: structured practice, LaTeX worked solutions and clear progression.</p>
        </Card>
        <Card className="p-8">
          <p className="mb-4 font-mono text-[13px] font-extrabold uppercase text-forge">Coming soon</p>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {courseGroups.map(([name, levels]) => (
              <article key={name} className="min-h-[130px] rounded-[10px] border border-line bg-[#fffaf5] p-6">
                <h3 className="m-0 text-2xl font-extrabold">{name}</h3>
                <p className="mt-3 text-muted">{levels}</p>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </SectionShell>
  );
}




