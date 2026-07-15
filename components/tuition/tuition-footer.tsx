import Link from "next/link";
import { tuitionLevels } from "@/components/tuition/tuition-data";

export function TuitionFooter() {
  return (
    <footer className="border-t border-line bg-paper px-5 py-10">
      <div className="mx-auto grid w-[min(1120px,100%)] grid-cols-3 gap-10 max-md:grid-cols-1 max-md:text-center">
        <div>
          <p className="m-0 text-lg font-extrabold text-ink">STEM Forge Tuition</p>
          <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted max-md:mx-auto">
            One-to-one National 5 and Higher tuition, from the team behind STEM Forge.
          </p>
        </div>
        <div>
          <p className="m-0 text-sm font-extrabold uppercase text-muted">Navigation</p>
          <nav className="mt-3 grid gap-2 text-sm font-semibold">
            <Link href="/tuition">Home</Link>
            <Link href="/tuition/subjects">Subjects</Link>
            <Link href="/tuition/about">About</Link>
            <Link href="/tuition/pricing">Pricing</Link>
          </nav>
        </div>
        <div>
          <p className="m-0 text-sm font-extrabold uppercase text-muted">Levels</p>
          <nav className="mt-3 grid gap-2 text-sm font-semibold">
            {tuitionLevels.map((level) => (
              <Link key={level.slug} href={`/tuition/subjects?level=${level.slug}`}>
                {level.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-[900px] text-center text-xs leading-relaxed text-muted">
        STEM Forge creates original SQA-style practice materials and is not affiliated with or endorsed by SQA.
      </p>
    </footer>
  );
}
