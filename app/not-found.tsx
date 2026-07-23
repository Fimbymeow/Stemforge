import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { FocusedProductShell } from "@/components/layout/focused-product-shell";

export default function NotFound() {
  return (
    <FocusedProductShell maxWidth="max-w-[760px]">
      <section className="grid gap-4">
        <p className="m-0 text-sm font-extrabold uppercase text-forge">Page not found</p>
        <Card className="p-8 max-md:p-5">
          <h1 className="m-0 text-[clamp(32px,5vw,48px)] font-extrabold leading-tight">This page could not be found.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            The page may have moved, or the route may not exist yet. You can return to Basic differentiation or browse subjects.
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
    </FocusedProductShell>
  );
}

