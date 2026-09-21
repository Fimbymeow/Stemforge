import Link from "next/link";
import Image from "next/image";
import { tuitionLevels } from "@/components/tuition/tuition-data";
import { TUITION_CONTAINER } from "@/components/tuition/tuition-styles";

export function TuitionFooter() {
  return (
    <footer className="border-t border-line bg-paper py-12">
      <div className={`${TUITION_CONTAINER} grid grid-cols-[1.3fr_0.7fr_0.7fr] gap-12 max-md:grid-cols-1 max-md:gap-8`}>
        <div>
          <div className="flex items-center gap-3">
            <Image src="/assets/orthic-mark.svg" alt="" width={24} height={24} className="size-5" />
            <p className="m-0 font-semibold text-ink">Orthic Tuition</p>
          </div>
          <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-muted">
            One-to-one National 5 and Higher tuition from Finlay Kennedy, who is also building Orthic.
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-ink">Navigation</p>
          <nav className="mt-3 grid gap-2 text-sm text-muted" aria-label="Tuition footer">
            <Link href="/tuition">Home</Link>
            <Link href="/tuition/subjects">Subjects</Link>
            <Link href="/tuition/about">About</Link>
            <Link href="/tuition/pricing">Pricing</Link>
          </nav>
        </div>
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-ink">Levels</p>
          <nav className="mt-3 grid gap-2 text-sm text-muted" aria-label="Tuition levels">
            {tuitionLevels.map((level) => (
              <Link key={level.slug} href={`/tuition/subjects?level=${level.slug}`}>
                {level.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className={`${TUITION_CONTAINER} mt-10 flex flex-wrap items-start justify-between gap-4 border-t border-line pt-6 text-xs leading-relaxed text-muted`}>
        <p className="m-0 max-w-[760px]">Orthic creates original Qualifications Scotland-style practice materials and is not affiliated with or endorsed by Qualifications Scotland.</p>
        <nav className="flex gap-4" aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      </div>
    </footer>
  );
}
