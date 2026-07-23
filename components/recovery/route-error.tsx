"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { FocusedProductShell } from "@/components/layout/focused-product-shell";

export function RouteError({ error, reset, title, message, code, backHref, backLabel }: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  message: string;
  code: string;
  backHref: string;
  backLabel: string;
}) {
  useEffect(() => { void error; }, [error]);
  return (
    <FocusedProductShell maxWidth="max-w-[760px]">
      <Card className="p-6" role="alert">
        <p className="font-mono text-xs font-extrabold uppercase text-forge">Recovery available &middot; {code}</p>
        <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-muted">{message}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-lg bg-forge px-5 font-extrabold text-white">Try again</button>
          <Link href={backHref} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-5 font-extrabold">{backLabel}</Link>
        </div>
      </Card>
    </FocusedProductShell>
  );
}
