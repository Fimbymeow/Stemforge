import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper px-5 py-16 text-ink">
      <section className="mx-auto grid max-w-[760px] gap-6">
        <p className="m-0 text-sm font-extrabold uppercase text-forge">Page not found</p>
        <Card className="p-8 max-md:p-5">
          <h1 className="m-0 text-[clamp(38px,6vw,68px)] font-extrabold leading-none">This page could not be found.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            The page may have moved, or the route may not exist yet. You can return to the current Higher Maths proof-of-concept path or browse subjects.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={getActiveSkillPathHref()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white">
              Back to Basic differentiation
              <ArrowRight className="size-5" />
            </Link>
            <Link href="/subjects" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-white px-5 font-extrabold">
              Browse subjects
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}

