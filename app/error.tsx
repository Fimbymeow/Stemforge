"use client";

import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Link from "next/link";
import { useEffect } from "react";
import { Card } from "@/components/ui";
import { FocusedProductShell } from "@/components/layout/focused-product-shell";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <FocusedProductShell maxWidth="max-w-[760px]">
      <section className="grid gap-4">
        <p className="m-0 text-sm font-extrabold uppercase text-forge">Something went wrong</p>
        <Card className="p-8 max-md:p-5">
          <h1 className="m-0 text-[clamp(32px,5vw,48px)] font-extrabold leading-tight">STEM Forge hit a temporary problem.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Try again, or return to the current Basic differentiation path. No technical details are shown here.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-forge px-5 font-extrabold text-white">
              Try again
            </button>
            <Link href={getActiveSkillPathHref()} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-white px-5 font-extrabold">
              Back to Basic differentiation
            </Link>
          </div>
        </Card>
      </section>
    </FocusedProductShell>
  );
}

